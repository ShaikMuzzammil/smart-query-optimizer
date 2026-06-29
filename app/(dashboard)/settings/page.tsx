"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Download, FileText, FileJson, FileCode, LogOut,
  Shield, Bell, Database, Check, X, AlertTriangle, Loader2,
} from "lucide-react";

interface ExportConfig {
  format: "sql" | "csv" | "json" | "pdf";
  scope: "all" | "last30" | "last7" | "favorites";
  features: ("optimizer" | "nl2sql")[];
}

const FORMAT_OPTIONS = [
  {
    id: "sql" as const,
    label: "SQL",
    desc: "Just the optimized SQL queries — ready to run",
    icon: <FileCode className="w-5 h-5" />,
    color: "violet",
  },
  {
    id: "csv" as const,
    label: "CSV",
    desc: "Spreadsheet with all metadata: title, domain, gain, timestamps",
    icon: <FileText className="w-5 h-5" />,
    color: "emerald",
  },
  {
    id: "json" as const,
    label: "JSON",
    desc: "Full structured data — all fields, nested issues array, improvements",
    icon: <FileJson className="w-5 h-5" />,
    color: "sky",
  },
  {
    id: "pdf" as const,
    label: "PDF",
    desc: "Formatted report with query pairs and analysis summaries",
    icon: <Download className="w-5 h-5" />,
    color: "amber",
  },
];

const SCOPE_OPTIONS = [
  { id: "all" as const,       label: "All History",          desc: "Every optimization ever saved" },
  { id: "last30" as const,    label: "Last 30 Days",         desc: "Optimizations from the past month" },
  { id: "last7" as const,     label: "Last 7 Days",          desc: "This week only" },
  { id: "favorites" as const, label: "Favorites Only",       desc: "Starred / bookmarked queries" },
];

const CARD_COLOR: Record<string, string> = {
  violet:  "bg-violet-500/15 text-violet-400 border-violet-500/25",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  sky:     "bg-sky-500/15 text-sky-400 border-sky-500/25",
  amber:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: "csv",
    scope: "all",
    features: ["optimizer", "nl2sql"],
  });
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportConfig),
      });
      if (!res.ok) {
        const d = await res.json();
        setExportError(d.error ?? "Export failed — please try again.");
        return;
      }
      const blob = await res.blob();
      const ext = exportConfig.format;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smartquery-export-${exportConfig.scope}-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => { setExportDone(false); setShowExportDialog(false); }, 2000);
    } catch {
      setExportError("Download failed — please try again.");
    } finally {
      setExporting(false);
    }
  };

  const toggleFeature = (f: "optimizer" | "nl2sql") => {
    setExportConfig((prev) => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter((x) => x !== f)
        : [...prev.features, f],
    }));
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
          <Settings className="w-6 h-6 text-violet-400" />Settings
        </h1>
        <p className="text-slate-400 text-sm">Account management, data exports, and preferences</p>
      </motion.div>

      <div className="space-y-5">
        {/* Account info */}
        <div className="glass-card rounded-2xl p-6 border border-violet-500/15">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-bold">Account</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-slate-500 mb-1">Name</div>
              <div className="text-sm font-medium">{session?.user?.name ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 mb-1">Email</div>
              <div className="text-sm font-medium">{session?.user?.email ?? "—"}</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-emerald-500/8 border border-emerald-500/15 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Personally Identifiable Information (PII) is auto-redacted before any AI processing. Your raw SQL values are never stored in plain text.</span>
          </div>
        </div>

        {/* Export section */}
        <div className="glass-card rounded-2xl p-6 border border-violet-500/15">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-bold">Export Your Data</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Download your complete query history and analytics. You choose the format, scope, and which features to include — a confirmation dialog appears before any download starts.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {FORMAT_OPTIONS.map((f) => (
              <div key={f.id} className={`glass-card rounded-xl p-3 border text-center ${CARD_COLOR[f.color]}`}>
                <div className="flex justify-center mb-1.5">{f.icon}</div>
                <div className="text-xs font-bold">{f.label}</div>
                <div className="text-[9px] text-slate-500 mt-1 leading-tight">{f.desc}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowExportDialog(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-2 transition-all">
            <Download className="w-4 h-4" />Choose Export Options
          </button>
        </div>

        {/* Notifications (UI only) */}
        <div className="glass-card rounded-2xl p-6 border border-violet-500/15">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-bold">Preferences</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Show Live Scanner on input", desc: "Real-time anti-pattern detection as you type" },
              { label: "Auto-save to History",        desc: "Every optimization is saved automatically"  },
              { label: "Confirm before clearing",     desc: "Ask before clearing the query input"        },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between py-2 border-b border-violet-500/5 last:border-0">
                <div>
                  <div className="text-xs font-medium">{pref.label}</div>
                  <div className="text-[10px] text-slate-500">{pref.desc}</div>
                </div>
                <div className="w-9 h-5 bg-violet-600 rounded-full relative flex-shrink-0 cursor-pointer">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Database info */}
        <div className="glass-card rounded-2xl p-6 border border-violet-500/15">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-bold">Data &amp; Storage</span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Your history is stored securely in your account. You can export it at any time, or delete all history below. Deleting is permanent and cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-xl transition-all">
              <AlertTriangle className="w-3.5 h-3.5" />Delete All History
            </button>
          ) : (
            <div className="p-4 bg-red-500/8 border border-red-500/20 rounded-xl">
              <p className="text-xs text-red-300 mb-3 font-semibold">Are you sure? This permanently deletes all your queries and conversions.</p>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl transition-all font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />Yes, Delete Everything
                </button>
                <button onClick={() => setDeleteConfirm(false)}
                  className="text-xs text-slate-400 hover:text-white px-4 py-2 rounded-xl border border-slate-500/20 hover:border-slate-500/40 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="glass-card rounded-2xl p-6 border border-red-500/15">
          <div className="flex items-center gap-2 mb-3">
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold">Sign Out</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">You will be redirected to the sign-in page. Your data is saved and will be here when you return.</p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-xs font-semibold text-red-400 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 px-4 py-2.5 rounded-xl transition-all">
            <LogOut className="w-3.5 h-3.5" />Sign Out of SmartQuery
          </button>
        </div>
      </div>

      {/* Export dialog */}
      <AnimatePresence>
        {showExportDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a1e] border border-violet-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-black flex items-center gap-2">
                  <Download className="w-5 h-5 text-violet-400" />Export Options
                </h2>
                <button onClick={() => { setShowExportDialog(false); setExportError(null); }}
                  className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Format selection */}
              <div className="mb-5">
                <div className="text-[10px] font-bold text-slate-500 tracking-widest mb-3">1. CHOOSE FORMAT</div>
                <div className="grid grid-cols-2 gap-2">
                  {FORMAT_OPTIONS.map((f) => (
                    <button key={f.id} onClick={() => setExportConfig((p) => ({ ...p, format: f.id }))}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        exportConfig.format === f.id
                          ? `${CARD_COLOR[f.color]} border-opacity-100`
                          : "border-slate-700 text-slate-500 hover:border-slate-600"
                      }`}>
                      <div className="mt-0.5 flex-shrink-0">{f.icon}</div>
                      <div>
                        <div className="text-xs font-bold">{f.label}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{f.desc}</div>
                      </div>
                      {exportConfig.format === f.id && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0 mt-0.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope selection */}
              <div className="mb-5">
                <div className="text-[10px] font-bold text-slate-500 tracking-widest mb-3">2. CHOOSE DATE RANGE</div>
                <div className="space-y-1.5">
                  {SCOPE_OPTIONS.map((s) => (
                    <button key={s.id} onClick={() => setExportConfig((p) => ({ ...p, scope: s.id }))}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        exportConfig.scope === s.id
                          ? "bg-violet-500/15 border-violet-500/40 text-white"
                          : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}>
                      <div className="flex-1">
                        <div className="text-xs font-semibold">{s.label}</div>
                        <div className="text-[10px] text-slate-500">{s.desc}</div>
                      </div>
                      {exportConfig.scope === s.id && <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature selection */}
              <div className="mb-5">
                <div className="text-[10px] font-bold text-slate-500 tracking-widest mb-3">3. INCLUDE FEATURES</div>
                <div className="flex gap-2">
                  {(["optimizer", "nl2sql"] as const).map((f) => (
                    <button key={f} onClick={() => toggleFeature(f)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs transition-all capitalize ${
                        exportConfig.features.includes(f)
                          ? "bg-violet-500/15 border-violet-500/40 text-violet-300"
                          : "border-slate-700 text-slate-500 hover:border-slate-600"
                      }`}>
                      {exportConfig.features.includes(f) && <Check className="w-3 h-3" />}
                      {f === "optimizer" ? "SQL Optimizer" : "Natural Lang to SQL"}
                    </button>
                  ))}
                </div>
              </div>

              {exportError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{exportError}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleExport} disabled={exporting || exportDone || exportConfig.features.length === 0}
                  className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-60">
                  {exporting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Preparing…</>
                  ) : exportDone ? (
                    <><Check className="w-4 h-4 text-emerald-400" />Downloaded!</>
                  ) : (
                    <><Download className="w-4 h-4" />Download {exportConfig.format.toUpperCase()}</>
                  )}
                </button>
                <button onClick={() => { setShowExportDialog(false); setExportError(null); }}
                  className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-all text-sm">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
