"use client";
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap, Brain, Database, Terminal, FileDown, TrendingUp,
  Flame, BarChart3, AlertTriangle, Target, Clock, Award,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const DOMAIN_COLORS = [
  "#7c3aed","#06d6a0","#fbbf24","#38bdf8","#f72585",
  "#f97316","#10b981","#8b5cf6","#ef4444","#14b8a6","#a855f7","#22d3ee",
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#f97316", medium: "#fbbf24", low: "#06d6a0",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a1e] border border-violet-500/30 rounded-xl p-3 text-xs shadow-xl">
      {label && <div className="text-slate-400 mb-1">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-white">{typeof p.value === "number" ? (p.name?.includes("Gain") ? `+${p.value}%` : p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { data, isLoading, error } = useSWR("/api/analytics", fetcher, {
    refreshInterval: 30_000,
  });

  const featureCards = [
    { label: "SQL Optimizations",    value: data?.featureUsage?.optimizer  ?? 0, icon: <Zap className="w-5 h-5" />,      color: "violet",  href: "/optimizer"  },
    { label: "Natural Lang to SQL",  value: data?.featureUsage?.nl2sql     ?? 0, icon: <Brain className="w-5 h-5" />,    color: "sky",     href: "/nl2sql"     },
    { label: "Schema Uploads",       value: data?.featureUsage?.schema     ?? 0, icon: <Database className="w-5 h-5" />, color: "emerald", href: "/schema"     },
    { label: "Playground Runs",      value: data?.featureUsage?.playground ?? 0, icon: <Terminal className="w-5 h-5" />, color: "amber",   href: "/playground" },
    { label: "Exports",              value: data?.featureUsage?.export     ?? 0, icon: <FileDown className="w-5 h-5" />, color: "pink",    href: "/settings"   },
  ];

  const radarData = featureCards.map((f) => ({
    feature: f.label.split(" ")[0],
    usage: f.value,
  }));

  const CARD = {
    violet:  "bg-violet-500/15 text-violet-400 border-violet-500/25",
    sky:     "bg-sky-500/15 text-sky-400 border-sky-500/25",
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    amber:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
    pink:    "bg-pink-500/15 text-pink-400 border-pink-500/25",
  } as Record<string, string>;

  const kpis = [
    { label: "Total Optimizations", value: data?.totalQueries ?? 0,         sub: "SQL queries rewritten",       icon: <Zap className="w-4 h-4" />,       c: "violet"  },
    { label: "Avg Performance Gain",value: `+${data?.avgGain ?? 0}%`,       sub: "across all queries",          icon: <TrendingUp className="w-4 h-4" />, c: "emerald" },
    { label: "Issues Auto-Fixed",   value: data?.totalIssuesFixed ?? 0,     sub: "anti-patterns removed",       icon: <AlertTriangle className="w-4 h-4"/>,c: "amber"  },
    { label: "Day Streak",          value: data?.streak ?? 0,               sub: "consecutive active days",     icon: <Flame className="w-4 h-4" />,      c: "violet"  },
    { label: "Avg Cost Score",      value: data?.avgCostScore ?? "—",       sub: "lower = cheaper queries",     icon: <Target className="w-4 h-4" />,     c: "sky"     },
    { label: "Total Actions",       value: data?.totalActions ?? 0,         sub: "across all features",         icon: <Award className="w-4 h-4" />,      c: "emerald" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-400" />Analytics
        </h1>
        <p className="text-slate-400 text-sm">Complete usage statistics across all SmartQuery features</p>
      </motion.div>

      {error && (
        <div className="glass-card border border-red-500/30 rounded-2xl p-4 mb-6 text-red-400 text-sm">
          Could not load analytics — please refresh.
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-4 text-center">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 mx-auto border ${CARD[k.c]}`}>
              {k.icon}
            </div>
            <div className={`text-xl font-black font-mono ${
              k.c === "violet" ? "text-violet-300" : k.c === "sky" ? "text-sky-300" :
              k.c === "emerald" ? "text-emerald-300" : k.c === "amber" ? "text-amber-300" : "text-rose-300"
            }`}>{isLoading ? "…" : k.value}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">{k.label}</div>
            <div className="text-[9px] text-slate-600 mt-0.5 leading-tight">{k.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Feature usage cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {featureCards.map((f, i) => (
          <motion.div key={f.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
            <Link href={f.href}
              className={`glass-card glass-card-hover rounded-2xl p-4 flex flex-col items-center text-center gap-2 border ${CARD[f.color]} group`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${CARD[f.color]}`}>
                {f.icon}
              </div>
              <div className={`text-2xl font-black font-mono ${
                f.color === "violet" ? "text-violet-300" : f.color === "sky" ? "text-sky-300" :
                f.color === "emerald" ? "text-emerald-300" : f.color === "amber" ? "text-amber-300" : "text-pink-300"
              }`}>{isLoading ? "…" : f.value}</div>
              <div className="text-[11px] text-slate-400 font-medium leading-tight group-hover:text-white transition-colors">{f.label}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {/* 14-day optimizer trend */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />SQL Optimizer — 14-Day Trend
          </div>
          {data?.recentTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.recentTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06d6a0" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06d6a0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false}
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} yAxisId="left" />
                <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="count" name="Queries" stroke="#7c3aed" strokeWidth={2} fill="url(#grad1)" />
                <Area yAxisId="right" type="monotone" dataKey="avg_gain" name="Avg Gain %" stroke="#06d6a0" strokeWidth={2} fill="url(#grad2)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No data yet — start optimizing!</div>
          )}
        </div>

        {/* Feature radar */}
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />Feature Usage Radar
          </div>
          {data?.totalActions > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData} margin={{ top: 4, right: 20, left: 20, bottom: 4 }}>
                <PolarGrid stroke="rgba(255,255,255,.08)" />
                <PolarAngleAxis dataKey="feature" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: "#64748b", fontSize: 8 }} axisLine={false} />
                <Radar name="Usage" dataKey="usage" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm text-center">
              Use multiple features to see radar chart
            </div>
          )}
        </div>
      </div>

      {/* Domain breakdown + issue types */}
      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        {/* Domain breakdown */}
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm font-bold mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />Optimization by Domain
          </div>
          {data?.domainBreakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.domainBreakdown.slice(0, 8)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                  <XAxis dataKey="domain" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Queries" radius={[4, 4, 0, 0]}>
                    {data.domainBreakdown.slice(0, 8).map((_: any, index: number) => (
                      <Cell key={index} fill={DOMAIN_COLORS[index % DOMAIN_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {data.domainBreakdown.slice(0, 5).map((d: any, i: number) => (
                  <div key={d.domain} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DOMAIN_COLORS[i] }} />
                    <span className="flex-1 text-slate-300">{d.domain}</span>
                    <span className="text-slate-400">{d.count} queries</span>
                    <span className="text-emerald-400 font-mono">+{d.avgGain}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">No domain data yet</div>
          )}
        </div>

        {/* Issue severity breakdown */}
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />Issues Fixed by Severity
          </div>
          {data?.issueTypes?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={data.issueTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="count" nameKey="severity" paddingAngle={3}>
                    {data.issueTypes.map((entry: any, i: number) => (
                      <Cell key={i} fill={SEVERITY_COLORS[entry.severity] ?? "#7c3aed"} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span className="text-[11px] text-slate-300">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {data.issueTypes.map((t: any) => (
                  <div key={t.severity} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: SEVERITY_COLORS[t.severity] ?? "#7c3aed" }} />
                    <span className="capitalize flex-1 text-slate-300">{t.severity}</span>
                    <span className="font-mono text-slate-400">{t.count} issues fixed</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">No issues data yet</div>
          )}
        </div>
      </div>

      {/* Top gains */}
      {data?.topGains?.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm font-bold mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />Top 5 Performance Wins
          </div>
          <div className="space-y-2">
            {data.topGains.map((q: any, i: number) => (
              <div key={q.id} className="flex items-center gap-3 py-2 border-b border-violet-500/5 last:border-0">
                <span className="text-sm font-black text-slate-500 w-5 flex-shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate text-slate-200">{q.title ?? "SQL Query"}</div>
                  <div className="text-[10px] text-slate-500">{q.domain} · {new Date(q.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-sm font-black text-emerald-400 font-mono">+{q.performanceGain}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
