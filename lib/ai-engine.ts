// lib/ai-engine.ts — Dual-provider AI engine with automatic failover
// Provider priority: if GEMINI_API_KEY is set without ANTHROPIC_API_KEY,
// Gemini is the sole engine. If both are set, Claude is primary with Gemini
// as automatic fallback. Either provider alone is sufficient.
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ── System prompt ────────────────────────────────────────────────────────────
export function buildOptimizeSystem(dialect = "PostgreSQL") {
  return `You are a world-class SQL query optimizer and database performance expert specializing in ${dialect}.

CRITICAL: Return ONLY valid JSON — no markdown fences, no preamble, no text outside the JSON object.

Return this EXACT structure:
{
  "isValidSql": true,
  "optimizedQuery": "fully optimized ${dialect} SQL with inline comments",
  "issues": [{"type":"slug","severity":"critical|high|medium|low","description":"problem + impact"}],
  "improvements": ["improvement 1", "improvement 2"],
  "performanceGain": 75,
  "explanation": "2-3 sentences on key changes",
  "indexRecommendations": ["CREATE INDEX idx ON tbl(col);"],
  "complexityBefore": "O(n²)",
  "complexityAfter": "O(n log n)",
  "estimatedSpeedup": "3-5× faster",
  "tablesDetected": ["table1","table2"],
  "queryType": "SELECT",
  "dialect": "${dialect}",
  "domain": "E-Commerce|Healthcare|Finance|HR|Analytics|Social|Real Estate|Logistics|Education|Gaming|Banking|Marketing|Travel|General",
  "title": "Short descriptive title",
  "estimatedRowsScanned": "~2.1M rows → ~4.8K rows",
  "costScore": 35,
  "readabilityNotes": "one line on code quality/maintainability",
  "piiDetected": false,
  "piiFields": []
}

Rules:
- performanceGain: integer 1-99
- costScore: 1-100 (lower = cheaper to execute)
- If NOT SQL: isValidSql=false, optimizedQuery="", empty arrays, performanceGain=0, explain in "explanation" what was wrong
- If SQL with syntax errors: isValidSql=true, put corrected SQL in optimizedQuery, list errors as critical issues
- piiDetected: true if you see string literals that look like real PII (emails, SSNs, card numbers)
- piiFields: list column names that appear to hold PII
- Always use ${dialect}-specific syntax and functions
- Never include text outside the single JSON object`;
}

// ── PII redaction ────────────────────────────────────────────────────────────
const PII_PATTERNS = [
  { rx: /(['"])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\1/g,           label: "[REDACTED_EMAIL]" },
  { rx: /(['"])\d{3}-\d{2}-\d{4}\1/g,                                           label: "[REDACTED_SSN]" },
  { rx: /(['"])(?:\d[\s-]?){13,16}\1/g,                                          label: "[REDACTED_CARD]" },
  { rx: /(['"])(?:\+?1[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\1/g,         label: "[REDACTED_PHONE]" },
  { rx: /(['"])\d{1,5}\s[\w\s]{1,100},\s[A-Z]{2}\s\d{5}(-\d{4})?\1/g,         label: "[REDACTED_ADDRESS]" },
];

export interface RedactResult { redacted: string; found: string[]; }

export function redactPii(sql: string): RedactResult {
  let out = sql;
  const found: string[] = [];
  for (const { rx, label } of PII_PATTERNS) {
    const matches = out.match(new RegExp(rx.source, rx.flags));
    if (matches?.length) {
      found.push(label.replace(/\[REDACTED_|]/g, "").toLowerCase());
      out = out.replace(new RegExp(rx.source, rx.flags), label);
    }
  }
  return { redacted: out, found };
}

// ── Types ────────────────────────────────────────────────────────────────────
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
  dialect: string;
  domain: string;
  title: string;
  estimatedRowsScanned: string;
  costScore: number;
  readabilityNotes: string;
  piiDetected: boolean;
  piiFields: string[];
  engine: "claude" | "gemini";
}

export interface NL2SQLResult {
  sql: string;
  explanation: string;
  assumptions: string[];
  tablesNeeded: string[];
  dialect: string;
}

export class AiParseError extends Error {}
export class AiUnavailableError extends Error {}

// ── JSON extraction ──────────────────────────────────────────────────────────
function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

function parseResult(raw: string, engine: "claude" | "gemini"): OptimizeResult {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  let parsed: unknown;
  try { parsed = JSON.parse(cleaned); }
  catch {
    const extracted = extractJson(cleaned);
    if (!extracted) throw new AiParseError("AI returned unreadable response");
    try { parsed = JSON.parse(extracted); }
    catch { throw new AiParseError("AI returned malformed JSON"); }
  }
  const p = parsed as Partial<OptimizeResult>;
  return {
    isValidSql:          p.isValidSql ?? true,
    optimizedQuery:      p.optimizedQuery ?? "",
    issues:              Array.isArray(p.issues) ? p.issues : [],
    improvements:        Array.isArray(p.improvements) ? p.improvements : [],
    performanceGain:     typeof p.performanceGain === "number" ? p.performanceGain : 0,
    explanation:         p.explanation ?? "",
    indexRecommendations: Array.isArray(p.indexRecommendations) ? p.indexRecommendations : [],
    complexityBefore:    p.complexityBefore ?? "N/A",
    complexityAfter:     p.complexityAfter ?? "N/A",
    estimatedSpeedup:    p.estimatedSpeedup ?? "N/A",
    tablesDetected:      Array.isArray(p.tablesDetected) ? p.tablesDetected : [],
    queryType:           p.queryType ?? "UNKNOWN",
    dialect:             p.dialect ?? "PostgreSQL",
    domain:              p.domain ?? "General",
    title:               p.title ?? "SQL Query",
    estimatedRowsScanned: p.estimatedRowsScanned ?? "N/A",
    costScore:           typeof p.costScore === "number" ? p.costScore : 0,
    readabilityNotes:    p.readabilityNotes ?? "",
    piiDetected:         p.piiDetected ?? false,
    piiFields:           Array.isArray(p.piiFields) ? p.piiFields : [],
    engine,
  };
}

function isRetryable(msg: string) {
  const m = msg.toLowerCase();
  return m.includes("api key") || m.includes("auth") || m.includes("401") ||
         m.includes("rate") || m.includes("429") || m.includes("overload") ||
         m.includes("503") || m.includes("529") || m.includes("quota") ||
         m.includes("invalid") || m.includes("permission") || m.includes("forbidden");
}

// ── Provider calls ───────────────────────────────────────────────────────────
async function callClaude(prompt: string, system: string, strict: boolean): Promise<string> {
  if (!anthropic) throw new AiUnavailableError("ANTHROPIC_API_KEY not configured");
  const sys = strict ? system + "\n\nIMPORTANT: Respond ONLY with a raw JSON object. No markdown, no prose." : system;
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 2048,
    system: sys, messages: [{ role: "user", content: prompt }],
  });
  return msg.content.map(c => (c.type === "text" ? c.text : "")).join("");
}

async function callGemini(prompt: string, system: string, strict: boolean): Promise<string> {
  if (!gemini) throw new AiUnavailableError("GEMINI_API_KEY not configured. Get a free key at aistudio.google.com/apikey");
  const sys = strict ? system + "\n\nIMPORTANT: Respond ONLY with a raw JSON object. No markdown, no prose." : system;
  const model = gemini.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: sys,
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── Main optimize function ───────────────────────────────────────────────────
export async function optimizeSQL(query: string, dialect = "PostgreSQL"): Promise<OptimizeResult> {
  // PII redaction before sending to any AI
  const { redacted, found } = redactPii(query);
  const prompt = `Analyze this ${dialect} SQL query and return the JSON optimization result:\n\n${redacted}`;
  const system = buildOptimizeSystem(dialect);

  // Build provider list: Gemini first if no Claude key (or Claude key may be bad)
  // Both are tried in order; any retryable error (auth, rate limit, overload) moves to next
  const providers: Array<{ name: "claude" | "gemini"; call: (s: boolean) => Promise<string> }> = [];
  if (anthropic) providers.push({ name: "claude", call: (s) => callClaude(prompt, system, s) });
  if (gemini)    providers.push({ name: "gemini", call: (s) => callGemini(prompt, system, s) });

  if (!providers.length) {
    throw new AiUnavailableError(
      "No AI provider configured. " +
      "Add GEMINI_API_KEY (free at aistudio.google.com/apikey) " +
      "and/or ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables, then redeploy."
    );
  }

  let lastErr: unknown = null;
  for (let i = 0; i < providers.length; i++) {
    const { name, call } = providers[i];
    const isLast = i === providers.length - 1;
    try {
      const raw = await call(false);
      const result = parseResult(raw, name);
      // Restore PII-related annotations to result
      if (found.length > 0) {
        result.piiDetected = true;
        result.piiFields = [...new Set([...result.piiFields, ...found])];
      }
      return result;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!isLast && (err instanceof AiUnavailableError || isRetryable(msg))) {
        console.warn(`[AI-ENGINE] ${name} failed (${msg.slice(0, 80)}), trying next provider`);
        continue;
      }
      // Same-provider retry with strict JSON prompt before giving up / failing over
      if (!(err instanceof AiParseError)) {
        try {
          const retryRaw = await call(true);
          const result = parseResult(retryRaw, name);
          if (found.length > 0) { result.piiDetected = true; result.piiFields = [...new Set([...result.piiFields, ...found])]; }
          return result;
        } catch (retryErr) {
          lastErr = retryErr;
          if (!isLast && isRetryable(retryErr instanceof Error ? retryErr.message : "")) continue;
        }
      }
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All AI providers failed");
}

// ── NL2SQL ───────────────────────────────────────────────────────────────────
const NL2SQL_SYSTEM = (dialect: string) => `You are an expert ${dialect} developer. Convert natural language queries to optimized ${dialect} SQL.
Return ONLY valid JSON, no markdown:
{
  "sql": "the complete, production-ready ${dialect} SQL query",
  "explanation": "what this query does in plain English",
  "assumptions": ["assumption about schema/data if any"],
  "tablesNeeded": ["table1", "table2"],
  "dialect": "${dialect}"
}
Rules: Use realistic, well-named tables. Write production-quality SQL with proper JOINs, WHERE clauses, aliases.`;

export async function nl2sql(prompt: string, dialect = "PostgreSQL"): Promise<NL2SQLResult> {
  const userPrompt = `Convert this natural language request to ${dialect} SQL:\n"${prompt}"`;
  const system = NL2SQL_SYSTEM(dialect);

  const providers = [
    ...(anthropic ? [{ call: (s: boolean) => callClaude(userPrompt, system, s) }] : []),
    ...(gemini    ? [{ call: (s: boolean) => callGemini(userPrompt, system, s) }] : []),
  ];

  if (!providers.length) throw new AiUnavailableError("No AI provider configured");

  for (let i = 0; i < providers.length; i++) {
    try {
      const raw = await providers[i].call(false);
      const cleaned = raw.replace(/```json|```/g, "").trim();
      let parsed: unknown;
      try { parsed = JSON.parse(cleaned); } catch { const ex = extractJson(cleaned); if (!ex) throw new AiParseError("bad JSON"); parsed = JSON.parse(ex); }
      const p = parsed as Partial<NL2SQLResult>;
      return { sql: p.sql ?? "", explanation: p.explanation ?? "", assumptions: Array.isArray(p.assumptions) ? p.assumptions : [], tablesNeeded: Array.isArray(p.tablesNeeded) ? p.tablesNeeded : [], dialect: p.dialect ?? dialect };
    } catch (err) {
      if (i < providers.length - 1) continue;
      throw err;
    }
  }
  throw new AiUnavailableError("NL2SQL failed");
}

// Re-export for legacy imports
export const OPTIMIZE_SYSTEM = buildOptimizeSystem();
