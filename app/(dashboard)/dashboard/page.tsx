"use client";
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Zap, TrendingUp, Database, Flame, ArrowRight, Plus, Clock,
  BookOpen, History, BarChart3, Sparkles, Gauge, Brain, Terminal,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const QUICK_ACTIONS = [
  { href: "/optimizer",  icon: Zap,       label: "SQL Optimizer",           desc: "AI rewrites with full analysis",     color: "violet"  },
  { href: "/nl2sql",     icon: Brain,     label: "Natural Language to SQL", desc: "Describe data, get production SQL",  color: "sky"     },
  { href: "/schema",     icon: Database,  label: "Schema Vault",            desc: "Upload DDL and get ER diagrams",     color: "emerald" },
  { href: "/playground", icon: Terminal,  label: "SQL Playground",          desc: "Run SQL in-browser instantly",       color: "amber"   },
  { href: "/examples",   icon: BookOpen,  label: "Example Library",         desc: "99 real queries across 12 domains",  color: "pink"    },
  { href: "/history",    icon: History,   label: "Query History",           desc: "All past optimizations saved",       color: "slate"   },
  { href: "/analytics",  icon: BarChart3, label: "Analytics",               desc: "Charts, trends and insights",        color: "violet"  },
  { href: "/settings",   icon: Gauge,     label: "Settings & Exports",      desc: "Export data, manage account",        color: "emerald" },
];

const CARD_COLOR: Record<string, string> = {
  violet:  "bg-violet-500/15 text-violet-400 border-violet-500/25",
  sky:     "bg-sky-500/15 text-sky-400 border-sky-500/25",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  amber:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  pink:    "bg-pink-500/15 text-pink-400 border-pink-500/25",
  slate:   "bg-slate-500/15 text-slate-400 border-slate-500/25",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a1e] border border-violet-500/30 rounded-xl p-3 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function gainColor(g: number) {
  if (g >= 70) return "text-emerald-400";
  if (g >= 40) return "text-yellow-400";
  return "text-slate-400";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: analytics } = useSWR("/api/analytics", fetcher, { refreshInterval: 30_000 });
  const { data: recentData } = useSWR("/api/queries?limit=5", fetcher, { refreshInterval: 15_000 });

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  const kpis = [
    { label: "SQL Optimizations",     value: analytics?.totalQueries ?? 0,          color: "violet",  icon: <Zap className="w-4 h-4" />       },
    { label: "NL to SQL Conversions", value: analytics?.featureUsage?.nl2sql ?? 0,  color: "sky",     icon: <Brain className="w-4 h-4" />     },
    { label: "Avg Performance Gain",  value: `+${analytics?.avgGain ?? 0}%`,        color: "emerald", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Issues Auto-Fixed",     value: analytics?.totalIssuesFixed ?? 0,      color: "amber",   icon: <Database className="w-4 h-4" />  },
    { label: "Day Streak",            value: analytics?.streak ?? 0,                color: "violet",  icon: <Flame className="w-4 h-4" />     },
    { label: "Total Actions",         value: analytics?.totalActions ?? 0,          color: "emerald", icon: <Sparkles className="w-4 h-4" />  },
  ];

  const featureRows = [
    { label: "SQL Optimizations",  value: analytics?.featureUsage?.optimizer  ?? 0, emoji: "⚡", href: "/optimizer"  },
    { label: "Natural Lang to SQL",value: analytics?.featureUsage?.nl2sql     ?? 0, emoji: "🧠", href: "/nl2sql"     },
    { label: "Schema Uploads",     value: analytics?.featureUsage?.schema     ?? 0, emoji: "🗄️", href: "/schema"     },
    { label: "Playground Runs",    value: analytics?.featureUsage?.playground ?? 0, emoji: "🖥️", href: "/playground" },
    { label: "Exports",            value: analytics?.featureUsage?.export     ?? 0, emoji: "📥", href: "/settings"   },
  ];

  const totalActions = analytics?.totalActions || 1;

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black mb-0.5">{greeting}, {firstName} 👋</h1>
          <p className="text-slate-400 text-sm">Your SQL intelligence workspace — all tools in one place</p>
        </div>
        <Link href="/optimizer"
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all">
          <Plus className="w-4 h-4" />New Optimization
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map((a, i) => (
          <motion.div key={a.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link href={a.href}
              className={`glass-card glass-card-hover rounded-2xl p-4 flex items-start gap-3 border ${CARD_COLOR[a.color]} group`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${CARD_COLOR[a.color]}`}>
                <a.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold group-hover:text-white transition-colors truncate">{a.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{a.desc}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpis.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-4 text-center">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 mx-auto border ${CARD_COLOR[s.color]}`}>
              {s.icon}
            </div>
            <div className={`text-xl font-black font-mono ${
              s.color === "violet" ? "text-violet-300" : s.color === "sky" ? "text-sky-300" :
              s.color === "emerald" ? "text-emerald-300" : s.color === "amber" ? "text-amber-300" : "text-rose-300"
            }`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />Feature Usage Breakdown
          </div>
          <div className="space-y-3">
            {featureRows.map((f) => {
              const pct = Math.round((f.value / totalActions) * 100);
              return (
                <Link key={f.label} href={f.href} className="flex items-center gap-3 group">
                  <span className="text-base w-6 flex-shrink-0">{f.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{f.label}</span>
                      <span className="text-xs font-mono text-slate-400">{f.value}</span>
                    </div>
                    <div className="h-1.5 bg-violet-500/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all"
                        style={{ width: `${Math.max(pct, 2)}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />Activity — Last 14 Days
          </div>
          {analytics?.recentTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={analytics.recentTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false}
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Optimizations" stroke="#7c3aed" strokeWidth={2} fill="url(#dg1)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm text-center">
              <div>
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-violet-500/30" />
                <div>Run your first optimization to see activity</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />Recent Optimizations
          </div>
          <Link href="/history" className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentData?.queries?.length > 0 ? (
          <div className="space-y-2">
            {recentData.queries.slice(0, 5).map((q: any) => (
              <div key={q.id} className="flex items-center gap-3 py-2 border-b border-violet-500/5 last:border-0">
                <span className="text-base flex-shrink-0">⚡</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate text-slate-200">{q.title ?? "SQL Query"}</div>
                  <div className="text-[10px] text-slate-500">{q.domain} · {new Date(q.createdAt).toLocaleDateString()}</div>
                </div>
                <span className={`text-xs font-bold font-mono flex-shrink-0 ${gainColor(q.performanceGain)}`}>
                  +{q.performanceGain}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            <Zap className="w-8 h-8 mx-auto mb-2 text-violet-500/30" />
            <div>No optimizations yet — start with SQL Optimizer above</div>
          </div>
        )}
      </div>
    </div>
  );
}
