"use client";
// app/(dashboard)/dashboard/page.tsx
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DOMAIN_CONFIG, gainColor, timeAgo } from "@/lib/utils";
import {
  Zap, TrendingUp, Database, Flame, ArrowRight, Plus, Clock,
  BookOpen, History, BarChart3, Sparkles, Award, Gauge,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

const DOMAIN_COLORS = ["#7c3aed","#06d6a0","#fbbf24","#38bdf8","#f72585","#f97316","#10b981","#8b5cf6"];

const QUICK_ACTIONS = [
  { href: "/optimizer",  icon: Zap,      label: "New Optimization", desc: "Optimize a SQL query with AI",      color: "violet" },
  { href: "/examples",   icon: BookOpen, label: "Browse Examples",  desc: "99 real queries to learn from",    color: "sky"    },
  { href: "/history",    icon: History,  label: "View History",     desc: "Past optimizations + exports",     color: "emerald"},
  { href: "/analytics",  icon: BarChart3,label: "Analytics",        desc: "Charts, trends, and insights",     color: "amber"  },
];

const CARD_COLOR: Record<string, string> = {
  violet:  "bg-violet-500/15 text-violet-400 border-violet-500/20",
  sky:     "bg-sky-500/15 text-sky-400 border-sky-500/20",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  amber:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

function GreetingTime() {
  const h = new Date().getHours();
  if (h < 12) return <>Good morning</>;
  if (h < 17) return <>Good afternoon</>;
  return <>Good evening</>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: analytics, isLoading: aLoading } = useSWR("/api/analytics", fetcher, { refreshInterval: 30_000 });
  const { data: recentData } = useSWR("/api/queries?limit=5", fetcher, { refreshInterval: 15_000 });

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const kpis = [
    { label: "Total Optimizations", value: analytics?.totalQueries ?? 0,           icon: <Zap className="w-4 h-4"/>,       color: "violet" },
    { label: "Avg Performance Gain", value: `+${analytics?.avgGain ?? 0}%`,         icon: <TrendingUp className="w-4 h-4"/>, color: "emerald" },
    { label: "Issues Fixed",          value: analytics?.totalIssuesFixed ?? 0,       icon: <Database className="w-4 h-4"/>,  color: "sky"    },
    { label: "Day Streak",            value: analytics?.streak ?? 0,                icon: <Flame className="w-4 h-4"/>,     color: "amber"  },
    { label: "Avg Cost Score",        value: analytics?.avgCostScore != null ? `${analytics.avgCostScore}/100` : "—", icon: <Gauge className="w-4 h-4"/>, color: "violet" },
    { label: "Top Gain",             value: analytics?.topGains?.[0] ? `+${analytics.topGains[0].performanceGain}%` : "—", icon: <Award className="w-4 h-4"/>, color: "emerald" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">

      {/* Header */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
        className="flex items-center justify-between mb-7 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black mb-0.5">
            <GreetingTime />, {firstName} 👋
          </h1>
          <p className="text-slate-400 text-sm">Your SQL optimization workspace</p>
        </div>
        <Link href="/optimizer"
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all glow-violet">
          <Plus className="w-4 h-4"/>New Optimization
        </Link>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map((a, i) => (
          <motion.div key={a.href} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}>
            <Link href={a.href}
              className={`glass-card glass-card-hover rounded-2xl p-4 flex items-start gap-3 border ${CARD_COLOR[a.color]} group`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${CARD_COLOR[a.color]}`}>
                <a.icon className="w-4 h-4"/>
              </div>
              <div>
                <div className="text-sm font-semibold group-hover:text-white transition-colors">{a.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{a.desc}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpis.map((s, i) => (
          <motion.div key={s.label} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}
            className="glass-card rounded-2xl p-4 text-center">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 mx-auto
              ${s.color==="violet"?"bg-violet-500/15 text-violet-400 border border-violet-500/20":
                s.color==="emerald"?"bg-emerald-500/15 text-emerald-400 border border-emerald-500/20":
                s.color==="sky"?"bg-sky-500/15 text-sky-400 border border-sky-500/20":
                "bg-amber-500/15 text-amber-400 border border-amber-500/20"}`}>
              {s.icon}
            </div>
            <div className="text-xl font-black font-mono">{aLoading ? "—" : s.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">

        {/* Activity trend chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400"/>
            Optimization Activity — last 14 days
          </div>
          {analytics?.recentTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={analytics.recentTrend} margin={{top:4,right:4,left:-24,bottom:0}}>
                <defs>
                  <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradGain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06d6a0" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#06d6a0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
                <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false}
                  tickFormatter={(d) => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"})}/>
                <YAxis tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false}/>
                <Tooltip
                  contentStyle={{background:"#0a0a1e",border:"1px solid rgba(124,58,237,.3)",borderRadius:8,fontSize:11}}
                  formatter={(val: any, name: string) => [val, name === "count" ? "Queries" : "Avg Gain %"]}/>
                <Area type="monotone" dataKey="count"    stroke="#7c3aed" strokeWidth={2} fill="url(#gradCount)" name="count"/>
                <Area type="monotone" dataKey="avg_gain" stroke="#06d6a0" strokeWidth={1.5} fill="url(#gradGain)" strokeDasharray="4 2" name="avg_gain"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-slate-500 text-sm gap-3">
              <Zap className="w-8 h-8 text-violet-500/30"/>
              Optimize your first query to start tracking activity
            </div>
          )}
        </div>

        {/* Domain pie + legend */}
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm font-semibold mb-4">By Domain</div>
          {analytics?.domainBreakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={analytics.domainBreakdown} dataKey="count" nameKey="domain"
                    innerRadius={34} outerRadius={52} paddingAngle={3}>
                    {analytics.domainBreakdown.map((_: any, i: number) =>
                      <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:"#0a0a1e",border:"1px solid rgba(124,58,237,.3)",borderRadius:8,fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {analytics.domainBreakdown.slice(0,6).map((d: any, i: number) => (
                  <div key={d.domain} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:DOMAIN_COLORS[i%DOMAIN_COLORS.length]}}/>
                      <span className="truncate max-w-[100px]">{d.domain}</span>
                    </span>
                    <span className="text-slate-400 font-mono">{d.count} · <span className="text-emerald-400">+{d.avgGain}%</span></span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm text-center">
              Domain breakdown will appear after your first optimization
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent activity */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Recent Optimizations</div>
            <Link href="/history" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3"/>
            </Link>
          </div>
          {recentData?.queries?.length > 0 ? (
            <div className="space-y-1.5">
              {recentData.queries.map((q: any) => {
                const dm = DOMAIN_CONFIG[q.domain] ?? DOMAIN_CONFIG.General;
                return (
                  <Link key={q.id} href={`/history`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-violet-500/5 transition-colors border border-transparent hover:border-violet-500/10">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{background:`${dm.color}18`}}>
                      {dm.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{q.title}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-2.5 h-2.5"/>{timeAgo(q.createdAt)}
                        <span className="text-slate-600">·</span>{q.domain}
                        {q.engine && q.engine !== "claude" && (
                          <span className="text-sky-500 capitalize">· via {q.engine}</span>
                        )}
                      </div>
                    </div>
                    <div className={`text-sm font-bold font-mono flex-shrink-0 ${gainColor(q.performanceGain)}`}>
                      +{q.performanceGain}%
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-sm text-slate-400 mb-4">No optimizations yet — let&apos;s fix your first query!</p>
              <Link href="/optimizer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium rounded-lg hover:bg-violet-500/20 transition-colors">
                <Zap className="w-3.5 h-3.5"/>Optimize Your First Query
              </Link>
            </div>
          )}
        </div>

        {/* Top gains + AI engine mix */}
        <div className="space-y-5">
          {/* Top gains */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold flex items-center gap-2"><Award className="w-3.5 h-3.5 text-amber-400"/>Top Gains</div>
              <Link href="/analytics" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                Full analytics <ArrowRight className="w-3 h-3"/>
              </Link>
            </div>
            {analytics?.topGains?.length > 0 ? (
              <div className="space-y-2">
                {analytics.topGains.slice(0, 4).map((q: any, i: number) => (
                  <div key={q.id} className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-slate-600 w-4 text-right flex-shrink-0">#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium truncate">{q.title}</div>
                      <div className="mt-1 h-1 bg-violet-500/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
                          style={{width:`${Math.min(100, q.performanceGain)}%`}}/>
                      </div>
                    </div>
                    <div className={`text-xs font-bold font-mono flex-shrink-0 ${gainColor(q.performanceGain)}`}>
                      +{q.performanceGain}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">No data yet</div>
            )}
          </div>

          {/* AI engine badge */}
          {analytics?.engineBreakdown?.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400"/>AI Engine Mix
              </div>
              <div className="space-y-2">
                {analytics.engineBreakdown.map((e: any) => {
                  const pct = analytics.totalQueries ? Math.round((e.count / analytics.totalQueries) * 100) : 0;
                  return (
                    <div key={e.engine} className="flex items-center gap-2.5">
                      <span className="text-[11px] capitalize w-14 flex-shrink-0 text-slate-300">{e.engine}</span>
                      <div className="flex-1 h-1.5 bg-violet-500/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{width:`${pct}%`, background: e.engine === "gemini" ? "#38bdf8" : "#7c3aed"}}/>
                      </div>
                      <span className="text-[10px] text-slate-500 w-12 text-right">{e.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-600 mt-2">Gemini activates automatically when Claude is unavailable.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
