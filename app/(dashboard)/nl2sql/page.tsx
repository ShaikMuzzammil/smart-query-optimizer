"use client";
import { useState } from "react";
import Link from "next/link";

const DIALECTS = ["PostgreSQL", "MySQL", "SQLite", "BigQuery", "MS SQL Server"];

const DOMAIN_PROMPTS: Record<string, { icon: string; prompts: string[] }> = {
  "E-Commerce": { icon: "🛒", prompts: [
    "Show the top 10 customers by total spend last month, grouped by country",
    "Find all orders placed in Q4 2024 where the discount was more than 20%",
    "Calculate monthly revenue per product category for the last 6 months ordered by revenue",
  ]},
  "Healthcare": { icon: "🏥", prompts: [
    "Find all patients who had lab tests flagged as abnormal in the last 30 days",
    "List doctors with more than 50 appointments in January 2024 by specialty",
    "Show patients who were prescribed the same drug more than 3 times in a month",
  ]},
  "Finance": { icon: "💰", prompts: [
    "Calculate monthly revenue per product category for Q1 2024 ordered by revenue",
    "Find all accounts with a balance drop of more than 50% compared to last month",
    "Show all transactions above 10000 flagged as suspicious in the last 7 days",
  ]},
  "HR & Payroll": { icon: "👔", prompts: [
    "List employees with no performance review in the past 6 months by department",
    "Find departments where average salary is above company average",
    "Show top 5 departments by headcount growth in 2024",
  ]},
  "SaaS": { icon: "📱", prompts: [
    "Show daily active users for the past 14 days with 7-day rolling average",
    "Find all users who signed up but never completed onboarding",
    "Calculate monthly recurring revenue by plan tier for the last quarter",
  ]},
  "Logistics": { icon: "📦", prompts: [
    "Find all shipments delayed more than 3 days with carrier and route info",
    "Show warehouse utilization percentage by region this week",
    "List the top 10 routes by average delivery time in the last 30 days",
  ]},
  "Education": { icon: "🎓", prompts: [
    "Show all students who scored below 60% in more than 2 subjects this semester",
    "Find courses with enrollment growth greater than 20% year over year",
    "List instructors with average student rating above 4.5 in the last term",
  ]},
  "Gaming": { icon: "🎮", prompts: [
    "Find players who completed 10+ matches in the last 7 days and their win rate",
    "Show the top 20 players by score with their rank and percentile",
    "List all players who made in-app purchases this month grouped by amount tier",
  ]},
};

export default function NL2SQLPage() {
  const [dialect, setDialect] = useState("PostgreSQL");
  const [prompt, setPrompt] = useState("");
  const [domain, setDomain] = useState("E-Commerce");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [schemaCtx, setSchemaCtx] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check for saved schema from Schema Vault
  const checkSchema = () => {
    const saved = localStorage.getItem("sqo_schema_ddl");
    if (saved) setSchemaCtx(saved);
  };

  const convert = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/nl2sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, dialect, domain, schemaContext: schemaCtx || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const domainList = Object.entries(DOMAIN_PROMPTS);

  return (
    <div style={{ padding: "28px 28px 64px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>Natural Language to SQL</h1>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(124,58,237,0.2)", color: "#c084fc", fontWeight: 700 }}>NEW</span>
          </div>
          <p style={{ color: "#7c6f94", fontSize: 14 }}>Describe what data you need in plain English — get production-ready SQL for any dialect</p>
        </div>
        <Link href="/optimizer" style={{ fontSize: 13, color: "#7c6f94", textDecoration: "none", padding: "8px 14px", border: "1px solid rgba(45,15,78,0.6)", borderRadius: 8 }}>
          ⚡ Switch to SQL Optimizer
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        {/* LEFT — Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Schema Context Banner */}
          <div style={{ background: schemaCtx ? "rgba(16,185,129,0.08)" : "rgba(45,15,78,0.3)", border: `1px solid ${schemaCtx ? "rgba(16,185,129,0.2)" : "rgba(45,15,78,0.6)"}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🗄️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: schemaCtx ? "#10b981" : "#e2d9f3" }}>
                  {schemaCtx ? "Schema context loaded from Schema Vault" : "No schema context — using generic table names"}
                </div>
                <div style={{ fontSize: 11, color: "#7c6f94" }}>
                  {schemaCtx ? "Your exact table/column names will be used — no hallucinations" : "Load a schema from Schema Vault to prevent hallucinations"}
                </div>
              </div>
            </div>
            {schemaCtx ? (
              <button onClick={() => setSchemaCtx(null)} style={{ fontSize: 12, color: "#7c6f94", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={checkSchema} style={{ fontSize: 12, color: "#c084fc", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Load from Vault</button>
                <Link href="/schema" style={{ fontSize: 12, color: "#7c6f94", textDecoration: "none", padding: "4px 10px", border: "1px solid rgba(45,15,78,0.5)", borderRadius: 6 }}>Open Schema Vault →</Link>
              </div>
            )}
          </div>

          {/* Dialect Selector */}
          <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7c6f94", letterSpacing: 2, marginBottom: 10 }}>TARGET SQL DIALECT</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DIALECTS.map(d => (
                <button key={d} onClick={() => setDialect(d)} style={{
                  padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
                  background: dialect === d ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(45,15,78,0.4)",
                  color: dialect === d ? "#fff" : "#9ca3af", fontWeight: dialect === d ? 700 : 400, transition: "all 0.15s",
                }}>{d}</button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7c6f94", letterSpacing: 2, padding: "14px 16px 8px" }}>DESCRIBE WHAT YOU NEED</div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); convert(); } }}
              placeholder='e.g. "Show the top 10 customers by total spend last month, grouped by country"'
              style={{ width: "100%", minHeight: 160, background: "transparent", border: "none", outline: "none", color: "#e2d9f3", fontSize: 14, fontFamily: "inherit", padding: "8px 16px 16px", resize: "vertical", lineHeight: 1.7 }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderTop: "1px solid rgba(45,15,78,0.3)", fontSize: 12, color: "#7c6f94" }}>
              <span>{prompt.length} chars · {dialect}</span>
              <span>Command+Enter (Mac) / Ctrl+Enter (Windows)</span>
            </div>
          </div>

          <button onClick={convert} disabled={loading || !prompt.trim()} style={{
            width: "100%", padding: "15px", borderRadius: 12, border: "none", cursor: prompt.trim() ? "pointer" : "not-allowed",
            background: prompt.trim() ? "linear-gradient(135deg,#7c3aed,#9333ea)" : "rgba(45,15,78,0.3)",
            color: prompt.trim() ? "#fff" : "#7c6f94", fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s",
            boxShadow: prompt.trim() ? "0 0 24px rgba(124,58,237,0.4)" : "none",
          }}>
            {loading ? <><span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Converting...</> : "✦ Convert to SQL"}
          </button>

          {/* Error */}
          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, color: "#f87171" }}>⚠</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fca5a5", marginBottom: 4 }}>Conversion Unavailable</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{error}</div>
              </div>
              <button onClick={convert} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 8, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", color: "#c084fc", cursor: "pointer", fontSize: 12 }}>↺ Retry</button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 600 }}>✓ Converted</span>
                <span style={{ fontSize: 12, color: "#7c6f94" }}>{(result.complexity as string)} · {(result.tables as string[]).join(", ")}</span>
                <span style={{ fontSize: 11, color: "#4a3d5c", marginLeft: "auto" }}>via {result.modelUsed as string}</span>
              </div>

              <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid rgba(45,15,78,0.4)" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: 1 }}>GENERATED SQL — {dialect}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => copyText(result.sql as string)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(45,15,78,0.5)", background: "none", color: copied ? "#10b981" : "#7c6f94", cursor: "pointer", fontSize: 12 }}>
                      {copied ? "✓ Copied!" : "📋 Copy"}
                    </button>
                    <Link href={`/optimizer?sql=${encodeURIComponent(result.sql as string)}`} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.1)", color: "#c084fc", cursor: "pointer", fontSize: 12, textDecoration: "none" }}>
                      ⚡ Optimize
                    </Link>
                  </div>
                </div>
                <pre style={{ padding: 16, fontSize: 12, color: "#e2d9f3", overflow: "auto", maxHeight: 320, margin: 0, lineHeight: 1.7 }}>
                  {result.sql as string}
                </pre>
              </div>

              <div style={{ background: "rgba(26,0,51,0.4)", border: "1px solid rgba(45,15,78,0.5)", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 6, letterSpacing: 1 }}>EXPLANATION</div>
                <p style={{ fontSize: 13, color: "#b8a9cc", lineHeight: 1.7 }}>{result.explanation as string}</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Example Prompts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 20, flex: 1, overflow: "auto", maxHeight: "80vh" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 2, marginBottom: 16 }}>EXAMPLE PROMPTS</div>
            {domainList.map(([dom, { icon, prompts }]) => (
              <div key={dom} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#c084fc", marginBottom: 8 }}>{icon} {dom}</div>
                {prompts.map((p, i) => (
                  <div key={i} onClick={() => { setPrompt(p); setDomain(dom); }}
                    style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 6, cursor: "pointer", background: "rgba(45,15,78,0.3)", border: "1px solid rgba(45,15,78,0.4)", transition: "all 0.15s" }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(45,15,78,0.4)"; e.currentTarget.style.background = "rgba(45,15,78,0.3)"; }}>
                    <p style={{ fontSize: 12, color: "#b8a9cc", lineHeight: 1.5, margin: 0 }}>{p}</p>
                    <span style={{ fontSize: 10, color: "#7c3aed", marginTop: 4, display: "block" }}>→ Use this prompt</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
