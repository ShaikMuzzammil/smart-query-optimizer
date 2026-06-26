"use client";
// app/(dashboard)/settings/page.tsx — Enhanced with export confirmation dialogs
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/hooks/useSwrFetcher";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  User, Mail, TrendingUp, FileText, Loader2, Download, CheckCircle2,
  XCircle, Zap, Database, Shield, Activity, Trash2, AlertCircle,
  X, FileJson, FileSpreadsheet, Code2, Brain, Globe, BarChart3,
} from "lucide-react";

type ExportFormat = "sql" | "json" | "csv" | "pdf";
type ExportScope  = "all" | "optimizer" | "analytics";

interface ExportConfig {
  format: ExportFormat;
  scope: ExportScope;
  label: string;
}

function ExportConfirmModal({
  open, onClose, onConfirm, defaultFormat,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (cfg: ExportConfig) => void;
  defaultFormat?: ExportFormat;
}) {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat ?? "csv");
  const [scope,  setScope]  = useState<ExportScope>("all");
  const [loading, setLoading] = useState(false);

  const formats: Array<{ key: ExportFormat; icon: React.ReactNode; label: string; desc: string }> = [
    { key: "csv",  icon: <FileSpreadsheet className="w-4 h-4" />, label: "CSV",  desc: "Excel & Google Sheets compatible" },
    { key: "pdf",  icon: <FileText         className="w-4 h-4" />, label: "PDF",  desc: "Formatted multi-page report" },
    { key: "json", icon: <FileJson         className="w-4 h-4" />, label: "JSON", desc: "Machine-readable structured data" },
    { key: "sql",  icon: <Code2            className="w-4 h-4" />, label: "SQL",  desc: "Annotated SQL file with comments" },
  ];

  const scopes: Array<{ key: ExportScope; label: string; desc: string }> = [
    { key: "all",       label: "Full History",       desc: "All optimizations ever saved" },
  ];

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm({ format, scope, label: `${scope}-${format}` });
    setLoading(false);
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative bg-[#0a0a1e] border border-violet-500/25 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-violet-500/10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">Export Data</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-violet-500/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format selection */}
        <div className="mb-5">
          <div className="text-xs font-semibold text-slate-400 mb-2">Export Format</div>
          <div className="grid grid-cols-2 gap-2">
            {formats.map(f => (
              <button key={f.key} onClick={() => setFormat(f.key)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  format === f.key
                    ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
                    : "border-violet-500/15 hover:border-violet-500/30 text-slate-400 hover:text-slate-200"
                }`}>
                <div className={`flex-shrink-0 ${format === f.key ? "text-violet-400" : "text-slate-500"}`}>{f.icon}</div>
                <div>
                  <div className="text-xs font-semibold">{f.label}</div>
                  <div className="text-[9px] text-slate-500">{f.desc}</div>
                </div>
                {format === f.key && <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 ml-auto flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Scope selection */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-400 mb-2">What to Include</div>
          <div className="space-y-2">
            {scopes.map(s => (
              <button key={s.key} onClick={() => setScope(s.key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  scope === s.key
                    ? "border-violet-500/60 bg-violet-500/15"
                    : "border-violet-500/15 hover:border-violet-500/30"
                }`}>
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  scope === s.key ? "border-violet-500 bg-violet-500" : "border-slate-500"
                }`}>
                  {scope === s.key && <div className="w-full h-full rounded-full bg-white scale-50" />}
                </div>
                <div>
                  <div className={`text-xs font-semibold ${scope === s.key ? "text-violet-300" : "text-slate-300"}`}>{s.label}</div>
                  <div className="text-[9px] text-slate-500">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-violet-500/20 text-slate-400 text-sm font-semibold hover:bg-violet-500/5 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export {format.toUpperCase()}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: health, isLoading: hLoading } = useSWR("/api/health", fetcher, { revalidateOnFocus: false });
  const { data: analytics } = useSWR("/api/analytics", fetcher, { revalidateOnFocus: false });
  const [clearing, setClearing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [exportModal, setExportModal] = useState<{ open: boolean; defaultFormat?: ExportFormat }>({ open: false });

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

  const handleExport = async (cfg: ExportConfig) => {
    try {
      const url = `/api/export?scope=all&format=${cfg.format}`;
      const a = document.createElement("a");
      a.href = url; a.target = "_blank";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      toast.success(`Exporting as ${cfg.format.toUpperCase()}…`);
    } catch {
      toast.error("Export failed");
    }
  };

  const services = health?.services ?? {};
  const isHealthy = health?.status === "healthy";

  const ServiceRow = ({ icon: Icon, label, ok, detail }: { icon: React.ElementType; label: string; ok: boolean; detail?: string }) => (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${ok ? "bg-emerald-500/4 border-emerald-500/15" : "bg-rose-500/5 border-rose-500/15"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ok ? "bg-emerald-500/15" : "bg-rose-500/15"}`}>
        <Icon className={`w-4 h-4 ${ok ? "text-emerald-400" : "text-rose-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-200">{label}</div>
        {detail && <div className="text-[10px] text-slate-500 mt-0.5">{detail}</div>}
      </div>
      {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
    </div>
  );

  const exportOptions = [
    { fmt: "csv" as ExportFormat, icon: FileSpreadsheet, label: "Spreadsheet (CSV)", desc: "Works in Excel & Google Sheets", color: "text-emerald-400 bg-emerald-500/10" },
    { fmt: "pdf" as ExportFormat, icon: FileText,        label: "PDF Report",        desc: "Formatted multi-page report",   color: "text-rose-400 bg-rose-500/10" },
    { fmt: "json" as ExportFormat, icon: FileJson,       label: "JSON Export",       desc: "Structured data for developers", color: "text-sky-400 bg-sky-500/10" },
    { fmt: "sql" as ExportFormat,  icon: Code2,          label: "SQL Dump",          desc: "Annotated SQL with all changes", color: "text-violet-400 bg-violet-500/10" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <ExportConfirmModal
        open={exportModal.open}
        defaultFormat={exportModal.defaultFormat}
        onClose={() => setExportModal({ open: false })}
        onConfirm={handleExport}
      />

      <div className="mb-7">
        <h1 className="text-2xl font-black mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Account, connection status, exports, and data management</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-4 h-4 text-violet-400" /><h2 className="text-sm font-bold">Profile</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-lg shadow-violet-500/30">
              {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <div className="font-bold text-lg">{session?.user?.name ?? "—"}</div>
              <div className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />{session?.user?.email}
              </div>
              <div className="text-[10px] text-slate-600 mt-2">Your data is private and never shared</div>
            </div>
          </div>
        </motion.div>

        {/* Usage summary — all features */}
        {analytics && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-violet-400" /><h2 className="text-sm font-bold">Your Usage</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {[
                { label: "SQL Optimizations",      value: analytics.totalQueries ?? 0,        icon: "⚡" },
                { label: "Natural Language to SQL", value: analytics.totalNl2sql ?? 0,         icon: "🧠" },
                { label: "Schema Uploads",          value: analytics.totalSchemaUploads ?? 0,  icon: "🗄️" },
                { label: "Avg Performance Gain",    value: `+${analytics.avgGain ?? 0}%`,      icon: "📈" },
              ].map(s => (
                <div key={s.label} className="bg-violet-500/8 border border-violet-500/12 rounded-xl p-3 text-center">
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className="text-xl font-black font-mono text-violet-200">{s.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Issues Fixed",   value: analytics.totalIssuesFixed ?? 0 },
                { label: "Active Streak",  value: `${analytics.streak ?? 0} days` },
                { label: "Domains Covered", value: analytics.domainBreakdown?.length ?? 0 },
                { label: "Avg Cost Score", value: analytics.avgCostScore != null ? `${analytics.avgCostScore}/100` : "—" },
              ].map(s => (
                <div key={s.label} className="bg-violet-500/5 border border-violet-500/8 rounded-xl p-3 text-center">
                  <div className="text-lg font-black font-mono text-slate-300">{s.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Connection Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold">Connection Status</h2>
              {!hLoading && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isHealthy ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-amber-500/15 border-amber-500/25 text-amber-400"
                }`}>
                  {isHealthy ? "All systems operational" : "Attention needed"}
                </span>
              )}
            </div>
          </div>
          {hLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />Checking connections…
            </div>
          ) : (
            <div className="space-y-2">
              <ServiceRow icon={Zap}         label="Query Engine"      ok={services.ai_engine?.ok ?? false}      detail={services.ai_engine?.label} />
              <ServiceRow icon={Shield}      label="Authentication"    ok={services.infrastructure?.ok ?? false} detail={services.infrastructure?.label} />
              <ServiceRow icon={Database}    label="Database"          ok={services.database?.ok ?? false}       detail={services.database?.label} />
              <ServiceRow icon={CheckCircle2} label="Schema"           ok={services.schema?.ok ?? false}         detail={services.schema?.label} />
            </div>
          )}
          {!isHealthy && !hLoading && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-400 leading-relaxed space-y-1">
                <p>One or more services need attention:</p>
                {!services.ai_engine?.ok && <p>• <strong className="text-amber-300">Query Engine:</strong> Add <code className="bg-violet-500/10 px-1 rounded">GEMINI_API_KEY</code> to your Vercel environment variables.</p>}
                {!services.infrastructure?.ok && <p>• <strong className="text-amber-300">Infrastructure:</strong> Ensure <code className="bg-violet-500/10 px-1 rounded">NEXTAUTH_SECRET</code> and <code className="bg-violet-500/10 px-1 rounded">NEXTAUTH_URL</code> are set.</p>}
                {!services.database?.ok && <p>• <strong className="text-amber-300">Database:</strong> Check <code className="bg-violet-500/10 px-1 rounded">DATABASE_URL</code> in environment variables.</p>}
                {!services.schema?.ok && <p>• <strong className="text-amber-300">Schema:</strong> Redeploy to run the automatic migration.</p>}
              </div>
            </div>
          )}
        </motion.div>

        {/* Required Environment Variables */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-violet-400" /><h2 className="text-sm font-bold">Required Environment Variables</h2>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { key: "GEMINI_API_KEY",    required: true,  note: "Get free at aistudio.google.com/apikey",    label: "Primary Query Engine" },
              { key: "DATABASE_URL",      required: true,  note: "Neon PostgreSQL connection string",          label: "Database" },
              { key: "DIRECT_URL",        required: true,  note: "Neon direct connection string",              label: "Database Direct" },
              { key: "NEXTAUTH_SECRET",   required: true,  note: "Run: openssl rand -base64 32",               label: "Auth Secret" },
              { key: "NEXTAUTH_URL",      required: true,  note: "Your deployed URL (e.g. https://app.vercel.app)", label: "Auth URL" },
              { key: "ANTHROPIC_API_KEY", required: false, note: "Optional fallback engine",                   label: "Fallback Engine" },
            ].map(v => (
              <div key={v.key} className={`flex items-center gap-3 p-3 rounded-xl border ${v.required ? "border-violet-500/15 bg-violet-500/4" : "border-slate-700/30 bg-slate-800/20"}`}>
                <code className="font-mono text-violet-300 text-[10px] bg-violet-500/10 px-2 py-0.5 rounded w-44 flex-shrink-0">{v.key}</code>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-300 font-medium text-[10px]">{v.label}</div>
                  <div className="text-slate-500 text-[9px]">{v.note}</div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${v.required ? "bg-rose-500/15 text-rose-400" : "bg-slate-500/15 text-slate-400"}`}>
                  {v.required ? "Required" : "Optional"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Export — all formats with confirmation */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-violet-400" /><h2 className="text-sm font-bold">Export Your Data</h2>
          </div>
          <p className="text-sm text-slate-400 mb-5">Download your complete optimization history. You'll be asked to confirm the format and scope before downloading.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {exportOptions.map(({ fmt, icon: Icon, label, desc, color }) => (
              <button key={fmt} onClick={() => setExportModal({ open: true, defaultFormat: fmt })}
                className="flex items-center gap-3 p-4 border border-violet-500/20 hover:border-violet-500/40 rounded-xl transition-colors hover:bg-violet-500/5 group text-left">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-3 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 flex-shrink-0" /> A confirmation dialog will appear before any file is downloaded.
          </p>
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="glass-card rounded-2xl p-6 border border-rose-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-4 h-4 text-rose-400" /><h2 className="text-sm font-bold text-rose-300">Data Management</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Permanently delete all your optimization history. This cannot be undone.</p>
          <button onClick={clearHistory} disabled={clearing}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
              confirm
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                : "border-rose-500/20 text-rose-400 hover:bg-rose-500/8 hover:border-rose-500/30"
            }`}>
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {confirm ? "Click again to confirm deletion" : "Clear All History"}
          </button>
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass-card rounded-2xl p-6">
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-rose-500/20 text-rose-400 text-sm font-semibold rounded-xl hover:bg-rose-500/8 hover:border-rose-500/30 transition-colors">
            Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
