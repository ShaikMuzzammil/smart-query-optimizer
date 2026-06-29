"use client";
// app/(dashboard)/examples/page.tsx
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SQL_EXAMPLES, DOMAINS, DOMAIN_ICONS, type SqlExample } from "@/lib/examples-data";
import { SqlBlock } from "@/components/optimizer/SqlBlock";
import {
  Search, Zap, X, ShoppingCart, HeartPulse, Landmark, Users, LineChart,
  MessageCircle, Home, Truck, GraduationCap, Gamepad2, Megaphone, Plane, Sparkles,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart, HeartPulse, Landmark, Users, LineChart,
  MessageCircle, Home, Truck, GraduationCap, Gamepad2, Megaphone, Plane,
};

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

const DIFF_COLOR: Record<string, string> = {
  Beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  Intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/25",
  Advanced: "text-rose-400 bg-rose-400/10 border-rose-400/25",
};

export default function ExamplesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [preview, setPreview] = useState<SqlExample | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SQL_EXAMPLES.filter((e) => {
      if (domain !== "all" && e.domain !== domain) return false;
      if (difficulty !== "all" && e.difficulty !== difficulty) return false;
      if (q && !`${e.title} ${e.issueTag} ${e.sql}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, domain, difficulty]);

  const domainCounts = useMemo(() => {
    const m = new Map<string, number>();
    SQL_EXAMPLES.forEach((e) => m.set(e.domain, (m.get(e.domain) ?? 0) + 1));
    return m;
  }, []);

  const loadInOptimizer = (ex: SqlExample) => {
    router.push(`/optimizer?example=${ex.id}`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black mb-1">Examples Library</h1>
          <p className="text-slate-400 text-sm">
            {SQL_EXAMPLES.length} real flawed queries across {DOMAINS.length} domains — load any one straight into the Optimizer.
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="glass-card rounded-2xl p-4 mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search examples by title, issue type, or table name…"
            className="w-full bg-[#020208] border border-violet-500/20 rounded-lg pl-9 pr-9 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[11px] text-slate-500 mr-1">Domain:</span>
          <button onClick={() => setDomain("all")}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${domain === "all" ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "border-violet-500/15 text-slate-400 hover:text-slate-200"}`}>
            All ({SQL_EXAMPLES.length})
          </button>
          {DOMAINS.map((d) => (
            <button key={d} onClick={() => setDomain(d)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${domain === d ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "border-violet-500/15 text-slate-400 hover:text-slate-200"}`}>
              {d} ({domainCounts.get(d) ?? 0})
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-[11px] text-slate-500 mr-1">Difficulty:</span>
          <button onClick={() => setDifficulty("all")}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${difficulty === "all" ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "border-violet-500/15 text-slate-400 hover:text-slate-200"}`}>
            All
          </button>
          {DIFFICULTIES.map((d) => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${difficulty === d ? DIFF_COLOR[d] : "border-violet-500/15 text-slate-400 hover:text-slate-200"}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-sm">
          No examples match your filters. Try clearing the search or domain filter.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ex) => {
            const Icon = ICONS[DOMAIN_ICONS[ex.domain]] ?? Sparkles;
            return (
              <motion.div key={ex.id} layout
                className="glass-card rounded-2xl p-4 flex flex-col gap-3 hover:border-violet-500/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 truncate">{ex.domain}</div>
                      <div className="text-sm font-semibold text-slate-100 truncate">{ex.issueTag}</div>
                    </div>
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${DIFF_COLOR[ex.difficulty]}`}>
                    {ex.difficulty}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{ex.description}</p>

                <pre className="text-[10px] font-mono text-slate-400 bg-[#020208] border border-violet-500/15 rounded-lg p-2.5 overflow-hidden max-h-20 leading-5">
                  {ex.sql.split("\n").slice(0, 3).join("\n")}
                  {ex.sql.split("\n").length > 3 ? "\n…" : ""}
                </pre>

                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setPreview(ex)}
                    className="flex-1 py-2 border border-violet-500/25 text-slate-300 text-[11px] font-medium rounded-lg hover:border-violet-500/45 transition-colors">
                    Preview
                  </button>
                  <button onClick={() => loadInOptimizer(ex)}
                    className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <Zap className="w-3 h-3" /> Load in Optimizer
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-5 max-w-xl w-full max-h-[80vh] overflow-auto"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[10px] text-violet-400">{preview.domain} · {preview.difficulty}</div>
                  <div className="text-lg font-bold">{preview.issueTag}</div>
                </div>
                <button onClick={() => setPreview(null)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">{preview.description}</p>
              <SqlBlock sql={preview.sql} label="▶ EXAMPLE QUERY" maxH={260} />
              <button onClick={() => loadInOptimizer(preview)}
                className="w-full mt-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" /> Load in Optimizer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
