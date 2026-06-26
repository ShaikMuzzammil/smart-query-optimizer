"use client";
// app/page.tsx — SmartQuery SQL Optimizer Landing Page (Enhanced)
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight, Zap, Shield, BarChart3, Database, Code2,
  CheckCircle2, LogIn, Sparkles, TrendingUp, Clock, FileDown,
  Upload, BookOpen, Cpu, ChevronDown, ChevronUp, Menu, X,
  Brain, Globe, Layers, AlertTriangle, Boxes, Activity,
  Terminal, FlaskConical, FileText, Key, Gauge, Star,
} from "lucide-react";

const NAV: [string, string][] = [
  ["Features", "#features"], ["How It Works", "#how-it-works"],
  ["Domains", "#domains"], ["FAQ", "#faq"],
];

const BEFORE_SQL = `-- ❌ 3 critical anti-patterns detected
SELECT p.id, p.name,
  (SELECT SUM(oi.qty * oi.price)
   FROM order_items oi
   WHERE oi.product_id = p.id) AS revenue
FROM products p
WHERE YEAR(p.created_at) = 2024
ORDER BY revenue DESC;`;

const AFTER_SQL = `-- ✓ LEFT JOIN eliminates N+1 correlated subquery
-- ✓ Range filter lets index on created_at work
-- ✓ LIMIT bounds result set safely
SELECT p.id, p.name,
  COALESCE(SUM(oi.qty * oi.price), 0) AS revenue
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE p.created_at >= '2024-01-01'
  AND p.created_at  < '2025-01-01'
GROUP BY p.id, p.name
ORDER BY revenue DESC
LIMIT 100;`;

const FEATURES = [
  { icon: Zap,          color:"violet",  title:"Intelligent SQL Optimizer",       desc:"Paste any SQL query and get a fully rewritten, production-grade version in seconds — with inline comments explaining every change, plus anti-pattern detection, index recommendations, and security alerts." },
  { icon: Brain,        color:"amber",   title:"Natural Language to SQL (NL→SQL)", desc:"Describe what data you need in plain English — 'show me the top 10 customers by revenue last month' — and get production-ready SQL for your chosen database dialect, instantly." },
  { icon: Database,     color:"sky",     title:"Schema Vault + ER Diagrams",       desc:"Upload your DDL (CREATE TABLE statements) to get a visual entity-relationship diagram. Schema context is injected when generating SQL — eliminating hallucinated column names." },
  { icon: Terminal,     color:"emerald", title:"In-Browser SQL Playground",        desc:"Execute generated SQL against an in-browser SQLite database populated with auto-generated sample data. See query results as a live data grid — zero backend overhead." },
  { icon: Shield,       color:"emerald", title:"Privacy-First PII Redaction",      desc:"Email addresses, Social Security Numbers (SSNs), and card numbers inside SQL literals are automatically masked before any analysis. General Data Protection Regulation (GDPR)-safe by design." },
  { icon: Globe,        color:"sky",     title:"Multi-Dialect Support",            desc:"PostgreSQL, MySQL, SQLite, BigQuery, MS SQL Server. Every optimization is tailored to your specific database engine's syntax, functions, and performance characteristics." },
  { icon: AlertTriangle,color:"pink",    title:"Live Anti-Pattern Scanner",        desc:"10 detection rules run instantly in your browser as you type — zero server calls. N+1 loops, leading wildcards, missing LIMIT, SELECT *, and 6 more patterns flagged in milliseconds." },
  { icon: BarChart3,    color:"emerald", title:"Full Platform Analytics",          desc:"Performance charts, domain breakdowns, streak tracking, cost score trends, and estimated rows-scanned comparisons across all features — SQL Optimizer, NL to SQL, Schema Vault, and Playground." },
  { icon: FileDown,     color:"amber",   title:"4 Export Formats",                 desc:"Download any optimization as annotated .sql, structured .json, spreadsheet-ready .csv, or a full .pdf report. Confirmation dialog always shown before any file download." },
  { icon: Layers,       color:"pink",    title:"99-Example Library",               desc:"Real, intentionally-flawed queries across 12 industry domains. Filter by domain and difficulty. One click loads any example straight into the optimizer." },
  { icon: Key,          color:"violet",  title:"Session Persistence",              desc:"Sign in once and stay signed in for 30 days. Navigate freely between all features — Optimizer, NL to SQL, Schema Vault, Playground, Analytics, History, and Settings — without re-authenticating." },
  { icon: Gauge,        color:"sky",     title:"Cost Score & Complexity Tracking", desc:"Every optimization shows estimated query cost (1-100 scale), algorithmic complexity before and after (e.g. O(n²) → O(n log n)), and estimated rows scanned comparison." },
];

const DOMAINS = [
  { icon:"🛒", name:"E-Commerce",    desc:"JOIN optimization, cart analytics, inventory" },
  { icon:"🏥", name:"Healthcare",    desc:"Patient records, lab test queries, scheduling" },
  { icon:"🏦", name:"Banking",       desc:"Transactions, fraud detection, account balances" },
  { icon:"👥", name:"HR & Payroll",  desc:"Employee records, performance reviews, payroll" },
  { icon:"📊", name:"SaaS Analytics",desc:"User events, cohort analysis, retention curves" },
  { icon:"💬", name:"Social Media",  desc:"Posts, followers, feed ranking queries" },
  { icon:"🏠", name:"Real Estate",   desc:"Listings, agent performance, pricing queries" },
  { icon:"🚚", name:"Logistics",     desc:"Shipments, inventory tracking, route optimization" },
  { icon:"🎓", name:"Education",     desc:"Student grades, enrollment, attendance reports" },
  { icon:"🎮", name:"Gaming",        desc:"Leaderboards, achievements, matchmaking queries" },
  { icon:"📣", name:"Marketing",     desc:"Campaigns, leads, conversion funnel analysis" },
  { icon:"✈️", name:"Travel",        desc:"Bookings, hotel analytics, pricing engines" },
];

const STEPS = [
  { n:"01", icon:"📋", title:"Paste or Upload SQL",      badge:"Zero setup",       desc:"Drop any SQL into the editor or drag a .sql file directly. The live scanner immediately flags anti-patterns — no network call needed. Supports 5 dialects." },
  { n:"02", icon:"⚡", title:"AI Analyzes & Rewrites",  badge:"Seconds",          desc:"The engine dissects every clause, identifies all anti-patterns, and produces an optimized rewrite with inline comments explaining each decision made." },
  { n:"03", icon:"🔬", title:"Review Deep Analysis",     badge:"8 dimensions",     desc:"Performance gain %, cost score, complexity before/after (Big-O), estimated rows scanned, index recommendations, security alerts, PII detection, and readability notes." },
  { n:"04", icon:"📥", title:"Export & Track Progress",  badge:"4 formats",        desc:"Copy the SQL, or export as .sql, .json, .csv, or full .pdf report. A confirmation dialog appears before every download. Every optimization is saved and searchable." },
];

const FAQS = [
  { q:"Is my SQL data private?", a:"Completely. Each query is stored privately in your own account and is never visible to other users. Personally Identifiable Information (PII) — emails, SSNs, card numbers — is automatically masked before any analysis reaches the engine." },
  { q:"What SQL dialects are supported?", a:"PostgreSQL, MySQL, SQLite, BigQuery, and MS SQL Server. Select your target dialect before optimizing and the engine uses database-specific syntax, functions, and best practices tailored to that engine." },
  { q:"What is Natural Language to SQL (NL to SQL)?", a:"You describe what data you need in plain English — for example, 'show me the top 10 products by revenue last month grouped by category' — and the engine produces production-ready SQL. One click then sends it to the SQL Optimizer for further analysis." },
  { q:"What is the Schema Vault?", a:"Upload your database DDL (CREATE TABLE statements) to get a visual Entity-Relationship (ER) diagram of your schema. A usage stats section shows how many characters and estimated tokens you&apos;ve used vs the context limit. Your schema is automatically injected when generating SQL — so the engine uses your exact table and column names instead of guessing." },
  { q:"What is the SQL Playground?", a:"Execute generated SQL against an in-browser SQLite database populated with realistic sample data. See your query results as a live data grid — without connecting to a real database. Query execution and results are fully local." },
  { q:"What do the abbreviations mean?", a:"PII = Personally Identifiable Information · DDL = Data Definition Language · ER Diagram = Entity-Relationship Diagram · GDPR = General Data Protection Regulation · NL to SQL = Natural Language to SQL · SSN = Social Security Number · N+1 = a query pattern that runs N extra queries for N rows returned." },
  { q:"Can I export my optimization history?", a:"Yes. A confirmation dialog always appears before any download so you choose format and scope. Individual queries export as SQL, JSON, CSV, or PDF. Your full history exports as a bulk CSV or multi-page PDF from the Settings page." },
  { q:"Will I be signed out when navigating between features?", a:"No. Your session persists for 30 days after signing in. All dashboard pages — SQL Optimizer, Natural Language to SQL, Schema Vault, Playground, Analytics, History, and Settings — are accessible without re-authenticating." },
];

const STATS = [
  { value:"82%",  label:"Average performance gain",   icon: TrendingUp },
  { value:"99",   label:"Domain SQL examples",         icon: BookOpen },
  { value:"12",   label:"Industry domains covered",    icon: Boxes },
  { value:"<2s",  label:"Average analysis time",       icon: Clock },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-violet-500/15 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-violet-500/5 transition-colors text-left">
        <span className="text-sm font-semibold text-slate-200">{q}</span>
        <span className="flex-shrink-0 text-violet-400">
          {open ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}>
            <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-violet-500/10 pt-4">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  violet:  { bg:"bg-violet-500/15", text:"text-violet-400", border:"border-violet-500/25" },
  emerald: { bg:"bg-emerald-500/15",text:"text-emerald-400",border:"border-emerald-500/25" },
  amber:   { bg:"bg-amber-500/15",  text:"text-amber-400",  border:"border-amber-500/25" },
  sky:     { bg:"bg-sky-500/15",    text:"text-sky-400",    border:"border-sky-500/25" },
  pink:    { bg:"bg-pink-500/15",   text:"text-pink-400",   border:"border-pink-500/25" },
};

export default function LandingPage() {
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [scrolled, setScrolled]         = useState(false);
  const [sqlTab, setSqlTab]             = useState<"before"|"after">("before");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      for (const id of ["features","how-it-works","domains","faq"]) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 140) setActiveSection(id);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030309] text-slate-100 overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-violet-500/5 blur-3xl animate-pulse"/>
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-purple-500/4 blur-3xl animate-pulse" style={{animationDelay:"1s"}}/>
        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-500/4 blur-3xl animate-pulse" style={{animationDelay:"2s"}}/>
        <div className="absolute inset-0 bg-cyber-grid opacity-10"/>
      </div>

      {/* ── Navigation ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#030309]/90 backdrop-blur-xl border-b border-violet-500/10" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white"/>
            </div>
            <div>
              <div className="text-sm font-black">Smart<span className="text-violet-400">Query</span></div>
              <div className="text-[9px] text-slate-500 leading-none">SQL Intelligence Platform</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(([label, href]) => {
              const id = href.slice(1);
              return (
                <a key={href} href={href}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${activeSection===id?"text-violet-300":"text-slate-400 hover:text-slate-200"}`}>
                  {label}
                  {activeSection===id && (
                    <motion.div layoutId="nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full"
                      transition={{type:"spring",stiffness:350,damping:35}}/>
                  )}
                </a>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5"/>Sign in
            </Link>
            <Link href="/register" className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20">
              Get Started <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-slate-400 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              className="md:hidden bg-[#030309]/95 backdrop-blur-xl border-b border-violet-500/10 px-6 pb-4 overflow-hidden">
              <nav className="flex flex-col gap-1 mb-4">
                {NAV.map(([label, href]) => (
                  <a key={href} href={href} onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 text-sm text-slate-400 hover:text-violet-300 transition-colors rounded-xl hover:bg-violet-500/5">
                    {label}
                  </a>
                ))}
              </nav>
              <div className="flex gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2.5 border border-violet-500/20 text-sm text-slate-400 rounded-xl hover:bg-violet-500/5 transition-colors">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-20">

        {/* ── Hero ── */}
        <section className="py-24 md:py-32 text-center">
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-8 font-semibold">
              <Sparkles className="w-3.5 h-3.5"/> SQL performance at production scale
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              Smart Query<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">Optimizer</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed">
              SQL Intelligence Platform · 12 Industry Domains · 5 Dialects
            </p>
            <p className="text-base text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Paste broken SQL. Get production-grade rewrites with full analysis — anti-pattern detection,
              index recommendations, cost scoring, and security alerts in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register"
                className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-violet-500/30 text-base">
                Start Optimizing <ArrowRight className="w-4 h-4"/>
              </Link>
              <Link href="/login"
                className="flex items-center gap-2 px-8 py-3.5 border border-violet-500/25 text-slate-300 hover:text-white hover:border-violet-500/50 font-semibold rounded-2xl transition-all text-base">
                <LogIn className="w-4 h-4"/> Sign In
              </Link>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {["Free to start","No credit card","5 SQL dialects","PII auto-redacted","Export as SQL/JSON/CSV/PDF"].map(b => (
                <span key={b} className="flex items-center gap-1 text-[11px] text-slate-500 px-3 py-1 rounded-full border border-violet-500/10">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500"/>{b}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Before/After SQL demo */}
          <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.2 }} className="mt-16">
            <div className="max-w-4xl mx-auto">
              {/* Tab switcher */}
              <div className="flex gap-2 justify-center mb-4">
                {(["before","after"] as const).map(t => (
                  <button key={t} onClick={() => setSqlTab(t)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      sqlTab === t
                        ? t === "before" ? "bg-rose-500/20 border border-rose-500/30 text-rose-300" : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                        : "bg-violet-500/8 border border-violet-500/10 text-slate-400 hover:text-slate-200"}`}>
                    {t === "before" ? "● BEFORE — 3 Anti-Patterns" : "● AFTER — Optimized +78%"}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={sqlTab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  className={`relative rounded-2xl border overflow-hidden text-left ${
                    sqlTab === "before"
                      ? "bg-rose-950/20 border-rose-500/20"
                      : "bg-emerald-950/15 border-emerald-500/20"
                  }`}>
                  <div className={`flex items-center gap-2 px-5 py-3 border-b text-xs font-bold ${
                    sqlTab === "before"
                      ? "border-rose-500/15 text-rose-400 bg-rose-500/8"
                      : "border-emerald-500/15 text-emerald-400 bg-emerald-500/8"}`}>
                    {sqlTab === "before" ? "× 3 critical anti-patterns detected" : "✓ All issues resolved — production-ready"}
                  </div>
                  <pre className="p-5 text-xs font-mono text-slate-300 leading-7 overflow-x-auto">
                    <code>{sqlTab === "before" ? BEFORE_SQL : AFTER_SQL}</code>
                  </pre>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="glass-card rounded-2xl p-5 text-center">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-4 h-4 text-violet-400"/>
              </div>
              <div className="text-2xl font-black text-violet-300 font-mono">{value}</div>
              <div className="text-[11px] text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        <section id="features" className="py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-4 font-semibold">
              <Sparkles className="w-3.5 h-3.5"/> Everything you need
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Built for every SQL use case
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base">
              A complete SQL intelligence platform — from optimization and NL to SQL generation to schema visualization and in-browser execution.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const c = COLOR_MAP[f.color] ?? COLOR_MAP.violet;
              const Icon = f.icon;
              return (
                <motion.div key={f.title} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i * 0.04 }}
                  className="glass-card rounded-2xl p-6 hover:border-violet-500/30 transition-colors group">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
                    <Icon className={`w-4 h-4 ${c.text}`}/>
                  </div>
                  <h3 className="font-bold text-sm mb-2 group-hover:text-violet-200 transition-colors">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-4 font-semibold">
              <Zap className="w-3.5 h-3.5"/> Simple 4-step workflow
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">From paste to production-ready SQL in under 2 seconds.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i * 0.08 }}
                className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-4xl font-black text-violet-500/8 select-none">{s.n}</div>
                <div className="text-3xl mb-4">{s.icon}</div>
                <div className="text-[10px] font-bold text-violet-400 mb-2 tracking-wider">{s.badge.toUpperCase()}</div>
                <h3 className="text-sm font-bold mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-violet-500/40"/>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Feature quick links */}
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href:"/optimizer",  icon:"⚡", label:"SQL Optimizer",           desc:"Optimize any query instantly" },
              { href:"/nl2sql",     icon:"🧠", label:"NL to SQL",               desc:"Plain English → SQL" },
              { href:"/schema",     icon:"🗄️", label:"Schema Vault",            desc:"Upload DDL, get ER diagram" },
              { href:"/playground", icon:"🧪", label:"SQL Playground",          desc:"Run SQL in-browser" },
            ].map(f => (
              <Link key={f.href} href="/register"
                className="flex items-center gap-3 p-4 glass-card rounded-xl hover:border-violet-500/30 transition-colors group">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="text-xs font-bold group-hover:text-violet-300 transition-colors">{f.label}</div>
                  <div className="text-[10px] text-slate-500">{f.desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-violet-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"/>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Domains ── */}
        <section id="domains" className="py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 mb-4 font-semibold">
              <Globe className="w-3.5 h-3.5"/> 12 industry domains
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-4">Every Industry, Every Query</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Domain-aware optimization with 99 real-world SQL examples across the most common database use cases.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {DOMAINS.map((d, i) => (
              <motion.div key={d.name} initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ delay: i * 0.04 }}
                className="glass-card rounded-2xl p-5 hover:border-violet-500/25 transition-colors">
                <div className="text-3xl mb-3">{d.icon}</div>
                <div className="text-sm font-bold mb-1">{d.name}</div>
                <div className="text-[11px] text-slate-500">{d.desc}</div>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors text-sm">
              <BookOpen className="w-4 h-4"/> Browse All 99 Examples
            </Link>
          </div>
        </section>

        {/* ── Why SmartQuery ── */}
        <section className="py-20">
          <div className="glass-card rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 pointer-events-none"/>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black mb-6">Why SmartQuery?</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left mb-10">
                {[
                  { icon:"🔒", title:"Private by default",       desc:"Your queries are stored only in your account. PII is masked automatically before any analysis." },
                  { icon:"⚡", title:"No config required",        desc:"Sign up, paste SQL, get results. No database connection, no API keys to manage, no setup." },
                  { icon:"🌐", title:"5 SQL dialects",            desc:"PostgreSQL, MySQL, SQLite, BigQuery, MS SQL Server — each with engine-specific syntax." },
                  { icon:"📊", title:"Full analytics dashboard",  desc:"Track performance gains, streak, domain breakdown, and cost scores across all features." },
                  { icon:"🔗", title:"Integrated workflow",       desc:"Schema Vault → NL to SQL → SQL Optimizer → Playground — features work together seamlessly." },
                  { icon:"📥", title:"Export everything",         desc:"SQL, JSON, CSV, and PDF export with confirmation dialogs. Download individual queries or full history." },
                ].map(r => (
                  <div key={r.title} className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">{r.icon}</div>
                    <div>
                      <div className="text-sm font-bold mb-1">{r.title}</div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-violet-500/30 text-base">
                Start for Free <ArrowRight className="w-4 h-4"/>
              </Link>
              <p className="text-xs text-slate-600 mt-3">No credit card required · Free account</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Full forms for all abbreviations are explained below.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a}/>)}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-20 text-center">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}>
            <h2 className="text-3xl md:text-5xl font-black mb-4">Ready to optimize your SQL?</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">Join developers and data engineers who use SmartQuery to write faster, safer queries.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register"
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold rounded-2xl transition-all shadow-2xl shadow-violet-500/30 text-base">
                Get Started Free <ArrowRight className="w-4 h-4"/>
              </Link>
              <Link href="/login"
                className="flex items-center justify-center gap-2 px-8 py-3.5 border border-violet-500/25 text-slate-300 hover:text-white hover:border-violet-500/50 font-semibold rounded-2xl transition-all text-base">
                <LogIn className="w-4 h-4"/> Sign In
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-violet-500/10 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white"/>
            </div>
            <div>
              <div className="text-sm font-black">Smart<span className="text-violet-400">Query</span></div>
              <div className="text-[9px] text-slate-600 leading-none">SQL Intelligence Platform</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{label}</a>
            ))}
          </div>
          <div className="text-xs text-slate-600">
            © {new Date().getFullYear()} SmartQuery · Built with Next.js, Neon PostgreSQL, Gemini AI
          </div>
        </div>
      </footer>
    </div>
  );
}
