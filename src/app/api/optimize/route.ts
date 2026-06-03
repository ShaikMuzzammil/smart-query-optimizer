import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, AI_MODEL } from '@/lib/openai';
import { buildOptimizerPrompt }      from '@/lib/promptBuilder';
import { connectDB }                 from '@/lib/mongodb';
import { QueryLog }                  from '@/models/QueryLog';
import { rateLimit, OPTIMIZER_RATE_LIMIT } from '@/lib/rateLimit';
import { hashIP }                    from '@/lib/utils';
import type { OptimizeRequest, OptimizeResult } from '@/types';

export const maxDuration = 60; // Vercel max

export async function POST(req: NextRequest) {
  // ── 1. Rate limit ────────────────────────────────────────
  const ip  = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl  = rateLimit(ip, OPTIMIZER_RATE_LIMIT);

  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: `Rate limit exceeded. Try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  // ── 2. Parse + validate body ─────────────────────────────
  let body: OptimizeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { query, naturalLanguage, dbType, optimizationGoal, schema, options } = body;

  // Basic validation
  if (!query && !naturalLanguage) {
    return NextResponse.json({ success: false, error: 'query or naturalLanguage is required.' }, { status: 400 });
  }
  const inputText = (query || naturalLanguage || '').trim();
  if (inputText.length > 10_000) {
    return NextResponse.json({ success: false, error: 'Query exceeds 10,000 character limit.' }, { status: 400 });
  }
  if (!['postgresql','mysql','sqlserver','mongodb','sqlite','oracle','cockroachdb','supabase'].includes(dbType)) {
    return NextResponse.json({ success: false, error: 'Invalid dbType.' }, { status: 400 });
  }

  // ── 3. Build + call OpenAI ───────────────────────────────
  const { system, user } = buildOptimizerPrompt(body);
  let rawJSON = '';

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model:       AI_MODEL,
      temperature: options?.temperature ?? 0.2,
      max_tokens:  3000,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: user   },
      ],
      response_format: { type: 'json_object' },
    });

    rawJSON = completion.choices[0]?.message?.content || '';
    if (!rawJSON) throw new Error('Empty response from AI model.');
  } catch (err: any) {
    console.error('[/api/optimize] OpenAI error:', err.message);
    if (err.code === 'insufficient_quota') {
      return NextResponse.json({ success: false, error: 'AI service quota exceeded. Please try again later.' }, { status: 503 });
    }
    if (err.status === 429) {
      return NextResponse.json({ success: false, error: 'AI service rate limit hit. Please wait a moment.' }, { status: 503 });
    }
    return NextResponse.json(
      { success: false, error: 'AI service error: ' + (err.message || 'Unknown error') },
      { status: 502 }
    );
  }

  // ── 4. Parse AI response ─────────────────────────────────
  let aiData: any;
  try {
    aiData = JSON.parse(rawJSON);
  } catch {
    try {
      const match = rawJSON.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON object in response');
      aiData = JSON.parse(match[0]);
    } catch {
      console.error('[/api/optimize] JSON parse failed. Raw:', rawJSON.slice(0, 500));
      return NextResponse.json({ success: false, error: 'AI returned invalid JSON. Please try again.' }, { status: 502 });
    }
  }

  if (!aiData.optimizedQuery) {
    return NextResponse.json({ success: false, error: 'AI response missing optimizedQuery field.' }, { status: 502 });
  }

  // ── 5. Clamp + validate metrics ──────────────────────────
  const metrics = {
    estimatedImprovement: Math.max(0, Math.min(100, parseInt(aiData.metrics?.estimatedImprovement ?? 0))),
    beforeCost:           Math.max(0, parseInt(aiData.metrics?.beforeCost ?? 100)),
    afterCost:            Math.max(0, parseInt(aiData.metrics?.afterCost  ?? 100)),
    estimatedExecMs:      Math.max(0, parseInt(aiData.metrics?.estimatedExecMs ?? 0)),
  };

  const indexSuggestions = (Array.isArray(aiData.indexSuggestions) ? aiData.indexSuggestions : [])
    .filter((s: any) => s && s.sql)
    .map((s: any) => ({
      sql:    String(s.sql    || ''),
      reason: String(s.reason || ''),
      impact: (['high','medium','low'].includes(s.impact) ? s.impact : 'medium') as 'high' | 'medium' | 'low',
    }));

  const result: OptimizeResult = {
    originalQuery:    inputText,
    optimizedQuery:   String(aiData.optimizedQuery),
    explanation:      String(aiData.explanation || '_No explanation provided._'),
    indexSuggestions,
    metrics,
    explainAnalysis:  aiData.explainAnalysis ? String(aiData.explainAnalysis) : undefined,
    queryComplexity:  ['simple','moderate','complex','very_complex'].includes(aiData.queryComplexity)
                        ? aiData.queryComplexity
                        : undefined,
    warnings:         Array.isArray(aiData.warnings) ? aiData.warnings.map(String) : [],
    sessionId:        crypto.randomUUID(),
    createdAt:        new Date().toISOString(),
  };

  // ── 6. Persist to MongoDB (non-blocking) ─────────────────
  (async () => {
    try {
      const db = await connectDB();
      if (!db) return;
      const ipHash = await hashIP(ip);
      await QueryLog.create({
        sessionId:        result.sessionId,
        originalQuery:    result.originalQuery,
        optimizedQuery:   result.optimizedQuery,
        dbType:           dbType,
        dbVersion:        body.dbVersion,
        optimizationGoal: optimizationGoal,
        schema:           schema,
        naturalLanguage:  naturalLanguage,
        metrics:          result.metrics,
        indexSuggestions: result.indexSuggestions,
        explanation:      result.explanation,
        queryComplexity:  result.queryComplexity,
        warnings:         result.warnings,
        ipHash,
      });
    } catch (dbErr: any) {
      console.warn('[/api/optimize] DB save failed (non-blocking):', dbErr.message);
    }
  })();

  return NextResponse.json(
    { success: true, data: result, rateLimitRemaining: rl.remaining },
    { status: 200, headers: { 'X-RateLimit-Remaining': String(rl.remaining) } }
  );
}
