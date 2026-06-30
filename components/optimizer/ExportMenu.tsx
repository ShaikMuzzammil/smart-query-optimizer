"use client";
// components/optimizer/ExportMenu.tsx — FIX #4 & #13: Ask before export, choose what to print
import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileJson, FileSpreadsheet, FileCode, X, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";

interface ExportMenuProps {
  href?: (format: "sql" | "json" | "csv" | "pdf") => string;
  label?: string;
  align?: "left" | "right";
  formats?: Array<"sql" | "json" | "csv" | "pdf">;
  className?: string;
  // Advanced mode: open full modal
  advancedMode?: boolean;
}

const FORMAT_META = [
  { key: "sql" as const,  label: "SQL file (.sql)",   icon: FileCode,        desc: "Optimized queries as executable SQL" },
  { key: "json" as const, label: "JSON (.json)",       icon: FileJson,        desc: "Full structured data with all metadata" },
  { key: "csv" as const,  label: "CSV (.csv)",         icon: FileSpreadsheet, desc: "Spreadsheet-compatible summary" },
  { key: "pdf" as const,  label: "PDF Report (.pdf)",  icon: FileText,        desc: "Human-readable report with all details" },
];

const SCOPE_META = [
  { key: "all",    label: "All Time",      desc: "Every query you've ever run" },
  { key: "last30", label: "Last 30 Days",  desc: "Queries from the past month" },
  { key: "last7",  label: "Last 7 Days",   desc: "Queries from the past week" },
  { key: "favorites", label: "Favourites", desc: "Only starred/favourited queries" },
];

const FEATURE_META = [
  { key: "optimizer", label: "SQL Optimizer",        desc: "Optimized queries with analysis" },
  { key: "nl2sql",    label: "Natural Language to SQL", desc: "Generated SQL from descriptions" },
];

export function ExportMenu({ href, label, align = "right", formats, className, advancedMode }: ExportMenuProps) {
  const [open, setOpen]       = useState(false);
  const [modal, setModal]     = useState(false);
  const [step, setStep]       = useState(1);
  const [selFormat, setSelFormat] = useState<"sql"|"json"|"csv"|"pdf">("sql");
  const [selScope, setSelScope]   = useState("all");
  const [selFeatures, setSelFeatures] = useState<string[]>(["optimizer", "nl2sql"]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const FORMATS = formats ? FORMAT_META.filter((f) => formats.includes(f.key)) : FORMAT_META;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggleFeature(key: string) {
    setSelFeatures(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  async function handleExport() {
    if (selFeatures.length === 0) { toast.error("Select at least one feature to export."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: selFormat, scope: selScope, features: selFeatures }),
      });
      if (!res.ok) { toast.error("Export failed — please try again."); return; }

      const blob = await res.blob();
      const ext  = selFormat;
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `smartquery-export-${new Date().toISOString().slice(0,10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Export downloaded!");
      setModal(false); setStep(1);
    } catch {
      toast.error("Export failed — please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Simple dropdown mode
  if (!advancedMode && href) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          className={className ?? (label
            ? "flex items-center gap-1.5 px-3 py-1.5 border border-violet-500/25 text-slate-300 text-[11px] font-medium rounded-lg hover:border-violet-500/45 transition-colors"
            : "p-1.5 rounded-lg hover:bg-violet-500/10")}
          title="Export"
        >
          <Download className="w-4 h-4 text-slate-400" />
          {label && <span>{label}</span>}
        </button>
        {open && (
          <div className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-1 w-52 bg-[#0a0a14] border border-violet-500/25 rounded-xl shadow-xl shadow-black/40 overflow-hidden z-30`}
            onClick={(e) => e.stopPropagation()}>
            {FORMATS.map(({ key, label: flabel, icon: Icon, desc }) => (
              <a key={key} href={href(key)} target="_blank" rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 px-3 py-2.5 text-slate-300 hover:bg-violet-500/10 hover:text-white transition-colors">
                <Icon className="w-3.5 h-3.5 text-violet-400 mt-0.5" />
                <div>
                  <div className="text-[11px] font-medium">{flabel}</div>
                  <div className="text-[9px] text-slate-500">{desc}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Advanced modal mode (FIX #4: ask before export)
  return (
    <>
      <button
        onClick={() => { setModal(true); setStep(1); }}
        className={className ?? "flex items-center gap-1.5 px-3 py-1.5 border border-violet-500/25 text-slate-300 text-[11px] font-medium rounded-lg hover:border-violet-500/45 transition-colors"}
        title="Export data"
      >
        <Download className="w-3.5 h-3.5" />
        {label ?? "Export"}
      </button>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setModal(false)}>
          <div className="w-full max-w-lg bg-[#08081a] border border-violet-500/25 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-violet-500/15">
              <div>
                <h2 className="font-bold text-white">Export Your Data</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">Step {step} of 3 — {step===1?"Choose features":step===2?"Date range & format":"Confirm"}</p>
              </div>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {step === 1 && (
                <>
                  <p className="text-sm text-slate-400">Which features would you like to export?</p>
                  <div className="space-y-2">
                    {FEATURE_META.map(f => (
                      <button key={f.key} onClick={() => toggleFeature(f.key)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                          selFeatures.includes(f.key)
                            ? "border-violet-500/50 bg-violet-500/10 text-white"
                            : "border-violet-500/15 text-slate-400 hover:border-violet-500/30"
                        }`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selFeatures.includes(f.key) ? "border-violet-400 bg-violet-400" : "border-slate-600"
                        }`}>
                          {selFeatures.includes(f.key) && <Check className="w-2.5 h-2.5 text-white"/>}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{f.label}</div>
                          <div className="text-[10px] text-slate-500">{f.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <p className="text-sm text-slate-400 mb-3">Date range</p>
                    <div className="grid grid-cols-2 gap-2">
                      {SCOPE_META.map(s => (
                        <button key={s.key} onClick={() => setSelScope(s.key)}
                          className={`px-3 py-2.5 rounded-xl border text-left transition-all ${
                            selScope === s.key
                              ? "border-violet-500/50 bg-violet-500/10 text-white"
                              : "border-violet-500/15 text-slate-400 hover:border-violet-500/30"
                          }`}>
                          <div className="text-[11px] font-semibold">{s.label}</div>
                          <div className="text-[9px] text-slate-500">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-3">Export format</p>
                    <div className="grid grid-cols-2 gap-2">
                      {FORMAT_META.map(({ key, label: fl, icon: Icon, desc }) => (
                        <button key={key} onClick={() => setSelFormat(key)}
                          className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                            selFormat === key
                              ? "border-violet-500/50 bg-violet-500/10 text-white"
                              : "border-violet-500/15 text-slate-400 hover:border-violet-500/30"
                          }`}>
                          <Icon className="w-3.5 h-3.5 text-violet-400 mt-0.5"/>
                          <div>
                            <div className="text-[11px] font-semibold">{fl}</div>
                            <div className="text-[9px] text-slate-500">{desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">Confirm your export:</p>
                  <div className="bg-[#0d0d24] rounded-xl border border-violet-500/15 p-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Features</span>
                      <span className="text-slate-200">{selFeatures.map(f => FEATURE_META.find(m=>m.key===f)?.label).join(", ")}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Date Range</span>
                      <span className="text-slate-200">{SCOPE_META.find(s=>s.key===selScope)?.label}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Format</span>
                      <span className="text-slate-200">{FORMAT_META.find(f=>f.key===selFormat)?.label}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Your data stays yours — this file downloads directly to your device. No data is sent anywhere.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-violet-500/15 bg-[#06061a]/50">
              <button onClick={() => step > 1 ? setStep(s=>s-1) : setModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                {step > 1 ? "← Back" : "Cancel"}
              </button>
              {step < 3 ? (
                <button onClick={() => setStep(s=>s+1)}
                  disabled={step === 1 && selFeatures.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors">
                  Next <ChevronRight className="w-4 h-4"/>
                </button>
              ) : (
                <button onClick={handleExport} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">
                  {loading ? "Exporting…" : (<><Download className="w-4 h-4"/> Download</>)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
