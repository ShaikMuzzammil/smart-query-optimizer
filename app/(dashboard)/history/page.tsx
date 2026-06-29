"use client";
import { useEffect, useState } from "react";

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  optimize: { label: "SQL Optimizer", icon: "⚡", color: "#7c3aed" },
  nl2sql:   { label: "NL to SQL",     icon: "💬", color: "#06b6d4" },
  schema:   { label: "Schema Vault",  icon: "🗄️", color: "#10b981" },
  playground: { label: "Playground",  icon: "▶️", color: "#f59e0b" },
  example:  { label: "Examples",      icon: "📚", color: "#ec4899" },
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444", high: "#f59e0b", medium: "#eab308", low: "#10b981",
};

type Conversion = {
  id: string; type: string; input: string; output: string | null;
  dialect: string | null; domain: string | null; issueCount: number;
  severity: string | null; status: string; modelUsed: string | null;
  duration: number | null; createdAt: string;
};

export default function HistoryPage() {
  const [items, setItems] = useState<Conversion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const LIMIT = 20;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: filter, limit: String(LIMIT), offset: String(page * LIMIT),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/conversions?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, search, page]);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ padding: "28px 28px 64px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 6 }}>History</h1>
        <p style={{ color: "#7c6f94", fontSize: 14 }}>Universal history — all features: SQL Optimizer, Natural Language to SQL, Schema Vault, Playground, and Examples</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Filter by type */}
        <div style={{ display: "flex", gap: 6, background: "rgba(26,0,51,0.4)", padding: 4, borderRadius: 10 }}>
          {[["all", "All Features", "📊"], ...Object.entries(TYPE_LABELS).map(([k, v]) => [k, v.label, v.icon])].map(([id, label, icon]) => (
            <button key={id} onClick={() => { setFilter(id); setPage(0); }} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
              background: filter === id ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "transparent",
              color: filter === id ? "#fff" : "#7c6f94", fontWeight: filter === id ? 700 : 400, display: "flex", alignItems: "center", gap: 4,
            }}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search queries..."
          style={{ flex: 1, minWidth: 200, padding: "8px 14px", borderRadius: 8, background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.6)", color: "#e2d9f3", fontSize: 13, outline: "none" }} />

        <div style={{ display: "flex", alignItems: "center", fontSize: 13, color: "#7c6f94" }}>
          {total} total
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#7c6f94" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          Loading history...
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: "rgba(26,0,51,0.4)", border: "1px dashed rgba(45,15,78,0.6)", borderRadius: 16, padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🕐</div>
          <h3 style={{ color: "#fff", marginBottom: 8 }}>No history yet</h3>
          <p style={{ color: "#7c6f94", fontSize: 14 }}>Your query history will appear here after using any feature</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map(item => {
              const meta = TYPE_LABELS[item.type] || { label: item.type, icon: "📄", color: "#7c6f94" };
              const isExpanded = expanded === item.id;
              const date = new Date(item.createdAt);
              return (
                <div key={item.id} style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.6)", borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s" }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = meta.color + "60")}
                  onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(45,15,78,0.6)")}>
                  {/* Row header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
                    onClick={() => setExpanded(isExpanded ? null : item.id)}>
                    {/* Feature badge */}
                    <div style={{ padding: "4px 10px", borderRadius: 6, background: meta.color + "20", color: meta.color, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, minWidth: 130 }}>
                      {meta.icon} {meta.label}
                    </div>

                    {/* Input preview */}
                    <span style={{ flex: 1, fontSize: 13, color: "#b8a9cc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: item.type === "nl2sql" ? "inherit" : "monospace" }}>
                      {item.input.slice(0, 100)}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {item.dialect && <span style={{ fontSize: 11, color: "#7c6f94", padding: "2px 8px", background: "rgba(45,15,78,0.4)", borderRadius: 4 }}>{item.dialect}</span>}
                      {item.severity && <span style={{ fontSize: 11, fontWeight: 700, color: SEVERITY_COLOR[item.severity] || "#7c6f94" }}>{item.severity.toUpperCase()}</span>}
                      {item.issueCount > 0 && <span style={{ fontSize: 11, color: "#f59e0b" }}>⚠ {item.issueCount}</span>}
                      <span style={{ fontSize: 11, color: "#4a3d5c" }}>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span style={{ color: "#7c6f94", fontSize: 14, transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0)" }}>›</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid rgba(45,15,78,0.4)", padding: 16, animation: "fadeIn 0.2s ease" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c6f94", letterSpacing: 1, marginBottom: 8 }}>INPUT</div>
                          <pre style={{ fontSize: 12, color: "#b8a9cc", background: "rgba(10,0,20,0.5)", padding: 12, borderRadius: 8, overflow: "auto", maxHeight: 200, lineHeight: 1.6, margin: 0 }}>
                            {item.input}
                          </pre>
                        </div>
                        {item.output && (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#7c6f94", letterSpacing: 1 }}>OUTPUT</span>
                              <button onClick={() => copy(item.output!, item.id)} style={{ fontSize: 11, color: copied === item.id ? "#10b981" : "#7c6f94", background: "none", border: "none", cursor: "pointer" }}>
                                {copied === item.id ? "✓ Copied" : "📋 Copy"}
                              </button>
                            </div>
                            <pre style={{ fontSize: 12, color: "#c3e88d", background: "rgba(10,0,20,0.5)", padding: 12, borderRadius: 8, overflow: "auto", maxHeight: 200, lineHeight: 1.6, margin: 0 }}>
                              {item.output}
                            </pre>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#4a3d5c" }}>
                        {item.modelUsed && <span>Model: {item.modelUsed}</span>}
                        {item.duration && <span>Duration: {item.duration}ms</span>}
                        {item.domain && <span>Domain: {item.domain}</span>}
                        <span>Status: <span style={{ color: item.status === "success" ? "#10b981" : "#f59e0b" }}>{item.status}</span></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(45,15,78,0.4)", border: "1px solid rgba(45,15,78,0.6)", color: page === 0 ? "#4a3d5c" : "#c084fc", cursor: page === 0 ? "not-allowed" : "pointer", fontSize: 13 }}>
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(0, Math.min(page - 2 + i, totalPages - 1));
                return (
                  <button key={pg} onClick={() => setPage(pg)} style={{
                    padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
                    background: pg === page ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(45,15,78,0.4)",
                    color: pg === page ? "#fff" : "#7c6f94",
                  }}>{pg + 1}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(45,15,78,0.4)", border: "1px solid rgba(45,15,78,0.6)", color: page >= totalPages - 1 ? "#4a3d5c" : "#c084fc", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", fontSize: 13 }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
