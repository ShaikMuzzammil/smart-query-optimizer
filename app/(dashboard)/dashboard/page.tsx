"use client";
// app/(dashboard)/dashboard/page.tsx
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion } from "framer-motion";
import Link from "next/link";
import { DOMAIN_CONFIG, gainColor, timeAgo } from "@/lib/utils";
import {
  Zap, TrendingUp, Database, Flame, ArrowRight, Plus, Clock,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

const DOMAIN_COLORS = ["#7c3aed","#06d6a0","#fbbf24","#38bdf8","#f72585","#f97316","#10b981","#8b5cf6"];

export default function DashboardPage() {
  const { data: analytics, isLoading: aLoading } = useSWR("/api/analytics", fetcher, { refreshInterval: 30000 });
  const { data: recentData } = useSWR("/api/queries?limit=5", fetcher, { refreshInterval: 15000 });

  const stats = [
    { label: "Total Optimizations", value: analytics?.totalQueries ?? 0, icon: <Zap className="w-4 h-4"/>, color: "violet" },
    { label: "Avg Performance Gain", value: `+${analytics?.avgGain ?? 0}%`, icon: <TrendingUp className="w-4 h-4"/>, color: "emerald" },
    { label: "Issues Fixed", value: analytics?.totalIssuesFixed ?? 0, icon: <Database className="w-4 h-4"/>, color: "sky" },
    { label: "Day Streak", value: analytics?.streak ?? 0, icon: <Flame className="w-4 h-4"/>, color: "amber" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black mb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm">Your SQL optimization workspace at a glance</p>
        </div>
        <Link href="/optimizer" className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all glow-violet">
          <Plus className="w-4 h-4"/>New Optimization
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}
            className="glass-card glass-card-hover rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3
              ${s.color==="violet"?"bg-violet-500/15 text-violet-400":
                s.color==="emerald"?"bg-emerald-500/15 text-emerald-400":
                s.color==="sky"?"bg-sky-500/15 text-sky-400":"bg-amber-500/15 text-amber-400"}`}>
              {s.icon}
            </div>
            <div className="text-2xl font-black font-mono">{aLoading ? "—" : s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {/* Trend chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="text-sm font-semibold mb-4">Optimization Activity (14 days)</div>
          {analytics?.recentTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.recentTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
                <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}
                  tickFormatter={(d)=>new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"})}/>
                <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:"#0a0a1e",border:"1px solid rgba(124,58,237,.3)",borderRadius:8,fontSize:11}}/>
                <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} fill="url(#colorCount)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No data yet — optimize your first query!</div>
          )}
        </div>

        {/* Domain breakdown */}
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm font-semibold mb-4">By Domain</div>
          {analytics?.domainBreakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={analytics.domainBreakdown} dataKey="count" nameKey="domain" innerRadius={35} outerRadius={55} paddingAngle={3}>
                    {analytics.domainBreakdown.map((_: any, i: number) => <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:"#0a0a1e",border:"1px solid rgba(124,58,237,.3)",borderRadius:8,fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {analytics.domainBreakdown.slice(0,5).map((d: any, i: number) => (
                  <div key={d.domain} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:DOMAIN_COLORS[i%DOMAIN_COLORS.length]}}/>{d.domain}</span>
                    <span className="text-slate-400">{d.count} · +{d.avgGain}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm text-center">No domains yet</div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Recent Optimizations</div>
          <Link href="/history" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">View all <ArrowRight className="w-3 h-3"/></Link>
        </div>
        {recentData?.queries?.length > 0 ? (
          <div className="space-y-2">
            {recentData.queries.map((q: any) => {
              const dm = DOMAIN_CONFIG[q.domain] ?? DOMAIN_CONFIG.General;
              return (
                <Link key={q.id} href="/history" className="flex items-center gap-3 p-3 rounded-xl hover:bg-violet-500/5 transition-colors border border-transparent hover:border-violet-500/15">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{background:`${dm.color}18`}}>{dm.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{q.title}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3"/>{timeAgo(q.createdAt)} · {q.domain}
                    </div>
                  </div>
                  <div className={`text-sm font-bold font-mono ${gainColor(q.performanceGain)}`}>+{q.performanceGain}%</div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-3xl mb-3">⚡</div>
            <p className="text-sm text-slate-400 mb-4">No optimizations yet — let&apos;s fix your first query!</p>
            <Link href="/optimizer" className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium rounded-lg">
              <Zap className="w-3.5 h-3.5"/>Optimize Your First Query
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
