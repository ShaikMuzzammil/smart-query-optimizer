"use client";
// app/(dashboard)/settings/page.tsx
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User, Mail, Shield, TrendingUp, FileText, Clock, Loader2,
  Download, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Zap,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: health, isLoading: hLoading, mutate: hMutate } = useSWR("/api/health", fetcher, { revalidateOnFocus: false });
  const { data: analytics } = useSWR("/api/analytics", fetcher, { revalidateOnFocus: false });
  const [clearing, setClearing] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const clearHistory = async () => {
    if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 5000); return; }
    setClearing(true);
    try {
      const res = await fetch("/api/queries", { method: "DELETE" });
      if (res.ok) { toast.success("History cleared"); setConfirm(false); }
      else toast.error("Failed to clear history");
    } catch { toast.error("Network error"); }
    finally { setClearing(false); }
  };

  // Parse health checks into display groups
  const healthChecks = health ? Object.entries(health.checks ?? {}) : [];
  const infraChecks = healthChecks.filter(([k]) => ["DATABASE_URL","DIRECT_URL","NEXTAUTH_SECRET","NEXTAUTH_URL"].includes(k));
  const aiChecks    = healthChecks.filter(([k]) => ["ANTHROPIC_API_KEY","GEMINI_API_KEY","ai_engine"].includes(k));
  const dbChecks    = healthChecks.filter(([k]) => ["database_connection","database_schema"].includes(k));

  const StatusIcon = ({ ok }: { ok: boolean }) =>
    ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0"/> : <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0"/>;

  const CheckGroup = ({ title, items, icon }: { title: string; items: [string, any][]; icon: React.ReactNode }) => (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-2 flex items-center gap-1.5">
        {icon}{title}
      </div>
      <div className="space-y-1.5">
        {items.map(([key, val]: [string, any]) => (
          <div key={key} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl ${val?.ok ? "bg-emerald-500/4 border border-emerald-500/10" : "bg-rose-500/5 border border-rose-500/15"}`}>
            <StatusIcon ok={val?.ok}/>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-mono font-semibold text-slate-300">{key}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{val?.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const overall = health?.status ?? "";
  const isHealthy = overall.includes("healthy");

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-black mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Account, system status, exports, and data management</p>
      </div>

      <div className="space-y-5">

        {/* Profile */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-violet-400"/><h2 className="text-sm font-bold">Profile</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-lg shadow-violet-500/30">
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <div className="font-bold text-lg">{session?.user?.name ?? "—"}</div>
              <div className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5"/>{session?.user?.email}
              </div>
              <div className="text-[10px] text-slate-600 mt-1">Account data stored in Neon PostgreSQL · Sessions last 30 days</div>
            </div>
          </div>
        </motion.div>

        {/* Usage summary */}
        {analytics && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.04}} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-violet-400"/><h2 className="text-sm font-bold">Usage Summary</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label:"Total queries",   value: analytics.totalQueries ?? 0 },
                { label:"Avg gain",        value: `+${analytics.avgGain ?? 0}%` },
                { label:"Issues fixed",    value: analytics.totalIssuesFixed ?? 0 },
                { label:"Day streak",      value: `${analytics.streak ?? 0} days` },
              ].map(s => (
                <div key={s.label} className="bg-violet-500/8 border border-violet-500/12 rounded-xl p-3 text-center">
                  <div className="text-xl font-black font-mono text-violet-200">{s.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* System Health — live /api/health data */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.08}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400"/>
              <h2 className="text-sm font-bold">System Health</h2>
              {!hLoading && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isHealthy ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-rose-500/15 border-rose-500/25 text-rose-400"}`}>
                  {overall}
                </span>
              )}
            </div>
            <button onClick={() => hMutate()} disabled={hLoading}
              className="p-1.5 rounded-lg hover:bg-violet-500/10 text-slate-500 hover:text-violet-300 transition-colors">
              <RefreshCw className={`w-4 h-4 ${hLoading ? "animate-spin" : ""}`}/>
            </button>
          </div>

          {hLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin"/>Checking system health…
            </div>
          ) : healthChecks.length > 0 ? (
            <>
              <CheckGroup title="Infrastructure" items={infraChecks} icon={<Zap className="w-3 h-3"/>}/>
              <CheckGroup title="AI Engine" items={aiChecks} icon={<Shield className="w-3 h-3"/>}/>
              <CheckGroup title="Database" items={dbChecks} icon={<Mail className="w-3 h-3"/>}/>
            </>
          ) : (
            <div className="text-sm text-slate-500 py-4">Could not load health data</div>
          )}

          {/* Actionable fix panel */}
          {!isHealthy && health && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400"/>
                <span className="text-xs font-bold text-amber-300">Action Required</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                One or more required configuration items are missing. The most common fix: add <code className="text-violet-300">GEMINI_API_KEY</code> (free at <strong className="text-emerald-400">aistudio.google.com/apikey</strong>) in Vercel → Settings → Environment Variables, then trigger a Redeploy.
              </p>
              <div className="text-[10px] font-bold text-slate-500 tracking-widest mb-2">MINIMUM REQUIRED VARS</div>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {[
                  {k:"DATABASE_URL",       desc:"Neon pooled connection"},
                  {k:"DIRECT_URL",         desc:"Neon direct connection"},
                  {k:"NEXTAUTH_SECRET",    desc:"openssl rand -base64 32"},
                  {k:"NEXTAUTH_URL",       desc:"Your Vercel app URL"},
                  {k:"GEMINI_API_KEY",     desc:"aistudio.google.com/apikey (free)"},
                ].map(v=>(
                  <div key={v.k} className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-mono text-violet-300">{v.k}</span>
                    <span className="text-slate-500">— {v.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <a href="/api/health" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] text-violet-400 hover:text-violet-300 mt-4 transition-colors">
            View full /api/health JSON response →
          </a>
        </motion.div>

        {/* Export */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.1}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-4 h-4 text-violet-400"/><h2 className="text-sm font-bold">Export History</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Download all your optimizations. CSV works in Excel/Google Sheets; PDF is a formatted report.</p>
          <div className="flex flex-wrap gap-3">
            {(["csv","pdf"] as const).map(fmt=>(
              <a key={fmt} href={`/api/export?scope=all&format=${fmt}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 border border-violet-500/25 hover:border-violet-500/45 text-slate-300 text-sm font-medium rounded-xl transition-colors hover:bg-violet-500/8">
                <Download className="w-4 h-4 text-violet-400"/>Export as {fmt.toUpperCase()}
              </a>
            ))}
          </div>
        </motion.div>

        {/* Rate limit info */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.12}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-violet-400"/><h2 className="text-sm font-bold">Rate Limits</h2>
          </div>
          <div className="space-y-2">
            {[
              { label:"Optimizations", limit:"20 / hour", note:"Resets every 60 minutes" },
              { label:"NL to SQL",     limit:"20 / hour", note:"Same hourly pool" },
              { label:"History",       limit:"Unlimited", note:"Stored indefinitely" },
              { label:"Exports",       limit:"Unlimited", note:"CSV, PDF, SQL, JSON" },
            ].map(r=>(
              <div key={r.label} className="flex items-center justify-between p-3 bg-violet-500/5 rounded-xl border border-violet-500/10">
                <span className="text-sm text-slate-300">{r.label}</span>
                <div className="text-right">
                  <div className="text-xs font-bold text-violet-300">{r.limit}</div>
                  <div className="text-[10px] text-slate-500">{r.note}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.14}}
          className="glass-card rounded-2xl p-6 border-rose-500/20">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-4 h-4 text-rose-400"/>
            <h2 className="text-sm font-bold text-rose-400">Danger Zone</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-semibold">Clear all history</div>
                <div className="text-xs text-slate-500 mt-0.5">Permanently deletes all saved optimizations. Cannot be undone.</div>
              </div>
              <button onClick={clearHistory} disabled={clearing}
                className={`px-4 py-2 border text-sm font-semibold rounded-xl transition-colors flex items-center gap-2
                  ${confirm ? "bg-rose-500/25 border-rose-500/50 text-rose-300 animate-pulse-violet" : "bg-rose-500/8 hover:bg-rose-500/18 border-rose-500/25 text-rose-400"}`}>
                {clearing && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
                {confirm ? "⚠ Confirm — this is permanent" : "Clear History"}
              </button>
            </div>
            <div className="border-t border-rose-500/10 pt-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-sm font-semibold">Sign out</div>
                <div className="text-xs text-slate-500 mt-0.5">End session and return to the home page.</div>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 bg-rose-500/8 hover:bg-rose-500/18 border border-rose-500/25 text-rose-400 text-sm font-semibold rounded-xl transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
