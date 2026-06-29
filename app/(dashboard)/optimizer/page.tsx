"use client";
import { useState, useCallback, useRef } from "react";
import Link from "next/link";

const DIALECTS = [
  { id: "PostgreSQL", icon: "🐘", label: "PostgreSQL" },
  { id: "MySQL", icon: "🐬", label: "MySQL" },
  { id: "SQLite", icon: "🪨", label: "SQLite" },
  { id: "BigQuery", icon: "☁️", label: "BigQuery" },
  { id: "MS SQL Server", icon: "🪟", label: "MS SQL Server" },
];

const DIALECT_REFERENCE: Record<string, {
  strengths: string[];
  indexTypes: string[];
  tipQueries: string[];
  keyFunctions: string[];
}> = {
  PostgreSQL: {
    strengths: ["MVCC concurrency", "JSONB support", "Window functions", "CTEs with recursion", "Partial indexes"],
    indexTypes: ["B-tree (default)", "GiST (geospatial)", "GIN (full-text/JSONB)", "BRIN (time-series)", "Hash"],
    tipQueries: [
      "EXPLAIN (ANALYZE, BUFFERS) SELECT ...",
      "CREATE INDEX CONCURRENTLY idx ON tbl(col);",
      "SELECT * FROM pg_stat_user_indexes;",
    ],
    keyFunctions: ["ROW_NUMBER()", "GENERATE_SERIES()", "TO_TSVECTOR()", "JSONB_AGG()", "DATE_TRUNC()"],
  },
  MySQL: {
    strengths: ["InnoDB ACID transactions", "Full-text search", "Replication", "JSON columns (5.7+)", "Wide ecosystem"],
    indexTypes: ["B-tree (default)", "Hash (MEMORY engine)", "Full-text", "Spatial (R-tree)", "Composite"],
    tipQueries: [
      "EXPLAIN FORMAT=JSON SELECT ...;",
      "SHOW INDEX FROM table_name;",
      "ANALYZE TABLE table_name;",
    ],
    keyFunctions: ["GROUP_CONCAT()", "IFNULL()", "DATE_FORMAT()", "FIND_IN_SET()", "JSON_VALUE()"],
  },
  SQLite: {
    strengths: ["Zero-config embedded", "Serverless", "Single file", "ACID-compliant", "Perfect for prototypes"],
    indexTypes: ["B-tree (all indexes)", "Covering indexes", "Partial indexes (WHERE clause)", "Expression indexes"],
    tipQueries: [
      "EXPLAIN QUERY PLAN SELECT ...;",
      "PRAGMA index_list(table_name);",
      "PRAGMA optimize;",
    ],
    keyFunctions: ["COALESCE()", "STRFTIME()", "SUBSTR()", "TYPEOF()", "IIF()"],
  },
  BigQuery: {
    strengths: ["Petabyte-scale analytics", "Columnar storage", "Federated queries", "ML integration", "Slot-based pricing"],
    indexTypes: ["Clustering (no traditional indexes)", "Partitioning (DATE, RANGE, INGESTION_TIME)", "Table search indexes"],
    tipQueries: [
      "SELECT * FROM `proj.ds.table` WHERE _PARTITIONDATE = '2024-01-01';",
      "CREATE TABLE ... PARTITION BY DATE(created_at) CLUSTER BY user_id;",
      "EXPLAIN SELECT ...;",
    ],
    keyFunctions: ["APPROX_COUNT_DISTINCT()", "ARRAY_AGG()", "UNNEST()", "DATE_DIFF()", "FARM_FINGERPRINT()"],
  },
  "MS SQL Server": {
    strengths: ["Enterprise security", "Row-level security", "Columnstore indexes", "In-memory OLTP", "T-SQL rich syntax"],
    indexTypes: ["Clustered (table order)", "Non-clustered", "Columnstore (analytics)", "Filtered", "XML/Spatial"],
    tipQueries: [
      "SET STATISTICS IO, TIME ON; SELECT ...;",
      "SELECT * FROM sys.dm_exec_query_stats;",
      "CREATE INDEX idx WITH (ONLINE=ON);",
    ],
    keyFunctions: ["ISNULL()", "CHARINDEX()", "FORMAT()", "CROSS APPLY", "STRING_AGG()"],
  },
};

const SAMPLE_QUERIES: Record<string, { label: string; domain: string; sql: string }[]> = {
  PostgreSQL: [
    { label: "Education — N+1 Correlated Subquery", domain: "Education", sql: `-- ⚠ Two correlated subqueries make this O(n²)
SELECT
  s.id,
  s.name,
  (SELECT COUNT(*) FROM grades      g WHERE g.student_id = s.id) AS grade_count,
  (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id) AS course_count
FROM students s
WHERE s.id > 0;` },
    { label: "E-Commerce — SELECT * + Missing LIMIT", domain: "E-Commerce", sql: `-- ⚠ SELECT * + no LIMIT on orders table
SELECT *
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE YEAR(o.created_at) = 2024
ORDER BY o.total DESC;` },
    { label: "HR — NOT IN NULL Trap", domain: "HR", sql: `-- ⚠ NOT IN fails silently when subquery returns NULL
SELECT e.id, e.name, e.department
FROM employees e
WHERE e.id NOT IN (
  SELECT manager_id FROM departments
)
ORDER BY e.name;` },
    { label: "Finance — Leading Wildcard LIKE", domain: "Finance", sql: `-- ⚠ Leading % forces full scan, ignores index
SELECT account_id, transaction_date, amount
FROM transactions
WHERE description LIKE '%payment%'
  AND status = 'completed'
ORDER BY transaction_date DESC;` },
  ],
  MySQL: [
    { label: "E-Commerce — Function on Indexed Column", domain: "E-Commerce", sql: `-- ⚠ YEAR() prevents index usage on created_at
SELECT p.id, p.name, p.price, c.name AS category
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE YEAR(p.created_at) = 2024
  AND MONTH(p.created_at) = 6
ORDER BY p.price DESC
LIMIT 20;` },
    { label: "Gaming — ORDER BY RAND() Performance", domain: "Gaming", sql: `-- ⚠ ORDER BY RAND() sorts entire table for each call
SELECT player_id, username, score, level
FROM leaderboards
WHERE game_id = 42
  AND status = 'active'
ORDER BY RAND()
LIMIT 5;` },
    { label: "Healthcare — Excessive JOINs", domain: "Healthcare", sql: `-- ⚠ 5 JOINs on large tables without covering indexes
SELECT
  p.id, p.name, p.dob,
  d.diagnosis_code, d.description,
  pr.drug_name, pr.dosage,
  l.test_name, l.result, l.flagged,
  a.appointment_date, a.status
FROM patients p
JOIN diagnoses    d  ON d.patient_id  = p.id
JOIN prescriptions pr ON pr.patient_id = p.id
JOIN lab_results  l  ON l.patient_id  = p.id
JOIN appointments a  ON a.patient_id  = p.id
WHERE p.created_at > '2024-01-01'
LIMIT 100;` },
  ],
  SQLite: [
    { label: "Analytics — Missing WHERE Clause", domain: "Analytics", sql: `-- ⚠ Full table scan — no filter on events table
SELECT
  event_type,
  COUNT(*) AS event_count,
  AVG(duration_ms) AS avg_duration
FROM events
GROUP BY event_type
ORDER BY event_count DESC;` },
    { label: "Inventory — SELECT * with JOIN", domain: "Inventory", sql: `-- ⚠ SELECT * fetches all columns across 2 tables
SELECT *
FROM products p
JOIN inventory i ON i.product_id = p.id
WHERE p.category = 'electronics'
ORDER BY p.name;` },
  ],
  BigQuery: [
    { label: "Analytics — Unpartitioned Full Scan", domain: "Analytics", sql: `-- ⚠ No partition filter — scans entire petabyte table
SELECT
  user_id,
  COUNT(*) AS sessions,
  SUM(revenue_usd) AS total_revenue
FROM \`myproject.analytics.events\`
WHERE event_type = 'purchase'
GROUP BY user_id
ORDER BY total_revenue DESC
LIMIT 1000;` },
    { label: "E-Commerce — Correlated Subquery in BigQuery", domain: "E-Commerce", sql: `-- ⚠ Correlated subquery runs once per outer row
SELECT
  o.order_id,
  o.user_id,
  o.total,
  (SELECT SUM(r.amount) FROM \`proj.ds.refunds\` r WHERE r.order_id = o.order_id) AS refund_total
FROM \`proj.ds.orders\` o
WHERE o.created_date BETWEEN '2024-01-01' AND '2024-12-31';` },
  ],
  "MS SQL Server": [
    { label: "HR — Missing Index + SELECT *", domain: "HR", sql: `-- ⚠ No index on department_id, SELECT * wasteful
SELECT *
FROM Employees
WHERE DepartmentId = 5
  AND IsActive = 1
ORDER BY HireDate DESC;` },
    { label: "Finance — NOT IN with NULLs", domain: "Finance", sql: `-- ⚠ NOT IN returns 0 rows if subquery has any NULL
SELECT AccountId, Balance, AccountType
FROM Accounts
WHERE AccountId NOT IN (
  SELECT AccountId FROM FrozenAccounts
)
AND Balance > 0;` },
  ],
};

type Issue = { label: string; desc: string; severity: "critical" | "high" | "medium" | "low"; fix?: string };

function detectIssues(sql: string): Issue[] {
  const issues: Issue[] = [];
  if (/SELECT\s+\*/i.test(sql))
    issues.push({ label: "SELECT * Usage", desc: "Fetches all columns — prevents index-only scans and wastes bandwidth.", severity: "medium", fix: "List only the columns you need" });
  if (/YEAR\s*\(|MONTH\s*\(|DAY\s*\(|DATE\s*\(/i.test(sql))
    issues.push({ label: "Function on Indexed Column", desc: "Wrapping a column in a function prevents the query engine from using an index on that column.", severity: "high", fix: "Use range predicates: WHERE col >= '2024-01-01' AND col < '2025-01-01'" });
  if (/SELECT[\s\S]*?FROM\s+\w+[\s\S]*?WHERE[\s\S]*?SELECT/i.test(sql))
    issues.push({ label: "Correlated Subquery (N+1)", desc: "Runs once per outer row — O(n²) execution. Replace with a JOIN + GROUP BY.", severity: "critical", fix: "Rewrite as LEFT JOIN with aggregation" });
  if (!/LIMIT|TOP|ROWNUM|FETCH\s+FIRST/i.test(sql) && /SELECT/i.test(sql))
    issues.push({ label: "Missing LIMIT Clause", desc: "Without a result-set bound, a single query can return millions of rows and saturate memory.", severity: "medium", fix: "Add LIMIT 100 or appropriate page size" });
  if (!/WHERE/i.test(sql) && /SELECT/i.test(sql))
    issues.push({ label: "Missing WHERE Clause", desc: "Full table scan — no filter means every row is examined regardless of table size.", severity: "high", fix: "Add a WHERE clause to filter rows" });
  if (/NOT\s+IN\s*\(/i.test(sql))
    issues.push({ label: "NOT IN with Potential NULLs", desc: "NOT IN returns no rows if the subquery contains any NULL values. Use NOT EXISTS instead.", severity: "high", fix: "Replace NOT IN with NOT EXISTS (SELECT 1 FROM ... WHERE ...)" });
  if (/LIKE\s+'%[^%]/i.test(sql))
    issues.push({ label: "Leading Wildcard LIKE", desc: "A leading % forces a full index scan — cannot use B-tree index prefix.", severity: "high", fix: "Use full-text search or a suffix-tree index" });
  if ((sql.match(/JOIN/gi) || []).length > 4)
    issues.push({ label: "Excessive JOINs (5+)", desc: "More than 4 JOINs exponentially increases optimizer search space.", severity: "medium", fix: "Use CTEs or materialized views for complex joins" });
  if (/ORDER\s+BY[\s\S]*?RAND\(\)|NEWID\(\)|RANDOM\(\)/i.test(sql))
    issues.push({ label: "ORDER BY RANDOM()", desc: "Sorts the entire result set randomly — O(n log n) per query, never uses indexes.", severity: "high", fix: "Use keyset or offset-based pagination instead" });
  return issues;
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444", high: "#f59e0b", medium: "#eab308", low: "#10b981",
};

export default function OptimizerPage() {
  const [dialect, setDialect] = useState("PostgreSQL");
  const [sql, setSql] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [showRef, setShowRef] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const issues = sql.trim() ? detectIssues(sql) : [];

  const optimize = async () => {
    if (!sql.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, dialect }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Optimization failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ref = DIALECT_REFERENCE[dialect];
  const samples = SAMPLE_QUERIES[dialect] || [];
  const charCount = sql.length;
  const lineCount = sql.split("\n").length;

  return (
    <div style={{ padding: "28px 28px 64px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 6 }}>SQL Optimizer</h1>
          <p style={{ color: "#7c6f94", fontSize: 14 }}>
            Paste a query → AI rewrites it with full analysis · Personally Identifiable Information (PII) auto-redacted · Multi-dialect support
          </p>
        </div>
        <Link href="/nl2sql" style={{ fontSize: 13, color: "#7c6f94", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid rgba(45,15,78,0.6)", borderRadius: 8 }}>
          ✦ Try Natural Language to SQL instead
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 460px", gap: 24 }}>
        {/* LEFT — Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Dialect Bar */}
          <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 8, flexWrap: "wrap", borderBottom: "1px solid rgba(45,15,78,0.5)" }}>
              {DIALECTS.map(d => (
                <button key={d.id} onClick={() => { setDialect(d.id); setShowRef(false); }} style={{
                  padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: dialect === d.id ? 700 : 400,
                  background: dialect === d.id ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(45,15,78,0.3)",
                  color: dialect === d.id ? "#fff" : "#9ca3af", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                }}>
                  {d.icon} {d.label}
                </button>
              ))}
              <button onClick={() => setShowRef(!showRef)} style={{
                marginLeft: 8, padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(124,58,237,0.3)", cursor: "pointer",
                background: showRef ? "rgba(124,58,237,0.2)" : "transparent", color: "#c084fc", fontSize: 12, fontWeight: 600,
              }}>
                ⓘ {dialect} Reference
              </button>
              <button onClick={() => setShowSamples(!showSamples)} style={{
                padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(45,15,78,0.4)", cursor: "pointer",
                background: "transparent", color: "#7c6f94", fontSize: 12,
              }}>
                📋 Sample Queries
              </button>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                  <input type="file" accept=".sql,.txt" style={{ display: "none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setSql(String(ev.target?.result || "")); r.readAsText(f); } }} />
                  <span style={{ color: "#7c6f94" }}>⬆ Upload</span>
                </label>
                <button onClick={() => { setSql(""); setResult(null); setError(""); }} style={{ background: "none", border: "none", color: "#7c6f94", cursor: "pointer", fontSize: 12 }}>Clear</button>
              </div>
            </div>

            {/* Dialect Reference Panel */}
            {showRef && (
              <div style={{ padding: 20, background: "rgba(124,58,237,0.05)", borderBottom: "1px solid rgba(45,15,78,0.5)", animation: "fadeIn 0.2s ease" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 8, letterSpacing: 1 }}>STRENGTHS</div>
                    {ref.strengths.map(s => <div key={s} style={{ fontSize: 12, color: "#c084fc", marginBottom: 4 }}>✓ {s}</div>)}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 8, letterSpacing: 1 }}>INDEX TYPES</div>
                    {ref.indexTypes.map(s => <div key={s} style={{ fontSize: 12, color: "#b8a9cc", marginBottom: 4 }}>▸ {s}</div>)}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 8, letterSpacing: 1 }}>KEY FUNCTIONS</div>
                    {ref.keyFunctions.map(s => <code key={s} style={{ display: "block", fontSize: 11, color: "#c3e88d", marginBottom: 4 }}>{s}</code>)}
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 8, letterSpacing: 1 }}>DIAGNOSTIC QUERIES</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {ref.tipQueries.map(q => (
                      <code key={q} onClick={() => setSql(q)} style={{ fontSize: 11, color: "#c3e88d", background: "rgba(195,232,141,0.08)", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>{q}</code>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sample Queries Panel */}
            {showSamples && (
              <div style={{ padding: 20, background: "rgba(45,15,78,0.2)", borderBottom: "1px solid rgba(45,15,78,0.5)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", marginBottom: 12, letterSpacing: 1 }}>SAMPLE QUERIES — {dialect}</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {(samples.length ? samples : [{ label: "No samples for this dialect yet", domain: "", sql: "" }]).map((s, i) => (
                    s.sql ? (
                      <div key={i} style={{ background: "rgba(26,0,51,0.6)", borderRadius: 8, padding: 12, cursor: "pointer" }}
                        onClick={() => { setSql(s.sql); setShowSamples(false); }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#c084fc" }}>{s.label}</span>
                          <span style={{ fontSize: 10, color: "#7c6f94", background: "rgba(45,15,78,0.5)", padding: "2px 8px", borderRadius: 4 }}>{s.domain}</span>
                        </div>
                        <pre style={{ fontSize: 11, color: "#7c6f94", margin: 0, overflow: "hidden", maxHeight: 60 }}>{s.sql.split("\n").slice(0, 3).join("\n")}...</pre>
                      </div>
                    ) : <div key={i} style={{ color: "#7c6f94", fontSize: 13 }}>{s.label}</div>
                  ))}
                </div>
              </div>
            )}

            {/* PII indicator */}
            <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid rgba(45,15,78,0.3)" }}>
              <span style={{ color: "#10b981", fontSize: 14 }}>●</span>
              <span style={{ fontSize: 12, color: "#7c6f94" }}>Personally Identifiable Information (PII) — emails, Social Security Numbers (SSNs), card numbers — is auto-redacted before reaching AI</span>
            </div>

            {/* Textarea */}
            <textarea ref={textareaRef} value={sql} onChange={e => setSql(e.target.value)}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); optimize(); } }}
              placeholder={`Paste ${dialect} query here, or drag & drop a .sql file...\n\nExample:\nSELECT * FROM orders o\nJOIN customers c ON c.id = o.customer_id\nWHERE YEAR(o.created_at) = 2024`}
              style={{ width: "100%", minHeight: 220, background: "transparent", border: "none", outline: "none", color: "#e2d9f3", fontSize: 13, fontFamily: "monospace", padding: "16px", resize: "vertical", lineHeight: 1.7 }} />

            {/* Status bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", borderTop: "1px solid rgba(45,15,78,0.3)", fontSize: 12, color: "#7c6f94" }}>
              <span>Characters: {charCount} · Lines: {lineCount} · Dialect: {dialect}</span>
              {issues.length > 0 && (
                <span style={{ color: "#f59e0b" }}>⚠ {issues.length} issue{issues.length !== 1 ? "s" : ""} detected</span>
              )}
              {sql && !issues.length && <span style={{ color: "#10b981" }}>✓ No obvious issues detected</span>}
            </div>
          </div>

          {/* Optimize Button */}
          <button onClick={optimize} disabled={loading || !sql.trim()} style={{
            width: "100%", padding: "16px", borderRadius: 12, border: "none", cursor: sql.trim() ? "pointer" : "not-allowed",
            background: sql.trim() ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(45,15,78,0.3)",
            color: sql.trim() ? "#fff" : "#7c6f94", fontSize: 16, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: sql.trim() ? "0 0 24px rgba(124,58,237,0.4)" : "none", transition: "all 0.2s",
          }}>
            {loading ? (
              <><span style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Optimizing...</>
            ) : `⚡ Optimize with AI  (Command+Enter / Ctrl+Enter)`}
          </button>

          {/* Live Scanner */}
          {sql.trim() && issues.length > 0 && (
            <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", letterSpacing: 2, marginBottom: 14 }}>
                ⚡ LIVE SCANNER — INSTANT ANALYSIS
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {issues.map((issue, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: 14, borderRadius: 10, background: `rgba(${issue.severity === "critical" ? "239,68,68" : issue.severity === "high" ? "245,158,11" : "234,179,8"},0.08)`, border: `1px solid rgba(${issue.severity === "critical" ? "239,68,68" : issue.severity === "high" ? "245,158,11" : "234,179,8"},0.2)` }}>
                    <span style={{ fontSize: 16, marginTop: 1 }}>⚠</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: SEVERITY_COLOR[issue.severity] || "#fff", marginBottom: 3 }}>
                        {issue.label} <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: `rgba(${issue.severity === "critical" ? "239,68,68" : "245,158,11"},0.15)`, marginLeft: 6 }}>{issue.severity.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{issue.desc}</div>
                      {issue.fix && <div style={{ fontSize: 11, color: "#10b981", marginTop: 4 }}>💡 Fix: {issue.fix}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
              <h3 style={{ color: "#fca5a5", marginBottom: 8, fontWeight: 700 }}>Optimization Failed</h3>
              <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>{error}</p>
              <button onClick={optimize} style={{ padding: "8px 20px", borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Try Again</button>
            </div>
          )}

          {!result && !error && (
            <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 32, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✦</div>
              <h3 style={{ color: "#fff", fontWeight: 700, marginBottom: 8 }}>Ready to Optimize</h3>
              <p style={{ color: "#7c6f94", fontSize: 13, marginBottom: 20 }}>
                Paste SQL and click <strong style={{ color: "#c084fc" }}>Optimize with AI</strong>, or use<br />
                <strong>Command+Enter (Mac)</strong> / <strong>Ctrl+Enter (Windows)</strong>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[["⚡", "Instant anti-pattern scan"], ["🤖", "AI-powered SQL rewrite"], ["📤", "4 export formats"]].map(([i, l]) => (
                  <div key={l} style={{ padding: 12, background: "rgba(45,15,78,0.3)", borderRadius: 8, textAlign: "center", fontSize: 12, color: "#7c6f94" }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{i}</div>{l}
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(45,15,78,0.3)", borderRadius: 8, padding: 12, fontSize: 12, color: "#7c6f94", textAlign: "left" }}>
                ⓘ Click the <strong style={{ color: "#c084fc" }}>"{dialect} Reference"</strong> button above for dialect-specific tips
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Performance gain */}
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>🚀</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>Performance Gain</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{result.performanceGain as string}</div>
                </div>
                {result.piiRedacted as number > 0 && (
                  <div style={{ marginLeft: "auto", background: "rgba(124,58,237,0.15)", borderRadius: 8, padding: "6px 10px", fontSize: 11, color: "#c084fc" }}>
                    🔒 {result.piiRedacted as number} Personally Identifiable Information (PII) item{(result.piiRedacted as number) > 1 ? "s" : ""} redacted
                  </div>
                )}
              </div>

              {/* Explanation */}
              <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", marginBottom: 8, letterSpacing: 1 }}>EXPLANATION</div>
                <p style={{ fontSize: 13, color: "#b8a9cc", lineHeight: 1.7 }}>{result.explanation as string}</p>
                {result.modelUsed && <p style={{ fontSize: 11, color: "#4a3d5c", marginTop: 8 }}>Model: {result.modelUsed as string}</p>}
              </div>

              {/* Optimized SQL */}
              <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(45,15,78,0.4)" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981", letterSpacing: 1 }}>OPTIMIZED SQL</span>
                  <button onClick={() => copyText(result.optimizedSQL as string)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(45,15,78,0.5)", background: "none", color: copied ? "#10b981" : "#7c6f94", cursor: "pointer", fontSize: 12 }}>
                    {copied ? "✓ Copied!" : "📋 Copy"}
                  </button>
                </div>
                <pre style={{ padding: 16, fontSize: 12, color: "#e2d9f3", overflow: "auto", maxHeight: 300, margin: 0, lineHeight: 1.7 }}>
                  {result.optimizedSQL as string}
                </pre>
              </div>

              {/* Changes */}
              {(result.changes as string[]).length > 0 && (
                <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", marginBottom: 10, letterSpacing: 1 }}>CHANGES MADE</div>
                  {(result.changes as string[]).map((c, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#10b981", marginBottom: 6, display: "flex", gap: 8 }}>
                      <span>✓</span><span>{c}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Index suggestions */}
              {(result.indexSuggestions as string[]).length > 0 && (
                <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", marginBottom: 10, letterSpacing: 1 }}>INDEX SUGGESTIONS</div>
                  {(result.indexSuggestions as string[]).map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <code style={{ fontSize: 11, color: "#c3e88d", flex: 1 }}>{s}</code>
                      <button onClick={() => copyText(s)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(45,15,78,0.5)", background: "none", color: "#7c6f94", cursor: "pointer", fontSize: 10, marginLeft: 8 }}>Copy</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Export */}
              <div style={{ display: "flex", gap: 8 }}>
                {["sql", "json", "csv"].map(fmt => (
                  <button key={fmt} onClick={() => {
                    const blob = new Blob([fmt === "json" ? JSON.stringify(result, null, 2) : fmt === "sql" ? result.optimizedSQL as string : `input,output\n"${sql}","${result.optimizedSQL}"`], { type: "text/plain" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `optimized.${fmt}`; a.click();
                  }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid rgba(45,15,78,0.6)", background: "rgba(26,0,51,0.4)", color: "#7c6f94", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                    ↓ {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Dialect comparison chips */}
          <div style={{ background: "rgba(26,0,51,0.4)", border: "1px solid rgba(45,15,78,0.5)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 10, letterSpacing: 1 }}>DIALECT QUICK COMPARE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { d: "PostgreSQL 🐘", tip: "Best for: complex queries, JSONB, full-text" },
                { d: "MySQL 🐬", tip: "Best for: web apps, replication, JSON 5.7+" },
                { d: "SQLite 🪨", tip: "Best for: embedded, mobile, prototypes" },
                { d: "BigQuery ☁️", tip: "Best for: analytics at petabyte scale" },
              ].map(({ d, tip }) => (
                <div key={d} style={{ padding: "8px 10px", background: "rgba(45,15,78,0.3)", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#c084fc" }}>{d}</div>
                  <div style={{ fontSize: 11, color: "#7c6f94" }}>{tip}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
