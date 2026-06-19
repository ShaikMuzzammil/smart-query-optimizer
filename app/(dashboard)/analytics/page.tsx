"use client";
// app/(dashboard)/analytics/page.tsx
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion } from "framer-motion";
import { DOMAIN_CONFIG, gainColor, timeAgo } from "@/lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell,
} from "recharts";
import { TrendingUp, Award, Target, Zap } from "lucide-react";

const SEV_COLORS: Record<string,string> = { critical:"#f72585", high:"#f97316", medium:"#fbbf24", low:"#06d6a0" };
const DOMAIN_COLORS = ["#7c3aed","#06d6a0","#fbbf24","#38bdf8","#f72585","#f97316","#10b981","#8b5cf6"];

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR("/api/analytics", fetcher, { refreshInterval: 30000 });

  const radarData = data ? [
    { subject: "Volume", value: Math.min((data.totalQueries||0)*5, 100) },
    { subject: "Avg Gain", value: data.avgGain || 0 },
    { subject: "Consistency", value: Math.min((data.streak||0)*10, 100) },
    { subject: "Issues Fixed", value: Math.min((data.totalIssuesFixed||0)*3, 100) },
    { subject: "Domain Coverage", value: Math.min((data.domainBreakdown?.length||0)*15, 100) },
  ] : [];

  return (
    <div className="p-6 lg:p-8 max-w-[1500px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1">Analytics</h1>
        <p className="text-slate-400 text-sm">Deep insights into your optimization patterns</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i)=>(<div key={i} className="h-28 rounded-2xl shimmer"/>))}</div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label:"Total Queries", value: data?.totalQueries ?? 0, icon:<Zap className="w-4 h-4"/>, color:"#a78bfa" },
              { label:"Avg Gain", value:`+${data?.avgGain ?? 0}%`, icon:<TrendingUp className="w-4 h-4"/>, color:"#06d6a0" },
              { label:"Best Streak", value:`${data?.streak ?? 0} days`, icon:<Award className="w-4 h-4"/>, color:"#fbbf24" },
              { label:"Issues Fixed", value: data?.totalIssuesFixed ?? 0, icon:<Target className="w-4 h-4"/>, color:"#38bdf8" },
            ].map((s,i)=>(
              <motion.div key={s.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}
                className="glass-card rounded-2xl p-5 text-center">
                <div className="text-2xl font-black font-mono mb-1" style={{color:s.color}}>{s.value}</div>
                <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5">{s.icon}{s.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            {/* Issue severity chart */}
            <div className="glass-card rounded-2xl p-5">
              <div className="text-sm font-semibold mb-4">Issues by Severity</div>
              {data?.issueTypes?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.issueTypes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false}/>
                    <XAxis type="number" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis dataKey="severity" type="category" tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false} width={70}/>
                    <Tooltip contentStyle={{background:"#0a0a1e",border:"1px solid rgba(124,58,237,.3)",borderRadius:8,fontSize:11}}/>
                    <Bar dataKey="count" radius={[0,6,6,0]}>
                      {data.issueTypes.map((d:any,i:number)=><Cell key={i} fill={SEV_COLORS[d.severity]||"#7c3aed"}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No issues data yet</div>}
            </div>

            {/* Performance radar */}
            <div className="glass-card rounded-2xl p-5">
              <div className="text-sm font-semibold mb-4">Optimization Profile</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(124,58,237,.15)"/>
                  <PolarAngleAxis dataKey="subject" tick={{fill:"#94a3b8",fontSize:10}}/>
                  <PolarRadiusAxis tick={false} axisLine={false}/>
                  <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={2}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Trend over time */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-5">
              <div className="text-sm font-semibold mb-4">Performance Gain Trend</div>
              {data?.recentTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.recentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
                    <XAxis dataKey="date" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}
                      tickFormatter={(d)=>new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"})}/>
                    <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:"#0a0a1e",border:"1px solid rgba(124,58,237,.3)",borderRadius:8,fontSize:11}}/>
                    <Line type="monotone" dataKey="avgGain" stroke="#06d6a0" strokeWidth={2} dot={{fill:"#06d6a0",r:3}}/>
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No trend data yet</div>}
            </div>

            {/* Top performing queries */}
            <div className="glass-card rounded-2xl p-5">
              <div className="text-sm font-semibold mb-4">🏆 Top Gains</div>
              <div className="space-y-2.5">
                {data?.topGains?.length > 0 ? data.topGains.map((q: any, i: number) => {
                  const dm = DOMAIN_CONFIG[q.domain] ?? DOMAIN_CONFIG.General;
                  return (
                    <div key={q.id} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-violet-500/15 flex items-center justify-center text-[10px] font-bold text-violet-400 flex-shrink-0">{i+1}</div>
                      <span className="text-sm flex-shrink-0">{dm.icon}</span>
                      <div className="flex-1 min-w-0 text-xs text-slate-300 truncate">{q.title}</div>
                      <div className={`text-xs font-bold font-mono ${gainColor(q.performanceGain)}`}>+{q.performanceGain}%</div>
                    </div>
                  );
                }) : <div className="text-sm text-slate-500 text-center py-8">No queries yet</div>}
              </div>
            </div>
          </div>

          {/* Domain breakdown table */}
          <div className="glass-card rounded-2xl p-5 mt-5">
            <div className="text-sm font-semibold mb-4">Domain Performance Breakdown</div>
            {data?.domainBreakdown?.length > 0 ? (
              <div className="space-y-2">
                {data.domainBreakdown.map((d: any, i: number) => {
                  const dm = DOMAIN_CONFIG[d.domain] ?? DOMAIN_CONFIG.General;
                  const pct = data.totalQueries ? Math.round((d.count/data.totalQueries)*100) : 0;
                  return (
                    <div key={d.domain} className="flex items-center gap-3">
                      <span className="text-base w-6">{dm.icon}</span>
                      <span className="text-xs text-slate-300 w-28 flex-shrink-0">{d.domain}</span>
                      <div className="flex-1 h-2 bg-violet-500/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${pct}%`, background: DOMAIN_COLORS[i%DOMAIN_COLORS.length]}}/>
                      </div>
                      <span className="text-xs text-slate-400 w-12 text-right">{d.count}</span>
                      <span className="text-xs font-mono text-emerald-400 w-12 text-right">+{d.avgGain}%</span>
                    </div>
                  );
                })}
              </div>
            ) : <div className="text-sm text-slate-500 text-center py-8">No domain data yet</div>}
          </div>
        </>
      )}
    </div>
  );
}
