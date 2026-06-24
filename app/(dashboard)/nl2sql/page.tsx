"use client";
// app/(dashboard)/nl2sql/page.tsx — Natural Language to SQL converter
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SqlBlock } from "@/components/optimizer/SqlBlock";
import {
  Brain, Loader2, Zap, Copy, ArrowRight, Sparkles, ChevronRight,
  Globe, CheckCircle2, AlertCircle,
} from "lucide-react";

const DIALECTS = ["PostgreSQL","MySQL","SQLite","BigQuery","MS SQL Server"] as const;
type Dialect = typeof DIALECTS[number];

interface NL2SQLResult {
  sql: string;
  explanation: string;
  assumptions: string[];
  tablesNeeded: string[];
  dialect: string;
}

const EXAMPLES = [
  { domain:"E-Commerce",    icon:"🛒", prompt:"Show me the top 10 products by total revenue this year, including product name and category" },
  { domain:"Healthcare",    icon:"🏥", prompt:"Find all patients who had more than 3 appointments in the last 30 days and list their names and appointment count" },
  { domain:"HR & Payroll",  icon:"👥", prompt:"Get the average salary by department, sorted from highest to lowest, for employees hired in the last 2 years" },
  { domain:"SaaS Analytics",icon:"📊", prompt:"Show daily active users for the past 14 days with the count of unique events per day" },
  { domain:"Banking",       icon:"🏦", prompt:"Find all accounts with a balance below 100 that had more than 5 transactions last month" },
  { domain:"Gaming",        icon:"🎮", prompt:"Get the top 20 players on the leaderboard for season 4 with their username, score, and rank" },
];

export default function NL2SQLPage() {
  const router = useRouter();
  const [prompt, setPrompt]   = useState("");
  const [dialect, setDialect] = useState<Dialect>("PostgreSQL");
  const [result, setResult]   = useState<NL2SQLResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const convert = useCallback(async () => {
    if (!prompt.trim() || prompt.trim().length < 5) { toast.warning("Describe what SQL you need first"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/nl2sql", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), dialect }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Conversion failed — please try again"); return; }
      setResult(data);
      toast.success(`✓ Converted to ${dialect} SQL`);
    } catch { setError("Network error — please check your connection"); }
    finally { setLoading(false); }
  }, [prompt, dialect]);

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  const sendToOptimizer = () => {
    if (!result?.sql) return;
    sessionStorage.setItem("qf_nl2sql_sql", result.sql);
    router.push("/optimizer?from=nl2sql");
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400"/>
          </div>
          <h1 className="text-2xl font-black">Natural Language to SQL</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">NEW</span>
        </div>
        <p className="text-slate-400 text-sm">
          Describe what data you need in plain English — get production-ready SQL instantly. Then send it to the Optimizer for further analysis.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Left: Input ── */}
        <div className="space-y-4">
          {/* Dialect selector */}
          <div className="glass-card rounded-2xl p-4">
            <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
              <Globe className="w-3 h-3"/> TARGET SQL DIALECT
            </div>
            <div className="flex flex-wrap gap-2">
              {DIALECTS.map(d => (
                <button key={d} onClick={() => setDialect(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${dialect === d ? "bg-violet-600 text-white border-violet-500" : "border-violet-500/20 text-slate-400 hover:text-white hover:border-violet-500/40"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div className="glass-card rounded-2xl p-5">
            <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
              <Brain className="w-3 h-3"/> DESCRIBE WHAT YOU NEED
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={"Describe your data request in plain English…\n\nExamples:\n• Show me top 10 customers by revenue this month\n• Find all users who haven't logged in for 30 days\n• Get average order value by country for Q4 2024"}
              className="w-full min-h-[180px] bg-[#020208] border border-violet-500/20 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition-colors resize-y leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-600">{prompt.length} chars · {dialect}</span>
              <button onClick={convert} disabled={loading || prompt.trim().length < 5}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 glow-violet">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin"/> Converting…</> : <><Brain className="w-4 h-4"/> Convert to SQL</>}
              </button>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="glass-card rounded-2xl p-4 border-rose-500/25">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5"/>
                  <p className="text-sm text-rose-300">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Example prompts */}
          <div className="glass-card rounded-2xl p-4">
            <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3"/> EXAMPLE PROMPTS
            </div>
            <div className="space-y-2">
              {EXAMPLES.map(ex => (
                <button key={ex.prompt} onClick={() => { setPrompt(ex.prompt); toast.message(`Loaded: ${ex.domain}`); }}
                  className="w-full flex items-start gap-3 px-3 py-2.5 bg-violet-500/5 hover:bg-violet-500/10 border border-violet-500/10 rounded-xl text-left transition-colors group">
                  <span className="text-base flex-shrink-0">{ex.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[10px] text-violet-400 mb-0.5">{ex.domain}</div>
                    <div className="text-[11px] text-slate-300 group-hover:text-white transition-colors leading-relaxed line-clamp-2">{ex.prompt}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-violet-400 flex-shrink-0 mt-1 transition-colors"/>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Result ── */}
        <div>
          {!result && !loading ? (
            <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-center min-h-[520px] gap-4">
              <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Brain className="w-9 h-9 text-violet-400/50"/>
              </div>
              <div>
                <div className="text-lg font-bold mb-2">Ready to Convert</div>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  Describe what data you need in plain English, pick your SQL dialect, and click Convert.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-2">
                {[["📝","Plain English"],["⚡","SQL Generated"],["🚀","Send to Optimizer"]].map(([icon,label])=>(
                  <div key={label} className="glass-card rounded-xl p-3 text-center">
                    <div className="text-xl mb-1">{icon}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center min-h-[520px] gap-4">
              <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Brain className="w-7 h-7 text-violet-400 animate-pulse"/>
              </div>
              <div className="text-center">
                <div className="font-bold mb-2">Generating {dialect} SQL…</div>
                <p className="text-sm text-slate-400">AI is converting your request into production-ready SQL</p>
              </div>
            </div>
          ) : result && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-4">

              {/* SQL result */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5"/> GENERATED {result.dialect.toUpperCase()} SQL
                  </div>
                  <button onClick={() => copy(result.sql)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-violet-300 transition-colors">
                    <Copy className="w-3 h-3"/> Copy
                  </button>
                </div>
                <SqlBlock sql={result.sql} label={`${result.dialect} SQL`} maxH={320}/>
              </div>

              {/* Explanation */}
              {result.explanation && (
                <div className="glass-card rounded-2xl p-4">
                  <div className="text-[10px] font-bold text-violet-400 tracking-wider mb-2">💡 EXPLANATION</div>
                  <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
                </div>
              )}

              {/* Assumptions + Tables */}
              <div className="grid sm:grid-cols-2 gap-4">
                {result.assumptions?.length > 0 && (
                  <div className="glass-card rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-amber-400 tracking-wider mb-2.5">⚠ ASSUMPTIONS MADE</div>
                    <div className="space-y-1.5">
                      {result.assumptions.map((a,i) => (
                        <div key={i} className="flex gap-2 text-xs text-slate-400">
                          <span className="text-amber-500 flex-shrink-0">•</span>{a}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.tablesNeeded?.length > 0 && (
                  <div className="glass-card rounded-2xl p-4">
                    <div className="text-[10px] font-bold text-sky-400 tracking-wider mb-2.5">📋 TABLES NEEDED</div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.tablesNeeded.map(t => (
                        <span key={t} className="text-[11px] px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={sendToOptimizer}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 glow-violet">
                  <Zap className="w-4 h-4"/> Send to Optimizer
                  <ArrowRight className="w-3.5 h-3.5"/>
                </button>
                <button onClick={() => copy(result.sql)}
                  className="px-5 py-3 border border-violet-500/25 hover:border-violet-500/45 text-violet-300 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5">
                  <Copy className="w-4 h-4"/> Copy SQL
                </button>
              </div>

              <p className="text-[10px] text-slate-600 text-center">
                💡 Tip: Send to Optimizer to get index recommendations, complexity analysis, and performance improvement estimates.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
