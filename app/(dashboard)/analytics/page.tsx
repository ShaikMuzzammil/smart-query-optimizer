"use client";
// app/(dashboard)/analytics/page.tsx — Full platform analytics (all features)
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell, PieChart, Pie, Legend,
} from "recharts";
import {
  TrendingUp, Award, Target, Zap, Cpu, Gauge, BarChart3,
  Database, Calendar, Flame, ArrowRight, RefreshCw, Clock,
  Brain, Globe, Terminal, Activity, Code2, Layers,
} from "lucide-react";
import { DOMAIN_CONFIG, gainColor } from "@/lib/utils";
import { ExportMenu } from "@/components/optimizer/ExportMenu";

const SEV_COLORS: Record<string, string> = {
  critical: "#f72585", high: "#f97316", medium: "#fbbf24", low: "#06d6a0",
};
const DOMAIN_COLORS = [
  "#7c3aed","#06d6a0","#fbbf24","#38bdf8","#f72585",
  "#f97316","#10b981","#8b5cf6","#22d3ee","#ec4899","#84cc16","#fb923c",
];

function StatCard({ label, value, icon, color = "violet", sub, href }: {
  label: string; value: string | number; icon: React.ReactNode;
  color?: "violet" | "emerald" | "amber" | "sky" | "rose" | "pink";
  sub?: string; href?: string;
}) {
  const colors: Record<string, string> = {
    violet:  "bg-violet-500/15 text-violet-400 border-violet-500/20",
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    amber:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
    sky:     "bg-sky-500/15 text-sky-400 border-sky-500/20",
    rose:    "bg-rose-500/15 text-rose-400 border-rose-500/20",
    pink:    "bg-pink-500/15 text-pink-400 border-pink-500/20",
  };
  const textColors: Record<string, string> = {
    violet: "text-violet-300", emerald: "text-emerald-300",
    amber: "text-amber-300", sky: "text-sky-300", rose: "text-rose-300", pink: "text-pink-300",
  };
  const card = (
    <div className={`glass-card rounded-2xl p-5 ${href ? "hover:border-violet-500/30 transition-colors cursor-pointer" : ""}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${colors[color]}`}>
        {icon}
      </div>
      <div className={`text-2xl font-black font-mono ${textColors[color]}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold">{title}</h2>
      {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a1e] border border-violet-500/30 rounded-xl p-3 text-xs shadow-xl">
      {label && <div className="text-slate-400 mb-1.5">{label}</div>}
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

const FEATURE_COLORS: Record<string, string> = {
  "SQL Optimizer":  "#7c3aed",
  "Natural Language to SQL": "#38bdf8",
  "Schema Vault":   "#06d6a0",
  "SQL Playground": "#fbbf24",
};

export default function AnalyticsPage() {
  const { data, isLoading, mutate } = useSWR("/api/analytics", fetcher, { refreshInterval: 30_000 });

  const radarData = data ? [
    { subject: "Optimizer",  value: Math.min((data.totalQueries || 0) * 5, 100) },
    { subject: "NL to SQL",  value: Math.min((data.totalNl2sql || 0) * 8, 100) },
    { subject: "Avg Gain",   value: Math.min(data.avgGain || 0, 100) },
    { subject: "Issues Fixed", value: Math.min((data.totalIssuesFixed || 0) * 2, 100) },
    { subject: "Schema",     value: Math.min((data.totalSchemaUploads || 0) * 15, 100) },
  ] : [];

  const featureBreakdown = data ? [
    { name: "SQL Optimizer",  value: data.totalQueries || 0,       color: "#7c3aed", href: "/optimizer", icon: "⚡" },
    { name: "NL to SQL",     value: data.totalNl2sql || 0,          color: "#38bdf8", href: "/nl2sql",   icon: "🧠" },
    { name: "Schema Vault",  value: data.totalSchemaUploads || 0,   color: "#06d6a0", href: "/schema",   icon: "🗄️" },
    { name: "Playground",    value: data.totalPlayground || 0,      color: "#fbbf24", href: "/playground",icon: "🧪" },
  ] : [];

  const topGainsChartData = (data?.topGains ?? []).map((q: any) => ({
    name: (q.title ?? "").slice(0, 22) + ((q.title ?? "").length > 22 ? "…" : ""),
    gain: q.performanceGain,
    domain: q.domain,
  }));

  const dialectData = (data?.nl2sqlByDialect ?? []).map((d: any) => ({
    name: d.dialect ?? "PostgreSQL",
    value: d.count,
  }));

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
        <div className="mb-6"><h1 className="text-2xl font-black mb-1">Analytics</h1></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 rounded-2xl shimmer" />)}
        </div>
      </div>
    );
  }

  const hasData = (data?.totalAllFeatures ?? 0) > 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1">Platform Analytics</h1>
          <p className="text-slate-400 text-sm">
            Complete insights across all features
            {data?.totalAllFeatures ? ` · ${data.totalAllFeatures} total interactions` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()}
            className="p-2 rounded-lg border border-violet-500/20 hover:bg-violet-500/10 text-slate-400 hover:text-white transition-colors" title="Refresh data">
            <RefreshCw className="w-4 h-4" />
          </button>
          {hasData && (
            <ExportMenu label="Export Report" formats={["csv", "pdf"]}
              href={fmt => `/api/export?scope=all&format=${fmt}`} />
          )}
        </div>
      </div>

      {!hasData ? (
        <div className="glass-card rounded-2xl p-20 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-bold mb-2">No activity yet</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            Use any feature — Optimizer, NL to SQL, or Schema Vault — and your analytics will appear here.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/optimizer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all">
              <Zap className="w-4 h-4" /> SQL Optimizer
            </Link>
            <Link href="/nl2sql" className="inline-flex items-center gap-2 px-5 py-2.5 border border-violet-500/30 text-violet-300 text-sm font-semibold rounded-xl hover:bg-violet-500/10 transition-all">
              <Brain className="w-4 h-4" /> Natural Language to SQL
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ── Section 1: Platform KPIs ── */}
          <div className="mb-10">
            <SectionHeader title="Platform Overview" desc="Total activity across all features" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {featureBreakdown.map(f => (
                <motion.div key={f.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <Link href={f.href}>
                    <div className="glass-card rounded-2xl p-5 hover:border-violet-500/30 transition-all group cursor-pointer">
                      <div className="text-2xl mb-2">{f.icon}</div>
                      <div className="text-2xl font-black font-mono" style={{ color: f.color }}>{f.value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.name}</div>
                      <div className="mt-3 h-1 bg-violet-500/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((f.value / Math.max(data?.totalAllFeatures ?? 1, 1)) * 100, 100)}%`, background: f.color }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <StatCard label="Avg Perf. Gain" value={`+${data?.avgGain ?? 0}%`} icon={<TrendingUp className="w-4 h-4" />} color="emerald" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <StatCard label="Current Streak" value={`${data?.streak ?? 0}d`} icon={<Flame className="w-4 h-4" />} color="amber" sub="Consecutive active days" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <StatCard label="Issues Fixed" value={data?.totalIssuesFixed ?? 0} icon={<Target className="w-4 h-4" />} color="sky" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <StatCard label="Avg Cost Score" value={data?.avgCostScore != null ? `${data.avgCostScore}/100` : "—"} icon={<Gauge className="w-4 h-4" />} color="violet" sub="Lower = cheaper" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <StatCard label="Domains Covered" value={data?.domainBreakdown?.length ?? 0} icon={<Database className="w-4 h-4" />} color="emerald" sub="of 12 available" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <StatCard label="Total Sessions" value={data?.totalAllFeatures ?? 0} icon={<Activity className="w-4 h-4" />} color="pink" sub="All features combined" />
              </motion.div>
            </div>
          </div>

          {/* ── Section 2: Activity Trend (all features) ── */}
          <div className="mb-10">
            <SectionHeader title="Activity Over Time" desc="Daily usage across all features — last 14 days" />
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 glass-card rounded-2xl p-5">
                {data?.recentTrend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data.recentTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradSky" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#06d6a0" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06d6a0" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                      <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false}
                        tickFormatter={d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
                      <Area type="monotone" dataKey="count" name="SQL Optimizer" stroke="#7c3aed" strokeWidth={2} fill="url(#gradViolet)" />
                      <Area type="monotone" dataKey="nl2sql" name="NL to SQL" stroke="#38bdf8" strokeWidth={2} fill="url(#gradSky)" strokeDasharray="4 2" />
                      <Area type="monotone" dataKey="schemaUploads" name="Schema Uploads" stroke="#06d6a0" strokeWidth={2} fill="url(#gradEmerald)" strokeDasharray="2 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm text-center">
                    <div><Calendar className="w-8 h-8 mx-auto mb-2 text-violet-500/30" /><br />Use features for 2+ days to see trend data</div>
                  </div>
                )}
              </div>
              <div className="glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-1">Platform Profile</div>
                <div className="text-[11px] text-slate-500 mb-3">Usage across 5 dimensions</div>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(124,58,237,.15)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                    <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {radarData.map(d => (
                    <div key={d.subject} className="text-center">
                      <div className="text-[10px] font-bold text-violet-300">{d.value}</div>
                      <div className="text-[8px] text-slate-500 leading-tight">{d.subject}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: NL2SQL breakdown ── */}
          {(data?.totalNl2sql ?? 0) > 0 && (
            <div className="mb-10">
              <SectionHeader title="Natural Language to SQL" desc="Conversion activity and dialect breakdown" />
              <div className="grid lg:grid-cols-3 gap-5">
                <div className="glass-card rounded-2xl p-5">
                  <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-sky-400" />NL2SQL by Dialect
                  </div>
                  {dialectData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={dialectData} dataKey="value" nameKey="name" innerRadius={44} outerRadius={68} paddingAngle={3}>
                          {dialectData.map((_: any, i: number) => (
                            <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No dialect data</div>
                  )}
                </div>
                <div className="lg:col-span-2 glass-card rounded-2xl p-5">
                  <div className="text-sm font-semibold mb-4">NL2SQL Performance</div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Total Conversions", value: data?.totalNl2sql ?? 0, color: "text-sky-300" },
                      { label: "Dialects Used",     value: dialectData.length,     color: "text-violet-300" },
                      { label: "Schema-assisted",   value: "—",                    color: "text-emerald-300" },
                    ].map(s => (
                      <div key={s.label} className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3 text-center">
                        <div className={`text-xl font-black font-mono ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {dialectData.length > 0 && (
                    <div className="space-y-2.5">
                      {dialectData.map((d: any, i: number) => {
                        const pct = data?.totalNl2sql ? Math.round((d.value / data.totalNl2sql) * 100) : 0;
                        return (
                          <div key={d.name} className="flex items-center gap-3">
                            <Globe className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <div className="w-28 flex-shrink-0">
                              <div className="text-xs text-slate-300 truncate">{d.name}</div>
                              <div className="text-[9px] text-slate-500">{d.value} conversions</div>
                            </div>
                            <div className="flex-1 h-2 bg-violet-500/8 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }} />
                            </div>
                            <span className="text-xs text-slate-500 w-10 text-right">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Section 4: SQL Optimizer Issues + Top Gains ── */}
          <div className="mb-10">
            <SectionHeader title="SQL Optimizer Analysis" desc="Anti-pattern detection and best optimizations" />
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-400" />Issues by Severity
                </div>
                {data?.issueTypes?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.issueTypes} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="severity" type="category" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={64} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]}>
                        {(data.issueTypes as any[]).map((d, i) => (
                          <Cell key={i} fill={SEV_COLORS[d.severity] ?? "#7c3aed"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No issue data yet — optimize some queries!</div>
                )}
                {data?.issueTypes?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(SEV_COLORS).map(([sev, color]) => (
                      <span key={sev} className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />Top 5 Performance Gains
                </div>
                {topGainsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topGainsChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `+${v}%`} />
                      <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip content={<CustomTooltip />} formatter={(v: any) => [`+${v}%`, "Gain"]} />
                      <Bar dataKey="gain" name="Gain %" radius={[0, 6, 6, 0]}>
                        {topGainsChartData.map((_: any, i: number) => (
                          <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No query data yet</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 5: Domain Breakdown ── */}
          <div className="mb-10">
            <SectionHeader title="Domain Breakdown" desc="Which SQL domains you've worked on most" />
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-400" />Distribution
                </div>
                {data?.domainBreakdown?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data.domainBreakdown} dataKey="count" nameKey="domain" innerRadius={44} outerRadius={68} paddingAngle={3}>
                        {(data.domainBreakdown as any[]).map((_: any, i: number) => (
                          <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">No domain data</div>
                )}
              </div>
              <div className="lg:col-span-2 glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4">Performance by Domain</div>
                {data?.domainBreakdown?.length > 0 ? (
                  <div className="space-y-2.5">
                    {(data.domainBreakdown as any[]).map((d: any, i: number) => {
                      const dm = (DOMAIN_CONFIG as any)[d.domain] ?? (DOMAIN_CONFIG as any).General;
                      const pct = data.totalQueries ? Math.round((d.count / data.totalQueries) * 100) : 0;
                      return (
                        <div key={d.domain} className="flex items-center gap-3">
                          <span className="text-base w-6 flex-shrink-0">{dm?.icon ?? "📊"}</span>
                          <div className="w-32 flex-shrink-0">
                            <div className="text-xs text-slate-300 truncate">{d.domain}</div>
                            <div className="text-[9px] text-slate-500">{d.count} queries</div>
                          </div>
                          <div className="flex-1 h-2 bg-violet-500/8 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }} />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                          <span className={`text-xs font-mono font-bold w-14 text-right ${gainColor(d.avgGain)}`}>+{d.avgGain}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm py-8">Optimize a few queries to see domain breakdown</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 6: Engine Insights + Cost ── */}
          <div className="mb-10">
            <SectionHeader title="Engine Insights" desc="Processing performance and query cost scores" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-violet-400" />Engine Usage
                </div>
                {data?.engineBreakdown?.length > 0 ? (
                  <div className="space-y-3">
                    {(data.engineBreakdown as any[]).map((e: any, i: number) => {
                      const pct = data.totalQueries ? Math.round((e.count / data.totalQueries) * 100) : 0;
                      const colors = ["#7c3aed","#38bdf8","#06d6a0"];
                      const label = e.engine === "ai" || e.engine === "engine-b" ? "Primary Engine" : e.engine === "engine-a" ? "Fallback Engine" : "Query Engine";
                      return (
                        <div key={e.engine}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-200">{label}</span>
                            <span className="text-xs text-slate-400">{e.count} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-violet-500/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Dual-engine architecture ensures <strong className="text-violet-400">99.9% uptime</strong> — if one engine is rate-limited, the other activates automatically.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">No engine data yet</div>
                )}
              </div>
              <div className="glass-card rounded-2xl p-5 flex flex-col">
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-violet-400" />Avg Cost Score
                </div>
                {data?.avgCostScore != null ? (
                  <>
                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                      <div className="relative w-28 h-28">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(124,58,237,.1)" strokeWidth="10" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#7c3aed" strokeWidth="10"
                            strokeDasharray={`${data.avgCostScore * 2.51} 251`}
                            strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black font-mono text-violet-300">{data.avgCostScore}</span>
                          <span className="text-[9px] text-slate-500">/100</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">Lower = cheaper query execution. Based on AI cost estimates across optimized queries.</p>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No cost data yet</div>
                )}
              </div>
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />🏆 Top Gains
                  </div>
                  <Link href="/history" className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                    See all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {data?.topGains?.length > 0 ? (
                  <div className="space-y-3">
                    {(data.topGains as any[]).slice(0, 5).map((q: any, i: number) => {
                      const dm = (DOMAIN_CONFIG as any)[q.domain] ?? (DOMAIN_CONFIG as any).General;
                      return (
                        <div key={q.id} className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold text-slate-600 w-4 flex-shrink-0">#{i + 1}</span>
                          <span className="text-base flex-shrink-0">{dm?.icon ?? "📊"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium truncate text-slate-200">{q.title}</div>
                            <div className="mt-0.5 h-1 bg-violet-500/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
                                style={{ width: `${q.performanceGain}%` }} />
                            </div>
                          </div>
                          <span className={`text-xs font-bold font-mono ${gainColor(q.performanceGain)} flex-shrink-0`}>
                            +{q.performanceGain}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">No top gains yet</div>
                )}
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="glass-card rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-bold mb-1">Explore all features</div>
              <p className="text-xs text-slate-400">Analytics update automatically as you use each feature.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ExportMenu label="Export Report" formats={["csv", "pdf"]} href={fmt => `/api/export?scope=all&format=${fmt}`} />
              <Link href="/optimizer" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all">
                <Zap className="w-3.5 h-3.5" /> SQL Optimizer
              </Link>
              <Link href="/nl2sql" className="flex items-center gap-2 px-4 py-2 border border-violet-500/30 text-violet-300 text-sm font-semibold rounded-xl hover:bg-violet-500/10 transition-all">
                <Brain className="w-3.5 h-3.5" /> NL to SQL
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
