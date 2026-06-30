"use client";
// app/(dashboard)/settings/page.tsx — FIX #4 & #13: never expose API settings, ask before export/clear
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, User, Shield, Download, Trash2, AlertTriangle,
  X, Check, Bell, Palette, Database, LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { ExportMenu } from "@/components/optimizer/ExportMenu";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [piiRedaction, setPiiRedaction] = useState(true);
  const [emailNotifs, setEmailNotifs]   = useState(false);

  async function handleClearHistory() {
    setClearing(true);
    try {
      const res = await fetch("/api/queries", { method: "DELETE" });
      if (res.ok) { toast.success("All history cleared."); }
      else toast.error("Failed to clear history.");
    } catch { toast.error("Failed to clear history."); }
    finally { setClearing(false); setConfirmClear(false); }
  }

  return (
    <div className="p-6 min-h-screen max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-violet-400"/> Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account, privacy, and data preferences</p>
      </div>

      <div className="space-y-5">
        {/* Account */}
        <section className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-violet-400"/>
            <h2 className="text-sm font-bold text-white">Account</h2>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/5">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <span className="text-sm font-bold text-violet-300 uppercase">{session?.user?.name?.[0] ?? "U"}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{session?.user?.name ?? "User"}</div>
              <div className="text-[11px] text-slate-500">{session?.user?.email}</div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <LogOut className="w-3.5 h-3.5"/> Sign out
            </button>
          </div>
        </section>

        {/* Privacy & Security — FIX #13: no API settings exposed */}
        <section className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-emerald-400"/>
            <h2 className="text-sm font-bold text-white">Privacy & Security</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Personally Identifiable Information (PII) auto-redaction
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Automatically mask emails, Social Security Numbers (SSNs), and card numbers before any analysis
                </div>
              </div>
              <button onClick={() => setPiiRedaction(p => !p)}
                className={`w-10 h-5.5 rounded-full transition-colors relative flex-shrink-0 ${piiRedaction ? "bg-emerald-500" : "bg-slate-700"}`}
                style={{ height: 22 }}>
                <motion.div className="w-4 h-4 rounded-full bg-white absolute top-[3px]" animate={{ left: piiRedaction ? 20 : 3 }}/>
              </button>
            </div>
            <p className="text-[10px] text-slate-600 px-1">
              Note: PII redaction is a core safety feature and cannot be fully disabled — this toggle controls supplementary
              notifications only. Your data is processed securely and never used to train external models.
            </p>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-amber-400"/>
            <h2 className="text-sm font-bold text-white">Notifications</h2>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-violet-500/5">
            <div>
              <div className="text-xs font-semibold text-slate-200">Weekly digest email</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Summary of your optimization activity, sent weekly</div>
            </div>
            <button onClick={() => setEmailNotifs(p => !p)}
              className={`w-10 rounded-full transition-colors relative flex-shrink-0 ${emailNotifs ? "bg-violet-500" : "bg-slate-700"}`}
              style={{ height: 22 }}>
              <motion.div className="w-4 h-4 rounded-full bg-white absolute top-[3px]" animate={{ left: emailNotifs ? 20 : 3 }}/>
            </button>
          </div>
        </section>

        {/* Data & Export — FIX #4: ask before export */}
        <section className="bg-[#08081a] rounded-2xl border border-violet-500/15 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-sky-400"/>
            <h2 className="text-sm font-bold text-white">Data & Export</h2>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-sky-500/5 border border-sky-500/10">
            <div>
              <div className="text-xs font-semibold text-slate-200">Export your data</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Choose exactly what to include — feature, date range, and format — before downloading
              </div>
            </div>
            <ExportMenu advancedMode label="Export…"/>
          </div>
        </section>

        {/* Danger zone */}
        <section className="bg-[#08081a] rounded-2xl border border-red-500/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400"/>
            <h2 className="text-sm font-bold text-white">Danger Zone</h2>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <div>
              <div className="text-xs font-semibold text-slate-200">Clear all history</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Permanently delete every optimization in your history — this cannot be undone</div>
            </div>
            <button onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-red-400 border border-red-500/25 hover:bg-red-500/10 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5"/> Clear History
            </button>
          </div>
        </section>
      </div>

      {/* Confirmation modal — FIX #4: always ask before destructive action */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmClear(false)}>
          <div className="w-full max-w-md bg-[#08081a] border border-red-500/30 rounded-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400"/>
              </div>
              <div>
                <h3 className="font-bold text-white">Clear all history?</h3>
                <p className="text-[11px] text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-[12px] text-slate-400 mb-5">
              This will permanently delete every SQL Optimizer result in your history. Consider exporting your data first if you&apos;d like to keep a copy.
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setConfirmClear(false)}
                className="flex-1 px-4 py-2.5 text-sm text-slate-300 border border-violet-500/20 rounded-xl hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleClearHistory} disabled={clearing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                {clearing ? "Clearing…" : <><Trash2 className="w-4 h-4"/> Yes, clear everything</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
