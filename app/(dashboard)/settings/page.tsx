"use client";
// app/(dashboard)/settings/page.tsx
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User, Mail, TrendingUp, FileText, Loader2,
  Download, CheckCircle2, XCircle, Zap, Database,
  Shield, Activity, Trash2, AlertCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: health, isLoading: hLoading } = useSWR("/api/health", fetcher, { revalidateOnFocus: false });
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

  // Parse services from health response
  const services = health?.services ?? {};
  const isHealthy = health?.status === "healthy";

  const ServiceRow = ({ icon: Icon, label, ok, detail }: { icon: React.ElementType; label: string; ok: boolean; detail?: string }) => (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${ok ? "bg-emerald-500/4 border-emerald-500/15" : "bg-rose-500/5 border-rose-500/15"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ok ? "bg-emerald-500/15" : "bg-rose-500/15"}`}>
        <Icon className={`w-4 h-4 ${ok ? "text-emerald-400" : "text-rose-400"}`}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-200">{label}</div>
        {detail && <div className="text-[10px] text-slate-500 mt-0.5">{detail}</div>}
      </div>
      {ok
        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0"/>
        : <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0"/>
      }
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-black mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Account, connection status, exports, and data management</p>
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
              <div className="text-[10px] text-slate-600 mt-2">Your data is private and never shared</div>
            </div>
          </div>
        </motion.div>

        {/* Usage summary */}
        {analytics && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.04}} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-violet-400"/><h2 className="text-sm font-bold">Your Usage</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label:"Total optimizations", value: analytics.totalQueries ?? 0 },
                { label:"Avg performance gain", value: `+${analytics.avgGain ?? 0}%` },
                { label:"Issues resolved",      value: analytics.totalIssuesFixed ?? 0 },
                { label:"Active streak",        value: `${analytics.streak ?? 0} days` },
              ].map(s => (
                <div key={s.label} className="bg-violet-500/8 border border-violet-500/12 rounded-xl p-3 text-center">
                  <div className="text-xl font-black font-mono text-violet-200">{s.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Connection Status */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.08}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400"/>
              <h2 className="text-sm font-bold">Connection Status</h2>
              {!hLoading && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isHealthy
                    ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
                    : "bg-amber-500/15 border-amber-500/25 text-amber-400"
                }`}>
                  {isHealthy ? "All systems operational" : "Attention needed"}
                </span>
              )}
            </div>
          </div>

          {hLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin"/>Checking connections…
            </div>
          ) : (
            <div className="space-y-2">
              <ServiceRow
                icon={Zap}
                label="AI Engine"
                ok={services.ai_engine?.ok ?? false}
                detail={services.ai_engine?.label}
              />
              <ServiceRow
                icon={Shield}
                label="Authentication"
                ok={services.infrastructure?.ok ?? false}
                detail={services.infrastructure?.label}
              />
              <ServiceRow
                icon={Database}
                label="Database"
                ok={services.database?.ok ?? false}
                detail={services.database?.label}
              />
              <ServiceRow
                icon={CheckCircle2}
                label="Schema"
                ok={services.schema?.ok ?? false}
                detail={services.schema?.label}
              />
            </div>
          )}

          {!isHealthy && !hLoading && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0"/>
              <p className="text-xs text-slate-400 leading-relaxed">
                One or more services need attention. If the AI engine is unavailable, check your environment configuration and redeploy. If the database shows an error, a redeployment usually runs the schema migration automatically.
              </p>
            </div>
          )}
        </motion.div>

        {/* Export History */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.1}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-violet-400"/><h2 className="text-sm font-bold">Export Your Data</h2>
          </div>
          <p className="text-sm text-slate-400 mb-5">Download your complete optimization history in your preferred format.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              { fmt: "csv", label: "Spreadsheet (CSV)", desc: "Works in Excel & Google Sheets" },
              { fmt: "pdf", label: "PDF Report",        desc: "Formatted multi-page report" },
            ] as const).map(({ fmt, label, desc }) => (
              <a key={fmt} href={`/api/export?scope=all&format=${fmt}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border border-violet-500/20 hover:border-violet-500/40 rounded-xl transition-colors hover:bg-violet-500/5 group">
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/15 transition-colors">
                  <Download className="w-4 h-4 text-violet-400"/>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
                </div>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.14}} className="glass-card rounded-2xl p-6 border border-rose-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-4 h-4 text-rose-400"/><h2 className="text-sm font-bold text-rose-300">Data Management</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Permanently delete all your optimization history. This cannot be undone.</p>
          <button onClick={clearHistory} disabled={clearing}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
              confirm
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                : "border-rose-500/20 text-rose-400 hover:bg-rose-500/8 hover:border-rose-500/30"
            }`}>
            {clearing
              ? <><Loader2 className="w-4 h-4 animate-spin"/>Clearing…</>
              : confirm
              ? <><AlertCircle className="w-4 h-4"/>Click again to confirm</>
              : <><Trash2 className="w-4 h-4"/>Clear All History</>
            }
          </button>
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.16}} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-violet-400"/><h2 className="text-sm font-bold">Account</h2>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-violet-500/20 hover:border-violet-500/40 text-slate-300 hover:text-violet-300 rounded-xl transition-colors hover:bg-violet-500/5">
            Sign Out
          </button>
        </motion.div>

      </div>
    </div>
  );
}
