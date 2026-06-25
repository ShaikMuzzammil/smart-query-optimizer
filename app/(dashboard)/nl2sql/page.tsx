"use client";
// app/(dashboard)/nl2sql/page.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Brain, Globe, Sparkles, Copy, ChevronRight, ArrowRight,
  RefreshCw, Send, AlertCircle, CheckCircle2, Database, Info,
  Terminal, Code2,
} from "lucide-react";
import { useRouter } from "next/navigation";

const DIALECTS = ["PostgreSQL","MySQL","SQLite","BigQuery","MS SQL Server"] as const;

const EXAMPLES = [
  { domain:"E-Commerce",  prompt:"Show the top 10 customers by total spend last month, grouped by country" },
  { domain:"Healthcare",  prompt:"Find all patients who had lab tests flagged as abnormal in the last 30 days" },
  { domain:"Finance",     prompt:"Calculate monthly revenue per product category for Q1 2024, ordered by revenue" },
  { domain:"HR",          prompt:"List employees with no performance review in the past 6 months, by department" },
  { domain:"SaaS",        prompt:"Show daily active users for the past 14 days with 7-day rolling average" },
  { domain:"Logistics",   prompt:"Find all shipments delayed more than 3 days with carrier and route info" },
  { domain:"Education",   prompt:"List students whose GPA dropped more than 0.5 points between last two semesters" },
  { domain:"Gaming",      prompt:"Top 20 players by total score in tournaments held this year" },
];

const SEVERITY_COLORS: Record<string,string> = {
  critical:"bg-rose-500/15 text-rose-300 border-rose-500/25",
  high:    "bg-orange-500/15 text-orange-300 border-orange-500/25",
  medium:  "bg-amber-500/15 text-amber-300 border-amber-500/25",
  low:     "bg-blue-500/15 text-blue-300 border-blue-500/25",
};

interface NL2SQLResult {
  sql: string;
  explanation: string;
  assumptions: string[];
  tablesNeeded: string[];
  dialect: string;
}

export default function NL2SQLPage() {
  const router = useRouter();
  const [prompt, setPrompt]   = useState("");
  const [dialect, setDialect] = useState<string>("PostgreSQL");
  const [result, setResult]   = useState<NL2SQLResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [schemaCtx, setSchemaCtx] = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  // Load schema context from Schema Vault if available
  useEffect(() => {
    const ctx = sessionStorage.getItem("sqo_schema_context");
    if (ctx) setSchemaCtx(ctx);
  }, []);

  const convert = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/nl2sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, dialect, schemaContext: schemaCtx ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Conversion failed — please try again.");
        toast.error("Conversion failed");
      } else {
        setResult(data);
        toast.success("SQL generated successfully");
      }
    } catch {
      setError("Network error — please try again.");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copySQL = () => {
    if (!result?.sql) return;
    navigator.clipboard.writeText(result.sql);
    setCopied(true);
    toast.success("SQL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendToOptimizer = () => {
    if (!result?.sql) return;
    sessionStorage.setItem("sqo_nl2sql_result", result.sql);
    sessionStorage.setItem("sqo_nl2sql_dialect", dialect);
    toast.success("Loaded in Optimizer");
    router.push("/optimizer");
  };

  const sendToPlayground = () => {
    if (!result?.sql) return;
    sessionStorage.setItem("sqo_playground_sql", result.sql);
    toast.success("Loaded in Playground");
    router.push("/playground");
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-black">Natural Language to SQL</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">NEW</span>
        </div>
        <p className="text-slate-400 text-sm">
          Describe what data you need in plain English — get production-ready SQL for any dialect
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-5">
        {/* Left: input + result */}
        <div className="space-y-4">

          {/* Schema context banner */}
          {schemaCtx && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}}
              className="flex items-center gap-3 px-4 py-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
              <Database className="w-4 h-4 text-emerald-400 flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-emerald-300">Schema context loaded from Schema Vault</div>
                <div className="text-[10px] text-slate-500">Your exact table/column names will be used — no hallucinations</div>
              </div>
              <button onClick={()=>setSchemaCtx(null)} className="text-[10px] text-slate-500 hover:text-slate-300 flex-shrink-0">Remove</button>
            </motion.div>
          )}

          {/* Input card */}
          <div className="glass-card rounded-2xl p-5">
            {/* Dialect picker */}
            <div className="mb-4">
              <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3"/>TARGET SQL DIALECT
              </div>
              <div className="flex flex-wrap gap-2">
                {DIALECTS.map(d => (
                  <button key={d} onClick={() => setDialect(d)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      dialect === d
                        ? "bg-violet-500/20 border-violet-500/50 text-violet-200"
                        : "border-violet-500/15 text-slate-400 hover:text-slate-200 hover:border-violet-500/25"
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input */}
            <div className="mb-4">
              <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                <Brain className="w-3 h-3"/>DESCRIBE WHAT YOU NEED
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") convert(); }}
                placeholder={`Describe your query in plain English...\n\nExamples:\n• "Show top 10 customers by revenue last month"\n• "Find products with low stock below reorder point"\n• "Calculate weekly active users for the last 4 weeks"\n\nTip: ⌘+Enter to convert`}
                className="w-full min-h-[160px] bg-[#020208] border border-violet-500/20 focus:border-violet-500/50 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 outline-none resize-y transition-colors leading-relaxed"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-600">{prompt.length} chars · {dialect}</span>
                <kbd className="text-[9px] px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded font-mono text-violet-400">⌘↵</kbd>
              </div>
            </div>

            <button onClick={convert} disabled={!prompt.trim() || loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20">
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin"/>Converting…</>
                : <><Sparkles className="w-4 h-4"/>Convert to SQL</>
              }
            </button>
          </div>

          {/* Error state */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"/>
                <div>
                  <div className="text-sm font-semibold text-amber-200">Conversion Unavailable</div>
                  <p className="text-xs text-slate-400 mt-0.5">The conversion service is temporarily unavailable. Please try again in a moment.</p>
                </div>
                <button onClick={convert} disabled={loading}
                  className="ml-auto flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-violet-400 border border-violet-500/25 rounded-lg hover:bg-violet-500/8 transition-colors">
                  <RefreshCw className="w-3 h-3"/>Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                className="glass-card rounded-2xl overflow-hidden">
                {/* Result header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-violet-500/10 bg-emerald-500/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
                  <span className="text-sm font-bold text-emerald-200">SQL Generated</span>
                  <span className="text-[10px] text-slate-500 ml-1">{result.dialect}</span>
                  <div className="ml-auto flex gap-2">
                    <button onClick={copySQL}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        copied ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-violet-500/25 text-slate-300 hover:bg-violet-500/8"
                      }`}>
                      {copied ? <><CheckCircle2 className="w-3 h-3"/>Copied</> : <><Copy className="w-3 h-3"/>Copy SQL</>}
                    </button>
                    <button onClick={sendToOptimizer}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600/80 hover:bg-violet-600 text-white rounded-lg transition-colors">
                      <Send className="w-3 h-3"/>Optimize
                    </button>
                    <button onClick={sendToPlayground}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-amber-500/25 text-amber-300 hover:bg-amber-500/8 rounded-lg transition-colors">
                      <Terminal className="w-3 h-3"/>Playground
                    </button>
                  </div>
                </div>

                {/* SQL */}
                <div className="p-5">
                  <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                    <Code2 className="w-3 h-3"/>GENERATED SQL
                  </div>
                  <pre className="text-xs font-mono text-emerald-300/90 leading-6 whitespace-pre-wrap bg-[#020208] border border-emerald-500/10 rounded-xl p-4 overflow-auto max-h-60">
                    {result.sql}
                  </pre>
                </div>

                {/* Explanation */}
                {result.explanation && (
                  <div className="px-5 pb-4">
                    <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2">WHAT IT DOES</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{result.explanation}</p>
                  </div>
                )}

                {/* Assumptions + tables */}
                <div className="grid sm:grid-cols-2 gap-4 px-5 pb-5">
                  {result.assumptions?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                        <Info className="w-3 h-3"/>ASSUMPTIONS
                      </div>
                      <ul className="space-y-1">
                        {result.assumptions.map((a, i) => (
                          <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                            <span className="text-slate-600 mt-0.5">·</span>{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.tablesNeeded?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                        <Database className="w-3 h-3"/>TABLES NEEDED
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.tablesNeeded.map(t => (
                          <span key={t} className="text-[11px] font-mono px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-violet-300">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: examples + tips */}
        <div className="space-y-4">
          {/* Tips */}
          {!schemaCtx && (
            <div className="glass-card rounded-2xl p-5 border border-violet-500/15">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-violet-400"/>
                <h3 className="text-xs font-bold">Better results with Schema Vault</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Upload your DDL to Schema Vault and your exact table/column names will be injected — eliminating hallucinated column names.
              </p>
              <a href="/schema" className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                Open Schema Vault <ArrowRight className="w-3.5 h-3.5"/>
              </a>
            </div>
          )}

          {/* Example prompts */}
          <div className="glass-card rounded-2xl p-5">
            <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3"/>EXAMPLE PROMPTS
            </div>
            <div className="space-y-2">
              {EXAMPLES.map((ex, i) => (
                <motion.button key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                  onClick={() => { setPrompt(ex.prompt); setResult(null); setError(null); }}
                  className="w-full text-left p-3 rounded-xl border border-violet-500/10 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                  <div className="text-[9px] font-bold text-violet-500 tracking-wider mb-0.5">{ex.domain}</div>
                  <div className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">{ex.prompt}</div>
                  <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-violet-400 mt-1 transition-colors"/>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Workflow */}
          <div className="glass-card rounded-2xl p-5">
            <div className="text-[10px] font-bold text-slate-500 tracking-wider mb-3">RECOMMENDED WORKFLOW</div>
            <div className="space-y-3">
              {[
                { n:"1", label:"Schema Vault", desc:"Upload DDL for context" },
                { n:"2", label:"NL to SQL",    desc:"Describe your query" },
                { n:"3", label:"Optimizer",    desc:"Optimize the SQL" },
                { n:"4", label:"Playground",   desc:"Test the result" },
              ].map(s => (
                <div key={s.n} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-black text-violet-400 flex-shrink-0">{s.n}</div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-300">{s.label}</div>
                    <div className="text-[10px] text-slate-600">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
