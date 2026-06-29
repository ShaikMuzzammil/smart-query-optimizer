import { GoogleGenerativeAI } from "@google/generative-ai";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Smart Query Intelligence Engine — v7
//  5-model fallback chain, Gemini-only
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FALLBACK_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-pro",
  "gemini-1.0-pro",
];

async function callGemini(prompt: string, maxTokens = 2048): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: Error | null = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.2,
          topP: 0.8,
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text || text.trim().length < 10) throw new Error("Empty response");
      return { text, model: modelName };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Rate limited or quota — try next model
      if (lastError.message.includes("quota") || lastError.message.includes("429")) continue;
      if (lastError.message.includes("not found") || lastError.message.includes("404")) continue;
      if (lastError.message.includes("unavailable") || lastError.message.includes("503")) continue;
      // For genuine errors, still try next model
      continue;
    }
  }
  throw lastError || new Error("All AI models exhausted");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PII Redaction
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function redactPII(sql: string): { redacted: string; count: number } {
  let redacted = sql;
  let count = 0;

  const patterns: [RegExp, string][] = [
    [/\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b/gi, "[EMAIL_REDACTED]"],
    [/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE_REDACTED]"],
    [/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]"],
    [/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, "[CARD_REDACTED]"],
    [/\b[A-Z]{2}\d{6}[A-Z]?\b/g, "[PASSPORT_REDACTED]"],
  ];

  for (const [pattern, replacement] of patterns) {
    const before = redacted;
    redacted = redacted.replace(pattern, replacement);
    if (redacted !== before) count++;
  }

  return { redacted, count };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Static SQL Analysis (works without AI)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export interface Issue {
  label: string;
  desc: string;
  severity: "critical" | "high" | "medium" | "low";
  fix?: string;
}

export function analyzeSQLStatic(sql: string): Issue[] {
  const issues: Issue[] = [];
  const upper = sql.toUpperCase();

  if (/SELECT\s+\*/i.test(sql))
    issues.push({ label: "SELECT * Usage", desc: "Fetches all columns — prevents index-only scans and wastes bandwidth.", severity: "medium", fix: "List only the columns you need: SELECT id, name, email FROM ..." });

  if (/YEAR\s*\(|MONTH\s*\(|DAY\s*\(|DATE\s*\(/i.test(sql))
    issues.push({ label: "Function on Indexed Column", desc: "Wrapping a column in a function prevents the query engine from using an index on that column.", severity: "high", fix: "Use range predicates: WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'" });

  if (/SELECT[\s\S]*?FROM\s+\w+[\s\S]*?WHERE[\s\S]*?SELECT/i.test(sql))
    issues.push({ label: "Correlated Subquery (N+1)", desc: "Runs once per outer row. Replace with a JOIN + GROUP BY for O(n) instead of O(n\u00b2) execution.", severity: "critical", fix: "Rewrite as LEFT JOIN with aggregation in a subquery or CTE" });

  if (!/LIMIT|TOP|ROWNUM|FETCH\s+FIRST/i.test(sql) && /SELECT/i.test(sql))
    issues.push({ label: "Missing LIMIT Clause", desc: "Without a result-set bound, a single query can return millions of rows and saturate memory.", severity: "medium", fix: "Add LIMIT 100 or appropriate page size" });

  if (!/WHERE/i.test(sql) && /SELECT/i.test(sql) && !/COUNT\(\)/i.test(sql))
    issues.push({ label: "Missing WHERE Clause", desc: "Full table scan — no filter means every row is examined regardless of table size.", severity: "high", fix: "Add a WHERE clause to filter rows before aggregation" });

  if (/OR\s+\d+\s*=\s*\d+|OR\s+'[^']*'\s*=\s*'[^']*'|1\s*=\s*1|'1'\s*=\s*'1'/i.test(sql))
    issues.push({ label: "SQL Injection Pattern", desc: "Tautological condition detected — potential SQL injection vulnerability.", severity: "critical", fix: "Use parameterized queries / prepared statements" });

  if (/LIKE\s+'%[^%]/i.test(sql))
    issues.push({ label: "Leading Wildcard LIKE", desc: "A leading % forces a full index scan — cannot use B-tree index prefix.", severity: "high", fix: "Use full-text search or a suffix index for leading wildcard patterns" });

  if (/NOT\s+IN\s*\(/i.test(sql))
    issues.push({ label: "NOT IN with Subquery", desc: "NOT IN returns no rows if the subquery contains any NULL values. Use NOT EXISTS instead.", severity: "high", fix: "Replace NOT IN (...) with NOT EXISTS (SELECT 1 FROM ... WHERE ...)" });

  if ((sql.match(/JOIN/gi) || []).length > 4)
    issues.push({ label: "Excessive JOINs", desc: "More than 4 JOINs increases the optimizer search space exponentially.", severity: "medium", fix: "Consider CTEs, materialized views, or denormalization for hot paths" });

  if (/ORDER\s+BY[\s\S]*?RAND\(\)|NEWID\(\)|RANDOM\(\)/i.test(sql))
    issues.push({ label: "ORDER BY RANDOM()", desc: "Sorts the entire result set randomly — O(n log n) per query, never uses indexes.", severity: "high", fix: "Use offset-based or keyset pagination for random sampling" });

  return issues;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SQL Optimize
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export interface OptimizeResult {
  optimizedSQL: string;
  explanation: string;
  changes: string[];
  indexSuggestions: string[];
  performanceGain: string;
  issues: Issue[];
  staticIssues: Issue[];
  modelUsed: string;
  piiRedacted: number;
}

export async function optimizeSQL(sql: string, dialect: string = "PostgreSQL"): Promise<OptimizeResult> {
  const { redacted, count: piiCount } = redactPII(sql);
  const staticIssues = analyzeSQLStatic(sql);

  const prompt = `You are a senior database performance engineer and SQL expert. Analyze and optimize this ${dialect} query.

SQL QUERY:
\`\`\`sql
${redacted}
\`\`\`

DIALECT: ${dialect}

Provide a thorough optimization. Return ONLY valid JSON with this exact structure (no markdown, no backticks):
{
  "optimizedSQL": "the fully optimized SQL query with comments explaining each change",
  "explanation": "2-3 sentence summary of the main performance issue and the fix",
  "changes": ["change 1", "change 2", "change 3"],
  "indexSuggestions": ["CREATE INDEX idx_name ON table(col);", "CREATE INDEX ..."],
  "performanceGain": "e.g. 10-50x faster on large datasets"
}

Focus on:
- Eliminating N+1 correlated subqueries (replace with JOINs + GROUP BY)
- Removing function calls on indexed columns
- Adding appropriate LIMIT clauses
- Fixing NULL-unsafe comparisons (NOT IN → NOT EXISTS)
- Using CTEs for complex transformations
- ${dialect}-specific optimizations (window functions, EXPLAIN hints, etc.)`;

  try {
    const { text, model } = await callGemini(prompt, 2048);
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      optimizedSQL: parsed.optimizedSQL || redacted,
      explanation: parsed.explanation || "Query has been optimized.",
      changes: parsed.changes || [],
      indexSuggestions: parsed.indexSuggestions || [],
      performanceGain: parsed.performanceGain || "Significant improvement expected",
      issues: staticIssues,
      staticIssues,
      modelUsed: model,
      piiRedacted: piiCount,
    };
  } catch (err) {
    // Static-only fallback — still useful
    return {
      optimizedSQL: redacted,
      explanation: "AI optimization unavailable. Static analysis completed — review issues below.",
      changes: staticIssues.map((i) => i.label),
      indexSuggestions: [],
      performanceGain: "Apply fixes above for estimated 2-10x improvement",
      issues: staticIssues,
      staticIssues,
      modelUsed: "static-analysis",
      piiRedacted: piiCount,
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Natural Language to SQL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export interface NL2SQLResult {
  sql: string;
  explanation: string;
  tables: string[];
  complexity: "simple" | "moderate" | "complex";
  modelUsed: string;
}

export async function convertNL2SQL(
  prompt: string,
  dialect: string = "PostgreSQL",
  schemaContext?: string
): Promise<NL2SQLResult> {
  const schemaSection = schemaContext
    ? `\nDATABASE SCHEMA (use ONLY these exact table/column names):\n\`\`\`sql\n${schemaContext}\n\`\`\``
    : "\nNo schema provided — use generic table names appropriate for the domain.";

  const systemPrompt = `You are an expert SQL developer. Convert the natural language request to a production-ready ${dialect} SQL query.
${schemaSection}

USER REQUEST: ${prompt}

DIALECT: ${dialect}

Return ONLY valid JSON (no markdown, no backticks):
{
  "sql": "the complete, ready-to-run SQL query with inline comments",
  "explanation": "plain-English explanation of what the query does and why it's structured this way",
  "tables": ["table1", "table2"],
  "complexity": "simple|moderate|complex"
}

Requirements:
- Use exact table and column names from the schema if provided
- Include appropriate JOINs, GROUP BY, HAVING, ORDER BY, LIMIT
- Add SQL comments for non-obvious logic
- Use ${dialect}-specific syntax (window functions, CTEs, etc. where appropriate)
- Never hallucinate table or column names if schema is provided`;

  const { text, model } = await callGemini(systemPrompt, 2048);
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(clean);

  return {
    sql: parsed.sql || "-- Could not generate SQL",
    explanation: parsed.explanation || "",
    tables: parsed.tables || [],
    complexity: parsed.complexity || "moderate",
    modelUsed: model,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Schema Analysis
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export interface SchemaAnalysisResult {
  tableCount: number;
  columnCount: number;
  relationshipCount: number;
  suggestions: string[];
  normalForm: string;
  modelUsed: string;
}

export async function analyzeSchema(ddl: string): Promise<SchemaAnalysisResult> {
  const prompt = `Analyze this database schema DDL and provide optimization insights.

DDL:
\`\`\`sql
${ddl}
\`\`\`

Return ONLY valid JSON:
{
  "suggestions": ["suggestion 1", "suggestion 2"],
  "normalForm": "e.g. 3NF with minor violations",
  "indexRecommendations": ["CREATE INDEX ..."],
  "securityConcerns": ["concern 1"]
}`;

  const tableMatches = ddl.match(/CREATE\s+TABLE\s+\w+/gi) || [];
  const colMatches = ddl.match(/^\s+\w+\s+\w+/gm) || [];
  const fkMatches = ddl.match(/REFERENCES\s+\w+/gi) || [];

  try {
    const { text, model } = await callGemini(prompt, 1024);
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      tableCount: tableMatches.length,
      columnCount: colMatches.length,
      relationshipCount: fkMatches.length,
      suggestions: parsed.suggestions || [],
      normalForm: parsed.normalForm || "Unknown",
      modelUsed: model,
    };
  } catch {
    return {
      tableCount: tableMatches.length,
      columnCount: colMatches.length,
      relationshipCount: fkMatches.length,
      suggestions: ["Add indexes on foreign key columns", "Consider adding updated_at timestamps", "Review NOT NULL constraints"],
      normalForm: "Analysis unavailable",
      modelUsed: "static",
    };
  }
}
