// lib/ai-engine.ts
// Multi-provider AI engine: Claude (Anthropic) is the primary optimizer.
// If it's unavailable (missing/invalid key, rate-limited, or overloaded) and
// a GEMINI_API_KEY is configured, the request automatically retries against
// Gemini so a single provider outage/limit never takes the feature down.
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export const OPTIMIZE_SYSTEM = `You are a world-class SQL query optimizer and database performance expert with 20 years of experience optimizing queries for companies like Google, Meta, and Amazon.

Your task: analyze the provided input and return an optimized version with detailed analysis.

CRITICAL: Return ONLY valid JSON — no markdown fences, no preamble, no text outside the JSON. The entire response must be parseable by JSON.parse().

Return this exact structure:
{
  "isValidSql": true,
  "optimizedQuery": "the fully optimized SQL with inline comments on key changes",
  "issues": [{"type":"slug","severity":"critical|high|medium|low","description":"clear problem + real-world impact"}],
  "improvements": ["specific improvement 1", "improvement 2"],
  "performanceGain": 75,
  "explanation": "2-3 sentences on the most important changes",
  "indexRecommendations": ["CREATE INDEX idx_name ON table(col);"],
  "complexityBefore": "O(n²)",
  "complexityAfter": "O(n log n)",
  "estimatedSpeedup": "3-5× faster",
  "tablesDetected": ["table1","table2"],
  "queryType": "SELECT",
  "domain": "E-Commerce|Healthcare|Finance|HR|Analytics|Social|Real Estate|Logistics|Education|Gaming|Banking|General",
  "title": "Short descriptive title for this query",
  "estimatedRowsScanned": "before vs after row-scan estimate, e.g. '~2.1M rows -> ~4.8K rows'",
  "costScore": 35,
  "readabilityNotes": "1 short sentence on code-quality/maintainability changes, if any"
}

Rules:
- performanceGain: integer 1-99 (estimated % improvement)
- costScore: integer 1-100 estimate of the OPTIMIZED query's relative execution cost (lower = cheaper), roughly modeled the way a query planner's cost estimator would think about it (table scans, join order, sort operations).
- If the input is NOT SQL at all (random text, gibberish, a single word, a question, etc.): set "isValidSql" to false, set "queryType" to "UNKNOWN", set "optimizedQuery" to an empty string, leave issues/improvements/indexRecommendations/tablesDetected as empty arrays, performanceGain to 0, complexityBefore/After to "N/A", estimatedSpeedup to "N/A", domain to "General", and put a short, friendly, specific explanation of what was wrong and what a real SQL query looks like in "explanation" and "title" set to "Not a valid SQL query".
- If the input LOOKS like an attempt at SQL but has syntax errors: set "isValidSql" to true, return valid JSON, put corrected SQL in optimizedQuery, explain syntax errors as critical issues.
- Always detect all tables in tablesDetected.
- Be specific about which line/clause causes each issue.
- Never include any text, markdown formatting, or commentary outside the single JSON object.`;

export interface OptimizeResult {
  isValidSql: boolean;
  optimizedQuery: string;
  issues: Array<{ type: string; severity: string; description: string }>;
  improvements: string[];
  performanceGain: number;
  explanation: string;
  indexRecommendations: string[];
  complexityBefore: string;
  complexityAfter: string;
  estimatedSpeedup: string;
  tablesDetected: string[];
  queryType: string;
  domain: string;
  title: string;
  estimatedRowsScanned: string;
  costScore: number;
  readabilityNotes: string;
  engine: "claude" | "gemini";
}

export class AiParseError extends Error {}
export class AiUnavailableError extends Error {}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function parseOptimizeResponse(raw: string, engine: "claude" | "gemini"): OptimizeResult {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const extracted = extractJsonObject(cleaned);
    if (!extracted) throw new AiParseError("The AI engine returned an unreadable response.");
    try {
      parsed = JSON.parse(extracted);
    } catch {
      throw new AiParseError("The AI engine returned a malformed response.");
    }
  }

  const p = parsed as Partial<OptimizeResult>;
  return {
    isValidSql: p.isValidSql ?? true,
    optimizedQuery: p.optimizedQuery ?? "",
    issues: Array.isArray(p.issues) ? p.issues : [],
    improvements: Array.isArray(p.improvements) ? p.improvements : [],
    performanceGain: typeof p.performanceGain === "number" ? p.performanceGain : 0,
    explanation: p.explanation ?? "",
    indexRecommendations: Array.isArray(p.indexRecommendations) ? p.indexRecommendations : [],
    complexityBefore: p.complexityBefore ?? "N/A",
    complexityAfter: p.complexityAfter ?? "N/A",
    estimatedSpeedup: p.estimatedSpeedup ?? "N/A",
    tablesDetected: Array.isArray(p.tablesDetected) ? p.tablesDetected : [],
    queryType: p.queryType ?? "UNKNOWN",
    domain: p.domain ?? "General",
    title: p.title ?? "SQL Query",
    estimatedRowsScanned: p.estimatedRowsScanned ?? "N/A",
    costScore: typeof p.costScore === "number" ? p.costScore : 0,
    readabilityNotes: p.readabilityNotes ?? "",
    engine,
  };
}

function isRetryableProviderError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("api key") || m.includes("authentication") || m.includes("401") ||
    m.includes("rate") || m.includes("429") || m.includes("overloaded") ||
    m.includes("503") || m.includes("529") || m.includes("quota")
  );
}

async function callClaude(query: string, strict: boolean): Promise<string> {
  if (!anthropic) throw new AiUnavailableError("ANTHROPIC_API_KEY not configured");
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: strict
      ? OPTIMIZE_SYSTEM + "\n\nIMPORTANT: Your previous response was not valid JSON. Respond with ONLY the raw JSON object, nothing else."
      : OPTIMIZE_SYSTEM,
    messages: [{ role: "user", content: `Analyze this input:\n\n${query}` }],
  });
  return message.content.map((c) => (c.type === "text" ? c.text : "")).join("");
}

async function callGemini(query: string, strict: boolean): Promise<string> {
  if (!gemini) throw new AiUnavailableError("GEMINI_API_KEY not configured");
  const model = gemini.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: strict
      ? OPTIMIZE_SYSTEM + "\n\nIMPORTANT: Your previous response was not valid JSON. Respond with ONLY the raw JSON object, nothing else."
      : OPTIMIZE_SYSTEM,
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent(`Analyze this input:\n\n${query}`);
  return result.response.text();
}

/**
 * Optimizes a SQL query (or detects non-SQL input). Tries Claude first; if
 * Claude is unavailable for a retryable reason (auth/rate-limit/overload)
 * and Gemini is configured, automatically fails over to Gemini. Each
 * provider also gets one internal retry with a stricter prompt if its first
 * response isn't valid JSON.
 */
export async function optimizeSQL(query: string): Promise<OptimizeResult> {
  const attempts: Array<{ engine: "claude" | "gemini"; call: (strict: boolean) => Promise<string> }> = [];
  if (anthropic) attempts.push({ engine: "claude", call: (strict) => callClaude(query, strict) });
  if (gemini) attempts.push({ engine: "gemini", call: (strict) => callGemini(query, strict) });

  if (attempts.length === 0) {
    throw new AiUnavailableError("No AI provider is configured (set ANTHROPIC_API_KEY and/or GEMINI_API_KEY).");
  }

  let lastErr: unknown = null;

  for (let i = 0; i < attempts.length; i++) {
    const { engine, call } = attempts[i];
    const isLastProvider = i === attempts.length - 1;
    try {
      const raw = await call(false);
      try {
        return parseOptimizeResponse(raw, engine);
      } catch (parseErr) {
        // One same-provider retry with a stricter nudge before failing over.
        const retryRaw = await call(true);
        return parseOptimizeResponse(retryRaw, engine);
      }
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Only fail over to the next provider for retryable infra errors,
      // or if this provider just isn't configured. Parse errors after the
      // strict retry are NOT retried across providers (they already got a
      // fair shot) — they bubble up as-is on the last provider.
      if (!isLastProvider && (err instanceof AiUnavailableError || isRetryableProviderError(msg))) {
        continue;
      }
      throw err;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("AI optimization failed");
}
