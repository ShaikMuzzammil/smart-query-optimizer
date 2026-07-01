"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Zap, Brain, Database, Terminal, BookOpen, BarChart3,
  ArrowRight, CheckCircle2, ChevronDown, ChevronRight, Shield,
  Clock, TrendingUp, Code2, Play, Upload, Sparkles, Home,
} from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Features",    href: "#features"   },
  { label: "How It Works",href: "#how-it-works"},
  { label: "Guide",       href: "#guide"       },
  { label: "Domains",     href: "#domains"     },
  { label: "FAQ",         href: "#faq"         },
];

const FEATURES = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "SQL Optimizer",
    desc: "Paste any SQL query — get an AI-rewritten, production-grade version with full analysis: anti-pattern detection, index recommendations, complexity reduction, and Personally Identifiable Information (PII) auto-redaction.",
    color: "violet",
    href: "/optimizer",
    bullets: ["Correlated subquery elimination","Index-aware rewrites","Complexity: O(n²) → O(n log n)","PII auto-redaction before processing"],
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Natural Language to SQL",
    desc: "Describe what data you need in plain English — SmartQuery converts it to production-ready SQL for your chosen dialect automatically, with zero hallucinations when your schema is loaded.",
    color: "sky",
    href: "/nl2sql",
    bullets: ["Supports PostgreSQL, MySQL, SQLite, BigQuery","Schema-aware generation","Plain English → production SQL","Example prompts for 12 domains"],
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: "Schema Vault",
    desc: "Upload your Data Definition Language (DDL) — instantly get a visual Entity-Relationship (ER) diagram with Primary Key (PK) and Foreign Key (FK) detection. Your schema is then injected into Natural Language to SQL for accurate generation.",
    color: "emerald",
    href: "/schema",
    bullets: ["Auto-detect PK/FK relationships","Live ER diagram visualization","DDL char usage meter","Schema context for NL to SQL"],
  },
  {
    icon: <Terminal className="w-6 h-6" />,
    title: "SQL Playground",
    desc: "Run SQL queries directly in-browser against sample databases — no backend, no setup. Perfect for testing optimized queries before deploying.",
    color: "amber",
    href: "/playground",
    bullets: ["In-browser SQL execution engine","Pre-loaded sample databases","Query history with copy options","Live results grid"],
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Example Library",
    desc: "25 curated, real-world SQL examples across 9 industry domains. Each example is annotated with the anti-patterns it demonstrates and what the optimized version achieves.",
    color: "pink",
    href: "/examples",
    bullets: ["25 queries, 9 domains","Difficulty-rated (Beginner → Advanced)","Copy, run, or optimize any example","Covers E-Commerce, Healthcare, Finance, HR and more"],
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Analytics & History",
    desc: "Full usage analytics across every SmartQuery feature — track your optimization streak, performance gain trends, issue severity breakdown, and Natural Language to SQL conversion counts.",
    color: "violet",
    href: "/analytics",
    bullets: ["Universal stats: all features in one view","14-day activity trend charts","Domain breakdown with average gains","Export history as CSV, JSON, SQL, or PDF"],
  },
];

const HOW_IT_WORKS = [
  { step: "01", icon: <Upload className="w-5 h-5" />, title: "Paste Your Query", desc: "Paste SQL directly or upload a .sql file. Your Personally Identifiable Information (PII) — emails, Social Security Numbers, card numbers — is auto-redacted before processing." },
  { step: "02", icon: <Sparkles className="w-5 h-5" />, title: "AI Analysis Runs", desc: "SmartQuery scans for anti-patterns, calculates complexity class, estimates rows scanned, and identifies index opportunities — all in seconds." },
  { step: "03", icon: <Code2 className="w-5 h-5" />, title: "Get Optimized SQL", desc: "Receive a fully rewritten SQL query with inline comments, index recommendations, and a side-by-side Before / After comparison." },
  { step: "04", icon: <Play className="w-5 h-5" />, title: "Test in Playground", desc: "Copy the optimized query straight to SQL Playground and run it against a sample database — no setup required." },
  { step: "05", icon: <BarChart3 className="w-5 h-5" />, title: "Track Progress", desc: "Every optimization is saved to History and Analytics — watch your performance gain average climb and your query cost scores drop over time." },
];

const GUIDE_STEPS = [
  {
    num: "1",
    title: "Start with SQL Optimizer for your slowest query",
    detail: "Go to SQL Optimizer, select your dialect (PostgreSQL, MySQL, SQLite, BigQuery, or MS SQL Server), paste your query, and click Optimize with AI. The Live Scanner instantly highlights issues even before the optimization completes.",
    tip: "Upload a .sql file for batch optimization.",
  },
  {
    num: "2",
    title: "Load your schema into Schema Vault for accurate Natural Language to SQL",
    detail: "Open Schema Vault, paste your Data Definition Language (DDL), and click Load. SmartQuery parses your tables and relationships into a visual Entity-Relationship diagram. Once loaded, all Natural Language to SQL conversions use your exact column and table names.",
    tip: "Click Use in NL to SQL to inject schema context automatically.",
  },
  {
    num: "3",
    title: "Use Natural Language to SQL for new query generation",
    detail: "Open NL to SQL, choose your target dialect, and describe what data you need in plain English. With schema context loaded, the generated SQL will use your real table names — no hallucinations.",
    tip: "Browse Example Prompts on the right panel for inspiration.",
  },
  {
    num: "4",
    title: "Test generated or optimized queries in the Playground",
    detail: "SQL Playground runs SQL entirely in-browser against pre-loaded sample databases. Use it to validate your optimized queries, experiment with JOINs, or try the Example Library queries interactively.",
    tip: "Use the copy button on any SQL block to move queries between tools.",
  },
  {
    num: "5",
    title: "Review Analytics and export your work",
    detail: "Analytics shows your full optimization history, feature usage breakdown, domain distribution, and performance gain trends. From Settings, export all your data as SQL, CSV, JSON, or PDF — each export type lets you choose what to include before downloading.",
    tip: "A 7-day optimization streak unlocks the Flame badge.",
  },
];

const DOMAINS = [
  { name: "E-Commerce",      icon: "🛒", eg: "Top 10 customers by total spend" },
  { name: "Healthcare",      icon: "🏥", eg: "Patients with abnormal lab tests" },
  { name: "Finance",         icon: "💰", eg: "Monthly revenue per category"     },
  { name: "HR & Payroll",    icon: "👥", eg: "Employees with no review in 6 months" },
  { name: "SaaS",            icon: "📊", eg: "Daily active users with rolling average" },
  { name: "Logistics",       icon: "🚚", eg: "Delayed shipments with carrier info" },
  { name: "Education",       icon: "🎓", eg: "Students with enrollment counts"  },
  { name: "Gaming",          icon: "🎮", eg: "Leaderboard by score this month"  },
  { name: "Banking",         icon: "🏦", eg: "High-value transactions by region" },
];

const FAQS = [
  {
    q: "What does PII auto-redaction mean?",
    a: "Personally Identifiable Information (PII) — such as email addresses, Social Security Numbers (SSN), and credit card numbers — found in your SQL string literals is automatically replaced with [REDACTED_EMAIL], [REDACTED_SSN], etc. before the query is sent for optimization. Your real data never leaves your browser in plain text.",
  },
  {
    q: "What SQL dialects are supported?",
    a: "SmartQuery supports PostgreSQL, MySQL, SQLite, BigQuery, and MS SQL Server. Each optimizer and NL to SQL run uses dialect-specific syntax, functions, and index types.",
  },
  {
    q: "What does Natural Language to SQL (NL2SQL) mean?",
    a: "Natural Language to SQL (NL2SQL) is the process of converting a plain-English description of a data query into a valid SQL statement. For example: 'Show me the top 10 customers by total spend last month' becomes a full SELECT with JOINs, GROUP BY, and ORDER BY — ready to run.",
  },
  {
    q: "What is a DDL and why do I need Schema Vault?",
    a: "Data Definition Language (DDL) is the part of SQL that defines your database structure — CREATE TABLE statements, column types, primary keys, and foreign keys. Uploading your DDL to Schema Vault lets SmartQuery generate an Entity-Relationship (ER) diagram and inject your exact table/column names into Natural Language to SQL so it never invents column names that don't exist.",
  },
  {
    q: "What is an ER diagram?",
    a: "An Entity-Relationship (ER) diagram is a visual map of your database tables and the relationships between them. Schema Vault auto-generates one from your DDL, marking Primary Key (PK) columns with a key icon and Foreign Key (FK) columns with a link icon.",
  },
  {
    q: "Is my data stored or shared?",
    a: "Your optimized queries are saved to your account history for your own reference and analytics. Query text is stored securely and never shared. PII is redacted before any AI processing. You can delete your history or export and purge it from Settings at any time.",
  },
  {
    q: "What export formats are available?",
    a: "From Settings you can export your optimization history as SQL (just the optimized queries), CSV (all metadata in spreadsheet format), JSON (full structured data), or PDF (formatted report). Every export asks you to choose a scope and format before downloading.",
  },
  {
    q: "What environment variables do I need to self-host?",
    a: "You only need five: GEMINI_API_KEY (from Google AI Studio — free), DATABASE_URL and DIRECT_URL (your Neon PostgreSQL connection strings), NEXTAUTH_SECRET (a random 32-character string), and NEXTAUTH_URL (your deployed app URL).",
  },
];

const STATS = [
  { value: "9",      label: "Industry Domains"     },
  { value: "25",     label: "Example Queries"      },
  { value: "5",      label: "SQL Dialects"          },
  { value: "O(n²)→O(n log n)", label: "Complexity Reduction" },
];

const FEAT_COLOR: Record<string, string> = {
  violet:  "bg-violet-500/15 text-violet-400 border-violet-500/25",
  sky:     "bg-sky-500/15 text-sky-400 border-sky-500/25",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  amber:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  pink:    "bg-pink-500/15 text-pink-400 border-pink-500/25",
  rose:    "bg-rose-500/15 text-rose-400 border-rose-500/25",
};

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-violet-500/10">
      <button className="w-full flex items-center justify-between gap-3 p-5 text-left text-sm font-semibold hover:text-violet-300 transition-colors"
        onClick={() => setOpen(!open)}>
        <span>{q}</span>
        {open ? <ChevronDown className="w-4 h-4 flex-shrink-0 text-violet-400" /> : <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-500" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-violet-500/10">
          <div className="pt-3">{a}</div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { data: session } = useSession();
  const authed = !!session?.user;

  return (
    <div className="min-h-screen bg-[#030308] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-16 h-16 bg-[#030308]/90 backdrop-blur border-b border-violet-500/10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-black text-sm">Smart<span className="text-violet-400">Query</span></span>
            <div className="text-[9px] text-slate-500 -mt-0.5">Query Intelligence Platform</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-300 transition-colors">
            <Home className="w-3.5 h-3.5" />Home
          </Link>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-xs text-slate-400 hover:text-violet-300 transition-colors">{l.label}</a>
          ))}
          <a href="#why" className="text-xs text-slate-400 hover:text-violet-300 transition-colors">Why SmartQuery</a>
        </div>

        <div className="flex items-center gap-3">
          {authed ? (
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all">
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-2">
                Sign in
              </Link>
              <Link href="/register" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-all">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 lg:px-16 pt-20 pb-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-900/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-6">
              <Database className="w-3.5 h-3.5 text-violet-400" />
              Query performance at production scale
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-[1.1]">
              Smart Query<br /><span className="text-violet-400">Optimizer</span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
              Query Intelligence Platform · 9 Industry Domains
            </p>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Paste broken SQL. Get production-grade rewrites with full analysis — anti-pattern detection,
              index recommendations, and security alerts in seconds.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href={authed ? "/optimizer" : "/register"}
                className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all text-sm">
                Start Optimizing <ArrowRight className="w-4 h-4" />
              </Link>
              {!authed && (
                <Link href="/login"
                  className="flex items-center gap-2 px-6 py-3 border border-white/10 hover:border-violet-500/50 text-slate-300 hover:text-white font-semibold rounded-xl transition-all text-sm bg-white/5">
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-14">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                className="glass-card rounded-2xl p-4 text-center border border-violet-500/15">
                <div className="text-lg font-black text-violet-300 font-mono">{s.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Before / After demo */}
          <div className="max-w-4xl mx-auto mt-12 grid sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 text-left border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-red-400 tracking-wider">BEFORE — 3 ANTI-PATTERNS</span>
              </div>
              <pre className="text-[11px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">
{`-- ✗ 3 critical anti-patterns detected
SELECT p.id, p.name,
  (SELECT SUM(oi.qty * oi.price)
   FROM order_items oi
   WHERE oi.product_id = p.id) AS revenue
FROM products p
WHERE YEAR(p.created_at) = 2024`}
              </pre>
            </div>
            <div className="glass-card rounded-2xl p-5 text-left border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-400 tracking-wider">AFTER — OPTIMIZED</span>
              </div>
              <pre className="text-[11px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">
{`-- ✓ LEFT JOIN eliminates N+1 subquery
-- ✓ Range filter lets index on created_at
-- ✓ LIMIT bounds result set safely
SELECT p.id, p.name,
  COALESCE(SUM(oi.qty * oi.price), 0) AS revenue
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE p.created_at >= '2024-01-01'
  AND p.created_at < '2025-01-01'
GROUP BY p.id, p.name
ORDER BY revenue DESC LIMIT 100`}
              </pre>
            </div>
          </div>
        </section>

        {/* ─── Why SmartQuery? ─────────────────────────────────────────────── */}
        <section id="why" className="px-6 lg:px-16 py-20 border-t border-violet-500/10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/8 text-violet-300 text-[10px] font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3 h-3"/> Why SmartQuery
              </div>
              <h2 className="text-3xl font-black mb-3">Built for the Work Developers Actually Do</h2>
              <p className="text-slate-400 text-sm max-w-xl mx-auto">
                Real query optimization is hard — slow subqueries, missing indexes, brittle hand-written SQL.
                SmartQuery handles the analysis so you can focus on the feature.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: <Zap className="w-5 h-5 text-violet-400"/>,
                  title: "Instant anti-pattern detection",
                  body: "The Live Scanner flags N+1 subqueries, cartesian products, function-wrapped filter columns, and SELECT * the moment you paste — before you even click Optimize.",
                  color: "violet",
                },
                {
                  icon: <TrendingUp className="w-5 h-5 text-emerald-400"/>,
                  title: "Complexity-reducing rewrites",
                  body: "Common O(n²) query shapes — correlated subqueries, repeated aggregations — are rewritten to O(n log n) with JOIN-based alternatives. You see the before and after side by side.",
                  color: "emerald",
                },
                {
                  icon: <Shield className="w-5 h-5 text-sky-400"/>,
                  title: "PII auto-redaction, always on",
                  body: "Personally Identifiable Information — emails, SSNs, card numbers — is stripped from your SQL before any processing. Your data never leaves the redaction layer unmasked.",
                  color: "sky",
                },
                {
                  icon: <Code2 className="w-5 h-5 text-amber-400"/>,
                  title: "Write SQL from plain English",
                  body: "Describe what you need in a sentence. Load your DDL schema first and the generated SQL matches your real tables exactly — no hallucinated column names.",
                  color: "amber",
                },
                {
                  icon: <Play className="w-5 h-5 text-pink-400"/>,
                  title: "Test queries without a database",
                  body: "The Playground runs edited SQL live in-browser against seeded sample tables. Study advanced patterns — window functions, CTEs — without a local server or credentials.",
                  color: "pink",
                },
                {
                  icon: <BarChart3 className="w-5 h-5 text-rose-400"/>,
                  title: "One platform, six tools",
                  body: "Optimizer, NL to SQL, Schema Vault, Playground, Examples, and Analytics all share context — schema loads in Vault flow directly into NL to SQL, examples route straight into the Optimizer.",
                  color: "rose",
                },
              ].map((card, i) => (
                <motion.div key={card.title}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="glass-card rounded-2xl p-5 border border-violet-500/10 flex flex-col gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0a0a20] border border-violet-500/15 flex items-center justify-center flex-shrink-0">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{card.title}</h3>
                    <p className="text-[11.5px] text-slate-400 leading-relaxed">{card.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 glass-card rounded-2xl border border-violet-500/15 p-6 text-center">
              <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                SmartQuery runs entirely through your own credentials — no shared API pool, no data retention, no ads. Your queries stay yours.
              </p>
              <Link href={authed ? "/optimizer" : "/register"}
                className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all">
                Start optimizing <ArrowRight className="w-4 h-4"/>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 lg:px-16 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Everything You Need</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Six integrated tools — from raw SQL optimization to schema visualization and in-browser testing</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link href={authed ? f.href : "/register"}
                  className={`glass-card glass-card-hover rounded-2xl p-6 border ${FEAT_COLOR[f.color]} group flex flex-col h-full`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${FEAT_COLOR[f.color]}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold mb-2 group-hover:text-white transition-colors">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">{f.desc}</p>
                  <ul className="space-y-1.5">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[11px] text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="px-6 lg:px-16 py-20 bg-violet-500/5 border-y border-violet-500/10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">How It Works</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">From paste to production in five steps</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-violet-500/50 via-violet-500/20 to-transparent hidden sm:block" />
              <div className="space-y-6">
                {HOW_IT_WORKS.map((s, i) => (
                  <motion.div key={s.step} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="flex gap-5 relative">
                    <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center flex-shrink-0 border border-violet-400/30 relative z-10">
                      {s.icon}
                    </div>
                    <div className="glass-card rounded-2xl p-5 flex-1 border border-violet-500/15">
                      <div className="text-[10px] text-violet-400 font-bold tracking-widest mb-1">STEP {s.step}</div>
                      <div className="text-sm font-bold mb-1">{s.title}</div>
                      <div className="text-xs text-slate-400 leading-relaxed">{s.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Guide */}
        <section id="guide" className="px-6 lg:px-16 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Step-by-Step Guide</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">How to get the most out of SmartQuery — side-by-side with each feature</p>
          </div>
          <div className="max-w-4xl mx-auto space-y-5">
            {GUIDE_STEPS.map((g, i) => (
              <motion.div key={g.num} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="glass-card rounded-2xl p-6 border border-violet-500/15 flex gap-5">
                <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 text-violet-300 font-black text-sm">
                  {g.num}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold mb-2">{g.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{g.detail}</p>
                  <div className="flex items-start gap-2 bg-violet-500/10 rounded-xl p-3 border border-violet-500/15">
                    <span className="text-violet-400 text-xs font-bold flex-shrink-0">💡 Tip:</span>
                    <span className="text-xs text-slate-300">{g.tip}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Domains */}
        <section id="domains" className="px-6 lg:px-16 py-20 bg-violet-500/5 border-y border-violet-500/10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">9 Industry Domains</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">SmartQuery detects your domain automatically and uses domain-specific optimization strategies</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {DOMAINS.map((d, i) => (
              <motion.div key={d.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl p-4 border border-violet-500/10 hover:border-violet-500/30 transition-all group">
                <div className="text-2xl mb-2">{d.icon}</div>
                <div className="text-sm font-bold mb-1 group-hover:text-violet-300 transition-colors">{d.name}</div>
                <div className="text-[10px] text-slate-500 leading-tight italic">e.g. {d.eg}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why SmartQuery */}
        <section className="px-6 lg:px-16 py-20">
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-5">
            {[
              { icon: <Shield className="w-5 h-5" />,       title: "PII Auto-Redaction",         desc: "Personally Identifiable Information is redacted before any processing. Your real data stays private.",  color: "emerald" },
              { icon: <Clock className="w-5 h-5" />,        title: "Results in Seconds",          desc: "AI analysis completes in under 5 seconds on most queries. No waiting, no queue.",                         color: "sky"     },
              { icon: <TrendingUp className="w-5 h-5" />,   title: "Track Your Progress",         desc: "Every optimization is saved. Watch your performance gain average climb over time in Analytics.",           color: "violet"  },
            ].map((w, i) => (
              <motion.div key={w.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`glass-card rounded-2xl p-6 border ${FEAT_COLOR[w.color]}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${FEAT_COLOR[w.color]}`}>
                  {w.icon}
                </div>
                <h3 className="text-sm font-bold mb-2">{w.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{w.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 lg:px-16 py-20 bg-violet-500/5 border-t border-violet-500/10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">FAQ</h2>
            <p className="text-slate-400 text-sm">Glossary of terms and common questions</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 lg:px-16 py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="relative max-w-xl mx-auto">
            <h2 className="text-3xl font-black mb-4">Ready to Optimize?</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">Join developers who write faster, safer SQL with SmartQuery — free to start, no credit card required.</p>
            <Link href={authed ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all text-sm">
              {authed ? "Go to Dashboard" : "Start Free"} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="px-6 lg:px-16 py-8 border-t border-violet-500/10 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-violet-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span>SmartQuery SQL Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-4">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-slate-400 transition-colors">{l.label}</a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}
