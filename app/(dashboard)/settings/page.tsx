"use client";
// app/(dashboard)/settings/page.tsx
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User, Mail, Shield, Database, Zap, AlertTriangle, CheckCircle2, XCircle,
  Cpu, FileText, Clock, TrendingUp, Download, Loader2,
} from "lucide-react";
import { ExportMenu } from "@/components/optimizer/ExportMenu";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: health, isLoading: healthLoading } = useSWR("/api/health", fetcher, { revalidateOnFocus: false });
  const { data: analytics } = useSWR("/api/analytics", fetcher, { revalidateOnFocus: false });
  const [deletingHistory, setDeletingHistory] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const clearHistory = async () => {
    if (!confirming) { setConfirming(true); return; }
    setDeletingHistory(true);
    try {
      const res = await fetch("/api/queries", { method: "DELETE" });
      if (res.ok) { toast.success("All history cleared"); setConfirming(false); }
      else toast.error("Failed to clear history");
    } catch { toast.error("Network error"); }
    finally { setDeletingHistory(false); }
  };

  const healthChecks = health ? Object.entries(health.checks ?? {}) : [];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Account, system status, exports, and preferences</p>
      </div>

      <div className="space-y-5">

        {/* Profile card */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-violet-400"/>
            <h2 className="text-sm font-semibold">Profile</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-lg">{session?.user?.name ?? "—"}</div>
              <div className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 flex-shrink-0"/>{session?.user?.email}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Usage summary */}
        {analytics && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.04}} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-violet-400"/>
              <h2 className="text-sm font-semibold">Usage Summary</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total queries",   value: analytics.totalQueries ?? 0 },
                { label: "Avg gain",        value: `+${analytics.avgGain ?? 0}%` },
                { label: "Issues fixed",    value: analytics.totalIssuesFixed ?? 0 },
                { label: "Day streak",      value: `${analytics.streak ?? 0} days` },
              ].map(stat => (
                <div key={stat.label} className="bg-violet-500/8 border border-violet-500/15 rounded-xl p-3 text-center">
                  <div className="text-lg font-black font-mono text-violet-200">{stat.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Export history */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.06}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-4 h-4 text-violet-400"/>
            <h2 className="text-sm font-semibold">Export Your History</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Download all your saved optimizations in your preferred format.</p>
          <div className="flex flex-wrap gap-3">
            {(["csv", "pdf"] as const).map((fmt) => (
              <a key={fmt} href={`/api/export?scope=all&format=${fmt}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 border border-violet-500/25 hover:border-violet-500/45 text-slate-300 text-sm font-medium rounded-xl transition-colors">
                <Download className="w-4 h-4 text-violet-400"/>
                {fmt.toUpperCase()} export
              </a>
            ))}
          </div>
          <p className="text-[11px] text-slate-600 mt-3">Rate-limited to your own data. CSV works great in Excel / Google Sheets. PDF is a formatted multi-page report.</p>
        </motion.div>

        {/* System health */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.08}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400"/>
              <h2 className="text-sm font-semibold">System Health</h2>
            </div>
            {healthLoading && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin"/>}
          </div>
          {healthChecks.length > 0 ? (
            <div className="space-y-2">
              {healthChecks.map(([key, val]: [string, any]) => (
                <div key={key} className="flex items-start gap-3 p-2.5 bg-violet-500/5 rounded-xl">
                  <div className="flex-shrink-0 mt-0.5">
                    {val?.ok
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
                      : <XCircle className="w-4 h-4 text-rose-400"/>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-mono font-semibold text-slate-200">{key}</div>
                    <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{val?.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : !healthLoading ? (
            <div className="space-y-2">
              {[
                { label:"Database", desc:"Neon PostgreSQL — Serverless", icon:<Database className="w-4 h-4"/> },
                { label:"Primary AI", desc:"Claude (Anthropic) — check /api/health for live status", icon:<Zap className="w-4 h-4"/> },
                { label:"Fallback AI", desc:"Gemini (Google) — activates automatically if Claude is unavailable", icon:<Cpu className="w-4 h-4"/> },
                { label:"Rate Limit", desc:"20 optimizations/hour per account", icon:<Clock className="w-4 h-4"/> },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-violet-500/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-violet-400 flex-shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <a href="/api/health" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 mt-3 transition-colors">
            View live health check → /api/health
          </a>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.1}}
          className="glass-card rounded-2xl p-6 border-rose-500/25">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-400"/>
            <h2 className="text-sm font-semibold text-rose-400">Danger Zone</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-medium">Clear all history</div>
                <div className="text-xs text-slate-500">Permanently deletes all your saved optimizations</div>
              </div>
              <button onClick={clearHistory} disabled={deletingHistory}
                className={`px-4 py-2 border text-sm font-medium rounded-lg transition-colors flex items-center gap-2
                  ${confirming ? "bg-rose-500/25 border-rose-500/50 text-rose-300" : "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/25 text-rose-400"}`}>
                {deletingHistory && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                {confirming ? "Click again to confirm" : "Clear History"}
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap pt-3 border-t border-rose-500/15">
              <div>
                <div className="text-sm font-medium">Sign out</div>
                <div className="text-xs text-slate-500">End your current session and return to the home page</div>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-sm font-medium rounded-lg transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
