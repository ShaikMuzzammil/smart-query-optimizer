"use client";
import { useEffect, useState } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "3px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#7c6f94" }}>Loading analytics...</p>
      </div>
    </div>
  );

  const byType = (stats?.byType as Record<string, number>) || {};
  const bySeverity = (stats?.bySeverity as Record<string, number>) || {};
  const byDialect = (stats?.byDialect as Record<string, number>) || {};
  const byDomain = (stats?.byDomain as Record<string, number>) || {};
  const total = (stats?.totalConversions as number) || 0;
  const totalIssues = (stats?.totalIssues as number) || 0;

  const featureLabels: Record<string, string> = {
    optimize: "SQL Optimizer",
    nl2sql: "NL to SQL",
    schema: "Schema Vault",
    playground: "Playground",
    example: "Examples",
  };

  const radarData = Object.entries(featureLabels).map(([key, label]) => ({
    feature: label, count: byType[key] || 0, fullMark: Math.max(...Object.values(byType), 1),
  }));

  const severityData = Object.entries(bySeverity).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v }));
  const severityColors: Record<string, string> = { Critical: "#ef4444", High: "#f59e0b", Medium: "#eab308", Low: "#10b981" };

  const dialectData = Object.entries(byDialect).map(([k, v]) => ({ name: k, count: v }));
  const domainData = Object.entries(byDomain).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 8);

  const kpis = [
    { label: "Total Queries", value: total, icon: "📝", color: "#7c3aed" },
    { label: "SQL Optimized", value: byType.optimize || 0, icon: "⚡", color: "#a855f7" },
    { label: "NL to SQL", value: byType.nl2sql || 0, icon: "💬", color: "#06b6d4" },
    { label: "Schemas Analyzed", value: byType.schema || 0, icon: "🗄️", color: "#10b981" },
    { label: "Playground Runs", value: byType.playground || 0, icon: "▶️", color: "#f59e0b" },
    { label: "Total Issues Found", value: totalIssues, icon: "🔍", color: "#ef4444" },
  ];

  return (
    <div style={{ padding: "28px 28px 64px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Analytics</h1>
        <p style={{ color: "#7c6f94", fontSize: 14 }}>Universal usage statistics across all features — SQL Optimizer, Natural Language to SQL, Schema Vault, Playground, and Examples</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, padding: "18px 16px" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "#7c6f94", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div style={{ background: "rgba(26,0,51,0.4)", border: "1px dashed rgba(45,15,78,0.6)", borderRadius: 16, padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3 style={{ color: "#fff", marginBottom: 8 }}>No data yet</h3>
          <p style={{ color: "#7c6f94", fontSize: 14 }}>Use SQL Optimizer, NL to SQL, or other features to generate analytics data</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Row 1: Radar + Severity */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Feature Usage Radar</h3>
              <p style={{ fontSize: 12, color: "#7c6f94", marginBottom: 16 }}>Distribution across all 5 platform features</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(45,15,78,0.8)" />
                  <PolarAngleAxis dataKey="feature" tick={{ fill: "#7c6f94", fontSize: 11 }} />
                  <Radar dataKey="count" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Issue Severity Distribution</h3>
              <p style={{ fontSize: 12, color: "#7c6f94", marginBottom: 16 }}>SQL anti-patterns by severity level</p>
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={severityData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {severityData.map((entry) => (
                        <Cell key={entry.name} fill={severityColors[entry.name] || "#7c6f94"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1a0033", border: "1px solid #2d0f4e", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#7c6f94", fontSize: 14 }}>No issue data yet</div>
              )}
            </div>
          </div>

          {/* Row 2: Dialect + Domain */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>SQL Dialect Usage</h3>
              <p style={{ fontSize: 12, color: "#7c6f94", marginBottom: 16 }}>Queries per dialect across all features</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dialectData} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" tick={{ fill: "#7c6f94", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#b8a9cc", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1a0033", border: "1px solid #2d0f4e", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Top Domains</h3>
              <p style={{ fontSize: 12, color: "#7c6f94", marginBottom: 16 }}>Most used industry domains</p>
              {domainData.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {domainData.map((d, i) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: "#7c6f94", minWidth: 16 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: "#e2d9f3", flex: 1 }}>{d.name}</span>
                      <div style={{ width: 120, height: 6, background: "rgba(45,15,78,0.5)", borderRadius: 3 }}>
                        <div style={{ width: `${Math.round((d.count / domainData[0].count) * 100)}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#7c6f94", minWidth: 24, textAlign: "right" }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#7c6f94", fontSize: 14 }}>No domain data yet</div>
              )}
            </div>
          </div>

          {/* Feature breakdown table */}
          <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 14, padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Feature Breakdown</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Feature", "Count", "% of Total", "Status"].map(h => (
                    <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#7c6f94", letterSpacing: 1, borderBottom: "1px solid rgba(45,15,78,0.4)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(featureLabels).map(([key, label], i) => {
                  const cnt = byType[key] || 0;
                  const pct = total > 0 ? ((cnt / total) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={key} style={{ borderBottom: "1px solid rgba(45,15,78,0.2)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#e2d9f3", fontWeight: 600 }}>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: COLORS[i], marginRight: 10 }} />
                        {label}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: COLORS[i], fontWeight: 700 }}>{cnt}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#7c6f94" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: "rgba(45,15,78,0.5)", borderRadius: 2 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: COLORS[i], borderRadius: 2 }} />
                          </div>
                          {pct}%
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: cnt > 0 ? "rgba(16,185,129,0.12)" : "rgba(45,15,78,0.3)", color: cnt > 0 ? "#10b981" : "#7c6f94" }}>
                          {cnt > 0 ? "Active" : "Not used yet"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
