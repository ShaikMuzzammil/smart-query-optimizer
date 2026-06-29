"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Copy, Check, RefreshCw, Database, ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

const DIALECTS = ["PostgreSQL", "MySQL", "SQLite", "BigQuery", "MS SQL Server"];

const EXAMPLE_PROMPTS: { domain: string; emoji: string; prompts: string[] }[] = [
  { domain: "E-Commerce",  emoji: "🛒", prompts: ["Show the top 10 customers by total spend last month, grouped by country", "Find all products with less than 5 items in stock, sorted by price descending", "Get monthly revenue per product category for the last 6 months"] },
  { domain: "Healthcare",  emoji: "🏥", prompts: ["Find all patients who had lab tests flagged as abnormal in the last 30 days", "List doctors with more than 50 appointments this month, by specialty", "Show patients with no appointment scheduled in the next 14 days"] },
  { domain: "Finance",     emoji: "💰", prompts: ["Calculate monthly revenue per product category for Q1 2024, ordered by revenue", "Find all transactions above $10,000 in the last 7 days with customer details", "Get the top 5 highest-spending accounts by total transaction volume"] },
  { domain: "HR",          emoji: "👥", prompts: ["List employees with no performance review in the past 6 months, by department", "Show average salary by department, ordered highest to lowest", "Find all employees hired in the last 90 days who report to a specific manager"] },
  { domain: "SaaS",        emoji: "📊", prompts: ["Show daily active users for the past 14 days with a 7-day rolling average", "Find users who signed up but never logged in after day 1", "Get churn rate per month for the last 6 months"] },
  { domain: "Logistics",   emoji: "🚚", prompts: ["Find all shipments delayed more than 3 days with carrier and route info", "List the top 10 routes by average delivery time, slowest first", "Get all orders with more than 2 delivery attempts that are still undelivered"] },
  { domain: "Education",   emoji: "🎓", prompts: ["Find students enrolled in more than 3 courses this semester with their GPA", "List courses with the highest dropout rate in the last year", "Show all students with no grades recorded for any course this term"] },
  { domain: "Gaming",      emoji: "🎮", prompts: ["Show the top 20 players by score this month, grouped by region", "Find all players who achieved a new personal best in the last 7 days", "Get average session length per game mode for the past 30 days"] },
];

interface NL2SQLResult {
  sql: string;
  explanation: string;
  assumptions: string[];
  tablesNeeded: string[];
  dialect: string;
}

function SqlBlock({ sql, label = "SQL" }: { sql: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl overflow-hidden border border-sky-500/15 bg-[#0d0d1f]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-sky-500/10 bg-[#0a0a1e]">
        <span className="text-[10px] font-bold tracking-widest text-slate-500">{label}</span>
        <div className="flex items-center gap-2">
          <button onClick={copy} className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-sky-300 transition-colors px-2 py-1 rounded-lg hover:bg-sky-500/10">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy SQL"}
          </button>
          <Link href="/optimizer" className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10">
            <ArrowRight className="w-3 h-3" />Optimize
          </Link>
        </div>
      </div>
      <pre className="p-4 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">{sql}</pre>
    </div>
  );
}

export default function NL2SQLPage() {
  const [prompt, setPrompt] = useState("");
  const [dialect, setDialect] = useState("PostgreSQL");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NL2SQLResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schemaLoaded, setSchemaLoaded] = useState(false);
  const [schemaContext, setSchemaContext] = useState<string | undefined>();

  useEffect(() => {
    const ctx = sessionStorage.getItem("smartquery_schema_context");
    if (ctx) { setSchemaContext(ctx); setSchemaLoaded(true); }
  }, []);

  const charCount = prompt.length;

  const handleConvert = async () => {
    if (!prompt.trim() || prompt.trim().length < 5) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/nl2sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, dialect, schemaContext }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Conversion failed — please try again."); return; }
      setResult(data as NL2SQLResult);
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleConvert(); }
  };

  const removeSchema = () => {
    setSchemaContext(undefined);
    setSchemaLoaded(false);
    sessionStorage.removeItem("smartquery_schema_context");
  };

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Brain className="w-5 h-5 text-sky-400" />Natural Language to SQL
            <span className="text-xs font-normal px-2 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/25 rounded-lg">NEW</span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Describe what data you need in plain English — get production-ready SQL for any dialect
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* LEFT: Input + result */}
        <div className="lg:col-span-2 space-y-4">
          {/* Schema context banner */}
          {schemaLoaded && (
            <div className="p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <Database className="w-4 h-4 flex-shrink-0" />
                Schema context loaded from Schema Vault — your exact table/column names will be used, no hallucinations
              </div>
              <button onClick={removeSchema} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors ml-3 flex-shrink-0">
                Remove
              </button>
            </div>
          )}

          {!schemaLoaded && (
            <div className="p-3 bg-violet-500/8 border border-violet-500/15 rounded-2xl flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                No schema loaded — generic table names will be used. Load your DDL in{" "}
                <Link href="/schema" className="text-emerald-400 hover:underline">Schema Vault</Link>{" "}
                for accurate generation.
              </div>
            </div>
          )}

          {/* Dialect selector */}
          <div className="glass-card rounded-2xl p-4 border border-sky-500/15">
            <div className="text-[10px] font-bold text-slate-500 tracking-widest mb-3">TARGET SQL DIALECT</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {DIALECTS.map((d) => (
                <button key={d} onClick={() => setDialect(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    dialect === d
                      ? "bg-sky-600 border-sky-500 text-white"
                      : "border-sky-500/20 text-slate-400 hover:border-sky-500/50 hover:text-white"
                  }`}>
                  {d}
                </button>
              ))}
            </div>

            <div className="text-[10px] font-bold text-slate-500 tracking-widest mb-2">DESCRIBE WHAT YOU NEED</div>
            <textarea
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setError(null); }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Show the top 10 customers by total spend last month, grouped by country"
              className="w-full h-36 bg-[#07071a] rounded-xl border border-sky-500/15 text-sm text-slate-200 p-4 resize-none focus:outline-none focus:border-sky-500/40 placeholder:text-slate-700 leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-600">
              <span>{charCount} chars · {dialect}</span>
              <span>⌘+Enter / Ctrl+Enter to convert</span>
            </div>

            <button onClick={handleConvert} disabled={loading || !prompt.trim()}
              className="mt-3 w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Converting…</>
                : <><Brain className="w-4 h-4" />Convert to SQL</>
              }
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="glass-card rounded-2xl p-6 border border-amber-500/20 flex flex-col items-center text-center">
              <div className="text-amber-400 font-bold mb-2">Conversion Unavailable</div>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <button onClick={handleConvert}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition-all">
                <RefreshCw className="w-4 h-4" />Retry
              </button>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <SqlBlock sql={result.sql} label={`GENERATED ${result.dialect} — PRODUCTION READY`} />

                {result.explanation && (
                  <div className="glass-card rounded-2xl p-4 border border-sky-500/10">
                    <div className="text-[10px] font-bold text-sky-400 tracking-widest mb-2">WHAT THIS QUERY DOES</div>
                    <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
                  </div>
                )}

                {result.tablesNeeded?.length > 0 && (
                  <div className="glass-card rounded-2xl p-4 border border-emerald-500/10">
                    <div className="text-[10px] font-bold text-emerald-400 tracking-widest mb-2">TABLES USED</div>
                    <div className="flex flex-wrap gap-2">
                      {result.tablesNeeded.map((t) => (
                        <code key={t} className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg">{t}</code>
                      ))}
                    </div>
                  </div>
                )}

                {result.assumptions?.length > 0 && (
                  <div className="glass-card rounded-2xl p-4 border border-amber-500/10">
                    <div className="text-[10px] font-bold text-amber-400 tracking-widest mb-2">ASSUMPTIONS MADE</div>
                    <ul className="space-y-1">
                      {result.assumptions.map((a, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className="text-amber-400 flex-shrink-0">·</span>{a}
                        </li>
                      ))}
                    </ul>
                    {!schemaLoaded && (
                      <div className="mt-3 p-2 bg-emerald-500/8 border border-emerald-500/15 rounded-xl text-[11px] text-emerald-300">
                        Load your schema in Schema Vault to eliminate assumptions and use your real table names.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { setResult(null); setPrompt(""); }}
                    className="flex-1 py-2.5 rounded-xl border border-violet-500/15 text-xs text-slate-400 hover:text-white hover:border-violet-500/40 transition-all">
                    New Conversion
                  </button>
                  <Link href="/optimizer"
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />Optimize This SQL
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Example prompts */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 tracking-widest">EXAMPLE PROMPTS</div>
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {EXAMPLE_PROMPTS.map((group) => (
              <div key={group.domain} className="glass-card rounded-2xl p-4 border border-violet-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{group.emoji}</span>
                  <span className="text-xs font-bold text-violet-300">{group.domain}</span>
                </div>
                <div className="space-y-1.5">
                  {group.prompts.map((p) => (
                    <button key={p} onClick={() => { setPrompt(p); setResult(null); setError(null); }}
                      className="w-full text-left text-[11px] text-slate-400 hover:text-white hover:bg-violet-500/8 rounded-xl p-2 transition-all border border-transparent hover:border-violet-500/15 flex items-start gap-2 group">
                      <ChevronRight className="w-3 h-3 text-violet-500 flex-shrink-0 mt-0.5 group-hover:text-violet-300 transition-colors" />
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
