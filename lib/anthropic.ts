// lib/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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
  "title": "Short descriptive title for this query"
}

Rules:
- performanceGain: integer 1-99 (estimated % improvement)
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
}

/** Pulls the first balanced {...} block out of a string, in case the model
 *  wraps JSON in stray prose despite instructions. */
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

function parseOptimizeResponse(raw: string): OptimizeResult {
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
  // Normalize / backfill so the UI never breaks on a missing field.
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
  };
}

export class AiParseError extends Error {}

export async function optimizeSQL(query: string): Promise<OptimizeResult> {
  const call = () =>
    anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: OPTIMIZE_SYSTEM,
      messages: [{ role: "user", content: `Analyze this input:\n\n${query}` }],
    });

  const message = await call();
  const raw = message.content.map((c) => (c.type === "text" ? c.text : "")).join("");

  try {
    return parseOptimizeResponse(raw);
  } catch (firstErr) {
    // One retry with a stricter nudge — handles the rare case where the
    // model adds stray prose around the JSON.
    const retry = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: OPTIMIZE_SYSTEM + "\n\nIMPORTANT: Your previous response was not valid JSON. Respond with ONLY the raw JSON object, nothing else.",
      messages: [{ role: "user", content: `Analyze this input:\n\n${query}` }],
    });
    const retryRaw = retry.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    try {
      return parseOptimizeResponse(retryRaw);
    } catch {
      throw firstErr;
    }
  }
}
