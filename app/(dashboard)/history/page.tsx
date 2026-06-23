"use client";
// app/(dashboard)/history/page.tsx
import { useState, useCallback } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { DOMAIN_CONFIG, gainColor, timeAgo } from "@/lib/utils";
import { SqlBlock } from "@/components/optimizer/SqlBlock";
import { ExportMenu } from "@/components/optimizer/ExportMenu";
import { toast } from "sonner";
import {
  Search, Star, Trash2, X, ChevronDown, Filter, Zap,
  LayoutGrid, LayoutList, CheckCircle2, AlertTriangle, Copy,
  TrendingUp, Database,
} from "lucide-react";

const PAGE_SIZE = 20;

const DOMAINS = [
  "all","E-Commerce","Healthcare","Finance","Banking & Finance","HR","SaaS Analytics",
  "Social Media","Real Estate","Logistics","Education","Gaming","Marketing",
  "Travel & Hospitality","General",
];
const DIFFICULTIES = ["all","Beginner","Intermediate","Advanced"];
const QUERY_TYPES = ["all","SELECT","INSERT","UPDATE","DELETE","CREATE","ALTER"];

type ViewMode = "list" | "grid";

function HistoryEmpty({ search, hasFilters }: { search: string; hasFilters: boolean }) {
  if (search || hasFilters) {
    return (
      <div className="glass-card rounded-2xl p-16 text-center">
        <Search className="w-10 h-10 text-violet-500/30 mx-auto mb-4" />
        <div className="text-lg font-bold mb-2">No results</div>
        <p className="text-sm text-slate-400">Try a different search or clear the filters.</p>
      </div>
    );
  }
  return (
    <div className="glass-card rounded-2xl p-16 text-center">
      <div className="text-5xl mb-4">🕐</div>
      <h2 className="text-xl font-bold mb-2">No history yet</h2>
      <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
        Every SQL query you optimize is saved here automatically with full analysis.
      </p>
      <Link href="/optimizer"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all">
        <Zap className="w-4 h-4" /> Optimize Your First Query
      </Link>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: "bg-rose-500/15 text-rose-400 border-rose-500/25",
    high:     "bg-orange-500/15 text-orange-400 border-orange-500/25",
    medium:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
    low:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  };
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${map[severity] ?? map.low}`}>
      {severity.toUpperCase()}
    </span>
  );
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [favOnly, setFavOnly] = useState(false);
  const [queryType, setQueryType] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<Record<string, "overview" | "sql" | "issues">>(
    {}
  );

  const params = new URLSearchParams({
    search, domain, favorites: String(favOnly),
    queryType, limit: String(PAGE_SIZE), page: String(page),
  });
  const swrKey = `/api/queries?${params}`;
  const { data, isLoading } = useSWR(swrKey, fetcher, { keepPreviousData: true });

  const refresh = useCallback(() => globalMutate(swrKey), [swrKey]);

  const toggleFavorite = async (id: string, current: boolean) => {
    await fetch("/api/queries", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isFavorited: !current }),
    });
    refresh();
    toast.success(current ? "Removed from favorites" : "Added to favorites ⭐");
  };

  const deleteQuery = async (id: string) => {
    if (!confirm("Delete this optimization? This cannot be undone.")) return;
    await fetch(`/api/queries?id=${id}`, { method: "DELETE" });
    if (expanded === id) setExpanded(null);
    refresh();
    toast.success("Deleted");
  };

  const copySQL = (sql: string) => { navigator.clipboard.writeText(sql); toast.success("Copied!"); };

  const hasFilters = domain !== "all" || favOnly || queryType !== "all";
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getItemTab = (id: string) => activeTab[id] ?? "overview";
  const setItemTab = (id: string, tab: "overview" | "sql" | "issues") =>
    setActiveTab(p => ({ ...p, [id]: tab }));

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black mb-1">History</h1>
          <p className="text-slate-400 text-sm">
            {total > 0 ? `${total} optimization${total !== 1 ? "s" : ""} saved to Neon PostgreSQL` : "Your optimization history"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 glass-card rounded-xl p-1">
            <button onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          {data?.queries?.length > 0 && (
            <ExportMenu label="Export All" formats={["csv", "pdf"]}
              href={fmt => `/api/export?scope=all&format=${fmt}&domain=${domain}&favorites=${favOnly}`} />
          )}
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title, domain, or SQL content…"
              className="w-full bg-[#050510] border border-violet-500/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition-colors" />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-sm transition-colors ${showFilters || hasFilters ? "bg-violet-500/15 border-violet-500/40 text-violet-300" : "border-violet-500/20 text-slate-400 hover:text-white"}`}>
            <Filter className="w-3.5 h-3.5" /> Filters {hasFilters && <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] flex items-center justify-center font-bold">!</span>}
          </button>
          <button onClick={() => setFavOnly(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-sm transition-colors ${favOnly ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "border-violet-500/20 text-slate-400 hover:text-white"}`}>
            <Star className={`w-3.5 h-3.5 ${favOnly ? "fill-amber-400" : ""}`} /> Favorites
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3 items-end">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1.5 font-semibold">DOMAIN</div>
                  <select value={domain} onChange={e => { setDomain(e.target.value); setPage(1); }}
                    className="bg-[#050510] border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500/50">
                    {DOMAINS.map(d => <option key={d} value={d}>{d === "all" ? "All Domains" : d}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-1.5 font-semibold">QUERY TYPE</div>
                  <select value={queryType} onChange={e => { setQueryType(e.target.value); setPage(1); }}
                    className="bg-[#050510] border border-violet-500/20 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500/50">
                    {QUERY_TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>)}
                  </select>
                </div>
                {hasFilters && (
                  <button onClick={() => { setDomain("all"); setQueryType("all"); setFavOnly(false); setPage(1); }}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-lg px-3 py-2 transition-colors">
                    <X className="w-3.5 h-3.5" /> Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-2xl shimmer" />)}
        </div>
      ) : !data?.queries?.length ? (
        <HistoryEmpty search={search} hasFilters={hasFilters} />
      ) : viewMode === "grid" ? (
        // ── Grid view ──
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.queries.map((q: any) => {
            const dm = DOMAIN_CONFIG[q.domain] ?? DOMAIN_CONFIG.General;
            const issues = Array.isArray(q.issues) ? q.issues : [];
            return (
              <motion.div key={q.id} layout className="glass-card glass-card-hover rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${dm.color}18` }}>{dm.icon}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{q.title}</div>
                      <div className="text-[10px] text-slate-500">{q.domain} · {q.queryType}</div>
                    </div>
                  </div>
                  <div className={`text-lg font-black font-mono flex-shrink-0 ${gainColor(q.performanceGain)}`}>
                    +{q.performanceGain}%
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {q.costScore != null && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                      Cost {q.costScore}/100
                    </span>
                  )}
                  {q.estimatedSpeedup && q.estimatedSpeedup !== "N/A" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      {q.estimatedSpeedup}
                    </span>
                  )}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 capitalize">
                    {q.engine ?? "claude"}
                  </span>
                  {issues.length > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                      {issues.length} issue{issues.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {q.explanation && (
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{q.explanation}</p>
                )}

                <div className="text-[10px] text-slate-600 mt-auto">{timeAgo(q.createdAt)}</div>

                <div className="flex gap-1.5">
                  <button onClick={() => copySQL(q.optimizedQuery)}
                    className="flex-1 py-1.5 text-[11px] border border-violet-500/20 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors flex items-center justify-center gap-1">
                    <Copy className="w-3 h-3" /> Copy SQL
                  </button>
                  <ExportMenu href={fmt => `/api/export?id=${q.id}&format=${fmt}`} />
                  <button onClick={() => toggleFavorite(q.id, q.isFavorited)}
                    className="p-1.5 rounded-lg hover:bg-violet-500/10 transition-colors">
                    <Star className={`w-4 h-4 ${q.isFavorited ? "fill-amber-400 text-amber-400" : "text-slate-500"}`} />
                  </button>
                  <button onClick={() => deleteQuery(q.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        // ── List view ──
        <div className="space-y-2.5">
          {data.queries.map((q: any) => {
            const dm = DOMAIN_CONFIG[q.domain] ?? DOMAIN_CONFIG.General;
            const isOpen = expanded === q.id;
            const issues = Array.isArray(q.issues) ? q.issues as Array<{ severity: string; description: string }> : [];
            const improvements = Array.isArray(q.improvements) ? q.improvements as string[] : [];
            const tab = getItemTab(q.id);

            return (
              <motion.div key={q.id} layout className="glass-card rounded-2xl overflow-hidden">
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-violet-500/3 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : q.id)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${dm.color}18` }}>{dm.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{q.title}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{timeAgo(q.createdAt)}</span>
                      <span className="text-slate-600">·</span>
                      <span>{q.domain}</span>
                      <span className="text-slate-600">·</span>
                      <span className="capitalize">{q.queryType}</span>
                      {issues.length > 0 && <>
                        <span className="text-slate-600">·</span>
                        <span className="text-rose-400">{issues.length} issue{issues.length !== 1 ? "s" : ""}</span>
                      </>}
                      {q.engine && q.engine !== "claude" && <>
                        <span className="text-slate-600">·</span>
                        <span className="text-sky-400 capitalize">via {q.engine}</span>
                      </>}
                    </div>
                  </div>
                  <div className={`text-base font-black font-mono flex-shrink-0 ${gainColor(q.performanceGain)}`}>
                    +{q.performanceGain}%
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleFavorite(q.id, q.isFavorited)}
                      className="p-1.5 rounded-lg hover:bg-violet-500/10 transition-colors">
                      <Star className={`w-4 h-4 ${q.isFavorited ? "fill-amber-400 text-amber-400" : "text-slate-500"}`} />
                    </button>
                    <ExportMenu href={fmt => `/api/export?id=${q.id}&format=${fmt}`} />
                    <button onClick={() => deleteQuery(q.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="w-4 h-4 text-slate-500 hover:text-rose-400" />
                    </button>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-violet-500/10">

                      {/* Metric badges */}
                      <div className="px-4 pt-3 flex flex-wrap gap-2">
                        {q.costScore != null && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-1">
                            <TrendingUp className="w-2.5 h-2.5" /> Cost: {q.costScore}/100
                          </span>
                        )}
                        {q.estimatedRowsScanned && q.estimatedRowsScanned !== "N/A" && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 flex items-center gap-1">
                            <Database className="w-2.5 h-2.5" /> {q.estimatedRowsScanned}
                          </span>
                        )}
                        {q.estimatedSpeedup && q.estimatedSpeedup !== "N/A" && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                            {q.estimatedSpeedup}
                          </span>
                        )}
                        {q.complexityBefore && q.complexityBefore !== "N/A" && (
                          <span className="text-[10px] px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                            {q.complexityBefore} → {q.complexityAfter}
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 capitalize">
                          via {q.engine ?? "claude"}
                        </span>
                      </div>

                      {/* Sub-tabs */}
                      <div className="px-4 pt-3 flex gap-1">
                        {(["overview", "sql", "issues"] as const).map(t => (
                          <button key={t} onClick={() => setItemTab(q.id, t)}
                            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors capitalize ${tab === t ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white hover:bg-violet-500/10"}`}>
                            {t === "issues" && issues.length > 0 ? `Issues (${issues.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>

                      <div className="p-4">
                        {tab === "overview" && (
                          <div className="space-y-3">
                            {q.explanation && (
                              <div className="bg-violet-500/6 border border-violet-500/15 rounded-xl p-3.5">
                                <div className="text-[9px] font-bold text-violet-400 tracking-wider mb-1.5">💡 AI EXPLANATION</div>
                                <p className="text-xs text-slate-300 leading-relaxed">{q.explanation}</p>
                              </div>
                            )}
                            {improvements.length > 0 && (
                              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5">
                                <div className="text-[9px] font-bold text-emerald-400 tracking-wider mb-2">✓ IMPROVEMENTS APPLIED</div>
                                <div className="space-y-1.5">
                                  {improvements.map((imp, i) => (
                                    <div key={i} className="flex gap-2 text-xs text-slate-300">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                      {imp}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {q.readabilityNotes && (
                              <div className="bg-slate-500/5 border border-slate-500/15 rounded-xl p-3.5">
                                <div className="text-[9px] font-bold text-slate-400 tracking-wider mb-1.5">📝 READABILITY NOTES</div>
                                <p className="text-xs text-slate-400 leading-relaxed">{q.readabilityNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {tab === "sql" && (
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <SqlBlock sql={q.originalQuery} label="ORIGINAL" maxH={200} />
                              <button onClick={() => copySQL(q.originalQuery)}
                                className="mt-1.5 text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                                <Copy className="w-3 h-3" /> Copy original
                              </button>
                            </div>
                            <div>
                              <SqlBlock sql={q.optimizedQuery} label="OPTIMIZED" maxH={200} />
                              <button onClick={() => copySQL(q.optimizedQuery)}
                                className="mt-1.5 text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                                <Copy className="w-3 h-3" /> Copy optimized
                              </button>
                            </div>
                          </div>
                        )}
                        {tab === "issues" && (
                          issues.length > 0 ? (
                            <div className="space-y-2">
                              {issues.map((iss, i) => (
                                <div key={i} className="flex gap-2.5 p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <SeverityBadge severity={iss.severity} />
                                    <p className="text-xs text-slate-300 leading-relaxed mt-1">{iss.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-500 text-sm">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />No issues found
                            </div>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 glass-card rounded-xl text-sm text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
            ← Prev
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const n = i + 1;
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${page === n ? "bg-violet-600 text-white" : "glass-card text-slate-400 hover:text-white"}`}>
                  {n}
                </button>
              );
            })}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 glass-card rounded-xl text-sm text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
