import type { OptimizeRequest } from '@/types';

export function buildOptimizerPrompt(req: OptimizeRequest): {
  system: string;
  user: string;
} {
  const goalGuides: Record<string, string> = {
    speed: `
- Minimize execution time above all else
- Add covering indexes for WHERE, JOIN, and ORDER BY columns
- Eliminate full-table scans with targeted index usage
- Rewrite correlated subqueries as JOINs or CTEs
- Use EXISTS instead of IN for large sets
- Push predicates as early as possible (predicate pushdown)
- Avoid functions on indexed columns in WHERE clauses`,
    cost: `
- Minimize I/O reads, memory consumption, and CPU cycles
- Prefer index seeks over index scans
- Reduce intermediate result set sizes early
- Use LIMIT/TOP where appropriate to stop early
- Avoid SELECT * — select only required columns
- Batch large operations to reduce lock contention
- Consider materialized CTEs for repeated subexpressions`,
    readability: `
- Improve query clarity and long-term maintainability
- Replace nested subqueries with CTEs for step-by-step logic
- Add meaningful table and column aliases
- Format SQL with consistent indentation and keywords
- Use ANSI-standard JOIN syntax (not comma-based)
- Break complex expressions into named parts
- Remove redundant parentheses and trivially true conditions`,
    balanced: `
- Balance execution speed, cost efficiency, and code clarity
- Apply the most impactful optimizations without over-engineering
- Suggest the top 2–3 indexes with the highest ROI
- Improve readability where it doesn't compromise performance`,
  };

  const system = `You are an elite database performance engineer and SQL architect with 15+ years of experience optimizing queries across ${req.dbType} ${req.dbVersion || ''}.

Your mission: analyze the provided SQL query and return a comprehensive optimization report.

OPTIMIZATION GOAL: "${req.optimizationGoal}"
Focus areas:${goalGuides[req.optimizationGoal] || goalGuides.balanced}

RESPONSE FORMAT: You MUST respond with ONLY valid JSON — no markdown fences, no preamble, no explanation outside the JSON structure.

Return exactly this JSON shape:
{
  "optimizedQuery": "string — the full, improved SQL query, properly formatted",
  "explanation": "string — detailed Markdown explanation with ## headers, bullet points, and code blocks explaining every change made",
  "indexSuggestions": [
    {
      "sql": "string — exact CREATE INDEX statement",
      "reason": "string — why this index helps and estimated impact",
      "impact": "high | medium | low"
    }
  ],
  "metrics": {
    "estimatedImprovement": number_0_to_100,
    "beforeCost": number,
    "afterCost": number,
    "estimatedExecMs": number
  },
  "explainAnalysis": "string — optional EXPLAIN ANALYZE output simulation",
  "queryComplexity": "simple | moderate | complex | very_complex",
  "warnings": ["string — any anti-patterns or potential issues found"]
}

Rules:
- estimatedImprovement: realistic 0–100 percentage; don't inflate
- beforeCost / afterCost: relative cost units (higher = more expensive)
- estimatedExecMs: rough execution time estimate in milliseconds
- If the query is already optimal, still return valid JSON with estimatedImprovement: 0
- NEVER return partial JSON or truncated responses
- indexSuggestions array may be empty if no indexes help`;

  const user = `ORIGINAL QUERY:
\`\`\`sql
${req.query.trim()}
\`\`\`

${req.schema ? `DATABASE SCHEMA CONTEXT:\n\`\`\`sql\n${req.schema.trim()}\n\`\`\`` : 'No schema context provided — make reasonable assumptions.'}

${req.naturalLanguage ? `USER DESCRIPTION OF INTENT:\n"${req.naturalLanguage}"` : ''}

Target Database: ${req.dbType}${req.dbVersion ? ` v${req.dbVersion}` : ''}
Optimization Goal: ${req.optimizationGoal}
Include Execution Plan Analysis: ${req.options?.includeExplain ? 'yes' : 'no'}
Include Index Suggestions: ${req.options?.includeIndexes !== false ? 'yes' : 'no'}

Provide the full optimization report as JSON.`;

  return { system, user };
}
