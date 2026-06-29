"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

type ExportConfig = {
  format: "sql" | "json" | "csv";
  types: string[];
  dateRange: "all" | "7d" | "30d";
  limit: number;
};

const FEATURE_OPTIONS = [
  { id: "optimize", label: "SQL Optimizer results", icon: "⚡" },
  { id: "nl2sql", label: "Natural Language to SQL conversions", icon: "💬" },
  { id: "schema", label: "Schema Vault uploads", icon: "🗄️" },
  { id: "playground", label: "Playground query runs", icon: "▶️" },
  { id: "example", label: "Example queries used", icon: "📚" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [showExport, setShowExport] = useState(false);
  const [cfg, setCfg] = useState<ExportConfig>({ format: "json", types: ["optimize", "nl2sql"], dateRange: "all", limit: 1000 });
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const toggleType = (id: string) => {
    setCfg(c => ({ ...c, types: c.types.includes(id) ? c.types.filter(t => t !== id) : [...c.types, id] }));
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const ext = cfg.format;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sqo-export-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => { setExportDone(false); setShowExport(false); }, 2000);
    } catch (e) { console.error(e); } finally { setExporting(false); }
  };

  return (
    <div style={{ padding: "28px 28px 64px", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Settings</h1>
        <p style={{ color: "#7c6f94", fontSize: 14 }}>Account preferences and data management</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Account */}
        <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Account</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff" }}>
              {session?.user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{session?.user?.name}</div>
              <div style={{ fontSize: 13, color: "#7c6f94" }}>{session?.user?.email}</div>
              <div style={{ fontSize: 11, color: "#4a3d5c", marginTop: 4 }}>Signed in with Google · Session active</div>
            </div>
          </div>
        </div>

        {/* AI Engine Info (no keys exposed) */}
        <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>AI Engine</h2>
          <p style={{ fontSize: 13, color: "#7c6f94", marginBottom: 16 }}>5-model fallback chain — automatically selects the best available model</p>
          <div style={{ display: "grid", gap: 8 }}>
            {[
              { model: "gemini-1.5-pro", role: "Primary — best quality", status: "active" },
              { model: "gemini-1.5-flash", role: "Fallback 1 — fast", status: "standby" },
              { model: "gemini-1.5-flash-8b", role: "Fallback 2 — ultra-fast", status: "standby" },
              { model: "gemini-pro", role: "Fallback 3 — stable", status: "standby" },
              { model: "gemini-1.0-pro", role: "Fallback 4 — legacy", status: "standby" },
            ].map((m, i) => (
              <div key={m.model} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(45,15,78,0.3)", borderRadius: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed", minWidth: 20 }}>{i + 1}</span>
                <code style={{ fontSize: 13, color: "#c3e88d", flex: 1 }}>{m.model}</code>
                <span style={{ fontSize: 12, color: "#7c6f94" }}>{m.role}</span>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: m.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(45,15,78,0.4)", color: m.status === "active" ? "#10b981" : "#4a3d5c" }}>{m.status}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#4a3d5c", marginTop: 12 }}>
            🔒 API keys are managed server-side and never exposed to the browser. Configure via environment variables: <code style={{ color: "#7c6f94" }}>GEMINI_API_KEY</code>
          </p>
        </div>

        {/* Data & Storage */}
        <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Data &amp; Storage</h2>
          <p style={{ fontSize: 13, color: "#7c6f94", marginBottom: 20 }}>Export your query history and optimization results</p>

          {!showExport ? (
            <button onClick={() => setShowExport(true)} style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              📤 Export My Data
            </button>
          ) : (
            <div style={{ background: "rgba(45,15,78,0.3)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: 20, animation: "fadeIn 0.2s ease" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Configure Export</div>

              {/* Format */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7c6f94", letterSpacing: 1, marginBottom: 8 }}>FORMAT</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["json", "JSON", "Full data with metadata"], ["csv", "CSV", "Spreadsheet-compatible"], ["sql", "SQL", "Raw query files"]].map(([id, label, desc]) => (
                    <button key={id} onClick={() => setCfg(c => ({ ...c, format: id as "sql" | "json" | "csv" }))} style={{
                      flex: 1, padding: 12, borderRadius: 8, cursor: "pointer", border: `1px solid ${cfg.format === id ? "#7c3aed" : "rgba(45,15,78,0.5)"}`,
                      background: cfg.format === id ? "rgba(124,58,237,0.15)" : "transparent",
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: cfg.format === id ? "#c084fc" : "#9ca3af" }}>{label}</div>
                      <div style={{ fontSize: 11, color: "#7c6f94", marginTop: 2 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Features to include */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7c6f94", letterSpacing: 1, marginBottom: 8 }}>FEATURES TO INCLUDE</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {FEATURE_OPTIONS.map(f => (
                    <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: cfg.types.includes(f.id) ? "rgba(124,58,237,0.1)" : "transparent", border: `1px solid ${cfg.types.includes(f.id) ? "rgba(124,58,237,0.2)" : "rgba(45,15,78,0.3)"}` }}>
                      <input type="checkbox" checked={cfg.types.includes(f.id)} onChange={() => toggleType(f.id)}
                        style={{ accentColor: "#7c3aed", width: 16, height: 16 }} />
                      <span style={{ fontSize: 16 }}>{f.icon}</span>
                      <span style={{ fontSize: 13, color: cfg.types.includes(f.id) ? "#c084fc" : "#9ca3af" }}>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#7c6f94", letterSpacing: 1, marginBottom: 8 }}>DATE RANGE</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["all", "All time"], ["30d", "Last 30 days"], ["7d", "Last 7 days"]].map(([id, label]) => (
                    <button key={id} onClick={() => setCfg(c => ({ ...c, dateRange: id as "all" | "7d" | "30d" }))} style={{
                      flex: 1, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                      border: `1px solid ${cfg.dateRange === id ? "#7c3aed" : "rgba(45,15,78,0.5)"}`,
                      background: cfg.dateRange === id ? "rgba(124,58,237,0.15)" : "transparent",
                      color: cfg.dateRange === id ? "#c084fc" : "#9ca3af",
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: "rgba(10,0,20,0.4)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: "#b8a9cc" }}>
                <strong style={{ color: "#fff" }}>Export summary:</strong> {cfg.format.toUpperCase()} format · {cfg.types.length} feature{cfg.types.length !== 1 ? "s" : ""} · {cfg.dateRange === "all" ? "All time" : cfg.dateRange === "30d" ? "Last 30 days" : "Last 7 days"} · up to {cfg.limit.toLocaleString()} records
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={doExport} disabled={exporting || cfg.types.length === 0} style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: cfg.types.length ? "pointer" : "not-allowed",
                  background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", fontSize: 14, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {exportDone ? "✓ Downloaded!" : exporting ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Exporting...</> : `↓ Download ${cfg.format.toUpperCase()}`}
                </button>
                <button onClick={() => setShowExport(false)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid rgba(45,15,78,0.5)", background: "transparent", color: "#7c6f94", cursor: "pointer", fontSize: 14 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy */}
        <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Privacy &amp; Security</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {[
              ["🔒", "Personally Identifiable Information (PII) Auto-Redaction", "Emails, Social Security Numbers (SSNs), credit card numbers, and phone numbers are automatically redacted before any AI processing"],
              ["🚫", "No API Key Exposure", "Your Gemini API key is stored server-side and never sent to the browser or logged in responses"],
              ["🗄️", "Data Ownership", "All query history is stored under your account and can be exported or deleted at any time"],
              ["🔐", "Session Security", "Sessions are encrypted with NextAuth and expire after 30 days of inactivity"],
            ].map(([icon, title, desc]) => (
              <div key={title as string} style={{ display: "flex", gap: 12, padding: 14, background: "rgba(45,15,78,0.2)", borderRadius: 10 }}>
                <span style={{ fontSize: 20, marginTop: 2 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2d9f3", marginBottom: 3 }}>{title as string}</div>
                  <div style={{ fontSize: 12, color: "#7c6f94", lineHeight: 1.5 }}>{desc as string}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
