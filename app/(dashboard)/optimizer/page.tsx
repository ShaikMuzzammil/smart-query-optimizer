"use client";
// app/(dashboard)/optimizer/page.tsx
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SqlBlock } from "@/components/optimizer/SqlBlock";
import { ScoreRing } from "@/components/optimizer/ScoreRing";
import { ExportMenu } from "@/components/optimizer/ExportMenu";
import { SEVERITY_CONFIG } from "@/lib/utils";
import { SQL_EXAMPLES } from "@/lib/examples-data";
import { toast } from "sonner";
import {
  Zap, Loader2, AlertTriangle, CheckCircle2, Copy, Sparkles, BookOpen,
  HelpCircle, Upload, FileUp, Gauge, Database, Cpu, ChevronRight,
  SplitSquareHorizontal, AlignLeft, AlignRight, Globe, Shield, Brain,
} from "lucide-react";

const DIALECTS = ["PostgreSQL","MySQL","SQLite","BigQuery","MS SQL Server"] as const;
type Dialect = typeof DIALECTS[number];

// ── Live scanner ─────────────────────────────────────────────────────────────
const SCAN_PATTERNS = [
  { id:"n1", sev:"critical", title:"Correlated Subquery (N+1)",   rx:/SELECT\b[\s\S]{0,200}SELECT\b/i,          tip:"Runs once per outer row. Use JOIN + GROUP BY instead." },
  { id:"n2", sev:"critical", title:"Leading Wildcard LIKE",        rx:/LIKE\s+['"]%[^%'"]/i,                    tip:"LIKE '%text%' disables index usage — full table scan." },
  { id:"n3", sev:"high",     title:"Function on Indexed Column",   rx:/\b(YEAR|MONTH|DAY|DATE|LOWER|UPPER|TRIM)\s*\(/i, tip:"Wrapping a column in a function prevents index use." },
  { id:"n4", sev:"high",     title:"Implicit JOIN (Comma Syntax)", rx:/FROM\s+\w+\s*,\s*\w+/i,                  tip:"Comma-style joins block the optimizer from choosing the best plan." },
  { id:"n5", sev:"medium",   title:"Missing LIMIT Clause",         rx:/SELECT\b(?![\s\S]*\bLIMIT\b)/i,          tip:"Without LIMIT, queries return unbounded result sets." },
  { id:"n6", sev:"medium",   title:"SELECT * (All Columns)",       rx:/SELECT\s+\*/i,                           tip:"SELECT * can't use covering indexes and wastes bandwidth." },
  { id:"n7", sev:"medium",   title:"NOT IN with Subquery",         rx:/NOT\s+IN\s*\(\s*SELECT/i,                tip:"NOT IN returns nothing if the subquery has any NULL rows. Use NOT EXISTS." },
  { id:"n8", sev:"low",      title:"OR Across Different Columns",  rx:/WHERE\s+.*\bOR\b/i,                      tip:"OR often can't use a single index. Consider UNION ALL." },
];

function useLiveScanner(sql: string) {
  return useMemo(() => sql.trim().length < 8 ? [] : SCAN_PATTERNS.filter(p => p.rx.test(sql)), [sql]);
}

// ── Types ────────────────────────────────────────────────────────────────────
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
  engine?: "claude" | "gemini";
  piiDetected?: boolean;
  piiFields?: string[];
  error?: string;
  fix?: string;
}

type ResultTab = "summary" | "sql" | "issues" | "improvements";

// ── Component ────────────────────────────────────────────────────────────────
function OptimizerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery]     = useState("");
  const [dialect, setDialect] = useState<Dialect>("PostgreSQL");
  const [result, setResult]   = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sqlView, setSqlView] = useState<"split"|"before"|"after">("split");
  const [resultTab, setResultTab] = useState<ResultTab>("summary");
  const [dragOver, setDragOver]   = useState(false);
  const [showDialect, setShowDialect] = useState(false);
  const scanHits = useLiveScanner(query);

  // Handle example loads from URL + NL2SQL sessionStorage
  useEffect(() => {
    const exId = searchParams.get("example");
    const fromNl2sql = searchParams.get("from") === "nl2sql";

    if (fromNl2sql) {
      const saved = sessionStorage.getItem("qf_nl2sql_sql");
      if (saved) { setQuery(saved); setResult(null); sessionStorage.removeItem("qf_nl2sql_sql"); toast.success("SQL loaded from NL to SQL — ready to optimize!"); }
      router.replace("/optimizer");
      return;
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
    if (file.size > 2 * 1024 * 1024) { toast.error("File too large — max 2MB"); return; }
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
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, dialect }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Show actionable error state — includes fix instructions
        setResult({ isValidSql: true, optimizedQuery:"", issues:[], improvements:[], performanceGain:0, explanation:"", indexRecommendations:[], complexityBefore:"N/A", complexityAfter:"N/A", estimatedSpeedup:"N/A", tablesDetected:[], queryType:"UNKNOWN", error: data.error, fix: data.fix });
        toast.error(data.error ?? "Optimization failed");
        return;
      }
      setResult({ ...data, originalQuery: query });
      setResultTab("summary");
      if (data.isValidSql === false) toast.warning("That doesn't look like valid SQL");
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
          <p className="text-slate-400 text-sm">Paste a query → AI rewrites it with full analysis · PII auto-redacted · Multi-dialect</p>
        </div>
        <Link href="/nl2sql"
          className="flex items-center gap-2 px-3 py-2 border border-violet-500/20 hover:border-violet-500/40 text-slate-400 hover:text-violet-300 text-xs rounded-xl transition-colors">
          <Brain className="w-3.5 h-3.5"/> Try NL to SQL instead
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* ── LEFT: Input ── */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">

            {/* Dialect + Controls */}
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowDialect(d => !d)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-300 text-[11px] font-semibold hover:bg-violet-500/15 transition-colors">
                  <Globe className="w-3 h-3"/>{dialect}
                </button>
                <AnimatePresence>
                  {showDialect && (
                    <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0}}
                      className="flex gap-1 flex-wrap">
                      {DIALECTS.filter(d=>d!==dialect).map(d=>(
                        <button key={d} onClick={()=>{setDialect(d);setShowDialect(false);}}
                          className="px-2 py-1 rounded-lg border border-violet-500/15 text-[10px] text-slate-400 hover:text-violet-300 hover:border-violet-500/30 transition-colors">{d}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <kbd className="px-1.5 py-0.5 bg-violet-500/15 border border-violet-500/25 rounded text-[10px] text-violet-300 font-mono">⌘↵</kbd>
                <label className="flex items-center gap-1 hover:text-violet-300 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5"/>Upload
                  <input type="file" accept=".sql,.txt" className="hidden"
                    onChange={e=>{const f=e.target.files?.[0];if(f)loadFile(f);e.target.value="";}}/>
                </label>
                <button onClick={()=>{setQuery("");setResult(null);}} className="hover:text-slate-300 transition-colors">Clear</button>
              </div>
            </div>

            {/* PII notice */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mb-2">
              <Shield className="w-3 h-3 text-emerald-600"/>
              PII (emails, SSNs, card numbers) is auto-redacted before reaching AI
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea value={query} onChange={e=>setQuery(e.target.value)}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={onDrop}
                placeholder={`Paste ${dialect} query here, or drag & drop a .sql file…\n\nExample:\nSELECT * FROM orders o, customers c\nWHERE o.customer_id = c.id\nAND YEAR(o.created_at) = 2024`}
                className={`w-full min-h-[240px] bg-[#020208] border rounded-xl p-4 text-xs font-mono leading-7 text-slate-200 placeholder:text-slate-600 outline-none transition-colors resize-y ${dragOver?"border-violet-400 ring-2 ring-violet-500/30":"border-violet-500/20 focus:border-violet-500/50"}`}/>
              {dragOver && (
                <div className="absolute inset-0 bg-violet-950/80 border-2 border-dashed border-violet-400 rounded-xl flex items-center justify-center gap-2 text-violet-200 text-sm font-semibold pointer-events-none">
                  <FileUp className="w-5 h-5"/> Drop .sql or .txt file
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-500">
              <span>Chars: {query.length} · Lines: {query.split("\n").length} · {dialect}</span>
              {scanHits.length>0 && (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3"/>{scanHits.length} issue{scanHits.length!==1?"s":""} detected
                </span>
              )}
            </div>

            {/* Optimize button */}
            <button onClick={optimize} disabled={loading||!query.trim()}
              className="w-full mt-3 py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 glow-violet">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin"/>Analyzing with AI…</>
                : <><Zap className="w-4 h-4"/>Optimize with AI</>}
            </button>
          </div>

          {/* Live scanner */}
          <AnimatePresence>
            {scanHits.length>0 && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                className="glass-card rounded-2xl p-4 border-amber-500/20 overflow-hidden">
                <div className="text-[10px] font-bold text-amber-400 tracking-wider mb-3 flex items-center gap-1.5">
                  <Zap className="w-3 h-3"/>LIVE SCANNER — INSTANT ANALYSIS
                </div>
                <div className="space-y-2">
                  {scanHits.map(h=>{
                    const s = SEVERITY_CONFIG[h.sev as keyof typeof SEVERITY_CONFIG];
                    return (
                      <div key={h.id} className={`flex gap-2.5 p-2.5 rounded-xl ${s.bg} border-l-2 ${s.border}`}>
                        <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${s.color}`}/>
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
                <BookOpen className="w-3 h-3"/>QUICK-LOAD EXAMPLES
              </div>
              <div className="space-y-1.5">
                {randomExamples.map(ex=>(
                  <button key={ex.id} onClick={()=>{setQuery(ex.sql);toast.message(`Loaded: ${ex.issueTag}`);}}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/10 rounded-xl text-left transition-colors group">
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-200 truncate group-hover:text-white transition-colors">{ex.issueTag}</div>
                      <div className="text-[10px] text-slate-500">{ex.domain} · {ex.difficulty}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-violet-400 flex-shrink-0"/>
                  </button>
                ))}
              </div>
              <Link href="/examples" className="mt-3 text-[11px] text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5">
                <BookOpen className="w-3 h-3"/>Browse all {SQL_EXAMPLES.length} examples →
              </Link>
            </div>
          )}
        </div>

        {/* ── RIGHT: Result ── */}
        <div>
          {/* Error state — clean, no API references */}
          {result?.error ? (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
              className="glass-card rounded-2xl p-10 border-amber-500/20 min-h-[400px] flex flex-col items-center justify-center gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-400"/>
              </div>
              <div>
                <div className="font-bold text-lg text-amber-200 mb-2">Service Temporarily Unavailable</div>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  The optimization service is temporarily unavailable. This usually resolves in a moment.
                </p>
              </div>
              <button onClick={optimize}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600/80 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors">
                <Zap className="w-4 h-4"/> Try Again
              </button>
              <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
                {randomExamples.slice(0,3).map(ex=>(
                  <button key={ex.id} onClick={()=>{setQuery(ex.sql);setResult(null);}}
                    className="text-center p-3 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/10 rounded-xl transition-colors">
                    <div className="text-[10px] text-slate-400 truncate">{ex.domain}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : !result ? (
            /* Empty state */
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[520px] gap-4">
              <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Sparkles className="w-9 h-9 text-violet-400/50"/>
              </div>
              <div>
                <div className="text-xl font-bold mb-2">Ready to Optimize</div>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  Paste SQL and click <b className="text-violet-300">Optimize with AI</b>, or load an example from the left.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-2">
                {[["⚡","Instant scan"],["🤖","AI rewrite"],["📥","4 export formats"]].map(([icon,label])=>(
                  <div key={label} className="glass-card rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="text-[10px] text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : result.isValidSql === false ? (
            /* Not-SQL */
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
              className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[520px] gap-4 border-amber-500/20">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                <HelpCircle className="w-7 h-7 text-amber-400"/>
              </div>
              <div>
                <div className="text-lg font-bold mb-2">That doesn&apos;t look like SQL</div>
                <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                  {result.explanation || "Paste a SELECT, INSERT, UPDATE, or DELETE statement and I'll analyze it."}
                </p>
              </div>
              <Link href="/nl2sql"
                className="flex items-center gap-2 px-4 py-2 bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm font-medium rounded-xl hover:bg-violet-500/20 transition-colors">
                <Brain className="w-4 h-4"/>Try NL to SQL instead →
              </Link>
              <div className="space-y-1.5 w-full max-w-sm">
                {randomExamples.slice(0,3).map(ex=>(
                  <button key={ex.id} onClick={()=>{setQuery(ex.sql);setResult(null);}}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/10 rounded-xl text-left transition-colors">
                    <span className="text-[11px] text-slate-300 truncate">{ex.issueTag}<span className="text-slate-500"> · {ex.domain}</span></span>
                    <Zap className="w-3 h-3 text-violet-400 flex-shrink-0"/>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Full result */
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-4">

              {/* PII warning */}
              {result.piiDetected && (
                <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
                  className="glass-card rounded-2xl p-3.5 border-emerald-500/25 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5"/>
                  <div>
                    <div className="text-xs font-semibold text-emerald-300">PII Redacted Before AI Processing</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Detected: {result.piiFields?.join(", ")} — masked in the copy sent to AI. Your original SQL is unchanged.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Score + meta */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-5">
                  <ScoreRing score={result.performanceGain}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold">Optimization Complete</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 capitalize flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5"/>AI Optimized
                        </span>
                        {dialect !== "PostgreSQL" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5"/>{dialect}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {[["Speedup",result.estimatedSpeedup],["Type",result.queryType],["Before",result.complexityBefore],["After",result.complexityAfter]].map(([k,v])=>(
                        <div key={k} className="bg-violet-500/8 rounded-lg px-2.5 py-1.5">
                          <div className="text-[9px] text-slate-500">{k}</div>
                          <div className="text-[11px] font-mono text-violet-300 font-semibold truncate">{v}</div>
                        </div>
                      ))}
                    </div>
                    {result.tablesDetected?.length>0 && (
                      <div className="flex gap-1 flex-wrap">
                        {result.tablesDetected.map(t=>(
                          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded border border-sky-500/15">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {(typeof result.costScore==="number"||(result.estimatedRowsScanned&&result.estimatedRowsScanned!=="N/A")) && (
                  <div className="mt-4 pt-4 border-t border-violet-500/10 grid sm:grid-cols-2 gap-3">
                    {typeof result.costScore==="number" && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1"><Gauge className="w-3 h-3"/>Cost score</span>
                          <span className="text-[11px] font-mono font-bold text-violet-300">{result.costScore}/100</span>
                        </div>
                        <div className="h-1.5 bg-violet-500/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full" style={{width:`${result.costScore}%`}}/>
                        </div>
                      </div>
                    )}
                    {result.estimatedRowsScanned&&result.estimatedRowsScanned!=="N/A"&&(
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-sky-400 flex-shrink-0"/>
                        <div>
                          <div className="text-[9px] text-slate-500">Rows scanned (est.)</div>
                          <div className="text-[11px] font-mono text-sky-300">{result.estimatedRowsScanned}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 glass-card rounded-2xl p-1.5">
                {tabs.map(tab=>(
                  <button key={tab.key} onClick={()=>setResultTab(tab.key)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${resultTab===tab.key?"bg-violet-600 text-white":"text-slate-400 hover:text-white"}`}>
                    {tab.label}
                    {tab.count!=null&&tab.count>0&&(
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${resultTab===tab.key?"bg-white/20":"bg-violet-500/20 text-violet-400"}`}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {resultTab==="summary"&&(
                  <motion.div key="summary" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
                    {result.explanation&&(
                      <div className="glass-card rounded-2xl p-4">
                        <div className="text-[10px] font-bold text-violet-300 tracking-wider mb-2">💡 AI EXPLANATION</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{result.explanation}</p>
                      </div>
                    )}
                    {result.readabilityNotes&&(
                      <div className="glass-card rounded-2xl p-4">
                        <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">📝 READABILITY NOTES</div>
                        <p className="text-xs text-slate-400 leading-relaxed">{result.readabilityNotes}</p>
                      </div>
                    )}
                    {result.indexRecommendations?.length>0&&(
                      <div className="glass-card rounded-2xl p-4">
                        <div className="text-[10px] font-bold text-sky-400 tracking-wider mb-2.5">⬡ INDEX RECOMMENDATIONS <span className="text-slate-600 font-normal">(click to copy)</span></div>
                        <div className="space-y-1.5">
                          {result.indexRecommendations.map((idx,i)=>(
                            <div key={i} onClick={()=>copy(idx)}
                              className="flex items-center justify-between font-mono text-[10.5px] text-sky-300 bg-sky-500/8 rounded-xl px-3 py-2.5 cursor-pointer hover:bg-sky-500/14 transition-colors border border-sky-500/15">
                              <span className="truncate">{idx}</span>
                              <Copy className="w-3 h-3 flex-shrink-0 ml-2"/>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {resultTab==="sql"&&(
                  <motion.div key="sql" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
                    <div className="flex gap-1.5 glass-card rounded-2xl p-1.5">
                      {([["split",<SplitSquareHorizontal key="s" className="w-3.5 h-3.5"/>,"Split"],["before",<AlignLeft key="b" className="w-3.5 h-3.5"/>,"Original"],["after",<AlignRight key="a" className="w-3.5 h-3.5"/>,"Optimized"]] as const).map(([v,icon,label])=>(
                        <button key={String(v)} onClick={()=>setSqlView(v as typeof sqlView)}
                          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${sqlView===v?"bg-violet-600 text-white":"text-slate-400 hover:text-white"}`}>
                          {icon}{label}
                        </button>
                      ))}
                    </div>
                    {(sqlView==="split"||sqlView==="before")&&<SqlBlock sql={result.originalQuery??query} label="▶  ORIGINAL QUERY"/>}
                    {(sqlView==="split"||sqlView==="after")&&<SqlBlock sql={result.optimizedQuery} label="✓  OPTIMIZED QUERY"/>}
                  </motion.div>
                )}
                {resultTab==="issues"&&(
                  <motion.div key="issues" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                    {result.issues?.length>0?(
                      <div className="glass-card rounded-2xl p-4 space-y-2">
                        <div className="text-[10px] font-bold text-rose-400 tracking-wider mb-3">⚠ {result.issues.length} ISSUE{result.issues.length!==1?"S":""} DETECTED</div>
                        {result.issues.map((iss,i)=>{
                          const s=SEVERITY_CONFIG[iss.severity as keyof typeof SEVERITY_CONFIG]??SEVERITY_CONFIG.low;
                          return (
                            <div key={i} className={`flex gap-2.5 p-3 rounded-xl ${s.bg} border-l-2 ${s.border}`}>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${s.dot} text-black self-start mt-0.5 flex-shrink-0`}>{s.label}</span>
                              <p className="text-[11px] text-slate-200 leading-relaxed">{iss.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    ):(
                      <div className="glass-card rounded-2xl p-8 text-center text-slate-500 text-sm">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2"/>No issues detected
                      </div>
                    )}
                  </motion.div>
                )}
                {resultTab==="improvements"&&(
                  <motion.div key="improvements" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                    {result.improvements?.length>0?(
                      <div className="glass-card rounded-2xl p-4">
                        <div className="text-[10px] font-bold text-emerald-400 tracking-wider mb-3">✓ IMPROVEMENTS APPLIED</div>
                        <div className="space-y-2">
                          {result.improvements.map((imp,i)=>(
                            <div key={i} className="flex gap-2.5 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"/>
                              <span className="text-[12px] text-slate-200 leading-relaxed">{imp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ):(
                      <div className="glass-card rounded-2xl p-8 text-center text-slate-500 text-sm">No improvements data</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-2">
                {result.id&&(
                  <div className="flex-1">
                    <ExportMenu label="Export" align="left"
                      className="w-full py-2.5 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      href={fmt=>`/api/export?id=${result.id}&format=${fmt}`}/>
                  </div>
                )}
                <button onClick={()=>copy(result.optimizedQuery)}
                  className="flex-1 py-2.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  <Copy className="w-3.5 h-3.5"/>Copy SQL
                </button>
                <button onClick={()=>{setResult(null);setQuery("");}}
                  className="px-4 py-2.5 border border-violet-500/15 text-slate-500 hover:text-slate-300 text-xs rounded-xl transition-colors">Reset</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OptimizerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/>Loading optimizer…</div>}>
      <OptimizerContent/>
    </Suspense>
  );
}
