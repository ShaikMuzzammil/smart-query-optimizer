"use client";
// app/(dashboard)/history/page.tsx — FIX #13: universal, all features, not just optimizer
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  History as HistoryIcon, Search, Star, Trash2, Zap, Brain,
  ChevronLeft, ChevronRight, Filter, Copy, Check, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { ExportMenu } from "@/components/optimizer/ExportMenu";

type Tab = "all" | "optimizer" | "nl2sql";

interface QueryItem {
  id: string; title: string; domain: string; queryType: string;
  performanceGain: number; optimizedQuery: string; originalQuery: string;
  isFavorited: boolean; createdAt: string; tablesDetected: string[];
}
interface ConversionItem {
  id: string; inputText: string; outputText: string; dialect: string;
  success: boolean; createdAt: string;
}

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  const { data: queryData, mutate: mutateQueries } = useSWR(
    `/api/queries?page=${page}&limit=12${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    fetcher
  );
  const { data: convData } = useSWR("/api/conversions?limit=50", fetcher);

  const queries: QueryItem[] = queryData?.queries ?? [];
  const conversions: ConversionItem[] = (convData?.conversions ?? []).filter((c: any) => c.feature === "nl2sql");

  const toggleFavorite = async (id: string, current: boolean) => {
    await fetch("/api/queries", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isFavorited: !current }),
    });
    mutateQueries();
    toast.success(!current ? "Added to favorites" : "Removed from favorites");
  };

  const deleteQuery = async (id: string) => {
    await fetch(`/api/queries?id=${id}`, { method: "DELETE" });
    mutateQueries();
    toast.success("Deleted from history");
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(()=>{});
    setCopiedId(id); setTimeout(()=>setCopiedId(null), 1600);
    toast.success("Copied!");
  };

  const reopenInOptimizer = (sql: string) => {
    sessionStorage.setItem("prefillSql", sql);
    router.push("/optimizer");
  };
  const reopenInNl2sql = (prompt: string) => {
    sessionStorage.setItem("prefillPrompt", prompt);
    router.push("/nl2sql");
  };

  const filteredConversions = search.trim()
    ? conversions.filter(c => c.inputText?.toLowerCase().includes(search.toLowerCase()))
    : conversions;

  const showOptimizer = tab === "all" || tab === "optimizer";
  const showNl2sql    = tab === "all" || tab === "nl2sql";

  const totalCount = (showOptimizer ? queries.length : 0) + (showNl2sql ? filteredConversions.length : 0);

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-violet-400"/> History
          </h1>
          {/* FIX #13: universal across features */}
          <p className="text-slate-400 text-sm mt-1">
            Your complete activity across every feature — SQL Optimizer and Natural Language to SQL, all in one place
          </p>
        </div>
        <ExportMenu label="Export History" advancedMode/>
      </div>

      {/* Tabs + search */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          {[
            { key: "all" as Tab,       label: "All Activity",   icon: Filter },
            { key: "optimizer" as Tab, label: "SQL Optimizer",  icon: Zap },
            { key: "nl2sql" as Tab,    label: "NL to SQL",      icon: Brain },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.key ? "bg-violet-500/20 text-violet-300 border border-violet-500/40" : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5"
              }`}>
              <t.icon className="w-3.5 h-3.5"/> {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search history…"
            className="bg-[#08081a] border border-violet-500/20 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-violet-500/40 w-56"/>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-20">
          <HistoryIcon className="w-10 h-10 text-slate-700 mx-auto mb-3"/>
          <p className="text-slate-500 text-sm">No history yet — your optimizations and conversions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {showOptimizer && queries.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="bg-[#08081a] rounded-xl border border-violet-500/15 p-4 hover:border-violet-500/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3.5 h-3.5 text-violet-400 flex-shrink-0"/>
                    <span className="text-sm font-semibold text-white truncate">{q.title ?? "SQL Optimization"}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-violet-500/15 text-violet-300 rounded-full flex-shrink-0">{q.domain}</span>
                    <span className="text-[9px] text-emerald-400 flex-shrink-0">+{q.performanceGain}%</span>
                  </div>
                  <pre className="text-[10px] text-slate-500 font-mono truncate">{q.optimizedQuery?.slice(0, 120)}</pre>
                  <div className="text-[9px] text-slate-600 mt-1">{new Date(q.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleFavorite(q.id, q.isFavorited)} className="p-1.5 rounded-lg hover:bg-violet-500/10 transition-colors">
                    <Star className={`w-3.5 h-3.5 ${q.isFavorited ? "text-amber-400 fill-amber-400" : "text-slate-500"}`}/>
                  </button>
                  <button onClick={() => copyText(q.optimizedQuery, q.id)} className="p-1.5 rounded-lg hover:bg-violet-500/10 transition-colors">
                    {copiedId === q.id ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5 text-slate-500"/>}
                  </button>
                  <button onClick={() => reopenInOptimizer(q.optimizedQuery)} className="p-1.5 rounded-lg hover:bg-violet-500/10 transition-colors" title="Reopen in Optimizer">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500"/>
                  </button>
                  <button onClick={() => deleteQuery(q.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400"/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {showNl2sql && filteredConversions.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="bg-[#08081a] rounded-xl border border-sky-500/15 p-4 hover:border-sky-500/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-3.5 h-3.5 text-sky-400 flex-shrink-0"/>
                    <span className="text-sm font-semibold text-white truncate">{c.inputText?.slice(0, 80)}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-sky-500/15 text-sky-300 rounded-full flex-shrink-0">{c.dialect}</span>
                  </div>
                  <pre className="text-[10px] text-slate-500 font-mono truncate">{c.outputText?.slice(0, 120)}</pre>
                  <div className="text-[9px] text-slate-600 mt-1">{new Date(c.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => copyText(c.outputText, c.id)} className="p-1.5 rounded-lg hover:bg-sky-500/10 transition-colors">
                    {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5 text-slate-500"/>}
                  </button>
                  <button onClick={() => reopenInNl2sql(c.inputText)} className="p-1.5 rounded-lg hover:bg-sky-500/10 transition-colors" title="Reopen in NL to SQL">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500"/>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {showOptimizer && queryData?.pagination?.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
            className="p-2 rounded-lg border border-violet-500/20 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4"/>
          </button>
          <span className="text-xs text-slate-500">Page {page} of {queryData.pagination.pages}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page >= queryData.pagination.pages}
            className="p-2 rounded-lg border border-violet-500/20 text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      )}
    </div>
  );
}
