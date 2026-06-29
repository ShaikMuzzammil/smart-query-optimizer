"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const QUICK_ACTIONS = [
  { href: "/optimizer", icon: "⚡", label: "SQL Optimizer", desc: "AI-powered query rewrite", color: "#7c3aed" },
  { href: "/nl2sql", icon: "💬", label: "NL to SQL", desc: "English → Production SQL", color: "#06b6d4", badge: "NEW" },
  { href: "/schema", icon: "🗄️", label: "Schema Vault", desc: "Data Definition Language (DDL) → Entity-Relationship (ER) Diagram", color: "#10b981", badge: "NEW" },
  { href: "/playground", icon: "▶️", label: "Playground", desc: "Run queries in-browser", color: "#f59e0b" },
  { href: "/examples", icon: "📚", label: "Examples", desc: "99+ production queries", color: "#ec4899" },
  { href: "/history", icon: "🕐", label: "History", desc: "All your queries", color: "#8b5cf6" },
  { href: "/analytics", icon: "📊", label: "Analytics", desc: "Usage insights", color: "#22d3ee" },
  { href: "/settings", icon: "⚙️", label: "Settings", desc: "Export & preferences", color: "#6b7280" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, []);

  const byType = (stats?.byType as Record<string, number>) || {};
  const chartData = [
    { name: "SQL Optimizer", count: byType.optimize || 0, fill: "#7c3aed" },
    { name: "NL to SQL", count: byType.nl2sql || 0, fill: "#06b6d4" },
    { name: "Schema", count: byType.schema || 0, fill: "#10b981" },
    { name: "Playground", count: byType.playground || 0, fill: "#f59e0b" },
    { name: "Examples", count: byType.example || 0, fill: "#ec4899" },
  ];

  const total = stats ? (stats.totalConversions as number) || 0 : 0;
  const issues = stats ? (stats.totalIssues as number) || 0 : 0;
  const avgDur = stats ? Math.round((stats.avgDurationMs as number) || 0) : 0;

  return (
    <div style={{ padding: "32px 32px 64px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
          Welcome back, {session?.user?.name?.split(" ")[0] || "Developer"} 👋
        </h1>
        <p style={{ color: "#7c6f94", fontSize: 15 }}>SQL Intelligence Platform — all your tools in one place</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Queries", value: total, icon: "📝", color: "#7c3aed" },
          { label: "SQL Optimized", value: byType.optimize || 0, icon: "⚡", color: "#a855f7" },
          { label: "NL to SQL", value: byType.nl2sql || 0, icon: "💬", color: "#06b6d4" },
          { label: "Issues Found", value: issues, icon: "🔍", color: "#ef4444" },
          { label: "Avg Speed", value: avgDur ? `${avgDur}ms` : "—", icon: "⏱️", color: "#10b981" },
          { label: "Schemas", value: byType.schema || 0, icon: "🗄️", color: "#f59e0b" },
        ].map(k => (
          <div key={k.label} style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, padding: "20px 16px" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#7c6f94", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        {/* Quick Actions */}
        <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {QUICK_ACTIONS.map(a => (
              <Link key={a.href} href={a.href} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 10,
                background: "rgba(45,15,78,0.4)", border: "1px solid rgba(45,15,78,0.6)",
                textDecoration: "none", transition: "all 0.15s",
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = `rgba(${a.color},0.1)`; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(45,15,78,0.6)"; e.currentTarget.style.background = "rgba(45,15,78,0.4)"; }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2d9f3" }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: "#7c6f94" }}>{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Usage Chart */}
        <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Usage by Feature</h2>
          {total > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                <XAxis dataKey="name" tick={{ fill: "#7c6f94", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7c6f94", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1a0033", border: "1px solid #2d0f4e", borderRadius: 8 }} labelStyle={{ color: "#e2d9f3" }} />
                {chartData.map(d => <Bar key={d.name} dataKey="count" fill={d.fill} radius={[4, 4, 0, 0]} />)}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#7c6f94", fontSize: 14 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
                <p>Run your first query to see stats</p>
                <Link href="/optimizer" style={{ color: "#a855f7", fontSize: 13, marginTop: 8, display: "block" }}>Try SQL Optimizer →</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature highlights */}
      <div style={{ background: "rgba(26,0,51,0.4)", border: "1px solid rgba(45,15,78,0.6)", borderRadius: 16, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 20 }}>Platform Features</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { icon: "⚡", title: "Live SQL Scanner", desc: "Instant anti-pattern detection — no AI needed. Finds N+1 queries, missing indexes, injection risks." },
            { icon: "🤖", title: "5-Model AI Fallback", desc: "gemini-1.5-pro → flash → flash-8b → pro → 1.0-pro ensures maximum uptime." },
            { icon: "🔒", title: "Personally Identifiable Information (PII) Guard", desc: "Emails, Social Security Numbers (SSNs), cards auto-redacted before any AI processing." },
            { icon: "📤", title: "4 Export Formats", desc: "Download your optimized queries as SQL, JSON, CSV, or PDF with one click." },
          ].map(f => (
            <div key={f.title} style={{ padding: 16, background: "rgba(45,15,78,0.3)", borderRadius: 10 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e2d9f3", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#7c6f94", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
