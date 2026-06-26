"use client";
// app/(dashboard)/analytics/page.tsx
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

function StatCard({ label, value, icon, color = "violet", sub }: {
  label: string; value: string | number; icon: React.ReactNode;
  color?: "violet" | "emerald" | "amber" | "sky" | "rose";
  sub?: string;
}) {
  const colors: Record<string, string> = {
    violet:  "bg-violet-500/15 text-violet-400 border-violet-500/20",
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    amber:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
    sky:     "bg-sky-500/15 text-sky-400 border-sky-500/20",
    rose:    "bg-rose-500/15 text-rose-400 border-rose-500/20",
  };
  const textColors: Record<string, string> = {
    violet: "text-violet-300", emerald: "text-emerald-300",
    amber: "text-amber-300", sky: "text-sky-300", rose: "text-rose-300",
  };
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${colors[color]}`}>
        {icon}
      </div>
      <div className={`text-2xl font-black font-mono ${textColors[color]}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-1">{sub}</div>}
    </div>
  );
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

export default function AnalyticsPage() {
  const { data, isLoading, mutate } = useSWR("/api/analytics", fetcher, { refreshInterval: 30_000 });

  const radarData = data ? [
    { subject: "Volume",       value: Math.min((data.totalQueries || 0) * 5, 100) },
    { subject: "Avg Gain",     value: Math.min(data.avgGain || 0, 100) },
    { subject: "Consistency",  value: Math.min((data.streak || 0) * 10, 100) },
    { subject: "Issues Fixed", value: Math.min((data.totalIssuesFixed || 0) * 2, 100) },
    { subject: "Coverage",     value: Math.min((data.domainBreakdown?.length || 0) * 8, 100) },
  ] : [];

  const topGainsChartData = (data?.topGains ?? []).map((q: any) => ({
    name: (q.title ?? "").slice(0, 22) + ((q.title ?? "").length > 22 ? "…" : ""),
    gain: q.performanceGain,
    domain: q.domain,
  }));

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
        <div className="mb-6"><h1 className="text-2xl font-black mb-1">Analytics</h1></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-2xl shimmer" />)}
        </div>
      </div>
    );
  }

  const hasData = (data?.totalQueries ?? 0) > 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-black mb-1">Analytics</h1>
          <p className="text-slate-400 text-sm">
            Deep insights into your optimization history
            {data?.totalQueries ? ` · ${data.totalQueries} total optimizations` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()}
            className="p-2 rounded-lg border border-violet-500/20 hover:bg-violet-500/10 text-slate-400 hover:text-white transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          {hasData && (
            <ExportMenu label="Export Report" formats={["csv", "pdf"]}
              href={fmt => `/api/export?scope=all&format=${fmt}`} />
          )}
        </div>
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="glass-card rounded-2xl p-20 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-bold mb-2">No data yet</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
            Optimize your first SQL query and come back — your analytics will appear here automatically.
          </p>
          <Link href="/optimizer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all">
            <Zap className="w-4 h-4" /> Optimize Your First Query
          </Link>
        </div>
      ) : (
        <>
          {/* ── Section 1: KPI Summary ── */}
          <div className="mb-10">
            <SectionHeader title="Performance Summary" desc="Key metrics across all your optimizations" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <StatCard label="Total Optimizations" value={data?.totalQueries ?? 0} icon={<Zap className="w-4 h-4" />} color="violet" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <StatCard label="Avg Performance Gain" value={`+${data?.avgGain ?? 0}%`} icon={<TrendingUp className="w-4 h-4" />} color="emerald" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <StatCard label="Current Streak" value={`${data?.streak ?? 0} days`} icon={<Flame className="w-4 h-4" />} color="amber"
                  sub="Consecutive days optimizing" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <StatCard label="Total Issues Fixed" value={data?.totalIssuesFixed ?? 0} icon={<Target className="w-4 h-4" />} color="sky" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <StatCard label="Avg Cost Score" value={data?.avgCostScore != null ? `${data.avgCostScore}/100` : "—"} icon={<Gauge className="w-4 h-4" />} color="violet"
                  sub="Lower is better" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <StatCard label="Domains Covered" value={data?.domainBreakdown?.length ?? 0} icon={<Database className="w-4 h-4" />} color="emerald"
                  sub="of 12 available" />
              </motion.div>
            </div>
          </div>

          {/* ── Section 2: Trend + Radar ── */}
          <div className="mb-10">
            <SectionHeader title="Performance Over Time" desc="Optimization activity and average gains for the last 14 days" />
            <div className="grid lg:grid-cols-3 gap-5">
              {/* Area chart — last 14 days */}
              <div className="lg:col-span-2 glass-card rounded-2xl p-5">
                {data?.recentTrend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={data.recentTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
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
                      <Area type="monotone" dataKey="count" name="Queries" stroke="#7c3aed" strokeWidth={2} fill="url(#gradViolet)" />
                      <Area type="monotone" dataKey="avg_gain" name="Avg Gain %" stroke="#06d6a0" strokeWidth={2} fill="url(#gradEmerald)" strokeDasharray="4 2" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm text-center">
                    <div><Calendar className="w-8 h-8 mx-auto mb-2 text-violet-500/30" /><br />Optimize queries for 2+ days to see trend data</div>
                  </div>
                )}
              </div>

              {/* Optimization profile radar */}
              <div className="glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-1">Optimization Profile</div>
                <div className="text-[11px] text-slate-500 mb-3">Your performance across 5 dimensions</div>
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

          {/* ── Section 3: Issues + Top Gains ── */}
          <div className="mb-10">
            <SectionHeader title="Issue Analysis" desc="Breakdown of detected anti-patterns and your best optimizations" />
            <div className="grid lg:grid-cols-2 gap-5">
              {/* Issues by severity */}
              <div className="glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-400" />Issues by Severity
                </div>
                {data?.issueTypes?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.issueTypes} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="severity" type="category" tick={{ fill: "#94a3b8", fontSize: 10 }}
                        axisLine={false} tickLine={false} width={64} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]}>
                        {(data.issueTypes as any[]).map((d, i) => (
                          <Cell key={i} fill={SEV_COLORS[d.severity] ?? "#7c3aed"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No issue data yet</div>
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

              {/* Top gains bar chart */}
              <div className="glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />Top 5 Performance Gains
                </div>
                {topGainsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topGainsChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false}
                        tickFormatter={v => `+${v}%`} />
                      <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 9 }}
                        axisLine={false} tickLine={false} width={100} />
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

          {/* ── Section 4: Domain breakdown ── */}
          <div className="mb-10">
            <SectionHeader title="Domain Breakdown" desc="Which SQL domains you've optimized most, with average performance gains" />
            <div className="grid lg:grid-cols-3 gap-5">
              {/* Pie chart */}
              <div className="glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-400" />Distribution
                </div>
                {data?.domainBreakdown?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data.domainBreakdown} dataKey="count" nameKey="domain"
                        innerRadius={44} outerRadius={68} paddingAngle={3}>
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

              {/* Domain table */}
              <div className="lg:col-span-2 glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4">Performance by Domain</div>
                {data?.domainBreakdown?.length > 0 ? (
                  <div className="space-y-2.5">
                    {(data.domainBreakdown as any[]).map((d: any, i: number) => {
                      const dm = DOMAIN_CONFIG[d.domain] ?? DOMAIN_CONFIG.General;
                      const pct = data.totalQueries ? Math.round((d.count / data.totalQueries) * 100) : 0;
                      return (
                        <div key={d.domain} className="flex items-center gap-3">
                          <span className="text-base w-6 flex-shrink-0">{dm.icon}</span>
                          <div className="w-32 flex-shrink-0">
                            <div className="text-xs text-slate-300 truncate">{d.domain}</div>
                            <div className="text-[9px] text-slate-500">{d.count} queries</div>
                          </div>
                          <div className="flex-1 h-2 bg-violet-500/8 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }} />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                          <span className={`text-xs font-mono font-bold w-14 text-right ${gainColor(d.avgGain)}`}>+{d.avgGain}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm py-8">
                    Optimize a few queries to see domain breakdown
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 5: AI Engine + Cost ── */}
          <div className="mb-10">
            <SectionHeader title="AI Engine Insights" desc="Which provider handled each optimization and average query cost scores" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Engine usage */}
              <div className="glass-card rounded-2xl p-5">
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-violet-400" />Engine Usage
                </div>
                {data?.engineBreakdown?.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {(data.engineBreakdown as any[]).map((e: any) => {
                        const pct = data.totalQueries ? Math.round((e.count / data.totalQueries) * 100) : 0;
                        const isGemini = e.engine === "gemini";
                        return (
                          <div key={e.engine}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold capitalize text-slate-200">{e.engine}</span>
                              <span className="text-xs text-slate-400">{e.count} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-violet-500/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: isGemini ? "#38bdf8" : "#7c3aed" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        <strong className="text-violet-400">Claude</strong> is the primary engine.
                        <strong className="text-sky-400"> Gemini</strong> activates automatically if Claude is rate-limited or unavailable — so you always get a result.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">No engine data yet</div>
                )}
              </div>

              {/* Avg cost score */}
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
                    <p className="text-[11px] text-slate-500 text-center">Lower = cheaper query execution. Based on AI cost estimates across your optimized queries.</p>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No cost data yet</div>
                )}
              </div>

              {/* Top gains list */}
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
                      const dm = DOMAIN_CONFIG[q.domain] ?? DOMAIN_CONFIG.General;
                      return (
                        <div key={q.id} className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold text-slate-600 w-4 flex-shrink-0">#{i + 1}</span>
                          <span className="text-base flex-shrink-0">{dm.icon}</span>
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
              <div className="font-bold mb-1">Ready to optimize more queries?</div>
              <p className="text-xs text-slate-400">Your analytics will update automatically as you optimize.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ExportMenu label="Export Report" formats={["csv", "pdf"]}
                href={fmt => `/api/export?scope=all&format=${fmt}`} />
              <Link href="/optimizer"
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all">
                <Zap className="w-3.5 h-3.5" /> New Optimization
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
