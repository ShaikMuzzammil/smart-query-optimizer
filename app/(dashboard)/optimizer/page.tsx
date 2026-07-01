"use client";
// app/(dashboard)/optimizer/page.tsx — FIX #2,#6,#7,#8,#11,#12
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Upload, X, AlertCircle, CheckCircle2, TrendingUp,
  ChevronRight, Info, Copy, Check, BookOpen, Globe, FileUp,
  Sparkles, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { SqlBlock } from "@/components/optimizer/SqlBlock";
import { ScoreRing } from "@/components/optimizer/ScoreRing";
import { ExportMenu } from "@/components/optimizer/ExportMenu";
import { staticAnalyze } from "@/lib/ai-engine";

// FIX #11: All dialects always visible; clicking shows reference panel
const DIALECTS = [
  { key: "PostgreSQL",  icon: "🐘", color: "sky",
    ref: { strengths: ["Advanced JSON/JSONB support","Window functions","CTEs with RECURSIVE","Partial indexes","EXPLAIN ANALYZE output"], 
           functions: ["DATE_TRUNC()","EXTRACT()","STRING_AGG()","ARRAY_AGG()","JSONB_SET()"],
           indexTypes: ["B-tree (default)","GIN (arrays/JSON)","GiST (geometric)","BRIN (range)","Hash"] } },
  { key: "MySQL",       icon: "🐬", color: "orange",
    ref: { strengths: ["Widely supported","InnoDB ACID transactions","Full-text search","Partitioning","JSON columns (5.7+)"],
           functions: ["DATE_FORMAT()","GROUP_CONCAT()","IFNULL()","IF()","JSON_VALUE()"],
           indexTypes: ["B-tree","Full-Text","Spatial (GEOMETRY)","Covering index","Composite index"] } },
  { key: "SQLite",      icon: "💾", color: "emerald",
    ref: { strengths: ["Zero-config serverless","Single file database","ACID compliant","Great for testing","Built into browsers"],
           functions: ["STRFTIME()","COALESCE()","GROUP_CONCAT()","HEX()","SUBSTR()"],
           indexTypes: ["B-tree (all indexes)","Unique","Partial (WHERE clause)","Expression-based"] } },
  { key: "BigQuery",    icon: "☁️",  color: "blue",
    ref: { strengths: ["Petabyte-scale analytics","Serverless auto-scaling","Built-in ML (BQML)","Nested/repeated fields","Slot-based pricing"],
           functions: ["DATE_DIFF()","SAFE_DIVIDE()","APPROX_COUNT_DISTINCT()","ARRAY_AGG()","STRUCT()"],
           indexTypes: ["Clustering columns","Partition pruning","Search indexes","Vector indexes (preview)"] } },
  { key: "MS SQL Server", icon: "🪟", color: "blue",
    ref: { strengths: ["T-SQL extensions","Row-level security","Columnstore indexes","Always On availability","Full CLR support"],
           functions: ["GETDATE()","ISNULL()","STRING_SPLIT()","FORMAT()","TRY_CAST()"],
           indexTypes: ["Clustered","Non-clustered","Columnstore","Full-text","Spatial"] } },
];

// FIX #11: PostgreSQL, MySQL, SQLite comparison details  
const SAMPLE_QUERIES: Record<string, string[]> = {
  "Education":      [
    `-- Find students with highest grade in each course\nSELECT c.name AS course, s.name AS student, MAX(g.score) AS top_score\nFROM grades g\nJOIN students s ON s.id = g.student_id\nJOIN courses c ON c.id = g.course_id\nGROUP BY c.name, s.name\nORDER BY top_score DESC\nLIMIT 20;`,
  ],
  "E-Commerce":     [
    `-- Top 10 customers by revenue last 30 days\nSELECT c.id, c.name, SUM(o.total_amount) AS revenue\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nWHERE o.created_at >= NOW() - INTERVAL '30 days'\n  AND o.status = 'completed'\nGROUP BY c.id, c.name\nORDER BY revenue DESC\nLIMIT 10;`,
  ],
  "HR & Payroll":   [
    `-- Employees without performance review in past 6 months\nSELECT e.id, e.name, e.department, MAX(r.review_date) AS last_review\nFROM employees e\nLEFT JOIN reviews r ON r.employee_id = e.id\nGROUP BY e.id, e.name, e.department\nHAVING MAX(r.review_date) < NOW() - INTERVAL '6 months'\n    OR MAX(r.review_date) IS NULL\nORDER BY e.department;`,
  ],
  "Healthcare":     [
    `-- Patients with abnormal lab tests in last 30 days\nSELECT p.id, p.name, COUNT(*) AS abnormal_count\nFROM patients p\nJOIN lab_results l ON l.patient_id = p.id\nWHERE l.result_date >= NOW() - INTERVAL '30 days'\n  AND l.is_abnormal = TRUE\nGROUP BY p.id, p.name\nORDER BY abnormal_count DESC\nLIMIT 50;`,
  ],
  "Finance":        [
    `-- Monthly revenue per category Q1 2024\nSELECT DATE_TRUNC('month', t.created_at) AS month,\n       c.name AS category,\n       SUM(t.amount) AS revenue\nFROM transactions t\nJOIN categories c ON c.id = t.category_id\nWHERE t.created_at BETWEEN '2024-01-01' AND '2024-03-31'\n  AND t.type = 'income'\nGROUP BY month, c.name\nORDER BY month, revenue DESC;`,
  ],
  "Gaming":         [
    `-- Top players by score this season\nSELECT u.username, SUM(s.points) AS total_points, COUNT(*) AS games_played\nFROM scores s\nJOIN users u ON u.id = s.user_id\nJOIN seasons ss ON ss.id = s.season_id\nWHERE ss.is_active = TRUE\nGROUP BY u.username\nORDER BY total_points DESC\nLIMIT 100;`,
  ],
  "Banking":        [
    `-- Detect potentially suspicious transactions\nSELECT t.id, t.account_id, t.amount, t.created_at,\n       AVG(t.amount) OVER (PARTITION BY t.account_id\n         ROWS BETWEEN 30 PRECEDING AND CURRENT ROW) AS rolling_avg\nFROM transactions t\nWHERE t.amount > 5000\n  AND t.created_at >= NOW() - INTERVAL '7 days'\nORDER BY t.amount DESC;`,
  ],
};

interface OptimizeResult {
  optimizedQuery: string; explanation: string; performanceGain: number;
  estimatedSpeedup: string; estimatedRowsScanned: string; costScore: number;
  complexityBefore: string; complexityAfter: string; readabilityNotes: string;
  issues: Array<{ type:string; severity:string; description:string; suggestion:string }>;
  improvements: string[]; indexRecommendations: string[];
  tablesDetected: string[]; domain: string; title: string;
  engine: string; queryType: string;
}

export default function OptimizerPage() {
  const [sql, setSql]               = useState("");
  const [dialect, setDialect]       = useState("PostgreSQL");
  const [refDialect, setRefDialect] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<OptimizeResult | null>(null);
  const [error, setError]           = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pick up a prefilled query sent from Examples / History pages
  useEffect(() => {
    const pre = sessionStorage.getItem("prefillSql");
    if (pre) { setSql(pre); sessionStorage.removeItem("prefillSql"); }
  }, []);


  // FIX #6: Abbreviations expanded
  const selectedDialect = DIALECTS.find(d => d.key === dialect)!;
  const liveIssues = sql.length > 5 ? staticAnalyze(sql) : [];
  // FIX (this round): lightweight shape check — if what's pasted doesn't
  // look like a SQL statement at all, surface a clear notification with a
  // quick fix instead of letting the user submit it and wait for a vague
  // failure from the optimization service.
  const looksLikeSql = /\b(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|MERGE|ALTER)\b/i.test(sql);
  const showShapeWarning = sql.trim().length > 8 && !looksLikeSql;

  const handleOptimize = useCallback(async () => {
    if (!sql.trim()) { toast.error("Paste a SQL query first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql, dialect }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Optimization failed — please try again."); return; }
      setResult(data);
      toast.success("Optimization complete!");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally { setLoading(false); }
  }, [sql, dialect]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setSql(ev.target?.result as string ?? ""); };
    reader.readAsText(file);
    toast.success(`Loaded ${file.name}`);
  };

  const loadSample = (category: string) => {
    const queries = SAMPLE_QUERIES[category];
    if (queries?.[0]) { setSql(queries[0]); setActiveCategory(category); }
  };

  const CATEGORIES = Object.keys(SAMPLE_QUERIES);

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">SQL Optimizer</h1>
          {/* FIX #6: Full forms for all abbreviations */}
          <p className="text-slate-400 text-sm mt-1">
            Paste a query → AI rewrites with full analysis ·{" "}
            <span className="text-violet-400">Personally Identifiable Information (PII)</span> auto-redacted · Multi-dialect
          </p>
        </div>
        <a href="/nl2sql" className="text-[11px] text-slate-500 hover:text-violet-400 flex items-center gap-1 transition-colors">
          <Sparkles className="w-3.5 h-3.5"/> Try Natural Language to SQL instead
        </a>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          {/* FIX #8 & #11: All dialect tabs always visible; clicking beside shows reference */}
          <div className="bg-[#08081a] rounded-2xl border border-violet-500/20 overflow-hidden">
            {/* Dialect selector */}
            <div className="flex items-center gap-1 px-4 pt-4 pb-3 border-b border-violet-500/10 flex-wrap gap-y-2">
              {DIALECTS.map(d => (
                <div key={d.key} className="flex items-center gap-1">
                  <button
                    onClick={() => { setDialect(d.key); setRefDialect(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      dialect === d.key
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <span>{d.icon}</span> {d.key}
                  </button>
                  {/* FIX #8: Reference button appears beside selected dialect */}
                  {dialect === d.key && (
                    <button
                      onClick={() => setRefDialect(refDialect === d.key ? null : d.key)}
                      title={`View ${d.key} quick reference — strengths, functions, index types`}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] border transition-all ${
                        refDialect === d.key
                          ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                          : "text-slate-500 border-slate-700 hover:text-sky-300 hover:border-sky-500/30"
                      }`}
                    >
                      <BookOpen className="w-3 h-3"/> {d.key} Reference
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Dialect Reference Panel */}
            <AnimatePresence>
              {refDialect && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 bg-sky-500/5 border-b border-sky-500/15">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-sky-300">{refDialect} Quick Reference</h3>
                      <button onClick={() => setRefDialect(null)} className="text-slate-500 hover:text-white">
                        <X className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                    {(() => {
                      const d = DIALECTS.find(x => x.key === refDialect)!;
                      return (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-[9px] font-bold text-sky-400 uppercase tracking-wider mb-1.5">Strengths</div>
                            {d.ref.strengths.map((s,i) => <div key={i} className="text-[10px] text-slate-300 flex gap-1 mb-1"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 mt-0.5 flex-shrink-0"/>{s}</div>)}
                          </div>
                          <div>
                            <div className="text-[9px] font-bold text-sky-400 uppercase tracking-wider mb-1.5">Key Functions</div>
                            {d.ref.functions.map((f,i) => <div key={i} className="text-[10px] text-slate-300 font-mono mb-1">{f}</div>)}
                          </div>
                          <div>
                            <div className="text-[9px] font-bold text-sky-400 uppercase tracking-wider mb-1.5">Index Types</div>
                            {d.ref.indexTypes.map((t,i) => <div key={i} className="text-[10px] text-slate-300 flex gap-1 mb-1"><span className="text-violet-400">•</span>{t}</div>)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PII notice */}
            <div className="px-4 py-2 flex items-center gap-2 border-b border-violet-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="text-[10px] text-slate-500">
                Personally Identifiable Information (PII) — emails, Social Security Numbers (SSNs), card numbers — is auto-redacted before processing
              </span>
            </div>

            {/* SQL Textarea */}
            <div className="relative">
              <textarea
                value={sql}
                onChange={e => setSql(e.target.value)}
                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleOptimize(); }}
                placeholder={`Paste ${dialect} query here, or drag & drop a .sql file…\n\nExample:\nSELECT * FROM orders o, customers c\nWHERE o.customer_id = c.id\nAND YEAR(o.created_at) = 2024`}
                className="w-full bg-transparent text-[12.5px] font-mono text-slate-300 placeholder-slate-600 resize-none p-4 outline-none leading-7"
                style={{ minHeight: 200 }}
                rows={10}
                spellCheck={false}
              />
              {sql && (
                <button onClick={() => { setSql(""); setResult(null); setError(""); setActiveCategory(null); }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <X className="w-3.5 h-3.5"/>
                </button>
              )}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-violet-500/5 border-t border-violet-500/10">
              <div className="text-[10px] text-slate-600 font-mono">
                Characters: {sql.length} · Lines: {sql.split("\n").length} · Dialect: {dialect}
              </div>
              <div className="flex items-center gap-2">
                {liveIssues.length > 0 && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3"/> {liveIssues.length} {liveIssues.length === 1 ? "issue" : "issues"} detected
                  </span>
                )}
                <label className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">
                  <FileUp className="w-3.5 h-3.5"/> Upload File
                  <input ref={fileRef} type="file" accept=".sql,.txt" onChange={handleFile} className="hidden"/>
                </label>
              </div>
            </div>
          </div>

          {/* Shape warning — displayed immediately when input doesn't look like SQL */}
          {showShapeWarning && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/8">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0"/>
              <div className="flex-1">
                <div className="text-xs font-semibold text-amber-300">That doesn&apos;t look like a SQL query</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  The optimizer expects a SQL statement (SELECT, INSERT, UPDATE, DELETE, WITH, CREATE, ALTER, or MERGE). Double-check what you pasted, or pick a sample below.
                </p>
              </div>
              <button onClick={() => setSql("")} className="text-slate-500 hover:text-amber-300 transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5"/>
              </button>
            </motion.div>
          )}

          {/* Optimize button */}
          <button onClick={handleOptimize} disabled={loading || !sql.trim() || showShapeWarning}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin"/> Analyzing…</> : <><Zap className="w-4 h-4"/> Optimize</>}
          </button>

          {/* Live Scanner */}
          {liveIssues.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                <Zap className="w-3 h-3"/> Live Scanner — Instant Analysis
              </div>
              {liveIssues.map((issue, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                  issue.severity === "critical" ? "border-red-500/25 bg-red-500/5" :
                  issue.severity === "warning"  ? "border-amber-500/25 bg-amber-500/5" :
                  "border-blue-500/25 bg-blue-500/5"
                }`}>
                  <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    issue.severity === "critical" ? "text-red-400" :
                    issue.severity === "warning"  ? "text-amber-400" : "text-blue-400"
                  }`}/>
                  <div>
                    <div className={`text-xs font-semibold ${
                      issue.severity === "critical" ? "text-red-300" :
                      issue.severity === "warning"  ? "text-amber-300" : "text-blue-300"
                    }`}>{issue.type}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{issue.description}</div>
                    <div className="text-[10px] text-slate-500 mt-1">→ {issue.suggestion}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Results or Ready state */}
        <div>
          {error && (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/8 p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-amber-400"/>
              </div>
              <div>
                {/* FIX #7: No AI name exposed — generic error messages */}
                <h3 className="font-bold text-amber-300 mb-1">Optimization Unavailable</h3>
                <p className="text-[12px] text-slate-400">{error}</p>
              </div>
              <button onClick={handleOptimize} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors">
                <RefreshCw className="w-4 h-4"/> Try Again
              </button>
              {/* FIX #8 & #11: Sample categories */}
              <div className="w-full">
                <p className="text-[10px] text-slate-500 mb-2">Or try a sample query:</p>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.slice(0,6).map(cat => (
                    <button key={cat} onClick={() => loadSample(cat)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] border transition-all ${
                        activeCategory === cat ? "border-violet-500/50 bg-violet-500/15 text-violet-300" : "border-violet-500/15 text-slate-500 hover:border-violet-500/30 hover:text-slate-300"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {CATEGORIES.slice(6).map(cat => (
                    <button key={cat} onClick={() => loadSample(cat)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] border transition-all ${
                        activeCategory === cat ? "border-violet-500/50 bg-violet-500/15 text-violet-300" : "border-violet-500/15 text-slate-500 hover:border-violet-500/30 hover:text-slate-300"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!result && !error && (
            <div className="rounded-2xl border border-violet-500/15 bg-[#06061a] p-6 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-violet-400"/>
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Ready to Optimize</h3>
                <p className="text-[12px] text-slate-400">
                  Paste SQL and click <strong>Optimize with AI</strong>, or use{" "}
                  <kbd className="px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-violet-300 text-[10px] font-mono">
                    Ctrl+Enter
                  </kbd>
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full">
                {[
                  { icon: <Zap className="w-4 h-4"/>, label: "Instant anti-pattern scan" },
                  { icon: <Sparkles className="w-4 h-4"/>, label: "AI-powered SQL rewrite" },
                  { icon: <TrendingUp className="w-4 h-4"/>, label: "4 export formats (SQL / JSON / CSV / PDF)" },
                ].map((f,i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                    <div className="text-violet-400">{f.icon}</div>
                    <div className="text-[10px] text-slate-400 text-center">{f.label}</div>
                  </div>
                ))}
              </div>
              {/* Sample categories */}
              <div className="w-full">
                <p className="text-[10px] text-slate-500 mb-2">Load a sample query:</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => loadSample(cat)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] border transition-all ${
                        activeCategory === cat ? "border-violet-500/50 bg-violet-500/15 text-violet-300" : "border-violet-500/15 text-slate-500 hover:border-violet-500/30 hover:text-slate-300"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-600">
                Click the <strong className="text-sky-400">{dialect} Reference</strong> button above for dialect-specific tips
              </p>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Score header */}
              <div className="flex items-center justify-between p-4 bg-[#06061a] rounded-2xl border border-violet-500/15">
                <div className="flex items-center gap-4">
                  <ScoreRing score={result.performanceGain} size={56}/>
                  <div>
                    <div className="text-white font-bold">{result.title ?? "Optimized Query"}</div>
                    <div className="text-[11px] text-slate-400">{result.domain} · {result.queryType} · {result.estimatedSpeedup}</div>
                    <div className="text-[10px] text-emerald-400 mt-1">+{result.performanceGain}% performance gain</div>
                  </div>
                </div>
                <ExportMenu
                  href={fmt => `/api/export?format=${fmt}&queryId=latest`}
                  label="Export"
                  formats={["sql","json","csv","pdf"]}
                />
              </div>

              {/* SQL before/after */}
              <div className="grid grid-cols-1 gap-3">
                <SqlBlock sql={sql} label="ORIGINAL QUERY"/>
                <SqlBlock sql={result.optimizedQuery} label="OPTIMIZED QUERY"/>
              </div>

              {/* Explanation */}
              <div className="p-4 bg-[#06061a] rounded-xl border border-violet-500/15">
                <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2">Explanation</div>
                <p className="text-[12px] text-slate-300 leading-relaxed">{result.explanation}</p>
              </div>

              {/* Issues */}
              {result.issues?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Issues Fixed ({result.issues.length})</div>
                  {result.issues.map((issue, i) => (
                    <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                      issue.severity === "critical" ? "border-red-500/25 bg-red-500/5" :
                      issue.severity === "warning"  ? "border-amber-500/25 bg-amber-500/5" :
                      "border-blue-500/25 bg-blue-500/5"
                    }`}>
                      <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        issue.severity === "critical" ? "text-red-400" :
                        issue.severity === "warning"  ? "text-amber-400" : "text-blue-400"
                      }`}/>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{issue.type}
                          <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full ${
                            issue.severity === "critical" ? "bg-red-500/20 text-red-300" :
                            issue.severity === "warning"  ? "bg-amber-500/20 text-amber-300" :
                            "bg-blue-500/20 text-blue-300"
                          }`}>{issue.severity}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{issue.description}</div>
                        <div className="text-[10px] text-emerald-400 mt-1">✓ {issue.suggestion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Index recommendations */}
              {result.indexRecommendations?.length > 0 && (
                <div className="p-4 bg-[#06061a] rounded-xl border border-violet-500/15">
                  <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2">
                    Index Recommendations ({result.indexRecommendations.length})
                  </div>
                  {result.indexRecommendations.map((idx, i) => (
                    <div key={i} className="font-mono text-[11px] text-emerald-300 bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2 mb-2">
                      {idx}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
