"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion } from "framer-motion";
import { History, Zap, Brain, Search, Copy, Check, ChevronDown, Trash2, Download } from "lucide-react";

type FeatureFilter = "all" | "optimizer" | "nl2sql";

function gainColor(g: number) {
  if (g >= 70) return "text-emerald-400";
  if (g >= 40) return "text-yellow-400";
  return "text-slate-400";
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10">
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function QueryCard({ q }: { q: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-violet-500/10 overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-violet-500/5 transition-all"
        onClick={() => setExpanded(!expanded)}>
        <span className="text-lg flex-shrink-0">⚡</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate text-slate-200">{q.title ?? "SQL Query"}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{q.domain} · {new Date(q.createdAt).toLocaleDateString()} · {q.queryType}</div>
        </div>
        <span className={`text-sm font-black font-mono flex-shrink-0 ${gainColor(q.performanceGain)}`}>+{q.performanceGain}%</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>
      {expanded && (
        <div className="border-t border-violet-500/10 p-4 space-y-3">
          {q.explanation && <p className="text-xs text-slate-400 leading-relaxed">{q.explanation}</p>}
          {q.optimizedQuery && (
            <div className="rounded-xl overflow-hidden border border-violet-500/10 bg-[#07071a]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0a1e] border-b border-violet-500/10">
                <span className="text-[9px] font-bold tracking-widest text-slate-500">OPTIMIZED QUERY</span>
                <CopyBtn text={q.optimizedQuery} />
              </div>
              <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">{q.optimizedQuery}</pre>
            </div>
          )}
          {Array.isArray(q.issues) && q.issues.length > 0 && (
            <div className="text-[10px] text-slate-500">
              {q.issues.length} issue{q.issues.length !== 1 ? "s" : ""} fixed ·{" "}
              {Array.isArray(q.improvements) ? q.improvements.length : 0} improvements applied
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ConversionCard({ c }: { c: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-sky-500/10 overflow-hidden">
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-sky-500/5 transition-all"
        onClick={() => setExpanded(!expanded)}>
        <span className="text-lg flex-shrink-0">🧠</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate text-slate-200">{c.inputText ?? "NL2SQL Conversion"}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Natural Language to SQL · {c.dialect ?? "SQL"} · {new Date(c.createdAt).toLocaleDateString()}</div>
        </div>
        <span className="text-xs font-semibold text-sky-400 flex-shrink-0 px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/15">NL2SQL</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </div>
      {expanded && c.outputText && (
        <div className="border-t border-sky-500/10 p-4">
          <div className="rounded-xl overflow-hidden border border-sky-500/10 bg-[#07071a]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0a1e] border-b border-sky-500/10">
              <span className="text-[9px] font-bold tracking-widest text-slate-500">GENERATED SQL</span>
              <CopyBtn text={c.outputText} />
            </div>
            <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">{c.outputText}</pre>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FeatureFilter>("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const { data: queryData } = useSWR("/api/queries?limit=100", fetcher, { refreshInterval: 30_000 });
  const { data: convData }  = useSWR("/api/conversions?limit=100", fetcher, { refreshInterval: 30_000 });

  const queries      = queryData?.queries ?? [];
  const conversions  = (convData?.conversions ?? []).filter((c: any) => c.feature === "nl2sql");

  const combined = [
    ...queries.map((q: any)      => ({ ...q, _type: "optimizer" as const, _date: new Date(q.createdAt) })),
    ...conversions.map((c: any)  => ({ ...c, _type: "nl2sql" as const,    _date: new Date(c.createdAt) })),
  ].sort((a, b) => b._date.getTime() - a._date.getTime());

  const filtered = combined.filter((item) => {
    if (filter === "optimizer" && item._type !== "optimizer") return false;
    if (filter === "nl2sql"    && item._type !== "nl2sql")    return false;
    const q = search.toLowerCase();
    if (!q) return true;
    const text = item._type === "optimizer"
      ? `${item.title ?? ""} ${item.domain ?? ""} ${item.queryType ?? ""}`
      : `${item.inputText ?? ""} ${item.dialect ?? ""}`;
    return text.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const optCount = combined.filter((i) => i._type === "optimizer").length;
  const nl2Count = combined.filter((i) => i._type === "nl2sql").length;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
          <History className="w-6 h-6 text-slate-400" />History
        </h1>
        <p className="text-slate-400 text-sm">Complete history across all SmartQuery features</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Actions",         value: combined.length, color: "violet" },
          { label: "SQL Optimizations",     value: optCount,        color: "violet" },
          { label: "NL to SQL Conversions", value: nl2Count,        color: "sky"    },
        ].map((s) => (
          <div key={s.label} className={`glass-card rounded-2xl p-4 text-center border ${s.color === "sky" ? "border-sky-500/20" : "border-violet-500/20"}`}>
            <div className={`text-2xl font-black font-mono ${s.color === "sky" ? "text-sky-300" : "text-violet-300"}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 p-1 bg-violet-500/10 rounded-xl">
          {(["all", "optimizer", "nl2sql"] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all capitalize ${filter === f ? "bg-violet-600 text-white" : "text-slate-500 hover:text-white"}`}>
              {f === "nl2sql" ? "NL to SQL" : f === "optimizer" ? "SQL Optimizer" : "All Features"}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search history…"
            className="w-full bg-[#07071a] rounded-xl border border-violet-500/15 text-xs text-slate-200 py-2 pl-9 pr-3 focus:outline-none focus:border-violet-500/40 placeholder:text-slate-700" />
        </div>
        <span className="text-[11px] text-slate-500">{filtered.length} results</span>
      </div>

      {/* List */}
      {paged.length > 0 ? (
        <div className="space-y-3">
          {paged.map((item) =>
            item._type === "optimizer"
              ? <QueryCard key={`q-${item.id}`} q={item} />
              : <ConversionCard key={`c-${item.id}`} c={item} />
          )}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <History className="w-10 h-10 mx-auto mb-3 text-violet-500/20" />
          <div className="text-sm">
            {search || filter !== "all" ? "No results match your filter" : "No history yet — start optimizing or converting SQL"}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-violet-500/20 text-xs text-slate-400 hover:text-white hover:border-violet-500/50 disabled:opacity-30 transition-all">
            Previous
          </button>
          <span className="text-xs text-slate-500">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-violet-500/20 text-xs text-slate-400 hover:text-white hover:border-violet-500/50 disabled:opacity-30 transition-all">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
