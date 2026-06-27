"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Upload, Trash2, Copy, Check, Download, AlertTriangle,
  Info, ChevronRight, ChevronDown, Database, TrendingUp,
  Shield, ExternalLink, Code2, Brain, BookOpen, X, FileDown,
} from "lucide-react";
import Link from "next/link";

// ── Dialect reference data ────────────────────────────────────────────────────
const DIALECT_INFO: Record<string, {
  color: string;
  strengths: string[];
  watchouts: string[];
  keyFunctions: string[];
  indexTypes: string[];
  useCases: string[];
  docsUrl: string;
}> = {
  PostgreSQL: {
    color: "#336791",
    strengths: ["Full ACID compliance","Advanced JSON/JSONB support","Parallel query execution","Partial and expression indexes","Window functions (OVER, PARTITION BY, RANK, DENSE_RANK)","Common Table Expressions (CTE) with WITH clause"],
    watchouts: ["LIKE with leading wildcard bypasses index","Implicit type casts can skip indexes","N+1 correlated subqueries degrade to O(n²)","SELECT * prevents index-only scans"],
    keyFunctions: ["DATE_TRUNC()","NOW()","EXTRACT()","COALESCE()","STRING_AGG()","ARRAY_AGG()","JSONB_AGG()","GENERATE_SERIES()","ROW_NUMBER() OVER()","NTILE()","LEAD() / LAG()"],
    indexTypes: ["B-Tree (default)","Hash","GIN (for JSONB/arrays)","GiST (for geometry/full-text)","BRIN (for time-series)","Partial index (WHERE clause)"],
    useCases: ["Complex analytics","JSONB document storage","Full-text search","Geospatial (PostGIS)","Enterprise OLTP"],
    docsUrl: "https://www.postgresql.org/docs/current/",
  },
  MySQL: {
    color: "#f29111",
    strengths: ["High read throughput with InnoDB","Excellent replication support","Full-text search with MATCH AGAINST","Broad hosting/cloud support","Mature ecosystem"],
    watchouts: ["YEAR(), MONTH(), DAY() on indexed columns prevents index use — use range filter instead","GROUP BY behavior differs from ANSI SQL","No partial indexes (use generated columns workaround)","LIMIT without ORDER BY returns unpredictable results"],
    keyFunctions: ["NOW()","DATE_FORMAT()","YEAR()","MONTH()","IFNULL()","GROUP_CONCAT()","FIND_IN_SET()","STR_TO_DATE()","UNIX_TIMESTAMP()"],
    indexTypes: ["B-Tree (InnoDB default)","Full-text","Spatial (MyISAM/InnoDB)","Composite index","Covering index","Prefix index for TEXT/BLOB"],
    useCases: ["Web applications","High-read OLTP","Replication scenarios","WordPress/CMS backends"],
    docsUrl: "https://dev.mysql.com/doc/refman/8.0/en/",
  },
  SQLite: {
    color: "#44a8d8",
    strengths: ["Zero configuration — file-based","Embedded in apps (mobile, desktop)","Excellent for prototyping and testing","Full SQL support including window functions (v3.25+)","No network latency"],
    watchouts: ["No true ALTER TABLE (limited column modification)","No RIGHT OUTER JOIN (rewrite as LEFT JOIN)","No concurrent writes — single writer lock","Type affinity is loose — 'INTEGER' stored as text is valid"],
    keyFunctions: ["DATETIME()","STRFTIME()","COALESCE()","IIF()","INSTR()","HEX()","RANDOMBLOB()","TOTAL()","GROUP_CONCAT()"],
    indexTypes: ["B-Tree (all indexes)","Partial index (WHERE clause supported v3.8.9+)","Covering index","Expression index (v3.9+)"],
    useCases: ["Mobile apps (iOS/Android)","Desktop apps","Embedded systems","Unit testing","Prototypes"],
    docsUrl: "https://www.sqlite.org/lang.html",
  },
  BigQuery: {
    color: "#4285f4",
    strengths: ["Petabyte-scale analytics","Columnar storage — extremely fast aggregations","Clustering and partitioning by date/column","Built-in ML with BQML","Serverless — no infrastructure management"],
    watchouts: ["Every query scans full columns by default — use WHERE on partition column","JOINs on huge tables can be expensive — use clustering","No traditional indexes — rely on partitions + clusters","DML (UPDATE/DELETE) rewrites entire partition"],
    keyFunctions: ["DATE_TRUNC()","TIMESTAMP_TRUNC()","ARRAY_AGG()","APPROX_COUNT_DISTINCT()","FARM_FINGERPRINT()","SAFE_DIVIDE()","COUNTIF()","ANY_VALUE()"],
    indexTypes: ["Partitioned table (pseudo-index)","Clustered table (up to 4 columns)","Materialized view","Search index (full-text)"],
    useCases: ["Data warehouse analytics","Marketing attribution","Log analysis","Machine learning pipelines","Cross-dataset joins"],
    docsUrl: "https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax",
  },
  "MS SQL Server": {
    color: "#cc2927",
    strengths: ["Excellent T-SQL extensions","Row-level security","Columnstore indexes for analytics","Always-On availability groups","Deep integration with .NET / Azure"],
    watchouts: ["TOP without ORDER BY is non-deterministic","NOLOCK hint causes dirty reads","Implicit conversions on VARCHAR vs NVARCHAR kill index use","Wide row locking can cause blocking under heavy writes"],
    keyFunctions: ["GETDATE()","ISNULL()","IIF()","TRY_CAST()","STRING_AGG()","FORMAT()","DATEADD()","DATEDIFF()","OFFSET FETCH (pagination)"],
    indexTypes: ["Clustered index","Non-clustered index","Columnstore index","Filtered index (partial)","Full-text index","Included columns index"],
    useCases: ["Enterprise ERP/CRM","Windows/.NET backends","Azure SQL deployments","Reporting Services","Heavy OLTP"],
    docsUrl: "https://learn.microsoft.com/en-us/sql/t-sql/language-reference",
  },
};

const DIALECTS = ["PostgreSQL", "MySQL", "SQLite", "BigQuery", "MS SQL Server"];

const SEVERITY_COLOR: Record<string, string> = {
  critical: "border-l-red-500 bg-red-500/8",
  high:     "border-l-orange-500 bg-orange-500/8",
  medium:   "border-l-yellow-500 bg-yellow-500/8",
  low:      "border-l-blue-500 bg-blue-500/8",
};
const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high:     "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

interface SqlIssue { type: string; severity: string; description: string; }
interface OptResult {
  isValidSql: boolean;
  optimizedQuery: string;
  issues: SqlIssue[];
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
  engine: "ai";
}

function SqlBlock({ sql, label = "SQL" }: { sql: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl overflow-hidden border border-violet-500/15 bg-[#0d0d1f]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-violet-500/10 bg-[#0a0a1e]">
        <span className="text-[10px] font-bold tracking-widest text-slate-500">{label}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">{sql}</pre>
    </div>
  );
}

function DialectPanel({ dialect, onClose }: { dialect: string; onClose: () => void }) {
  const info = DIALECT_INFO[dialect];
  if (!info) return null;
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="glass-card rounded-2xl p-5 border border-violet-500/20 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: info.color }} />
          <span className="font-bold text-sm">{dialect} Reference</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-[10px] font-bold text-emerald-400 tracking-widest mb-2">STRENGTHS</div>
          <ul className="space-y-1">
            {info.strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-bold text-amber-400 tracking-widest mb-2">WATCH OUT FOR</div>
          <ul className="space-y-1">
            {info.watchouts.map((w) => (
              <li key={w} className="flex items-start gap-2 text-xs text-slate-400">
                <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                {w}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-bold text-sky-400 tracking-widest mb-2">KEY FUNCTIONS</div>
          <div className="flex flex-wrap gap-1.5">
            {info.keyFunctions.map((fn) => (
              <code key={fn} className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-lg">{fn}</code>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold text-violet-400 tracking-widest mb-2">INDEX TYPES</div>
          <ul className="space-y-1">
            {info.indexTypes.map((idx) => (
              <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                <Database className="w-3 h-3 text-violet-400 flex-shrink-0 mt-0.5" />
                {idx}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-bold text-slate-400 tracking-widest mb-2">BEST FOR</div>
          <div className="flex flex-wrap gap-1.5">
            {info.useCases.map((uc) => (
              <span key={uc} className="text-[10px] bg-slate-500/10 border border-slate-500/20 text-slate-300 px-1.5 py-0.5 rounded-lg">{uc}</span>
            ))}
          </div>
        </div>

        <a href={info.docsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors pt-1">
          <ExternalLink className="w-3.5 h-3.5" />Official {dialect} docs
        </a>
      </div>
    </motion.div>
  );
}

const SAMPLE_QUERIES: Record<string, { label: string; sql: string }[]> = {
  PostgreSQL: [
    { label: "N+1 Correlated Subquery", sql: `SELECT students.id,
  (SELECT COUNT(*) FROM grades WHERE grades.student_id = students.id) AS c1,
  (SELECT COUNT(*) FROM enrollments WHERE enrollments.student_id = students.id) AS c2
FROM students
WHERE students.id > 0;` },
    { label: "Function on Indexed Column", sql: `SELECT * FROM leaderboards
WHERE YEAR(score_date) = 2024
AND MONTH(score_date) = 6;` },
    { label: "Missing Index + SELECT *", sql: `SELECT * FROM orders o, customers c
WHERE o.customer_id = c.id
AND YEAR(o.created_at) = 2024;` },
  ],
  MySQL: [
    { label: "YEAR() on Indexed Column", sql: `SELECT * FROM orders
WHERE YEAR(created_at) = 2024
AND MONTH(created_at) = 3;` },
    { label: "Implicit Type Cast", sql: `SELECT * FROM users
WHERE phone_number = 1234567890;` },
    { label: "Missing LIMIT Clause", sql: `SELECT * FROM logs
WHERE level = 'ERROR'
ORDER BY created_at DESC;` },
  ],
  SQLite: [
    { label: "No Index on Filter", sql: `SELECT * FROM messages
WHERE content LIKE '%urgent%'
ORDER BY created_at;` },
    { label: "Correlated Subquery", sql: `SELECT id, name,
  (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.id) AS total
FROM users;` },
  ],
  BigQuery: [
    { label: "Missing Partition Filter", sql: `SELECT user_id, event_type, COUNT(*)
FROM events
WHERE event_type = 'click'
GROUP BY user_id, event_type;` },
    { label: "Non-Deterministic Aggregation", sql: `SELECT user_id, ANY_VALUE(email), COUNT(*)
FROM user_events
GROUP BY user_id;` },
  ],
  "MS SQL Server": [
    { label: "NOLOCK Dirty Read", sql: `SELECT TOP 100 * FROM orders WITH (NOLOCK)
WHERE status = 'pending'
ORDER BY created_at DESC;` },
    { label: "Implicit VARCHAR Cast", sql: `SELECT * FROM customers
WHERE phone = N'555-1234';` },
  ],
};

export default function OptimizerPage() {
  // ALL hooks declared at top level - no conditionals
  const { data: session } = useSession();
  const [sql, setSql] = useState("");
  const [dialect, setDialect] = useState("PostgreSQL");
  const [showDialectPanel, setShowDialectPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sqlView, setSqlView] = useState<"split" | "before" | "after">("split");
  const [sampleOpen, setSampleOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const schemaContext = typeof window !== "undefined"
    ? sessionStorage.getItem("smartquery_schema_context") ?? undefined
    : undefined;

  const charCount = sql.length;
  const lineCount = sql.split("\n").length;
  const dialectInfo = DIALECT_INFO[dialect];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleOptimize();
    }
  };

  const handleOptimize = useCallback(async () => {
    if (!sql.trim() || sql.trim().length < 3) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql, dialect, schemaContext }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Optimization failed — please try again."); return; }
      setResult(data as OptResult);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [sql, dialect, schemaContext]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSql(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const handleCopyResult = () => {
    if (result?.optimizedQuery) navigator.clipboard.writeText(result.optimizedQuery);
  };

  const gainColor = (g: number) => g >= 70 ? "text-emerald-400" : g >= 40 ? "text-yellow-400" : "text-slate-400";
  const costColor = (c: number) => c <= 30 ? "text-emerald-400" : c <= 60 ? "text-yellow-400" : "text-red-400";

  const currentSamples = SAMPLE_QUERIES[dialect] ?? SAMPLE_QUERIES.PostgreSQL;

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black">SQL Optimizer</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Paste a query → AI rewrites it with full analysis ·{" "}
            <span title="Personally Identifiable Information (PII) such as emails, SSNs, and card numbers is auto-redacted before processing">
              Personally Identifiable Information (PII) auto-redacted
            </span>{" "}
            · Multi-dialect
          </p>
        </div>
        <Link href="/nl2sql" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-300 transition-colors">
          <Brain className="w-3.5 h-3.5" />Try Natural Language to SQL instead
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* LEFT: Input panel */}
        <div className="space-y-4">
          {/* Dialect selector */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {DIALECTS.map((d) => (
                <div key={d} className="flex items-center gap-1">
                  <button
                    onClick={() => { setDialect(d); if (showDialectPanel && dialect === d) setShowDialectPanel(false); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      dialect === d
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "border-violet-500/20 text-slate-400 hover:border-violet-500/50 hover:text-white"
                    }`}
                  >
                    {dialect === d && <span className="mr-1">🌐</span>}
                    {d}
                  </button>
                  {dialect === d && (
                    <button
                      onClick={() => setShowDialectPanel(!showDialectPanel)}
                      title={`View ${d} quick reference — strengths, functions, index types`}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-semibold transition-all border flex items-center gap-1 ${
                        showDialectPanel
                          ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                          : "border-violet-500/20 text-slate-500 hover:text-violet-300 hover:border-violet-500/40"
                      }`}
                    >
                      <Info className="w-3 h-3" />
                      {d} Reference
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* PII notice */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
              <Shield className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span>
                Personally Identifiable Information (PII) — emails, Social Security Numbers (SSNs), card numbers — is auto-redacted before processing
              </span>
            </div>

            {/* Upload + clear row */}
            <div className="flex items-center gap-2 mb-3">
              <label className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-violet-300 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-violet-500/10 border border-violet-500/10">
                <Upload className="w-3 h-3" />Upload File
                <input type="file" accept=".sql,.txt" className="hidden" onChange={handleUpload} />
              </label>
              {sql && (
                <button onClick={() => { setSql(""); setResult(null); setError(null); }}
                  className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 border border-red-500/10">
                  <Trash2 className="w-3 h-3" />Clear
                </button>
              )}
              <div className="relative ml-auto">
                <button onClick={() => setSampleOpen(!sampleOpen)}
                  className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10 border border-violet-500/10">
                  <BookOpen className="w-3 h-3" />Sample Queries
                  {sampleOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                {sampleOpen && (
                  <div className="absolute right-0 top-7 z-20 w-72 glass-card rounded-2xl border border-violet-500/20 p-3 space-y-2">
                    {currentSamples.map((s) => (
                      <button key={s.label} onClick={() => { setSql(s.sql); setSampleOpen(false); setResult(null); setError(null); }}
                        className="w-full text-left text-[11px] text-slate-300 hover:text-white hover:bg-violet-500/10 rounded-xl p-2 transition-all border border-transparent hover:border-violet-500/20">
                        <div className="font-semibold mb-0.5">{s.label}</div>
                        <div className="text-slate-500 font-mono text-[9px] truncate">{s.sql.slice(0, 60)}…</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={sql}
              onChange={(e) => { setSql(e.target.value); setError(null); }}
              onKeyDown={handleKeyDown}
              placeholder={`Paste ${dialect} query here, or drag & drop a .sql file…\n\nExample:\nSELECT * FROM orders o, customers c\nWHERE o.customer_id = c.id\nAND YEAR(o.created_at) = 2024`}
              className="w-full h-52 bg-[#07071a] rounded-xl border border-violet-500/15 text-xs font-mono text-slate-200 p-4 resize-none focus:outline-none focus:border-violet-500/50 placeholder:text-slate-700 leading-relaxed"
            />

            {/* Status bar */}
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-600">
              <span>Characters: {charCount} · Lines: {lineCount} · Dialect: {dialect}</span>
              <span title="Command+Enter (Mac) / Ctrl+Enter (Windows) to optimize">
                ⌘↵ / Ctrl+Enter to optimize
              </span>
            </div>

            {/* Optimize button */}
            <button
              onClick={handleOptimize}
              disabled={loading || !sql.trim()}
              className="mt-3 w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing…</>
                : <><Zap className="w-4 h-4" />Optimize with AI</>
              }
            </button>
          </div>

          {/* Live Scanner */}
          {sql.length > 10 && (() => {
            const issues: { label: string; desc: string; severity: string }[] = [];
            if (/select\s+\*/i.test(sql)) issues.push({ label: "SELECT * Usage", desc: "Fetches all columns — prevents index-only scans and wastes bandwidth.", severity: "medium" });
            if (/YEAR\s*\(|MONTH\s*\(|DAY\s*\(|DATE\s*\(/i.test(sql)) issues.push({ label: "Function on Indexed Column", desc: "Wrapping a column in a function prevents the query engine from using an index on that column.", severity: "high" });
            if (/SELECT.*FROM\s+\w+.*WHERE.*SELECT/is.test(sql)) issues.push({ label: "Correlated Subquery (N+1)", desc: "Runs once per outer row. Replace with a JOIN + GROUP BY for O(n) instead of O(n²) execution.", severity: "critical" });
            if (!/LIMIT|TOP|ROWNUM|FETCH\s+FIRST/i.test(sql) && /SELECT/i.test(sql)) issues.push({ label: "Missing LIMIT Clause", desc: "Without a result-set bound, a single query can return millions of rows and saturate memory.", severity: "medium" });
            if (!/WHERE/i.test(sql) && /SELECT/i.test(sql)) issues.push({ label: "Missing WHERE Clause", desc: "Full table scan — no filter means every row is examined.", severity: "high" });
            if (issues.length === 0) return null;
            return (
              <div className="glass-card rounded-2xl p-4 border border-amber-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-bold tracking-widest text-amber-400">LIVE SCANNER — INSTANT ANALYSIS</span>
                  <span className="ml-auto text-[10px] text-amber-400 font-bold">{issues.length} issue{issues.length !== 1 ? "s" : ""} detected</span>
                </div>
                <div className="space-y-2">
                  {issues.map((issue, i) => (
                    <div key={i} className={`border-l-2 rounded-r-xl p-3 ${SEVERITY_COLOR[issue.severity]}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span className="text-xs font-semibold">{issue.label}</span>
                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md border capitalize ${SEVERITY_BADGE[issue.severity]}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 ml-5">{issue.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* RIGHT: Results / Ready state / Dialect Panel */}
        <div>
          <AnimatePresence mode="wait">
            {showDialectPanel && (
              <motion.div key="dialect-panel">
                <DialectPanel dialect={dialect} onClose={() => setShowDialectPanel(false)} />
              </motion.div>
            )}

            {!showDialectPanel && error && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-8 flex flex-col items-center text-center border border-red-500/20">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="font-bold mb-2 text-amber-300">Optimization Failed</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-xs">{error}</p>
                <button onClick={handleOptimize}
                  className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all">
                  <Zap className="w-4 h-4" />Try Again
                </button>
                <div className="mt-6 flex gap-2 flex-wrap justify-center">
                  {["Gaming","Education","Banking & Finance","E-Commerce","Healthcare"].map((d) => (
                    <button key={d} onClick={() => {}} className="text-xs px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-slate-400 hover:text-white transition-all">{d}</button>
                  ))}
                </div>
              </motion.div>
            )}

            {!showDialectPanel && !error && !result && !loading && (
              <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-8 flex flex-col items-center text-center border border-violet-500/10">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/15 flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="font-bold mb-2">Ready to Optimize</h3>
                <p className="text-slate-400 text-sm mb-6 max-w-xs">
                  Paste SQL and click <strong>Optimize with AI</strong> or use{" "}
                  <kbd className="px-1 py-0.5 rounded bg-white/10 text-xs">Command+Enter (Mac)</kbd> /{" "}
                  <kbd className="px-1 py-0.5 rounded bg-white/10 text-xs">Ctrl+Enter (Windows)</kbd>.
                </p>
                <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-4">
                  {[
                    { icon: <Zap className="w-4 h-4" />, label: "Instant anti-pattern scan" },
                    { icon: <Brain className="w-4 h-4" />, label: "AI-powered SQL rewrite" },
                    { icon: <FileDown className="w-4 h-4" />, label: "4 export formats" },
                  ].map((f) => (
                    <div key={f.label} className="glass-card rounded-xl p-3 border border-violet-500/10 text-center">
                      <div className="flex justify-center mb-1.5 text-violet-400">{f.icon}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">{f.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  Click the &quot;{dialect} Reference&quot; button above for dialect-specific tips
                </div>
              </motion.div>
            )}

            {!showDialectPanel && loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-8 flex flex-col items-center text-center border border-violet-500/10">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/15 flex items-center justify-center mb-4">
                  <span className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
                </div>
                <h3 className="font-bold mb-2">Analyzing Your Query…</h3>
                <div className="space-y-1.5 text-xs text-slate-500 text-left max-w-xs">
                  {["Scanning for anti-patterns","Calculating complexity class","Building optimized rewrite","Generating index recommendations"].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />{s}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {!showDialectPanel && result && (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="glass-card rounded-2xl p-4 text-center border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <div className={`text-xl font-black font-mono ${gainColor(result.performanceGain)}`}>+{result.performanceGain}%</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Performance Gain</div>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-center border border-sky-500/20">
                    <Database className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                    <div className={`text-xl font-black font-mono ${costColor(result.costScore)}`}>{result.costScore}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Cost Score</div>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-center border border-violet-500/20">
                    <Zap className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                    <div className="text-sm font-black text-violet-300">{result.estimatedSpeedup}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Estimated Speedup</div>
                  </div>
                </div>

                {/* SQL view toggle */}
                <div className="glass-card rounded-2xl p-4 border border-violet-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1 p-1 bg-violet-500/10 rounded-xl">
                      {(["split","before","after"] as const).map((v) => (
                        <button key={v} onClick={() => setSqlView(v)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all capitalize ${sqlView === v ? "bg-violet-600 text-white" : "text-slate-500 hover:text-white"}`}>
                          {v === "split" ? "Side by Side" : v === "before" ? "Original" : "Optimized"}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleCopyResult} className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10 border border-violet-500/10">
                      <Copy className="w-3 h-3" />Copy Optimized
                    </button>
                  </div>

                  {sqlView === "split" ? (
                    <div className="grid grid-cols-2 gap-3">
                      {sql && <SqlBlock sql={sql} label="BEFORE — ORIGINAL" />}
                      <SqlBlock sql={result.optimizedQuery} label="AFTER — OPTIMIZED" />
                    </div>
                  ) : sqlView === "before" ? (
                    sql && <SqlBlock sql={sql} label="ORIGINAL QUERY" />
                  ) : (
                    <SqlBlock sql={result.optimizedQuery} label="OPTIMIZED QUERY" />
                  )}
                </div>

                {/* Explanation */}
                {result.explanation && (
                  <div className="glass-card rounded-2xl p-4 border border-violet-500/10">
                    <div className="text-[10px] font-bold text-violet-400 tracking-widest mb-2">EXPLANATION</div>
                    <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
                    {result.complexityBefore && (
                      <div className="flex items-center gap-3 mt-3 text-xs">
                        <span className="text-slate-500">Complexity:</span>
                        <code className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">{result.complexityBefore}</code>
                        <span className="text-slate-600">→</span>
                        <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{result.complexityAfter}</code>
                      </div>
                    )}
                    {result.estimatedRowsScanned && (
                      <div className="mt-2 text-xs text-slate-500">
                        Rows scanned: <span className="text-slate-300">{result.estimatedRowsScanned}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Issues */}
                {result.issues?.length > 0 && (
                  <div className="glass-card rounded-2xl p-4 border border-amber-500/10">
                    <div className="text-[10px] font-bold text-amber-400 tracking-widest mb-3">
                      ISSUES DETECTED & FIXED ({result.issues.length})
                    </div>
                    <div className="space-y-2">
                      {result.issues.map((issue, i) => (
                        <div key={i} className={`border-l-2 rounded-r-xl p-3 ${SEVERITY_COLOR[issue.severity] ?? "border-l-slate-500 bg-slate-500/8"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span className="text-xs font-semibold capitalize">{issue.type.replace(/-/g," ")}</span>
                            <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${SEVERITY_BADGE[issue.severity] ?? ""}`}>
                              {issue.severity}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 ml-5">{issue.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {result.improvements?.length > 0 && (
                  <div className="glass-card rounded-2xl p-4 border border-emerald-500/10">
                    <div className="text-[10px] font-bold text-emerald-400 tracking-widest mb-3">
                      IMPROVEMENTS APPLIED ({result.improvements.length})
                    </div>
                    <ul className="space-y-1.5">
                      {result.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Index recommendations */}
                {result.indexRecommendations?.length > 0 && (
                  <div className="glass-card rounded-2xl p-4 border border-sky-500/10">
                    <div className="text-[10px] font-bold text-sky-400 tracking-widest mb-3">INDEX RECOMMENDATIONS</div>
                    <div className="space-y-2">
                      {result.indexRecommendations.map((idx, i) => (
                        <div key={i} className="bg-[#07071a] rounded-xl p-3 border border-sky-500/10 flex items-start gap-2">
                          <Code2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                          <code className="text-[11px] font-mono text-sky-300">{idx}</code>
                          <button onClick={() => navigator.clipboard.writeText(idx)} className="ml-auto text-slate-600 hover:text-sky-300 transition-colors flex-shrink-0">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security alerts */}
                {result.securityAlerts?.length > 0 && (
                  <div className="glass-card rounded-2xl p-4 border border-red-500/15">
                    <div className="text-[10px] font-bold text-red-400 tracking-widest mb-3">SECURITY ALERTS</div>
                    <ul className="space-y-1.5">
                      {result.securityAlerts.map((alert, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-red-300">
                          <Shield className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Metadata */}
                <div className="glass-card rounded-2xl p-4 border border-violet-500/10">
                  <div className="text-[10px] font-bold text-slate-500 tracking-widest mb-3">QUERY METADATA</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Title",   value: result.title },
                      { label: "Domain",  value: result.domain },
                      { label: "Type",    value: result.queryType },
                      { label: "Dialect", value: result.dialect },
                      { label: "Tables",  value: result.tablesDetected?.join(", ") || "—" },
                      { label: "Speedup", value: result.estimatedSpeedup },
                    ].map((m) => (
                      <div key={m.label} className="flex flex-col gap-0.5">
                        <span className="text-slate-500">{m.label}</span>
                        <span className="text-slate-200 font-medium">{m.value || "—"}</span>
                      </div>
                    ))}
                  </div>
                  {result.readabilityNotes && (
                    <div className="mt-3 pt-3 border-t border-violet-500/10 text-xs text-slate-400">
                      <span className="text-slate-500">Readability:</span> {result.readabilityNotes}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
