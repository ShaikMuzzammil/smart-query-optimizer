// lib/ai-engine.ts — Gemini-primary AI engine (Anthropic optional fallback)
// Engine names are intentionally neutral — no AI branding exposed to users.

import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Provider init (safe — only creates clients when keys are present) ─────────
let geminiClient: GoogleGenerativeAI | null = null;
let anthropicClient: import("@anthropic-ai/sdk").default | null = null;

function getGemini(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!geminiClient) {
    const { GoogleGenerativeAI: G } = require("@google/generative-ai");
    geminiClient = new G(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

function getAnthropic(): import("@anthropic-ai/sdk").default | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    if (!anthropicClient) {
      const Anthropic = require("@anthropic-ai/sdk").default;
      anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return anthropicClient;
  } catch {
    return null;
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────
export function buildOptimizeSystem(dialect = "PostgreSQL", schemaContext?: string) {
  const schemaSection = schemaContext
    ? `\n\nSCHEMA CONTEXT (use these exact table/column names):\n${schemaContext}`
    : "";
  return `You are a world-class SQL query optimizer and database performance expert specializing in ${dialect}.${schemaSection}

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
  "piiFields": [],
  "securityAlerts": [],
  "lintWarnings": []
}

Rules:
- performanceGain: integer 1-99
- costScore: 1-100 (lower = cheaper to execute)
- securityAlerts: array of strings for SQL injection risks, unbounded selects, etc.
- lintWarnings: array of strings for style/quality issues
- If NOT SQL: isValidSql=false, optimizedQuery="", empty arrays, performanceGain=0
- If SQL with syntax errors: isValidSql=true, corrected SQL in optimizedQuery
- piiDetected: true if string literals look like real PII (emails, SSNs, card numbers)
- Always use ${dialect}-specific syntax and functions
- Never include text outside the single JSON object`;
}

// ── PII redaction ──────────────────────────────────────────────────────────────
const PII_PATTERNS = [
  { rx: /(['"'])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\1/g,           label: "[REDACTED_EMAIL]" },
  { rx: /(['"'])\d{3}-\d{2}-\d{4}\1/g,                                           label: "[REDACTED_SSN]" },
  { rx: /(['"'])(?:\d[\s-]?){13,16}\1/g,                                          label: "[REDACTED_CARD]" },
  { rx: /(['"'])(?:\+?1[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\1/g,         label: "[REDACTED_PHONE]" },
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

// ── Types ─────────────────────────────────────────────────────────────────────
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
  securityAlerts: string[];
  lintWarnings: string[];
  engine: "engine-a" | "engine-b" | "ai";
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

// ── JSON extraction ───────────────────────────────────────────────────────────
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

function parseResult(raw: string, engine: OptimizeResult["engine"]): OptimizeResult {
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
    isValidSql:           p.isValidSql ?? true,
    optimizedQuery:       p.optimizedQuery ?? "",
    issues:               Array.isArray(p.issues) ? p.issues : [],
    improvements:         Array.isArray(p.improvements) ? p.improvements : [],
    performanceGain:      typeof p.performanceGain === "number" ? p.performanceGain : 0,
    explanation:          p.explanation ?? "",
    indexRecommendations: Array.isArray(p.indexRecommendations) ? p.indexRecommendations : [],
    complexityBefore:     p.complexityBefore ?? "N/A",
    complexityAfter:      p.complexityAfter ?? "N/A",
    estimatedSpeedup:     p.estimatedSpeedup ?? "N/A",
    tablesDetected:       Array.isArray(p.tablesDetected) ? p.tablesDetected : [],
    queryType:            p.queryType ?? "UNKNOWN",
    dialect:              p.dialect ?? "PostgreSQL",
    domain:               p.domain ?? "General",
    title:                p.title ?? "SQL Query",
    estimatedRowsScanned: p.estimatedRowsScanned ?? "N/A",
    costScore:            typeof p.costScore === "number" ? p.costScore : 0,
    readabilityNotes:     p.readabilityNotes ?? "",
    piiDetected:          p.piiDetected ?? false,
    piiFields:            Array.isArray(p.piiFields) ? p.piiFields : [],
    securityAlerts:       Array.isArray(p.securityAlerts) ? p.securityAlerts : [],
    lintWarnings:         Array.isArray(p.lintWarnings) ? p.lintWarnings : [],
    engine,
  };
}

// ── Provider calls ─────────────────────────────────────────────────────────────
// Gemini model priority list — tries each in order
const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-pro",
];

async function callGemini(prompt: string, system: string, strict: boolean): Promise<string> {
  const g = getGemini();
  if (!g) throw new AiUnavailableError("Query engine not configured — add GEMINI_API_KEY");
  const sys = strict ? system + "\n\nIMPORTANT: Respond ONLY with a raw JSON object. No markdown, no prose." : system;

  let lastErr: unknown = null;
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = g.getGenerativeModel({
        model: modelName,
        systemInstruction: sys,
        generationConfig: { responseMimeType: "application/json" },
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastErr = err;
      const msg = String(err).toLowerCase();
      // Only retry on model-not-found errors
      if (!msg.includes("not found") && !msg.includes("404") && !msg.includes("invalid") && !msg.includes("does not exist")) {
        throw err;
      }
    }
  }
  throw lastErr ?? new AiUnavailableError("All Gemini models unavailable");
}

async function callAnthropic(prompt: string, system: string, strict: boolean): Promise<string> {
  const a = getAnthropic();
  if (!a) throw new AiUnavailableError("Fallback engine not configured");
  const sys = strict ? system + "\n\nIMPORTANT: Respond ONLY with a raw JSON object. No markdown, no prose." : system;
  const msg = await (a as any).messages.create({
    model: "claude-sonnet-4-6", max_tokens: 2048,
    system: sys, messages: [{ role: "user", content: prompt }],
  });
  return msg.content.map((c: any) => (c.type === "text" ? c.text : "")).join("");
}

// ── Main optimize function ─────────────────────────────────────────────────────
export async function optimizeSQL(
  query: string,
  dialect = "PostgreSQL",
  schemaContext?: string
): Promise<OptimizeResult> {
  const { redacted, found } = redactPii(query);
  const prompt = `Analyze this ${dialect} SQL query and return the JSON optimization result:\n\n${redacted}`;
  const system = buildOptimizeSystem(dialect, schemaContext);

  // Build provider chain — Gemini first, Anthropic as fallback
  const providers: Array<{ name: OptimizeResult["engine"]; call: (s: boolean) => Promise<string> }> = [];
  if (getGemini())    providers.push({ name: "engine-b", call: (s) => callGemini(prompt, system, s) });
  if (getAnthropic()) providers.push({ name: "engine-a", call: (s) => callAnthropic(prompt, system, s) });

  if (!providers.length) {
    throw new AiUnavailableError(
      "Query engine not configured. Please add GEMINI_API_KEY in your environment variables."
    );
  }

  let lastErr: unknown = null;
  for (let i = 0; i < providers.length; i++) {
    const { name, call } = providers[i];
    const isLast = i === providers.length - 1;
    try {
      const raw = await call(false);
      const result = parseResult(raw, name);
      if (found.length > 0) {
        result.piiDetected = true;
        result.piiFields = [...new Set([...result.piiFields, ...found])];
      }
      result.engine = "ai";
      return result;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const retryable = msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("429") ||
                        msg.toLowerCase().includes("503") || msg.toLowerCase().includes("overload");
      if (!isLast && (err instanceof AiUnavailableError || retryable)) {
        console.warn(`[AI-ENGINE] provider ${name} failed, trying next:`, msg);
        continue;
      }
      if (!(err instanceof AiParseError)) {
        try {
          const retryRaw = await call(true);
          const result = parseResult(retryRaw, name);
          if (found.length > 0) { result.piiDetected = true; result.piiFields = [...new Set([...result.piiFields, ...found])]; }
          result.engine = "ai";
          return result;
        } catch (retryErr) {
          lastErr = retryErr;
          if (!isLast) continue;
        }
      }
      if (!isLast) continue;
      throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new AiUnavailableError("Query engine temporarily unavailable — please try again.");
}

// ── NL2SQL ────────────────────────────────────────────────────────────────────
const NL2SQL_SYSTEM = (dialect: string, schemaContext?: string) => {
  const schemaSection = schemaContext
    ? `\n\nSCHEMA CONTEXT (use these exact table/column names in your SQL):\n${schemaContext}`
    : "";
  return `You are an expert ${dialect} developer. Convert natural language queries to optimized ${dialect} SQL.${schemaSection}
Return ONLY valid JSON, no markdown:
{
  "sql": "the complete, production-ready ${dialect} SQL query",
  "explanation": "what this query does in plain English",
  "assumptions": ["assumption about schema/data if any"],
  "tablesNeeded": ["table1", "table2"],
  "dialect": "${dialect}"
}
Rules: Use realistic, well-named tables. Write production-quality SQL with proper JOINs, WHERE clauses, aliases.`;
};

export async function nl2sql(
  prompt: string,
  dialect = "PostgreSQL",
  schemaContext?: string
): Promise<NL2SQLResult> {
  const userPrompt = `Convert this natural language request to ${dialect} SQL:\n"${prompt}"`;
  const system = NL2SQL_SYSTEM(dialect, schemaContext);

  const providers = [
    ...(getGemini()    ? [{ call: (s: boolean) => callGemini(userPrompt, system, s) }] : []),
    ...(getAnthropic() ? [{ call: (s: boolean) => callAnthropic(userPrompt, system, s) }] : []),
  ];

  if (!providers.length) throw new AiUnavailableError("Query engine not configured — add GEMINI_API_KEY");

  for (let i = 0; i < providers.length; i++) {
    try {
      const raw = await providers[i].call(false);
      const cleaned = raw.replace(/```json|```/g, "").trim();
      let parsed: unknown;
      try { parsed = JSON.parse(cleaned); } catch { const ex = extractJson(cleaned); if (!ex) throw new AiParseError("bad JSON"); parsed = JSON.parse(ex); }
      const p = parsed as Partial<NL2SQLResult>;
      return {
        sql: p.sql ?? "",
        explanation: p.explanation ?? "",
        assumptions: Array.isArray(p.assumptions) ? p.assumptions : [],
        tablesNeeded: Array.isArray(p.tablesNeeded) ? p.tablesNeeded : [],
        dialect: p.dialect ?? dialect,
      };
    } catch (err) {
      if (i < providers.length - 1) { console.warn("[NL2SQL] provider failed, trying next"); continue; }
      throw err;
    }
  }
  throw new AiUnavailableError("Conversion service unavailable");
}

// Re-export legacy symbols
export const OPTIMIZE_SYSTEM = buildOptimizeSystem();
