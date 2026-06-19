"use client";
// app/(dashboard)/history/page.tsx
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion, AnimatePresence } from "framer-motion";
import { DOMAIN_CONFIG, gainColor, timeAgo } from "@/lib/utils";
import { SqlBlock } from "@/components/optimizer/SqlBlock";
import { toast } from "sonner";
import {
  Search, Star, Trash2, Download, X, ChevronDown, Filter,
} from "lucide-react";

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [favOnly, setFavOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const params = new URLSearchParams({
    search, domain, favorites: String(favOnly), limit: "50",
  });
  const { data, isLoading } = useSWR(`/api/queries?${params}`, fetcher);

  const toggleFavorite = async (id: string, current: boolean) => {
    await fetch("/api/queries", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isFavorited: !current }),
    });
    mutate(`/api/queries?${params}`);
    toast.success(!current ? "Added to favorites" : "Removed from favorites");
  };

  const deleteQuery = async (id: string) => {
    await fetch(`/api/queries?id=${id}`, { method: "DELETE" });
    mutate(`/api/queries?${params}`);
    toast.success("Query deleted");
  };

  const exportQuery = (id: string) => window.open(`/api/export?id=${id}&format=sql`, "_blank");

  const domains = ["all", "E-Commerce","Healthcare","Finance","HR","Analytics","Social","Real Estate","Logistics","General"];

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1">History</h1>
        <p className="text-slate-400 text-sm">{data?.pagination?.total ?? 0} optimization{data?.pagination?.total !== 1 ? "s" : ""} saved to Neon PostgreSQL</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title or query content…"
            className="w-full bg-[#050510] border border-violet-500/20 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50"/>
        </div>
        <select value={domain} onChange={e=>setDomain(e.target.value)}
          className="bg-[#050510] border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500/50">
          {domains.map(d => <option key={d} value={d}>{d === "all" ? "All Domains" : d}</option>)}
        </select>
        <button onClick={()=>setFavOnly(f=>!f)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${favOnly ? "bg-amber-500/15 border-amber-500/40 text-amber-400" : "border-violet-500/20 text-slate-400"}`}>
          <Star className={`w-3.5 h-3.5 ${favOnly?"fill-amber-400":""}`}/>Favorites
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i)=>(<div key={i} className="h-20 rounded-2xl shimmer"/>))}</div>
      ) : data?.queries?.length > 0 ? (
        <div className="space-y-3">
          {data.queries.map((q: any) => {
            const dm = DOMAIN_CONFIG[q.domain] ?? DOMAIN_CONFIG.General;
            const isOpen = expanded === q.id;
            const issues = Array.isArray(q.issues) ? q.issues : [];
            return (
              <motion.div key={q.id} layout className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={()=>setExpanded(isOpen?null:q.id)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{background:`${dm.color}18`}}>{dm.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{q.title}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{timeAgo(q.createdAt)}</span>·<span>{q.domain}</span>·<span>{issues.length} issue{issues.length!==1?"s":""} fixed</span>
                    </div>
                  </div>
                  <div className={`text-base font-bold font-mono ${gainColor(q.performanceGain)}`}>+{q.performanceGain}%</div>
                  <button onClick={(e)=>{e.stopPropagation();toggleFavorite(q.id,q.isFavorited);}}
                    className="p-1.5 rounded-lg hover:bg-violet-500/10">
                    <Star className={`w-4 h-4 ${q.isFavorited?"fill-amber-400 text-amber-400":"text-slate-500"}`}/>
                  </button>
                  <button onClick={(e)=>{e.stopPropagation();exportQuery(q.id);}} className="p-1.5 rounded-lg hover:bg-violet-500/10">
                    <Download className="w-4 h-4 text-slate-500"/>
                  </button>
                  <button onClick={(e)=>{e.stopPropagation();deleteQuery(q.id);}} className="p-1.5 rounded-lg hover:bg-rose-500/10">
                    <Trash2 className="w-4 h-4 text-slate-500 hover:text-rose-400"/>
                  </button>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen?"rotate-180":""}`}/>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                      className="overflow-hidden border-t border-violet-500/15">
                      <div className="p-4 grid md:grid-cols-2 gap-3">
                        <SqlBlock sql={q.originalQuery} label="ORIGINAL" maxH={220}/>
                        <SqlBlock sql={q.optimizedQuery} label="OPTIMIZED" maxH={220}/>
                      </div>
                      {q.explanation && (
                        <div className="px-4 pb-4">
                          <div className="bg-violet-500/8 border border-violet-500/20 rounded-lg p-3 text-xs text-slate-300 leading-relaxed">
                            💡 {q.explanation}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">🕐</div>
          <div className="text-lg font-bold mb-2">No history yet</div>
          <p className="text-sm text-slate-400">Optimized queries will appear here automatically.</p>
        </div>
      )}
    </div>
  );
}
