"use client";
// app/(dashboard)/optimizer/page.tsx
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SqlBlock } from "@/components/optimizer/SqlBlock";
import { ScoreRing } from "@/components/optimizer/ScoreRing";
import { SEVERITY_CONFIG } from "@/lib/utils";
import { toast } from "sonner";
import {
  Zap, Loader2, AlertTriangle, CheckCircle2, Database, Download,
  Copy, Sparkles, ChevronDown,
} from "lucide-react";

// ── Live anti-pattern scanner (instant, no API)
const SCAN_PATTERNS = [
  { id:"n1", sev:"critical", title:"Correlated Subquery (N+1)", rx:/SELECT\b[\s\S]{0,120}SELECT\b/i, tip:"A SELECT inside another SELECT runs once per outer row. Use JOIN + GROUP BY instead." },
  { id:"n2", sev:"critical", title:"Leading Wildcard LIKE",     rx:/LIKE\s+['"]%[^%'"]/i,            tip:"LIKE '%text%' disables all indexes — full table scan. Use full-text search instead." },
  { id:"n3", sev:"high",     title:"Function on Indexed Column",rx:/\b(YEAR|MONTH|DAY|DATE|LOWER|UPPER|TRIM)\s*\(/i, tip:"Wrapping a column in a function prevents index usage." },
  { id:"n4", sev:"high",     title:"Implicit JOIN (Comma)",     rx:/FROM\s+\w+\s*,\s*\w+/i,          tip:"Comma joins prevent the optimizer from reordering joins." },
  { id:"n5", sev:"medium",   title:"Missing LIMIT Clause",      rx:/SELECT\b(?![\s\S]*\bLIMIT\b)/i, tip:"Without LIMIT, queries can return unbounded result sets." },
  { id:"n6", sev:"medium",   title:"SELECT * (All Columns)",    rx:/SELECT\s+\*/i,                   tip:"SELECT * transfers unnecessary data. Specify needed columns." },
  { id:"n7", sev:"low",      title:"NOT IN with Subquery",      rx:/NOT\s+IN\s*\(\s*SELECT/i,         tip:"NOT IN with NULLs can return unexpected empty results. Use NOT EXISTS." },
];

function useLiveScanner(sql: string) {
  return useMemo(() => sql.trim().length < 10 ? [] : SCAN_PATTERNS.filter(p => p.rx.test(sql)), [sql]);
}

interface OptimizeResult {
  id?: string;
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
}

export default function OptimizerPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"split"|"before"|"after">("split");
  const scanHits = useLiveScanner(query);

  const optimize = useCallback(async () => {
    if (!query.trim()) { toast.warning("Paste a SQL query first"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Optimization failed"); return; }
      setResult({ ...data, originalQuery: query });
      toast.success(`⚡ +${data.performanceGain}% estimated performance gain`);
    } catch {
      toast.error("Network error — please try again");
    } finally { setLoading(false); }
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); optimize(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [optimize]);

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  const exportSql = async () => {
    if (!result?.id) { copy(result?.optimizedQuery ?? ""); return; }
    window.open(`/api/export?id=${result.id}&format=sql`, "_blank");
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1">SQL Optimizer</h1>
        <p className="text-slate-400 text-sm">Paste a query, get an AI-optimized version with full analysis</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* LEFT: input */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">SQL Input</h2>
              <div className="flex items-center gap-2 text-xs">
                <kbd className="px-1.5 py-0.5 bg-violet-500/15 border border-violet-500/25 rounded text-[10px] text-violet-300 font-mono">⌘ Enter</kbd>
                <button onClick={() => { setQuery(""); setResult(null); }} className="text-slate-500 hover:text-slate-300">Clear</button>
              </div>
            </div>

            <textarea value={query} onChange={e => setQuery(e.target.value)}
              placeholder={"Paste your SQL query here…\n\n-- Example:\nSELECT * FROM orders o, customers c\nWHERE o.customer_id = c.id\nAND YEAR(o.created_at) = 2024"}
              className="w-full min-h-[220px] bg-[#020208] border border-violet-500/20 rounded-lg p-3.5 text-xs font-mono leading-7 text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition-colors resize-y"/>

            <div className="flex gap-4 mt-3 px-3 py-2 bg-violet-500/8 rounded-lg text-[11px] text-slate-400 flex-wrap">
              <span>Chars: <b className="text-violet-300">{query.length}</b></span>
              <span>Lines: <b className="text-violet-300">{query.split("\n").length}</b></span>
              {scanHits.length > 0 && <span className="ml-auto text-amber-400 font-semibold animate-pulse2">⚠ {scanHits.length} issue{scanHits.length!==1?"s":""} detected</span>}
            </div>

            <button onClick={optimize} disabled={loading || !query.trim()}
              className="w-full mt-3 py-3 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 glow-violet">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Analyzing with Claude AI…</> : <><Zap className="w-4 h-4"/>Optimize with AI</>}
            </button>
          </div>

          {/* Live scanner results */}
          <AnimatePresence>
            {scanHits.length > 0 && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                className="glass-card rounded-2xl p-5 border-amber-500/25 overflow-hidden">
                <div className="text-[10px] font-semibold text-amber-400 tracking-wider mb-3">⚡ LIVE SCANNER — INSTANT ANALYSIS</div>
                <div className="space-y-2">
                  {scanHits.map(h => {
                    const s = SEVERITY_CONFIG[h.sev as keyof typeof SEVERITY_CONFIG];
                    return (
                      <div key={h.id} className={`flex gap-2.5 p-2.5 rounded-lg ${s.bg} border-l-2 ${s.border}`}>
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
        </div>

        {/* RIGHT: results */}
        <div>
          {!result ? (
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[480px] gap-4">
              <div className="w-16 h-16 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-violet-400"/>
              </div>
              <div>
                <div className="text-lg font-bold mb-2">Ready to Optimize</div>
                <p className="text-sm text-slate-400 max-w-xs">Paste a SQL query and click <b className="text-violet-300">Optimize with AI</b> to see the magic happen.</p>
              </div>
            </div>
          ) : (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-4">
              {/* Score + summary */}
              <div className="glass-card rounded-2xl p-5 flex gap-5 items-center">
                <ScoreRing score={result.performanceGain}/>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-2">Optimization Summary</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[["Speedup", result.estimatedSpeedup],["Type", result.queryType],["Before", result.complexityBefore],["After", result.complexityAfter]].map(([k,v]) => (
                      <div key={k} className="bg-violet-500/10 rounded px-2 py-1">
                        <div className="text-[9px] text-slate-500">{k}</div>
                        <div className="text-[11px] font-mono text-violet-300 font-semibold">{v}</div>
                      </div>
                    ))}
                  </div>
                  {result.tablesDetected?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {result.tablesDetected.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded border border-sky-500/15">{t}</span>)}
                    </div>
                  )}
                </div>
              </div>

              {/* Issues */}
              {result.issues?.length > 0 && (
                <div className="glass-card rounded-2xl p-4">
                  <div className="text-[10px] font-semibold text-rose-400 tracking-wider mb-2.5">⚠ ISSUES DETECTED ({result.issues.length})</div>
                  <div className="space-y-1.5">
                    {result.issues.map((iss, i) => {
                      const s = SEVERITY_CONFIG[iss.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.low;
                      return (
                        <div key={i} className={`flex gap-2 p-2 rounded-lg ${s.bg} border-l-2 ${s.border}`}>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${s.dot} text-black flex-shrink-0 mt-0.5`}>{s.label}</span>
                          <span className="text-[11px] text-slate-200 leading-relaxed">{iss.description}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View toggle */}
              <div className="flex gap-1.5">
                {(["split","before","after"] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className={`flex-1 py-1.5 rounded-lg text-xs transition-all border ${view===v ? "bg-violet-500/15 border-violet-500/40 text-violet-300" : "border-violet-500/15 text-slate-500"}`}>
                    {v === "split" ? "Split View" : v === "before" ? "Original" : "Optimized"}
                  </button>
                ))}
              </div>

              {(view==="split"||view==="before") && <SqlBlock sql={result.originalQuery ?? query} label="▶ ORIGINAL QUERY"/>}
              {(view==="split"||view==="after")  && <SqlBlock sql={result.optimizedQuery} label="✓ OPTIMIZED QUERY"/>}

              {/* Improvements */}
              {result.improvements?.length > 0 && (
                <div className="glass-card rounded-2xl p-4">
                  <div className="text-[10px] font-semibold text-emerald-400 tracking-wider mb-2">✓ IMPROVEMENTS APPLIED</div>
                  {result.improvements.map((imp, i) => (
                    <div key={i} className="flex gap-2 text-[12px] text-slate-200 py-1.5 border-b border-violet-500/10 last:border-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"/>{imp}
                    </div>
                  ))}
                </div>
              )}

              {/* Index recs */}
              {result.indexRecommendations?.length > 0 && (
                <div className="glass-card rounded-2xl p-4">
                  <div className="text-[10px] font-semibold text-sky-400 tracking-wider mb-2">⬡ INDEX RECOMMENDATIONS</div>
                  {result.indexRecommendations.map((idx, i) => (
                    <div key={i} onClick={() => copy(idx)} className="flex items-center justify-between font-mono text-[10.5px] text-sky-300 bg-sky-500/8 rounded-lg px-3 py-2 mb-1.5 cursor-pointer hover:bg-sky-500/14 transition-colors">
                      <span>{idx}</span><Copy className="w-3 h-3 flex-shrink-0"/>
                    </div>
                  ))}
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <div className="glass-card rounded-2xl p-4 border-violet-500/30">
                  <div className="text-[10px] font-semibold text-violet-300 tracking-wider mb-2">💡 AI EXPLANATION</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{result.explanation}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={exportSql} className="flex-1 py-2.5 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  <Download className="w-3.5 h-3.5"/>Export SQL
                </button>
                <button onClick={() => copy(result.optimizedQuery)} className="flex-1 py-2.5 bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5">
                  <Copy className="w-3.5 h-3.5"/>Copy Optimized
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
