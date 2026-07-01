// lib/ai-engine.ts — SmartQuery AI Engine (Gemini-powered, name never exposed)
// FIX #2 & #12: Use GEMINI_API_KEY, correct model names, no AI name in errors
// UPDATED: the previous 5-model chain (gemini-1.5-pro/flash/flash-8b, gemini-pro,
// gemini-1.0-pro) was the actual root cause of every "Optimization/Conversion
// Unavailable" error — Google shut all of those model IDs down (404 on every
// call). Chain below uses only currently-live, stable model IDs.

export class AiUnavailableError extends Error {
  constructor(msg = "AI service temporarily unavailable") { super(msg); }
}
export class AiParseError extends Error {
  constructor(msg = "AI returned unexpected format") { super(msg); }
}

// 5-model fallback chain — current, live Gemini model IDs (verified against
// the Gemini API model list). "gemini-flash-latest" is a Google-managed alias
// that auto-points at the newest stable Flash release, so this chain stays
// correct even as Google ships new model generations.
const GEMINI_MODELS = [
  "gemini-flash-latest",   // alias → always-current stable Flash model
  "gemini-2.5-flash",      // best price/performance, stable
  "gemini-3.5-flash",      // most capable for sustained agentic/coding tasks
  "gemini-2.5-pro",        // deep reasoning fallback for complex queries
  "gemini-2.5-flash-lite", // fastest, cheapest — last-resort fallback
] as const;

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function callGemini(prompt: string, maxTokens = 4096): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiUnavailableError("Intelligence engine not configured — set GEMINI_API_KEY");

  let lastErr: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `${GEMINI_BASE}/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.15,
              maxOutputTokens: maxTokens,
              responseMimeType: "text/plain",
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        lastErr = new Error(`[${model}] HTTP ${res.status}: ${body.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) { lastErr = new Error(`[${model}] Empty response`); continue; }
      return text.trim();
    } catch (e) {
      lastErr = e;
    }
  }
  console.error("[AI ENGINE] All models failed:", lastErr);
  throw new AiUnavailableError();
}

function extractJSON(raw: string): string {
  // Strip markdown fences
  const stripped = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  // Find the first { ... } block
  const start = stripped.indexOf("{");
  const end   = stripped.lastIndexOf("}");
  if (start === -1 || end === -1) throw new AiParseError("No JSON object in response");
  return stripped.slice(start, end + 1);
}

// ── PII Redaction ──────────────────────────────────────────────────────────
const PII_PATTERNS: Array<[RegExp, string]> = [
  [/\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,       "[EMAIL_REDACTED]"],
  [/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,                            "[SSN_REDACTED]"],
  [/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, "[CARD_REDACTED]"],
  [/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,                            "[PHONE_REDACTED]"],
];

export function redactPII(sql: string): string {
  let out = sql;
  for (const [re, rep] of PII_PATTERNS) out = out.replace(re, rep);
  return out;
}

// ── SQL Optimizer ──────────────────────────────────────────────────────────
export interface OptimizeResult {
  optimizedQuery:      string;
  explanation:         string;
  performanceGain:     number;
  estimatedSpeedup:    string;
  estimatedRowsScanned:string;
  costScore:           number;
  complexityBefore:    string;
  complexityAfter:     string;
  readabilityNotes:    string;
  issues:              Array<{ type: string; severity: "critical"|"warning"|"info"; description: string; suggestion: string }>;
  improvements:        string[];
  indexRecommendations:string[];
  tablesDetected:      string[];
  domain:              string;
  title:               string;
  engine:              string;
  queryType:           string;
}

const OPTIMIZE_PROMPT = (sql: string, dialect: string, schema?: string) => `
You are an expert SQL query optimizer. Analyze and optimize the following ${dialect} SQL query.
${schema ? `\nSchema context:\n${schema}\n` : ""}

SQL Query:
\`\`\`sql
${sql}
\`\`\`

Return ONLY valid JSON (no markdown, no prose) with this exact structure:
{
  "optimizedQuery": "the fully rewritten, optimized SQL query as a string",
  "explanation": "2-3 sentence explanation of what was changed and why",
  "performanceGain": 45,
  "estimatedSpeedup": "2-5x faster",
  "estimatedRowsScanned": "~1,200 rows vs ~850,000 before",
  "costScore": 72,
  "complexityBefore": "O(n²)",
  "complexityAfter": "O(n log n)",
  "readabilityNotes": "Added table aliases, improved formatting",
  "issues": [
    {
      "type": "Correlated Subquery (N+1)",
      "severity": "critical",
      "description": "Runs once per outer row. Scales as O(n²).",
      "suggestion": "Use JOIN + GROUP BY instead."
    }
  ],
  "improvements": [
    "Eliminated N+1 correlated subquery with LEFT JOIN",
    "Added LIMIT clause to bound result set",
    "Used index-friendly column access"
  ],
  "indexRecommendations": [
    "CREATE INDEX idx_orders_customer_id ON orders(customer_id);",
    "CREATE INDEX idx_orders_created_at ON orders(created_at DESC);"
  ],
  "tablesDetected": ["orders", "customers"],
  "domain": "E-Commerce",
  "title": "Customer Order Summary Query",
  "engine": "smartquery-ai",
  "queryType": "SELECT"
}

Severity levels: "critical" = anti-pattern causing O(n²)+ behavior; "warning" = inefficiency; "info" = style suggestion.
performanceGain: integer 1-95 (realistic estimate).
costScore: integer 0-100 where 100 = most expensive, 0 = cheapest.
`;

export async function optimizeSQL(
  rawSql: string,
  dialect = "PostgreSQL",
  schemaContext?: string
): Promise<OptimizeResult> {
  const sql = redactPII(rawSql);
  const raw = await callGemini(OPTIMIZE_PROMPT(sql, dialect, schemaContext));
  try {
    const json = extractJSON(raw);
    const result = JSON.parse(json) as OptimizeResult;
    // Ensure arrays exist
    result.issues              = Array.isArray(result.issues)              ? result.issues              : [];
    result.improvements        = Array.isArray(result.improvements)        ? result.improvements        : [];
    result.indexRecommendations= Array.isArray(result.indexRecommendations)? result.indexRecommendations: [];
    result.tablesDetected      = Array.isArray(result.tablesDetected)      ? result.tablesDetected      : [];
    result.engine              = "smartquery-ai";
    return result;
  } catch {
    throw new AiParseError("Optimization result could not be parsed");
  }
}

// ── Natural Language to SQL ────────────────────────────────────────────────
export interface NL2SQLResult {
  sql:           string;
  explanation:   string;
  assumptions:   string[];
  tablesNeeded:  string[];
  dialect:       string;
  complexity:    string;
  alternativeApproach?: string;
}

const NL2SQL_PROMPT = (prompt: string, dialect: string, schema?: string) => `
You are an expert SQL developer. Convert the following natural language description into a production-ready ${dialect} SQL query.
${schema ? `\nDatabase schema context:\n${schema}\n` : ""}

User request: "${prompt}"

Return ONLY valid JSON (no markdown, no prose):
{
  "sql": "the complete, production-ready SQL query",
  "explanation": "2-3 sentence explanation of the query logic",
  "assumptions": ["Assumption 1 made about the schema or data", "Assumption 2"],
  "tablesNeeded": ["table_name_1", "table_name_2"],
  "dialect": "${dialect}",
  "complexity": "Simple SELECT with JOIN",
  "alternativeApproach": "Optional: alternative approach if relevant"
}

Rules:
- Use proper ${dialect} syntax
- Add comments in the SQL for clarity
- Use aliases for readability  
- Handle NULLs appropriately
- Add LIMIT where appropriate
- If schema is provided, use EXACT table/column names — no hallucinations
`;

export async function nl2sql(
  prompt: string,
  dialect = "PostgreSQL",
  schemaContext?: string
): Promise<NL2SQLResult> {
  const raw = await callGemini(NL2SQL_PROMPT(prompt, dialect, schemaContext));
  try {
    const json = extractJSON(raw);
    const result = JSON.parse(json) as NL2SQLResult;
    result.assumptions  = Array.isArray(result.assumptions)  ? result.assumptions  : [];
    result.tablesNeeded = Array.isArray(result.tablesNeeded) ? result.tablesNeeded : [];
    return result;
  } catch {
    throw new AiParseError("SQL generation result could not be parsed");
  }
}

// ── Static SQL Analysis (instant, no AI needed) ───────────────────────────
export interface StaticIssue {
  type:        string;
  severity:    "critical" | "warning" | "info";
  description: string;
  suggestion:  string;
  line?:       number;
}

const PATTERNS: Array<{ re: RegExp; issue: StaticIssue }> = [
  {
    re: /\bSELECT\s+\*/i,
    issue: { type: "SELECT *", severity: "warning",
      description: "Selecting all columns fetches unnecessary data.",
      suggestion: "List only the columns you need." },
  },
  {
    re: /\bLIKE\s+'%/i,
    issue: { type: "Leading Wildcard LIKE", severity: "critical",
      description: "LIKE '%...' prevents index use; causes full table scan.",
      suggestion: "Use a full-text index or reverse the pattern." },
  },
  {
    re: /\b(YEAR|MONTH|DAY|UPPER|LOWER|TRIM|LENGTH)\s*\(/i,
    issue: { type: "Function on Indexed Column", severity: "warning",
      description: "Wrapping a column in a function prevents index use.",
      suggestion: "Use range conditions or computed/virtual columns." },
  },
  {
    re: /\bSELECT\b(?![\s\S]*\bLIMIT\b)/i,
    issue: { type: "Missing LIMIT Clause", severity: "info",
      description: "Without LIMIT, queries return unbounded result sets.",
      suggestion: "Add LIMIT to prevent accidental full-table reads." },
  },
  {
    re: /\bNOT\s+IN\s*\(/i,
    issue: { type: "NOT IN Subquery", severity: "warning",
      description: "NOT IN with NULLs returns no rows. NOT EXISTS is safer.",
      suggestion: "Replace NOT IN with NOT EXISTS or LEFT JOIN ... WHERE IS NULL." },
  },
  {
    re: /\(SELECT\b(?:[^()]*|\([^()]*\))*\)\s+(?:AS\s+\w+\s+)?WHERE/i,
    issue: { type: "Correlated Subquery (N+1)", severity: "critical",
      description: "Runs once per outer row. Scales as O(n²).",
      suggestion: "Use JOIN + GROUP BY instead." },
  },
  {
    re: /\bOR\b.*\bWHERE\b/i,
    issue: { type: "OR in WHERE Clause", severity: "info",
      description: "OR can prevent index use on some engines.",
      suggestion: "Consider UNION ALL of two separate queries." },
  },
];

export function staticAnalyze(sql: string): StaticIssue[] {
  return PATTERNS
    .filter(({ re }) => re.test(sql))
    .map(({ issue }) => issue);
}
