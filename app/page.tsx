"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DOMAINS = [
  { icon: "🛒", name: "E-Commerce", desc: "Orders, products, inventory" },
  { icon: "🏥", name: "Healthcare", desc: "Patients, records, labs" },
  { icon: "💰", name: "Finance", desc: "Transactions, accounts" },
  { icon: "👔", name: "HR & Payroll", desc: "Employees, salaries" },
  { icon: "📦", name: "Logistics", desc: "Shipments, routes" },
  { icon: "🎓", name: "Education", desc: "Students, courses, grades" },
  { icon: "🎮", name: "Gaming", desc: "Leaderboards, sessions" },
  { icon: "🏭", name: "Manufacturing", desc: "Production, inventory" },
  { icon: "🏢", name: "Real Estate", desc: "Properties, listings" },
  { icon: "📱", name: "SaaS", desc: "Users, subscriptions, metrics" },
  { icon: "🏦", name: "Banking", desc: "Accounts, transactions" },
  { icon: "✈️", name: "Travel", desc: "Bookings, flights, hotels" },
];

const FEATURES = [
  { icon: "⚡", title: "SQL Optimizer", desc: "Paste broken SQL — get a production-grade rewrite with anti-pattern detection, index recommendations, and security alerts in seconds.", color: "#7c3aed" },
  { icon: "💬", title: "Natural Language to SQL", desc: "Describe what data you need in plain English and get a ready-to-run SQL query for any dialect — no schema hallucinations.", color: "#06b6d4" },
  { icon: "🗄️", title: "Schema Vault", desc: "Upload DDL and get a visual Entity-Relationship diagram with zoomable, scrollable tables and relationship lines.", color: "#10b981" },
  { icon: "▶️", title: "SQL Playground", desc: "Run SQL queries in-browser against real demo databases (E-Commerce, HR, Education) — zero setup required.", color: "#f59e0b" },
  { icon: "📚", title: "Query Examples", desc: "99+ production-ready queries across 12 domains with full explanations, copy-to-clipboard, and dialect switching.", color: "#ec4899" },
];

const HOW_IT_WORKS_STEPS = [
  { step: "01", title: "Paste Your SQL", desc: "Drop any SQL query — broken, slow, or complex. Supports PostgreSQL, MySQL, SQLite, BigQuery, and MS SQL Server." },
  { step: "02", title: "Personally Identifiable Information (PII) Auto-Redacted", desc: "Emails, Social Security Numbers (SSNs), credit card numbers, and phone numbers are detected and masked before reaching the AI engine." },
  { step: "03", title: "Live Scanner Runs Instantly", desc: "Our static analyzer detects anti-patterns in real time — correlated subqueries, missing indexes, injection vectors — with no API call." },
  { step: "04", title: "AI Engine Optimizes", desc: "A 5-model fallback chain (gemini-1.5-pro → flash → flash-8b → pro → 1.0-pro) rewrites the query with inline comments explaining every change." },
  { step: "05", title: "Export & Use", desc: "Copy the optimized SQL, export to SQL file / JSON / CSV / PDF, or jump to the Natural Language to SQL converter for the next query." },
];

const FAQS = [
  { q: "What is Personally Identifiable Information (PII) redaction?", a: "Before any SQL is sent to the AI engine, our regex pipeline scans for and replaces emails, SSNs, phone numbers, and credit card numbers with safe placeholders like [EMAIL_REDACTED]. The original data never leaves your browser unmasked." },
  { q: "What SQL dialects are supported?", a: "PostgreSQL, MySQL, SQLite, BigQuery, and MS SQL Server. Each has its own reference panel with syntax tips, function lists, and performance best practices." },
  { q: "What is the AI engine's fallback chain?", a: "The engine tries gemini-1.5-pro first. On failure or quota exhaustion, it cascades through gemini-1.5-flash → gemini-1.5-flash-8b → gemini-pro → gemini-1.0-pro. Even if all AI models fail, the static analyzer still returns useful results." },
  { q: "What is an Entity-Relationship (ER) diagram?", a: "An ER diagram shows your database tables as boxes and their relationships (foreign keys) as connecting lines. Schema Vault generates one from your Data Definition Language (DDL) automatically." },
  { q: "What is Natural Language to SQL (NL2SQL)?", a: "NL2SQL converts plain-English descriptions of data needs into runnable SQL. Example: 'Show me the top 10 customers by total spend last month' → full SELECT with JOINs, GROUP BY, ORDER BY, and LIMIT." },
  { q: "What is Data Definition Language (DDL)?", a: "DDL is the subset of SQL used to define database structure — CREATE TABLE, ALTER TABLE, DROP TABLE. Schema Vault reads DDL to extract table names, column types, and foreign key relationships." },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      // Don't redirect — let them browse the landing page if they want
    }
  }, [status]);

  return (
    <div style={{ background: "#0a0014", color: "#e2d9f3", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid rgba(124,58,237,0.2)", background: "rgba(10,0,20,0.9)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>
                <span style={{ color: "#fff" }}>Smart</span><span style={{ color: "#a855f7" }}>Query</span>
              </div>
              <div style={{ fontSize: 9, color: "#7c6f94", letterSpacing: 1 }}>SQL Intelligence Platform</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 32, fontSize: 14 }}>
            {["Features", "How It Works", "Domains", "FAQ"].map(s => (
              <a key={s} href={`#${s.toLowerCase().replace(" ", "-")}`} style={{ color: "#9ca3af", textDecoration: "none" }}
                onMouseOver={e => (e.currentTarget.style.color = "#c084fc")}
                onMouseOut={e => (e.currentTarget.style.color = "#9ca3af")}>{s}</a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {session ? (
              <Link href="/dashboard" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/signin" style={{ color: "#9ca3af", fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  → Sign in
                </Link>
                <Link href="/signin" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", padding: "8px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                  Get Started →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 140, paddingBottom: 80, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#c084fc", marginBottom: 32 }}>
            ✦ SQL performance at production scale
          </div>
          <h1 style={{ fontSize: "clamp(48px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            <span style={{ color: "#fff" }}>Smart Query</span><br />
            <span style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Optimizer</span>
          </h1>
          <p style={{ fontSize: 14, color: "#7c6f94", marginBottom: 16 }}>SQL Intelligence Platform · 12 Industry Domains</p>
          <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "#b8a9cc", marginBottom: 48, maxWidth: 700, margin: "0 auto 48px" }}>
            Paste broken SQL. Get production-grade rewrites with full analysis — anti-pattern detection, index recommendations, and security alerts in seconds.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={session ? "/dashboard" : "/signin"} style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", padding: "14px 32px", borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}>
              Start Optimizing →
            </Link>
            <Link href="/signin" style={{ background: "transparent", color: "#e2d9f3", padding: "14px 32px", borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: "none", border: "1px solid rgba(124,58,237,0.3)" }}>
              → Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* BEFORE/AFTER DEMO */}
      <section style={{ maxWidth: 1100, margin: "0 auto 80px", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", letterSpacing: 2, marginBottom: 16 }}>● BEFORE — 3 ANTI-PATTERNS</div>
            <pre style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.8, overflow: "auto" }}>{`-- ✗ 3 critical anti-patterns detected
SELECT p.id, p.name,
  (SELECT SUM(oi.qty * oi.price)
   FROM order_items oi
   WHERE oi.product_id = p.id) AS revenue,
  (SELECT COUNT(*) FROM reviews r
   WHERE r.product_id = p.id) AS review_count
FROM products p
WHERE YEAR(p.created_at) = 2024;`}</pre>
          </div>
          <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", letterSpacing: 2, marginBottom: 16 }}>● AFTER — OPTIMIZED</div>
            <pre style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.8, overflow: "auto" }}>{`-- ✓ LEFT JOIN eliminates N+1 correlated subquery
-- ✓ Range filter lets index on created_at work
-- ✓ LIMIT bounds result set safely
SELECT p.id, p.name,
  COALESCE(SUM(oi.qty * oi.price), 0) AS revenue,
  COUNT(DISTINCT r.id) AS review_count
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN reviews r ON r.product_id = p.id
WHERE p.created_at >= '2024-01-01'
  AND p.created_at < '2025-01-01'
GROUP BY p.id, p.name
ORDER BY revenue DESC
LIMIT 50;`}</pre>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", letterSpacing: 3, marginBottom: 12 }}>FEATURES</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#fff" }}>Everything your SQL needs</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} onMouseOver={e => (e.currentTarget.style.borderColor = f.color)} onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(45,15,78,0.8)")}
              style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 16, padding: 28, transition: "all 0.2s", cursor: "default" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#7c6f94", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ background: "rgba(124,58,237,0.04)", borderTop: "1px solid rgba(124,58,237,0.1)", borderBottom: "1px solid rgba(124,58,237,0.1)", padding: "80px 0", marginBottom: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", letterSpacing: 3, marginBottom: 12 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#fff" }}>From broken SQL to production-ready in seconds</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.step} style={{ textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontWeight: 800, fontSize: 16, color: "#fff", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
                  {step.step}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: "#7c6f94", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GUIDE SECTION */}
      <section style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", letterSpacing: 3, marginBottom: 12 }}>USER GUIDE</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#fff" }}>How to use each feature</h2>
        </div>
        <div style={{ display: "grid", gap: 20 }}>
          {[
            { icon: "⚡", title: "SQL Optimizer", steps: ["Paste your SQL query in the editor", "Select your SQL dialect (PostgreSQL, MySQL, SQLite, BigQuery, MS SQL Server)", "Click the dialect Reference button to see syntax tips", "Watch the Live Scanner detect anti-patterns instantly", 'Click "Optimize with AI" to get a full rewrite', "Copy the result or export to SQL/JSON/CSV/PDF"] },
            { icon: "💬", title: "Natural Language to SQL (NL2SQL)", steps: ["(Optional) Upload your schema in Schema Vault first to prevent hallucinations", "Select your target SQL dialect", 'Type what data you need in plain English — e.g. "Show top 10 customers by revenue last month"', 'Click "Convert to SQL" to get a production-ready query', "The query uses your exact table and column names from Schema Vault", "Copy or load into the SQL Optimizer for further tuning"] },
            { icon: "🗄️", title: "Schema Vault", steps: ["Paste your Data Definition Language (DDL) — CREATE TABLE statements", "See stats: character count, tables, columns, relationships", "Switch to ER Diagram tab for a visual Entity-Relationship view", "Edit tables and columns directly in the diagram", 'Click "Use in NL to SQL" to inject schema context', "Load example schemas (E-Commerce, HR, Education) to explore"] },
            { icon: "▶️", title: "SQL Playground", steps: ["Select a demo database (E-Commerce, HR, Education)", "Pick a sample query or write your own", "Click Run to execute in-browser — no server needed", "See results in a formatted table below", "Copy queries with the copy button for use elsewhere"] },
          ].map(f => (
            <div key={f.title} style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 16, padding: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>{f.icon} {f.title}</h3>
              <ol style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8, listStyle: "none" }}>
                {f.steps.map((s, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: "#b8a9cc" }}>
                    <span style={{ color: "#7c3aed", fontWeight: 700, minWidth: 20 }}>{i+1}.</span>{s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* DOMAINS */}
      <section id="domains" style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", letterSpacing: 3, marginBottom: 12 }}>12 INDUSTRY DOMAINS</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#fff" }}>Built for every industry</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          {DOMAINS.map(d => (
            <div key={d.name} style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{d.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "#7c6f94" }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: 800, margin: "0 auto 100px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", letterSpacing: 3, marginBottom: 12 }}>FAQ</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#fff" }}>Frequently asked questions</h2>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          {FAQS.map(f => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "80px 24px 120px", background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)" }}>
        <h2 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>Ready to optimize your SQL?</h2>
        <p style={{ color: "#7c6f94", marginBottom: 40, fontSize: 16 }}>Join thousands of developers writing faster, safer queries.</p>
        <Link href="/signin" style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", padding: "16px 40px", borderRadius: 12, fontWeight: 700, fontSize: 18, textDecoration: "none", boxShadow: "0 0 40px rgba(124,58,237,0.5)" }}>
          Start Free — No Credit Card →
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(45,15,78,0.6)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>Smart Query Optimizer</span>
        </div>
        <p style={{ fontSize: 13, color: "#4a3d5c" }}>SQL Intelligence Platform · AI-Powered · Secure · v7.0</p>
      </footer>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "rgba(26,0,51,0.6)", border: "1px solid rgba(45,15,78,0.8)", borderRadius: 12, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", color: "#fff", cursor: "pointer", textAlign: "left", fontSize: 15, fontWeight: 600 }}>
        {q}
        <span style={{ color: "#7c3aed", fontSize: 20, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </button>
      {open && <div style={{ padding: "0 24px 20px", fontSize: 14, color: "#9ca3af", lineHeight: 1.7, borderTop: "1px solid rgba(45,15,78,0.5)" }}>{a}</div>}
    </div>
  );
}
