"use client";
// app/(dashboard)/nl2sql/page.tsx — FIX #3,#6,#7,#12
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Copy, Check, ChevronRight, RefreshCw, AlertCircle, X, Globe } from "lucide-react";
import { toast } from "sonner";
import { SqlBlock } from "@/components/optimizer/SqlBlock";

const DIALECTS = ["PostgreSQL", "MySQL", "SQLite", "BigQuery", "MS SQL Server"];

// FIX #14: Complete sample prompts for all domains
const EXAMPLE_PROMPTS: Record<string, Array<{ title: string; prompt: string; dialect: string }>> = {
  "E-Commerce": [
    { title: "Top customers by revenue", prompt: "Show the top 10 customers by total spend last month, grouped by country and ordered by revenue descending", dialect: "PostgreSQL" },
    { title: "Product inventory alert", prompt: "Find all products where stock quantity is below the reorder threshold, grouped by category, showing supplier contact info", dialect: "MySQL" },
    { title: "Abandoned cart analysis", prompt: "List customers who added items to cart but did not complete purchase in the last 7 days, with cart value", dialect: "PostgreSQL" },
  ],
  "Healthcare": [
    { title: "Abnormal lab tests", prompt: "Find all patients who had lab tests flagged as abnormal in the last 30 days, grouped by test type with patient contact info", dialect: "PostgreSQL" },
    { title: "Doctor schedule", prompt: "Show all appointments scheduled for next week grouped by doctor, include patient name and appointment type", dialect: "MySQL" },
    { title: "Medication refills", prompt: "List all prescriptions due for refill in the next 14 days where last refill was more than 25 days ago", dialect: "SQLite" },
  ],
  "Finance": [
    { title: "Monthly revenue by category", prompt: "Calculate monthly revenue per product category for Q1 2024, ordered by revenue descending with month-over-month growth percentage", dialect: "PostgreSQL" },
    { title: "Overdue invoices", prompt: "Find all invoices that are more than 30 days past due, grouped by client, with total outstanding amount", dialect: "MySQL" },
    { title: "Budget variance", prompt: "Compare actual spending vs budget for each department in the current fiscal year, showing variance percentage", dialect: "PostgreSQL" },
  ],
  "HR": [
    { title: "No performance review", prompt: "List employees with no performance review in the past 6 months, grouped by department, with manager name", dialect: "PostgreSQL" },
    { title: "Salary bands", prompt: "Show average, min, and max salary for each job title and department, filtered to employees hired in the last 2 years", dialect: "MySQL" },
    { title: "Leave balance", prompt: "Find all employees with more than 15 unused vacation days as of today, sorted by days remaining descending", dialect: "PostgreSQL" },
  ],
  "SaaS": [
    { title: "Daily active users", prompt: "Show daily active users for the past 14 days with 7-day rolling average, grouped by plan tier", dialect: "PostgreSQL" },
    { title: "Churn risk", prompt: "Identify users who have not logged in for 21+ days but whose subscription is still active, with plan and billing cycle", dialect: "MySQL" },
    { title: "Feature adoption", prompt: "Calculate the percentage of users who used each key feature at least once in the last 30 days", dialect: "PostgreSQL" },
  ],
  "Logistics": [
    { title: "Delayed shipments", prompt: "Find all shipments delayed more than 3 days with carrier name, route info, and customer contact, ordered by delay duration", dialect: "PostgreSQL" },
    { title: "Warehouse capacity", prompt: "Show current stock levels vs capacity for each warehouse, flagging those above 85% utilization", dialect: "MySQL" },
    { title: "Driver performance", prompt: "Calculate on-time delivery rate for each driver for the past month, with average delay in minutes", dialect: "PostgreSQL" },
  ],
  "Education": [
    { title: "At-risk students", prompt: "Find students with average grade below 60% in any subject this semester, with advisor email", dialect: "PostgreSQL" },
    { title: "Course enrollment", prompt: "Show enrollment counts per course for current term, with instructor name and room capacity vs enrolled ratio", dialect: "MySQL" },
    { title: "Assignment completion", prompt: "List students who have not submitted more than 3 assignments across all courses this month", dialect: "SQLite" },
  ],
  "Gaming": [
    { title: "Leaderboard", prompt: "Show top 100 players by score in the current season, with rank change compared to last week", dialect: "PostgreSQL" },
    { title: "In-app purchases", prompt: "Calculate total in-app purchase revenue per player segment (free, premium, VIP) for the last 30 days", dialect: "MySQL" },
    { title: "Achievement analysis", prompt: "Find the 10 rarest achievements with unlock rate percentage and average time to unlock from account creation", dialect: "PostgreSQL" },
  ],
};

interface NL2SQLResult {
  sql: string; explanation: string; assumptions: string[];
  tablesNeeded: string[]; dialect: string; complexity: string;
  alternativeApproach?: string;
}

export default function NL2SQLPage() {
  const [prompt, setPrompt]     = useState("");
  const [dialect, setDialect]   = useState("PostgreSQL");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<NL2SQLResult | null>(null);
  const [error, setError]       = useState("");
  const [schemaCtx, setSchemaCtx] = useState<string | null>(null);

  // Load schema context from sessionStorage
  useEffect(() => {
    const ctx = sessionStorage.getItem("schemaContext");
    if (ctx) setSchemaCtx(ctx);
    const pre = sessionStorage.getItem("prefillPrompt");
    if (pre) { setPrompt(pre); sessionStorage.removeItem("prefillPrompt"); }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!prompt.trim()) { toast.error("Describe the data you need."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/nl2sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, dialect, schemaContext: schemaCtx ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Conversion failed — please try again."); return; }
      setResult(data);
      toast.success("SQL generated!");
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally { setLoading(false); }
  }, [prompt, dialect, schemaCtx]);

  const loadPrompt = (p: string, d: string) => {
    setPrompt(p); setDialect(d); setResult(null); setError("");
  };

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-sky-400"/> Natural Language to SQL
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">NEW</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Describe what data you need in plain English — get production-ready SQL for any dialect
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Main: Input */}
        <div className="xl:col-span-3 space-y-4">
          {/* Schema context banner */}
          {schemaCtx ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400"/>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-emerald-300">Schema context loaded from Schema Vault</div>
                <div className="text-[10px] text-slate-500">Your exact table/column names will be used — no hallucinations</div>
              </div>
              <button onClick={() => { setSchemaCtx(null); sessionStorage.removeItem("schemaContext"); }}
                className="text-[10px] text-slate-500 hover:text-white transition-colors">Remove</button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0"/>
              <div className="text-[11px] text-slate-400">
                No schema loaded. <a href="/schema" className="text-violet-400 hover:underline">Open Schema Vault</a> to inject your table structure for accurate generation.
              </div>
            </div>
          )}

          {/* Dialect selector */}
          <div className="bg-[#08081a] rounded-2xl border border-violet-500/20 p-4">
            <div className="flex items-center gap-1 mb-3 flex-wrap gap-y-2">
              <Globe className="w-3.5 h-3.5 text-slate-500 mr-1"/>
              <span className="text-[10px] text-slate-500 mr-2">Target SQL Dialect:</span>
              {DIALECTS.map(d => (
                <button key={d} onClick={() => setDialect(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    dialect === d ? "bg-violet-500/20 text-violet-300 border border-violet-500/40" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}>{d}</button>
              ))}
            </div>

            {/* Prompt textarea */}
            <div className="mb-1">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Describe what you need</div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleConvert(); }}
                placeholder="Example: Show the top 10 customers by total spend last month, grouped by country"
                className="w-full bg-[#040414] border border-violet-500/15 rounded-xl text-[12.5px] text-slate-300 placeholder-slate-600 resize-none p-4 outline-none leading-7 focus:border-violet-500/35 transition-colors"
                rows={6}
              />
              <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                <span>{prompt.length} chars · {dialect}</span>
                <kbd className="px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-violet-400 font-mono">Ctrl+Enter</kbd>
              </div>
            </div>
          </div>

          {/* Convert button */}
          <button onClick={handleConvert} disabled={loading || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-violet-700 hover:from-sky-500 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-sky-500/20">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin"/> Converting…</> : <><Sparkles className="w-4 h-4"/> Convert to SQL</>}
          </button>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/25">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0"/>
              <div className="flex-1">
                {/* FIX #7: No AI name exposed */}
                <div className="text-sm font-semibold text-amber-300">Conversion Unavailable</div>
                <div className="text-[11px] text-slate-400 mt-1">{error}</div>
              </div>
              <button onClick={handleConvert} className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] rounded-lg transition-colors">
                <RefreshCw className="w-3 h-3"/> Retry
              </button>
            </div>
          )}

          {/* Result */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <SqlBlock sql={result.sql} label={`GENERATED ${dialect.toUpperCase()} QUERY`}/>
              <div className="p-4 bg-[#06061a] rounded-xl border border-violet-500/15">
                <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2">Explanation</div>
                <p className="text-[12px] text-slate-300">{result.explanation}</p>
                {result.complexity && (
                  <div className="mt-2 text-[10px] text-slate-500">Complexity: <span className="text-slate-300">{result.complexity}</span></div>
                )}
              </div>
              {result.assumptions?.length > 0 && (
                <div className="p-4 bg-[#06061a] rounded-xl border border-amber-500/15">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">Assumptions Made</div>
                  {result.assumptions.map((a,i) => (
                    <div key={i} className="text-[11px] text-slate-400 flex gap-2 mb-1"><span className="text-amber-500">→</span>{a}</div>
                  ))}
                </div>
              )}
              {result.tablesNeeded?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-500">Tables needed:</span>
                  {result.tablesNeeded.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-[10px] font-mono text-violet-300">{t}</span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right: Example prompts — FIX #14: Complete prompts */}
        <div className="xl:col-span-2">
          <div className="bg-[#06061a] rounded-2xl border border-violet-500/15 overflow-hidden sticky top-6">
            <div className="px-4 py-3 border-b border-violet-500/10">
              <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3"/> Example Prompts
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "80vh" }}>
              {Object.entries(EXAMPLE_PROMPTS).map(([domain, examples]) => (
                <div key={domain} className="border-b border-violet-500/8 last:border-0">
                  <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-violet-500/3">{domain}</div>
                  {examples.map((ex, i) => (
                    <button key={i} onClick={() => loadPrompt(ex.prompt, ex.dialect)}
                      className="w-full text-left px-4 py-3 hover:bg-violet-500/8 transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-medium text-slate-300 group-hover:text-white">{ex.title}</div>
                        <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-violet-400 flex-shrink-0"/>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{ex.prompt}</div>
                      <div className="text-[9px] text-violet-400 mt-1">{ex.dialect}</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
