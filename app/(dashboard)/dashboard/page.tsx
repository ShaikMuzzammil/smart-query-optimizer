"use client";
// app/(dashboard)/dashboard/page.tsx — FIX #9: overview spans all features, not just optimizer
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Brain, Database, Terminal, TrendingUp, Flame, Target,
  ArrowRight, BarChart3, BookOpen, History, Sparkles,
} from "lucide-react";
import { fetcher } from "@/hooks/useSwrFetcher";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data } = useSWR("/api/analytics", fetcher);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const QUICK_LINKS = [
    { href: "/optimizer",  icon: Zap,    label: "SQL Optimizer",  desc: "Paste & optimize a query",         color: "violet" },
    { href: "/nl2sql",     icon: Brain,  label: "NL to SQL",      desc: "Describe data in plain English",   color: "sky"     },
    { href: "/schema",     icon: Database,label: "Schema Vault",  desc: "Upload your database structure",   color: "emerald" },
    { href: "/playground", icon: Terminal,label: "Playground",    desc: "Explore advanced SQL patterns",     color: "amber"   },
  ];

  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Welcome back, {firstName}</h1>
        <p className="text-slate-400 text-sm mt-1">Here&apos;s a snapshot of your SmartQuery activity across every feature</p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {QUICK_LINKS.map(link => (
          <Link key={link.href} href={link.href}>
            <motion.div whileHover={{ y: -3 }} className={`p-5 rounded-2xl border border-${link.color}-500/20 bg-${link.color}-500/5 hover:border-${link.color}-500/40 transition-colors h-full`}>
              <link.icon className={`w-6 h-6 text-${link.color}-400 mb-3`}/>
              <div className="font-bold text-white text-sm">{link.label}</div>
              <div className="text-[11px] text-slate-500 mt-1">{link.desc}</div>
              <div className={`flex items-center gap-1 text-[10px] text-${link.color}-400 mt-3`}>
                Open <ArrowRight className="w-3 h-3"/>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Universal stats — FIX #9 */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: TrendingUp, label: "Total actions, all features", value: data.totalActions ?? 0, color: "violet" },
            { icon: Target,     label: "Avg performance gain",  value: `+${data.avgGain ?? 0}%`, color: "emerald" },
            { icon: Flame,      label: "Activity streak",       value: `${data.streak ?? 0}d`,  color: "orange"  },
            { icon: BarChart3,  label: "Issues fixed",          value: data.totalIssuesFixed ?? 0, color: "amber" },
          ].map((s,i) => (
            <div key={i} className="bg-[#08081a] rounded-xl border border-violet-500/15 p-4">
              <s.icon className={`w-4 h-4 text-${s.color}-400 mb-2`}/>
              <div className="text-xl font-black text-white">{s.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Feature usage snapshot */}
        {data && (
          <div className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
            <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4">Activity Across Features</h3>
            <div className="space-y-2.5">
              {[
                { icon: Zap, label: "SQL Optimizer", value: data.featureUsage?.optimizer ?? 0 },
                { icon: Brain, label: "Natural Language to SQL", value: data.featureUsage?.nl2sql ?? 0 },
                { icon: Database, label: "Schema Vault", value: data.featureUsage?.schema ?? 0 },
                { icon: Terminal, label: "Playground", value: data.featureUsage?.playground ?? 0 },
              ].map((f,i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-violet-500/5">
                  <span className="flex items-center gap-2 text-xs text-slate-300"><f.icon className="w-3.5 h-3.5 text-slate-500"/>{f.label}</span>
                  <span className="text-xs font-bold text-violet-300">{f.value}</span>
                </div>
              ))}
            </div>
            <Link href="/analytics" className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 mt-4">
              View full analytics <ArrowRight className="w-3 h-3"/>
            </Link>
          </div>
        )}

        {/* Recent top performers */}
        <div className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
          <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4">Recent Top Optimizations</h3>
          {data?.topGains?.length > 0 ? (
            <div className="space-y-2">
              {data.topGains.slice(0,5).map((g: any, i: number) => (
                <div key={g.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-violet-500/5">
                  <span className="text-[10px] text-slate-600 w-4">#{i+1}</span>
                  <span className="flex-1 text-xs text-slate-300 truncate">{g.title ?? "SQL Query"}</span>
                  <span className="text-xs font-bold text-emerald-400">+{g.performanceGain}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-slate-700 mx-auto mb-2"/>
              <p className="text-slate-500 text-xs">Optimize your first query to see it here</p>
              <Link href="/optimizer" className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs mt-2">
                Get started <ArrowRight className="w-3 h-3"/>
              </Link>
            </div>
          )}
          <Link href="/history" className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 mt-4">
            View full history <History className="w-3 h-3"/>
          </Link>
        </div>
      </div>

      {/* Helper tip */}
      <div className="mt-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-violet-500/5 border border-violet-500/15">
        <BookOpen className="w-5 h-5 text-violet-400 flex-shrink-0"/>
        <p className="text-[12px] text-slate-400">
          New here? Check out <Link href="/examples" className="text-violet-400 hover:underline">25 curated examples</Link> across 9 industries,
          or load your tables into <Link href="/schema" className="text-violet-400 hover:underline">Schema Vault</Link> for more accurate Natural Language to SQL generation.
        </p>
      </div>
    </div>
  );
}
