// lib/csv-export.ts
// Minimal, dependency-free CSV builder with correct RFC 4180 escaping.

export interface ExportableQuery {
  id: string;
  title: string | null;
  domain: string | null;
  queryType: string;
  performanceGain: number;
  costScore: number | null;
  engine: string | null;
  issues: unknown;
  improvements: unknown;
  indexRecs: unknown;
  originalQuery: string;
  optimizedQuery: string;
  explanation: string | null;
  createdAt: Date | string;
}

function csvField(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const HEADERS = [
  "ID", "Title", "Domain", "Query Type", "Performance Gain (%)", "Cost Score",
  "AI Engine", "Issues Found", "Index Recommendations", "Created At",
  "Original Query", "Optimized Query", "Explanation",
];

export function buildCsv(queries: ExportableQuery[]): string {
  const rows = [HEADERS.map(csvField).join(",")];
  for (const q of queries) {
    const issues = Array.isArray(q.issues) ? q.issues as Array<{ description?: string }> : [];
    const indexRecs = Array.isArray(q.indexRecs) ? q.indexRecs as string[] : [];
    rows.push([
      csvField(q.id),
      csvField(q.title ?? "SQL Query"),
      csvField(q.domain ?? "General"),
      csvField(q.queryType),
      csvField(q.performanceGain),
      csvField(q.costScore ?? ""),
      csvField(q.engine ?? "claude"),
      csvField(issues.map((i) => i.description).filter(Boolean).join(" | ")),
      csvField(indexRecs.join(" | ")),
      csvField(new Date(q.createdAt).toISOString()),
      csvField(q.originalQuery),
      csvField(q.optimizedQuery),
      csvField(q.explanation ?? ""),
    ].join(","));
  }
  return rows.join("\r\n");
}
