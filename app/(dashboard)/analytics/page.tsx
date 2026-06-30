"use client";
// app/(dashboard)/analytics/page.tsx — FIX #3 & #9: universal across ALL features
import useSWR from "swr";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Zap, Brain, Database, Terminal, Download,
  Flame, Target, AlertTriangle, Award, Activity,
} from "lucide-react";
import { fetcher } from "@/hooks/useSwrFetcher";
import { ExportMenu } from "@/components/optimizer/ExportMenu";

interface AnalyticsData {
  totalQueries: number; avgGain: number; totalIssuesFixed: number; streak: number;
  avgCostScore: number | null;
  domainBreakdown: Array<{ domain: string; count: number; avgGain: number }>;
  recentTrend: Array<{ date: string; count: number; avg_gain: number }>;
  topGains: Array<{ id: string; title: string; domain: string; performanceGain: number; createdAt: string }>;
  issueTypes: Array<{ severity: string; count: number }>;
  featureUsage: { optimizer: number; nl2sql: number; schema: number; playground: number; export: number };
  totalActions: number;
  nl2sqlTrend: Array<{ date: string; count: number }>;
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-[#08081a] rounded-xl border border-violet-500/15 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg bg-${color}-500/15 flex items-center justify-center`}>
          <Icon className={`w-4 h-4 text-${color}-400`}/>
        </div>
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-[9px] text-slate-600 mt-1">{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR<AnalyticsData>("/api/analytics", fetcher, { refreshInterval: 30000 });

  if (isLoading || !data) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-slate-500 text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 animate-pulse"/> Loading analytics across all features…
        </div>
      </div>
    );
  }

  const maxTrendCount = Math.max(1, ...data.recentTrend.map(t => t.count));
  const maxFeature = Math.max(1, ...Object.values(data.featureUsage));

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-400"/> Analytics
          </h1>
          {/* FIX #3 & #9: universal, all features */}
          <p className="text-slate-400 text-sm mt-1">
            Performance statistics across your <strong className="text-violet-400">entire</strong> SmartQuery activity — Optimizer, Natural Language to SQL, Schema Vault, and Playground
          </p>
        </div>
        <ExportMenu label="Export Analytics" advancedMode/>
      </div>

      {/* Universal feature usage — FIX #9 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard icon={Zap}      label="SQL Optimizer runs"   value={data.featureUsage.optimizer}  color="violet"/>
        <StatCard icon={Brain}    label="NL to SQL conversions" value={data.featureUsage.nl2sql}     color="sky"/>
        <StatCard icon={Database} label="Schema loads"          value={data.featureUsage.schema}     color="emerald"/>
        <StatCard icon={Terminal} label="Playground runs"       value={data.featureUsage.playground} color="amber"/>
        <StatCard icon={Download} label="Exports"                value={data.featureUsage.export}     color="pink"/>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Activity}  label="Total actions (all features)" value={data.totalActions} color="violet" sub="Lifetime"/>
        <StatCard icon={TrendingUp}label="Avg performance gain" value={`+${data.avgGain}%`} color="emerald" sub="SQL Optimizer"/>
        <StatCard icon={Target}    label="Issues fixed"  value={data.totalIssuesFixed} color="amber" sub="Anti-patterns resolved"/>
        <StatCard icon={Flame}     label="Activity streak" value={`${data.streak} ${data.streak===1?"day":"days"}`} color="orange" sub="Consecutive days active"/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Feature usage bar chart */}
        <div className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4">Feature Usage Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "SQL Optimizer", value: data.featureUsage.optimizer, icon: Zap, color: "violet" },
              { label: "Natural Language to SQL", value: data.featureUsage.nl2sql, icon: Brain, color: "sky" },
              { label: "Schema Vault", value: data.featureUsage.schema, icon: Database, color: "emerald" },
              { label: "Playground", value: data.featureUsage.playground, icon: Terminal, color: "amber" },
            ].map(f => (
              <div key={f.label}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-300 flex items-center gap-1.5"><f.icon className="w-3 h-3"/>{f.label}</span>
                  <span className="text-slate-500">{f.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(f.value/maxFeature)*100}%` }}
                    className={`h-full rounded-full bg-${f.color}-500`}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Domain breakdown */}
        <div className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4">Optimizations by Domain</h3>
          {data.domainBreakdown.length === 0 ? (
            <p className="text-slate-600 text-xs py-8 text-center">No optimizations yet — run your first query!</p>
          ) : (
            <div className="space-y-3">
              {data.domainBreakdown.slice(0, 6).map(d => (
                <div key={d.domain}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-300">{d.domain ?? "General"}</span>
                    <span className="text-slate-500">{d.count} queries · avg +{d.avgGain}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(d.count/Math.max(1,data.domainBreakdown[0].count))*100}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* 14-day trend */}
        <div className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4">14-Day Optimization Activity</h3>
          {data.recentTrend.length === 0 ? (
            <p className="text-slate-600 text-xs py-8 text-center">No activity in the last 14 days.</p>
          ) : (
            <div className="flex items-end gap-1.5 h-32">
              {data.recentTrend.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(t.count/maxTrendCount)*100}%` }}
                    className="w-full rounded-t bg-gradient-to-t from-violet-600 to-violet-400 min-h-[4px]"/>
                  <span className="text-[8px] text-slate-600">{new Date(t.date).getDate()}</span>
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-black/80 text-[9px] text-white px-1.5 py-0.5 rounded transition-opacity whitespace-nowrap">
                    {t.count} queries · +{t.avg_gain}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issue severity breakdown */}
        <div className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5"/> Issues Detected by Severity
          </h3>
          {data.issueTypes.length === 0 ? (
            <p className="text-slate-600 text-xs py-8 text-center">No issues recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.issueTypes.map(it => (
                <div key={it.severity}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className={`capitalize ${
                      it.severity === "critical" ? "text-red-300" : it.severity === "warning" ? "text-amber-300" : "text-blue-300"
                    }`}>{it.severity}</span>
                    <span className="text-slate-500">{it.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${
                      it.severity === "critical" ? "bg-red-500" : it.severity === "warning" ? "bg-amber-500" : "bg-blue-500"
                    }`} style={{ width: `${(it.count / Math.max(1,...data.issueTypes.map(x=>x.count)))*100}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top performing optimizations */}
      <div className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
        <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5"/> Top Performing Optimizations
        </h3>
        {data.topGains.length === 0 ? (
          <p className="text-slate-600 text-xs py-8 text-center">Optimize your first query to see top performers here.</p>
        ) : (
          <div className="space-y-2">
            {data.topGains.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-500/5">
                <span className="text-[10px] text-slate-600 w-4">#{i+1}</span>
                <span className="flex-1 text-xs text-slate-300 truncate">{g.title ?? "SQL Query"}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-violet-500/15 text-violet-300 rounded-full">{g.domain}</span>
                <span className="text-xs font-bold text-emerald-400">+{g.performanceGain}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
