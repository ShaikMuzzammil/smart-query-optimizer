"use client";
// app/(dashboard)/optimizer/page.tsx — Enhanced with dialect analysis + full abbreviation forms
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SqlBlock }   from "@/components/optimizer/SqlBlock";
import { ScoreRing }  from "@/components/optimizer/ScoreRing";
import { ExportMenu } from "@/components/optimizer/ExportMenu";
import { SEVERITY_CONFIG } from "@/lib/utils";
import { SQL_EXAMPLES } from "@/lib/examples-data";
import { toast } from "sonner";
import {
  Zap, Loader2, AlertTriangle, CheckCircle2, Copy, Sparkles, BookOpen,
  HelpCircle, Upload, FileUp, Gauge, Database, Cpu, ChevronRight,
  SplitSquareHorizontal, AlignLeft, AlignRight, Globe, Shield, Brain,
  Info, X, ChevronDown, ChevronUp,
} from "lucide-react";

const DIALECTS = ["PostgreSQL","MySQL","SQLite","BigQuery","MS SQL Server"] as const;
type Dialect = typeof DIALECTS[number];

// ── Dialect-specific analysis data ───────────────────────────────────────────
const DIALECT_INFO: Record<string, {
  icon: string; color: string; strengths: string[]; watchOut: string[];
  keyFunctions: string[]; indexTypes: string[];
}> = {
  PostgreSQL: {
    icon: "🐘", color: "text-sky-300",
    strengths: ["Window functions (LAG, LEAD, RANK)", "JSONB / array operators", "CTEs (WITH clauses)", "Partial & expression indexes", "EXPLAIN ANALYZE"],
    watchOut:  ["SERIAL vs IDENTITY for auto-increment", "Case-sensitive identifiers need quoting", "ILIKE for case-insensitive LIKE", "text vs varchar performance"],
    keyFunctions: ["DATE_TRUNC()", "GENERATE_SERIES()", "COALESCE()", "NULLIF()", "ARRAY_AGG()"],
    indexTypes: ["B-tree (default)", "GIN (JSONB/arrays)", "GiST (geometry)", "BRIN (time-series)"],
  },
  MySQL: {
    icon: "🐬", color: "text-amber-300",
    strengths: ["InnoDB full-text search", "AUTO_INCREMENT", "ENUM types", "Stored procedures", "Replication support"],
    watchOut:  ["GROUP BY is more permissive (risky)", "ONLY_FULL_GROUP_BY mode", "Strict vs non-strict mode", "Case sensitivity varies by OS"],
    keyFunctions: ["GROUP_CONCAT()", "IFNULL()", "FIND_IN_SET()", "STR_TO_DATE()", "CONVERT_TZ()"],
    indexTypes: ["B-tree (InnoDB default)", "FULLTEXT", "SPATIAL", "Covering indexes"],
  },
  SQLite: {
    icon: "📦", color: "text-emerald-300",
    strengths: ["Zero-config, file-based", "Great for prototyping", "FTS5 full-text search", "JSON1 extension", "WAL mode for concurrency"],
    watchOut:  ["No RIGHT JOIN support", "Dynamic typing (no strict column types)", "Limited ALTER TABLE", "No stored procedures"],
    keyFunctions: ["datetime()", "julianday()", "json_extract()", "group_concat()", "printf()"],
    indexTypes: ["B-tree (only type)", "Partial indexes", "Expression indexes (SQLite 3.9+)"],
  },
  BigQuery: {
    icon: "☁️", color: "text-violet-300",
    strengths: ["Petabyte-scale queries", "Partitioned & clustered tables", "STRUCT / ARRAY types", "ML integration (BQML)", "Federated queries"],
    watchOut:  ["Partitioning is critical for cost", "ARRAY_AGG vs GROUP BY", "No indexes (uses columnar storage)", "Full table scans are cheap but watch limits"],
    keyFunctions: ["ARRAY_AGG()", "STRUCT()", "UNNEST()", "DATE_DIFF()", "APPROX_COUNT_DISTINCT()"],
    indexTypes: ["Partitioning (DATE/INT64)", "Clustering (up to 4 cols)", "Table range partitioning"],
  },
  "MS SQL Server": {
    icon: "🪟", color: "text-blue-300",
    strengths: ["Columnstore indexes", "T-SQL procedural language", "Query Store & plan forcing", "Always Encrypted", "Temporal tables"],
    watchOut:  ["TOP instead of LIMIT", "NOLOCK hint risks dirty reads", "Implicit conversions kill indexes", "SET options affect execution plans"],
    keyFunctions: ["TRY_CAST()", "IIF()", "CHOOSE()", "FORMAT()", "DATEDIFF()"],
    indexTypes: ["Clustered", "Non-clustered", "Columnstore (OLAP)", "Filtered indexes", "Full-text"],
  },
};

// ── Live scanner ─────────────────────────────────────────────────────────────
const SCAN_PATTERNS = [
  { id:"n1", sev:"critical", title:"Correlated Subquery (N+1 Problem)",      rx:/SELECT[\s\S]{0,200}SELECT\b/i,               tip:"Runs once per outer row. Use JOIN + GROUP BY instead." },
  { id:"n2", sev:"critical", title:"Leading Wildcard LIKE",                   rx:/LIKE\s+['"']%[^%'"]/i,                       tip:"LIKE '%text%' disables index usage — causes a full table scan." },
  { id:"n3", sev:"high",     title:"Function on Indexed Column",              rx:/\b(YEAR|MONTH|DAY|DATE|LOWER|UPPER|TRIM)\s*\(/i, tip:"Wrapping a column in a function prevents index use." },
  { id:"n4", sev:"high",     title:"Implicit JOIN (Comma Syntax)",            rx:/FROM\s+\w+\s*,\s*\w+/i,                     tip:"Comma-style JOINs block the optimizer from choosing the best plan." },
  { id:"n5", sev:"medium",   title:"Missing LIMIT Clause",                    rx:/SELECT\b(?![\s\S]*\bLIMIT\b)/i,              tip:"Without LIMIT, queries return unbounded result sets." },
  { id:"n6", sev:"medium",   title:"SELECT * (All Columns Selected)",         rx:/SELECT\s+\*/i,                               tip:"SELECT * can&apos;t use covering indexes and wastes network bandwidth." },
  { id:"n7", sev:"medium",   title:"NOT IN with Subquery",                    rx:/NOT\s+IN\s*\(\s*SELECT/i,                    tip:"NOT IN returns nothing if the subquery has any NULL rows. Use NOT EXISTS." },
  { id:"n8", sev:"low",      title:"OR Across Different Columns",             rx:/WHERE\s+.*\bOR\b/i,                          tip:"OR often can&apos;t use a single index. Consider UNION ALL." },
];

function useLiveScanner(sql: string) {
  return useMemo(() => sql.trim().length < 8 ? [] : SCAN_PATTERNS.filter(p => p.rx.test(sql)), [sql]);
}

interface OptimizeResult {
  id?: string | null;
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
  originalQuery?: string;
  estimatedRowsScanned?: string;
  costScore?: number;
  readabilityNotes?: string;
  engine?: string;
  piiDetected?: boolean;
  piiFields?: string[];
  securityAlerts?: string[];
  lintWarnings?: string[];
  error?: string;
  fix?: string;
}

type ResultTab = "summary" | "sql" | "issues" | "improvements";

// ── Dialect Analysis Panel ────────────────────────────────────────────────────
function DialectPanel({ dialect, onClose }: { dialect: Dialect; onClose: () => void }) {
  const info = DIALECT_INFO[dialect];
  const [tab, setTab] = useState<"strengths"|"watchout"|"functions"|"indexes">("strengths");
  if (!info) return null;
  const tabData: Record<string, { label: string; items: string[]; color: string }> = {
    strengths: { label: "Strengths",    items: info.strengths,    color: "text-emerald-300" },
    watchout:  { label: "Watch Out",    items: info.watchOut,     color: "text-amber-300" },
    functions: { label: "Key Functions",items: info.keyFunctions, color: "text-sky-300" },
    indexes:   { label: "Index Types",  items: info.indexTypes,   color: "text-violet-300" },
  };
  return (
    <motion.div initial={{ opacity:0, y:-8, height:0 }} animate={{ opacity:1, y:0, height:"auto" }}
      exit={{ opacity:0, y:-8, height:0 }} className="overflow-hidden">
      <div className="glass-card rounded-2xl p-4 border border-violet-500/25 mb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{info.icon}</span>
            <span className={`text-sm font-bold ${info.color}`}>{dialect} Quick Reference</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-violet-500/10 text-slate-500 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {Object.entries(tabData).map(([key, { label }]) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                tab === key ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-violet-500/10"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          {tabData[tab].items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              <span className={`flex-shrink-0 mt-0.5 ${tab === "watchout" ? "text-amber-400" : "text-violet-400"}`}>
                {tab === "watchout" ? "⚠" : "✓"}
              </span>
              <span className="text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function OptimizerContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [query,      setQuery]      = useState("");
  const [dialect,    setDialect]    = useState<Dialect>("PostgreSQL");
  const [result,     setResult]     = useState<OptimizeResult | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [sqlView,    setSqlView]    = useState<"split"|"before"|"after">("split");
  const [resultTab,  setResultTab]  = useState<ResultTab>("summary");
  const [dragOver,   setDragOver]   = useState(false);
  const [showDialect,setShowDialect]= useState(false);
  const [showDialectPanel, setShowDialectPanel] = useState(false);
  const scanHits = useLiveScanner(query);

  useEffect(() => {
    const exId = searchParams.get("example");
    const fromNl2sql = searchParams.get("from") === "nl2sql";
    if (fromNl2sql) {
      const saved = sessionStorage.getItem("qf_nl2sql_sql");
      if (saved) { setQuery(saved); setResult(null); sessionStorage.removeItem("qf_nl2sql_sql"); toast.success("SQL loaded from Natural Language to SQL — ready to optimize!"); }
      router.replace("/optimizer"); return;
    }
    if (exId) {
      const ex = SQL_EXAMPLES.find(e => e.id === exId);
      if (ex) { setQuery(ex.sql); setResult(null); toast.message(`Loaded: ${ex.issueTag}`); }
      router.replace("/optimizer");
    }
  }, [searchParams, router]);

  const randomExamples = useMemo(() => [...SQL_EXAMPLES].sort(() => Math.random() - 0.5).slice(0, 4), []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") optimize(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  });

  const loadFile = useCallback((file: File) => {
    if (!/\.(sql|txt)$/i.test(file.name)) { toast.error("Please upload a .sql or .txt file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("File too large — max 2 MB"); return; }
    const r = new FileReader();
    r.onload = () => { setQuery(String(r.result ?? "")); setResult(null); toast.success(`Loaded ${file.name}`); };
    r.readAsText(file);
  }, []);

  const onDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0]; if (f) loadFile(f);
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  const optimize = useCallback(async () => {
    if (!query.trim()) { toast.warning("Paste a SQL query first"); return; }
    setLoading(true); setResult(null); setShowDialectPanel(false);
    try {
      const schemaCtx = sessionStorage.getItem("sqo_schema_context") ?? undefined;
      const res = await fetch("/api/optimize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, dialect, schemaContext: schemaCtx }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ isValidSql:true, optimizedQuery:"", issues:[], improvements:[], performanceGain:0, explanation:"", indexRecommendations:[], complexityBefore:"N/A", complexityAfter:"N/A", estimatedSpeedup:"N/A", tablesDetected:[], queryType:"UNKNOWN", error: data.error, fix: data.fix });
        toast.error(data.error ?? "Optimization failed");
        return;
      }
      setResult({ ...data, originalQuery: query });
      setResultTab("summary");
      if (data.isValidSql === false) toast.warning("That doesn&apos;t look like valid SQL");
      else toast.success(`⚡ +${data.performanceGain}% estimated performance gain`);
    } catch { toast.error("Network error — please check your connection"); }
    finally { setLoading(false); }
  }, [query, dialect]);

  const tabs: Array<{ key: ResultTab; label: string; count?: number }> = [
    { key:"summary",      label:"Summary" },
    { key:"sql",          label:"SQL Diff" },
    { key:"issues",       label:"Issues",       count: result?.issues?.length },
    { key:"improvements", label:"Improvements", count: result?.improvements?.length },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black mb-1">SQL Optimizer</h1>
          <p className="text-slate-400 text-sm">Paste a query → AI rewrites it with full analysis · Personally Identifiable Information (PII) auto-redacted · Multi-dialect</p>
        </div>
        <Link href="/nl2sql" className="flex items-center gap-2 px-3 py-2 border border-violet-500/20 hover:border-violet-500/40 text-slate-400 hover:text-violet-300 text-xs rounded-xl transition-colors">
          <Brain className="w-3.5 h-3.5" />Try Natural Language to SQL instead
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── LEFT: Input ── */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            {/* Dialect + Controls */}
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Active dialect button — click to toggle selector */}
                <button onClick={() => { setShowDialect(d => !d); setShowDialectPanel(false); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-300 text-[11px] font-semibold hover:bg-violet-500/15 transition-colors">
                  <Globe className="w-3 h-3" />
                  {dialect}
                  {showDialect ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {/* Dialect info button */}
                <button onClick={() => { setShowDialectPanel(v => !v); setShowDialect(false); }}
                  title={`View ${dialect} quick reference — strengths, functions, index types`}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors ${
                    showDialectPanel ? "bg-violet-500/20 border-violet-400/40 text-violet-300" : "border-violet-500/20 text-slate-500 hover:text-violet-300 hover:border-violet-500/35"}`}>
                  <Info className="w-3 h-3" />
                  {dialect.split(" ")[0]} Reference
                </button>
                {/* Dialect selector dropdown */}
                <AnimatePresence>
                  {showDialect && (
                    <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                      className="flex gap-1 flex-wrap">
                      {DIALECTS.filter(d => d !== dialect).map(d => (
                        <button key={d} onClick={() => { setDialect(d); setShowDialect(false); setShowDialectPanel(true); }}
                          className="px-2 py-1 rounded-lg border border-violet-500/15 text-[10px] text-slate-400 hover:text-violet-300 hover:border-violet-500/30 transition-colors">
                          {d}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                {/* Full-form keyboard shortcut */}
                <span className="relative group cursor-help">
                  <kbd className="px-1.5 py-0.5 bg-violet-500/15 border border-violet-500/25 rounded text-[10px] text-violet-300 font-mono">⌘↵</kbd>
                  <span className="absolute bottom-7 left-1/2 -translate-x-1/2 w-52 p-2 bg-[#0a0a1e] border border-violet-500/30 rounded-lg text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center shadow-xl">
                    Command+Enter (Mac) / Ctrl+Enter (Windows) — Optimize Query
                  </span>
                </span>
                <label className="flex items-center gap-1 hover:text-violet-300 cursor-pointer transition-colors" title="Upload SQL file (.sql or .txt)">
                  <Upload className="w-3.5 h-3.5" />Upload File
                  <input type="file" accept=".sql,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }} />
                </label>
                <button onClick={() => { setQuery(""); setResult(null); setShowDialectPanel(false); }} className="hover:text-slate-300 transition-colors" title="Clear query and results">
                  Clear
                </button>
              </div>
            </div>

            {/* Dialect Analysis Panel */}
            <AnimatePresence>
              {showDialectPanel && <DialectPanel dialect={dialect} onClose={() => setShowDialectPanel(false)} />}
            </AnimatePresence>

            {/* PII notice */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mb-2">
              <Shield className="w-3 h-3 text-emerald-600" />
              Personally Identifiable Information (PII) — emails, SSNs, card numbers — is auto-redacted before processing
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea value={query} onChange={e => setQuery(e.target.value)}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                placeholder={`Paste ${dialect} query here, or drag & drop a .sql file…\n\nExample:\nSELECT * FROM orders o, customers c\nWHERE o.customer_id = c.id\nAND YEAR(o.created_at) = 2024`}
                className={`w-full min-h-[240px] bg-[#020208] border rounded-xl p-4 text-xs font-mono leading-7 text-slate-200 placeholder:text-slate-600 outline-none transition-colors resize-y ${dragOver ? "border-violet-400 ring-2 ring-violet-500/30" : "border-violet-500/20 focus:border-violet-500/50"}`}
              />
              {dragOver && (
                <div className="absolute inset-0 bg-violet-950/80 border-2 border-dashed border-violet-400 rounded-xl flex items-center justify-center gap-2 text-violet-200 text-sm font-semibold pointer-events-none">
                  <FileUp className="w-5 h-5" /> Drop .sql or .txt file here to load
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-500">
              <span>Characters: {query.length} · Lines: {query.split("\n").length} · Dialect: {dialect}</span>
              {scanHits.length > 0 && (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{scanHits.length} issue{scanHits.length !== 1 ? "s" : ""} detected
                </span>
              )}
            </div>

            {/* Optimize button */}
            <button onClick={optimize} disabled={loading || !query.trim()}
              className="w-full mt-3 py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 glow-violet"
              title="Analyze and optimize SQL with AI (Command+Enter / Ctrl+Enter)">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</>
                : <><Zap className="w-4 h-4" />Optimize with AI</>}
            </button>
          </div>

          {/* Live scanner */}
          <AnimatePresence>
            {scanHits.length > 0 && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                className="glass-card rounded-2xl p-4 border-amber-500/20 overflow-hidden">
                <div className="text-[10px] font-bold text-amber-400 tracking-wider mb-3 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />LIVE SCANNER — INSTANT ANALYSIS
                  <span className="text-[9px] text-slate-600 font-normal ml-1">(AI optimization gives deeper analysis)</span>
                </div>
                <div className="space-y-2">
                  {scanHits.map(h => {
                    const s = SEVERITY_CONFIG[h.sev as keyof typeof SEVERITY_CONFIG];
                    return (
                      <div key={h.id} className={`flex gap-2.5 p-2.5 rounded-xl ${s.bg} border-l-2 ${s.border}`}>
                        <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${s.color}`} />
                        <div>
                          <div className={`text-[11px] font-semibold ${s.color}`}>{h.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{h.tip}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick examples */}
          {!result && !loading && (
            <div className="glass-card rounded-2xl p-4">
              <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />QUICK-LOAD EXAMPLES
              </div>
              <div className="space-y-1.5">
                {randomExamples.map(ex => (
                  <button key={ex.id} onClick={() => { setQuery(ex.sql); toast.message(`Loaded: ${ex.issueTag}`); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/10 rounded-xl text-left transition-colors group">
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-200 truncate group-hover:text-white transition-colors">{ex.issueTag}</div>
                      <div className="text-[10px] text-slate-500">{ex.domain} · {ex.difficulty}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
              <Link href="/examples" className="mt-3 text-[11px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />Browse all {SQL_EXAMPLES.length} examples →
              </Link>
            </div>
          )}
        </div>

        {/* ── RIGHT: Result ── */}
        <div>
          {result?.error ? (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              className="glass-card rounded-2xl p-10 border-amber-500/20 min-h-[400px] flex flex-col items-center justify-center gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <div className="font-bold text-lg text-amber-200 mb-2">Service Temporarily Unavailable</div>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  The optimization service is temporarily unavailable. This usually resolves in a moment.
                </p>
                {result.fix && (
                  <div className="mt-3 p-3 rounded-xl bg-violet-500/8 border border-violet-500/20 text-left">
                    <p className="text-[11px] text-violet-300 leading-relaxed">{result.fix}</p>
                  </div>
                )}
              </div>
              <button onClick={optimize}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600/80 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors">
                <Zap className="w-4 h-4" /> Try Again
              </button>
              <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                {randomExamples.slice(0, 3).map(ex => (
                  <button key={ex.id} onClick={() => { setQuery(ex.sql); setResult(null); }}
                    className="text-center p-3 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/10 rounded-xl transition-colors">
                    <div className="text-[10px] text-slate-400 truncate">{ex.domain}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : !result ? (
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[520px] gap-4">
              <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-9 h-9 text-violet-400/50" />
              </div>
              <div>
                <div className="text-xl font-bold mb-2">Ready to Optimize</div>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  Paste SQL and click <b className="text-violet-300">Optimize with AI</b>, or use <b className="text-violet-300">Command+Enter (Mac)</b> / <b className="text-violet-300">Ctrl+Enter (Windows)</b>.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-2">
                {[["⚡","Instant anti-pattern scan"],["🤖","AI-powered SQL rewrite"],["📥","4 export formats (SQL / JSON / CSV / PDF)"]].map(([icon, label]) => (
                  <div key={label} className="glass-card rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="text-[10px] text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
              {/* Dialect info teaser */}
              <div className="w-full max-w-sm">
                <button onClick={() => setShowDialectPanel(v => !v)}
                  className="w-full flex items-center gap-2 p-3 rounded-xl border border-violet-500/15 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors text-xs text-slate-400 hover:text-slate-200">
                  <Info className="w-3.5 h-3.5 text-violet-400" />
                  Click here or the &ldquo;{dialect} Reference&rdquo; button above for dialect-specific tips
                </button>
              </div>
            </div>
          ) : result.isValidSql === false ? (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[520px] gap-4 border-amber-500/20">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                <HelpCircle className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <div className="text-lg font-bold mb-2">That doesn&apos;t look like SQL</div>
                <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                  Please paste a valid SQL query. Supported dialects: {DIALECTS.join(", ")}.
                </p>
              </div>
              <button onClick={() => { setQuery(""); setResult(null); }}
                className="px-5 py-2.5 border border-violet-500/30 text-violet-300 text-sm font-semibold rounded-xl hover:bg-violet-500/10 transition-colors">
                Clear &amp; Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="space-y-4">
              {/* Score + meta */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <ScoreRing score={result.performanceGain} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg truncate">{(result as any).title ?? "Optimized Query"}</div>
                    <div className="text-xs text-slate-400 mt-0.5 mb-3 line-clamp-2">{result.explanation}</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label:"Speedup",      value: result.estimatedSpeedup ?? "N/A" },
                        { label:"Complexity",   value: `${result.complexityBefore} → ${result.complexityAfter}` },
                        { label:"Domain",       value: (result as any).domain ?? "General" },
                      ].map(m => (
                        <div key={m.label} className="bg-violet-500/8 rounded-xl p-2 text-center">
                          <div className="text-[11px] font-semibold text-violet-200 truncate">{m.value}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>
                    {result.estimatedRowsScanned && (
                      <div className="mt-2 text-[10px] text-slate-500">
                        <span className="text-slate-400 font-medium">Rows Scanned:</span> {result.estimatedRowsScanned}
                      </div>
                    )}
                  </div>
                </div>

                {/* PII alert */}
                {result.piiDetected && (
                  <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300">
                    <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                    PII redacted before processing: {result.piiFields?.join(", ")}
                  </div>
                )}

                {/* Security alerts */}
                {(result.securityAlerts ?? []).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {(result.securityAlerts ?? []).map((a, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/8 border border-rose-500/15 text-[10px] text-rose-300">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />{a}
                      </div>
                    ))}
                  </div>
                )}

                {/* Export menu */}
                {result.id && (
                  <div className="mt-3 flex justify-end">
                    <ExportMenu queryId={result.id} />
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-violet-500/5 rounded-xl p-1 border border-violet-500/10">
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setResultTab(t.key)}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      resultTab === t.key ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>
                    {t.label}
                    {t.count ? <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${resultTab === t.key ? "bg-white/20" : "bg-violet-500/15"}`}>{t.count}</span> : null}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                <motion.div key={resultTab} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                  {resultTab === "summary" && (
                    <div className="glass-card rounded-2xl p-5 space-y-4">
                      {/* Index recommendations */}
                      {result.indexRecommendations?.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-violet-400 tracking-wider mb-2">INDEX RECOMMENDATIONS</div>
                          <div className="space-y-1.5">
                            {result.indexRecommendations.map((rec, i) => (
                              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-violet-500/8 border border-violet-500/12">
                                <Database className="w-3 h-3 text-violet-400 flex-shrink-0 mt-0.5" />
                                <code className="text-[10px] font-mono text-violet-200">{rec}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Tables detected */}
                      {result.tablesDetected?.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2">TABLES DETECTED</div>
                          <div className="flex flex-wrap gap-1.5">
                            {result.tablesDetected.map(t => (
                              <span key={t} className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-[10px] font-mono text-violet-300">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Readability */}
                      {result.readabilityNotes && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2">CODE QUALITY</div>
                          <p className="text-[11px] text-slate-400">{result.readabilityNotes}</p>
                        </div>
                      )}
                      {/* Lint warnings */}
                      {(result.lintWarnings ?? []).length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2">LINT WARNINGS</div>
                          {(result.lintWarnings ?? []).map((w, i) => (
                            <div key={i} className="text-[10px] text-amber-300 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />{w}</div>
                          ))}
                        </div>
                      )}
                      {result.costScore != null && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <Gauge className="w-3 h-3" />Query cost score: <span className="text-violet-300 font-bold">{result.costScore}/100</span>
                          <span className="text-[9px]">(lower = cheaper to execute)</span>
                        </div>
                      )}
                    </div>
                  )}

                  {resultTab === "sql" && (
                    <div className="glass-card rounded-2xl p-5 space-y-4">
                      <div className="flex gap-1 p-1 bg-violet-500/8 rounded-xl border border-violet-500/10 w-fit">
                        {([["split","Split View"],["before","Before Only"],["after","After Only"]] as const).map(([v, label]) => (
                          <button key={v} onClick={() => setSqlView(v as any)}
                            className={`px-3 py-1 text-[10px] font-semibold rounded-lg transition-colors ${sqlView === v ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {(sqlView === "split" || sqlView === "before") && result.originalQuery && (
                        <div>
                          <div className="text-[10px] font-bold text-rose-400 tracking-wider mb-2 flex items-center gap-1.5">
                            <AlignLeft className="w-3 h-3" />BEFORE — ORIGINAL
                          </div>
                          <SqlBlock sql={result.originalQuery} label="ORIGINAL QUERY" />
                        </div>
                      )}
                      {(sqlView === "split" || sqlView === "after") && (
                        <div>
                          <div className="text-[10px] font-bold text-emerald-400 tracking-wider mb-2 flex items-center gap-1.5">
                            <AlignRight className="w-3 h-3" />AFTER — OPTIMIZED
                          </div>
                          <SqlBlock sql={result.optimizedQuery} label="OPTIMIZED QUERY" />
                        </div>
                      )}
                    </div>
                  )}

                  {resultTab === "issues" && (
                    <div className="glass-card rounded-2xl p-5 space-y-2">
                      {result.issues?.length === 0 ? (
                        <div className="text-center py-8"><CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" /><p className="text-sm text-slate-400">No issues found — your query looks clean!</p></div>
                      ) : result.issues?.map((issue, i) => {
                        const s = SEVERITY_CONFIG[issue.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.low;
                        return (
                          <div key={i} className={`flex gap-2.5 p-3 rounded-xl ${s.bg} border-l-2 ${s.border}`}>
                            <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${s.color}`} />
                            <div>
                              <div className={`text-[11px] font-bold ${s.color} uppercase tracking-wide`}>{issue.severity}</div>
                              <div className="text-xs text-slate-300 mt-0.5">{issue.description}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {resultTab === "improvements" && (
                    <div className="glass-card rounded-2xl p-5 space-y-2">
                      {result.improvements?.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">No improvements listed.</p>
                      ) : result.improvements?.map((imp, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                          <span className="text-xs text-slate-300">{imp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OptimizerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading optimizer…</div>}>
      <OptimizerContent />
    </Suspense>
  );
}
