"use client";
// app/page.tsx — Smart Query Optimizer Landing Page
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight, Zap, Shield, BarChart3, Database, Code2, Star,
  CheckCircle2, LogIn, Sparkles, TrendingUp, Clock, FileDown,
  Upload, BookOpen, Cpu, ChevronDown, ChevronUp, Menu, X,
  Brain, Lock, Globe, Layers, GitBranch, Search, Terminal,
  FlaskConical, LineChart, AlertTriangle, Server, Boxes,
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
  { icon: Zap,         color: "violet", title: "Intelligent SQL Optimizer",     desc: "Paste any SQL query and get a fully rewritten, production-grade version in seconds — with inline comments explaining every change made." },
  { icon: Brain,       color: "amber",  title: "Natural Language to SQL",        desc: "Describe what data you need in plain English. The engine converts your intent into optimized, ready-to-run SQL for your chosen database." },
  { icon: Database,    color: "sky",    title: "Schema Vault",                   desc: "Upload your DDL (CREATE TABLE statements) and get a visual entity-relationship diagram. Your schema context is injected when generating SQL — eliminating hallucinations." },
  { icon: Terminal,    color: "emerald",title: "SQL Playground",                 desc: "Execute your generated SQL against an in-browser database with auto-generated sample data. Instant preview, zero backend overhead." },
  { icon: Shield,      color: "emerald",title: "Privacy-First Redaction",        desc: "Email addresses, SSNs, and card numbers inside SQL literals are automatically masked before any analysis. GDPR-safe by design." },
  { icon: Globe,       color: "sky",    title: "Multi-Dialect Support",          desc: "PostgreSQL, MySQL, SQLite, BigQuery, MS SQL Server. Every optimization is tailored to your specific database engine's syntax and features." },
  { icon: Search,      color: "violet", title: "Live Anti-Pattern Scanner",      desc: "10 detection rules run instantly in your browser as you type — zero server calls. N+1 loops, leading wildcards, missing LIMIT, and more flagged in milliseconds." },
  { icon: AlertTriangle,color:"pink",   title: "Security & Lint Analysis",       desc: "Before rendering results, every generated query is checked for SQL injection vectors, unbounded scans, and style anti-patterns with clear severity labels." },
  { icon: BarChart3,   color: "emerald",title: "Deep Analytics Dashboard",       desc: "Performance charts, domain breakdowns, streak tracking, cost score trends, and estimated rows-scanned comparisons across your full history." },
  { icon: FileDown,    color: "amber",  title: "4 Export Formats",               desc: "Download any optimization as annotated .sql, structured .json, spreadsheet-ready .csv, or a full .pdf report — from a single dropdown." },
  { icon: Layers,      color: "pink",   title: "99-Example Library",             desc: "Real, intentionally-flawed queries across 12 industries. Filter by domain and difficulty. One click loads any example straight into the optimizer." },
  { icon: Upload,      color: "sky",    title: "Drag & Drop Files",              desc: "Drop a .sql or .txt file onto the editor. No copy-paste needed for large scripts. File size validated, content loaded instantly." },
];

const DOMAINS = [
  { icon:"🛒",name:"E-Commerce",   desc:"JOIN optimization, cart analytics" },
  { icon:"🏥",name:"Healthcare",   desc:"Patient records, lab queries" },
  { icon:"🏦",name:"Banking",      desc:"Transactions, fraud detection" },
  { icon:"👥",name:"HR & Payroll", desc:"Employee queries, payroll" },
  { icon:"📊",name:"SaaS Analytics",desc:"User events, cohort analysis" },
  { icon:"💬",name:"Social Media", desc:"Posts, followers, feed queries" },
  { icon:"🏠",name:"Real Estate",  desc:"Listings, agent performance" },
  { icon:"🚚",name:"Logistics",    desc:"Shipments, inventory, routes" },
  { icon:"🎓",name:"Education",    desc:"Student grades, enrollment" },
  { icon:"🎮",name:"Gaming",       desc:"Leaderboards, achievements" },
  { icon:"📣",name:"Marketing",    desc:"Campaigns, leads, conversions" },
  { icon:"✈️",name:"Travel",       desc:"Bookings, hotel analytics" },
];

const STEPS = [
  { n:"01",icon:"📋",title:"Paste or Upload SQL",       badge:"Zero setup",          desc:"Drop any SQL into the editor or drag a .sql file directly. The live scanner immediately flags anti-patterns — no network call needed." },
  { n:"02",icon:"⚡",title:"AI Analyzes & Rewrites",    badge:"Instant results",      desc:"The engine dissects every clause, identifies all issues, and produces an optimized rewrite with inline comments explaining every decision." },
  { n:"03",icon:"🔬",title:"Review Deep Analysis",      badge:"8 dimensions",         desc:"Performance gain, cost score, complexity before/after, estimated rows scanned, index recommendations, security alerts, and PII detection." },
  { n:"04",icon:"📥",title:"Export & Track Progress",   badge:"4 export formats",     desc:"Copy the SQL, or export as .sql, .json, .csv, or .pdf. Every optimization is saved and searchable. Bulk-export your entire history anytime." },
];

const FAQS = [
  { q:"Is my SQL data private?", a:"Completely. Each query is stored privately in your own account, never visible to other users, and never used for model training. PII (emails, SSNs, card numbers) is automatically masked before any analysis." },
  { q:"What SQL dialects are supported?", a:"PostgreSQL, MySQL, SQLite, BigQuery, and MS SQL Server. Select your dialect before optimizing and the engine uses database-specific syntax, functions, and best practices." },
  { q:"What is Natural Language to SQL?", a:"You describe what you need in plain English — for example, 'show me the top 10 products by revenue last month grouped by category' — and the engine produces production-ready SQL. You can then optimize it further with one click." },
  { q:"What is the Schema Vault?", a:"Upload your database DDL (CREATE TABLE statements) to get a visual ER diagram of your schema. When you generate SQL with NL to SQL, this schema context is automatically injected — so the engine uses your exact table and column names instead of guessing." },
  { q:"What is the SQL Playground?", a:"Execute generated SQL against an in-browser database populated with realistic sample data. See your query results as a live data grid — without connecting to a real database." },
  { q:"Can I export my optimization history?", a:"Yes. Individual queries export as SQL, JSON, CSV, or PDF. Your full history exports as a bulk CSV or multi-page PDF report from the History or Settings pages." },
];

const STATS = [
  { value:"82%",  label:"Avg performance gain",  icon:<TrendingUp className="w-4 h-4"/> },
  { value:"99",   label:"Domain SQL examples",   icon:<BookOpen className="w-4 h-4"/> },
  { value:"12",   label:"Industry domains",       icon:<Boxes className="w-4 h-4"/> },
  { value:"<2s",  label:"Avg analysis time",      icon:<Clock className="w-4 h-4"/> },
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
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-violet-500/10 pt-4">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ id, children, className = "" }: { id?: string; children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  return (
    <section ref={ref} id={id} className={`py-20 md:py-28 ${className}`}>
      {children}
    </section>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = ["features","how-it-works","domains","faq"];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) setActiveSection(id);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030309] text-slate-100 overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-violet-500/5 blur-3xl animate-pulse"/>
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-purple-500/4 blur-3xl animate-pulse" style={{animationDelay:"1s"}}/>
        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-500/4 blur-3xl animate-pulse" style={{animationDelay:"2s"}}/>
        <div className="absolute inset-0 bg-cyber-grid opacity-10"/>
      </div>

      {/* Nav */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#030309]/90 backdrop-blur-xl border-b border-violet-500/10" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white"/>
            </div>
            <div>
              <div className="text-sm font-black">Smart<span className="text-violet-400">Query</span></div>
              <div className="text-[9px] text-slate-500 leading-none">SQL Intelligence Platform</div>
            </div>
          </Link>

          {/* Desktop nav */}
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

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5"/>Sign in
            </Link>
            <Link href="/register"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20">
              Get Started <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-slate-400 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
              className="md:hidden bg-[#040410]/95 border-t border-violet-500/10 px-6 pb-6 space-y-1">
              {NAV.map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm text-slate-300 hover:text-violet-300 hover:bg-violet-500/5 rounded-xl transition-colors">{label}</a>
              ))}
              <div className="pt-3 space-y-2">
                <Link href="/login" className="block text-center py-2.5 border border-violet-500/20 rounded-xl text-sm text-slate-300" onClick={() => setMobileOpen(false)}>Sign in</Link>
                <Link href="/register" className="block text-center py-2.5 bg-violet-600 rounded-xl text-sm text-white font-semibold" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="relative z-10">

        {/* ── Hero ── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center" ref={heroRef}>
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.7}}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs text-violet-300 font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5"/>SQL performance at production scale
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-4 tracking-tight">
              Smart Query<br/>
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                Optimizer
              </span>
            </h1>
            <p className="text-base text-slate-400 font-medium mb-2">SQL Intelligence Platform · 12 Industry Domains</p>
            <p className="text-xl md:text-2xl text-slate-300 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
              Paste broken SQL. Get production-grade rewrites with full analysis —
              anti-pattern detection, index recommendations, and security alerts in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register"
                className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-violet-500/25 text-base">
                Start Optimizing <ArrowRight className="w-4 h-4"/>
              </Link>
              <Link href="/login"
                className="flex items-center gap-2 px-7 py-3.5 border border-violet-500/30 hover:border-violet-500/50 text-slate-300 hover:text-white font-semibold rounded-2xl transition-all text-base">
                <LogIn className="w-4 h-4"/>Sign In
              </Link>
            </div>
          </motion.div>

          {/* SQL Preview */}
          <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.3}}
            className="w-full max-w-5xl grid md:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 text-left border border-rose-500/15">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-rose-500"/>
                <span className="text-[11px] font-bold text-rose-400 tracking-wider">BEFORE — 3 ANTI-PATTERNS</span>
              </div>
              <pre className="text-[11px] font-mono text-slate-400 leading-6 whitespace-pre-wrap">{BEFORE_SQL}</pre>
            </div>
            <div className="glass-card rounded-2xl p-5 text-left border border-emerald-500/15">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500"/>
                <span className="text-[11px] font-bold text-emerald-400 tracking-wider">AFTER — OPTIMIZED</span>
              </div>
              <pre className="text-[11px] font-mono text-emerald-300/80 leading-6 whitespace-pre-wrap">{AFTER_SQL}</pre>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.6}}
            className="flex flex-wrap items-center justify-center gap-8 mt-12">
            {STATS.map(s=>(
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-violet-400">{s.icon}</span>
                <span className="text-2xl font-black text-white">{s.value}</span>
                <span className="text-sm text-slate-400">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── Features ── */}
        <Section id="features" className="px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="text-xs text-violet-400 font-bold tracking-widest uppercase mb-3">Platform Features</div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">Everything you need to ship<br/>faster, safer SQL</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">From instant anti-pattern detection to schema-aware generation — the full database performance stack.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                const colors: Record<string,string> = {
                  violet:"text-violet-400 bg-violet-500/10 border-violet-500/20",
                  amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                  sky:   "text-sky-400 bg-sky-500/10 border-sky-500/20",
                  emerald:"text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                  pink:  "text-pink-400 bg-pink-500/10 border-pink-500/20",
                };
                return (
                  <motion.div key={f.title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.04}}
                    className="glass-card rounded-2xl p-5 hover:border-violet-500/20 transition-colors group">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colors[f.color]}`}>
                      <Icon className="w-5 h-5"/>
                    </div>
                    <h3 className="text-sm font-bold mb-1.5 group-hover:text-violet-300 transition-colors">{f.title}</h3>
                    <p className="text-[12px] text-slate-500 leading-relaxed">{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── How It Works ── */}
        <Section id="how-it-works" className="px-6 bg-gradient-to-b from-transparent via-violet-500/3 to-transparent">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="text-xs text-violet-400 font-bold tracking-widest uppercase mb-3">How It Works</div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">From broken to optimized<br/>in four steps</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
                <motion.div key={step.n} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}
                  className="relative">
                  {i < STEPS.length-1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-violet-500/30 to-transparent -ml-6 z-0"/>
                  )}
                  <div className="glass-card rounded-2xl p-5 relative z-10 h-full">
                    <div className="text-3xl mb-3">{step.icon}</div>
                    <div className="text-[10px] font-black text-violet-500 tracking-widest mb-1">{step.n}</div>
                    <div className="text-sm font-bold mb-1">{step.title}</div>
                    <div className="inline-flex items-center gap-1 text-[9px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full mb-2">{step.badge}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tech stack */}
            <div className="mt-16 text-center">
              <div className="text-[10px] text-slate-600 font-bold tracking-widest uppercase mb-4">Built With</div>
              <div className="flex flex-wrap justify-center gap-2">
                {["Next.js 14","TypeScript","Tailwind CSS","Framer Motion","Neon PostgreSQL","Prisma ORM","NextAuth.js","Recharts","pdf-lib","Vercel"].map(t=>(
                  <span key={t} className="px-3 py-1.5 text-[11px] font-medium border border-violet-500/15 rounded-full text-slate-400">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── New capabilities callout ── */}
        <Section className="px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  icon: Database, color: "violet",
                  title: "Schema Vault",
                  badge: "NEW",
                  desc: "Upload your DDL, get a visual ER diagram. Schema context is injected into every NL → SQL generation — no more hallucinated column names.",
                  href: "/schema",
                  cta: "Open Schema Vault",
                },
                {
                  icon: Terminal, color: "emerald",
                  title: "SQL Playground",
                  badge: "BETA",
                  desc: "Execute your queries against an in-browser database with AI-generated sample data. See real results without touching production.",
                  href: "/playground",
                  cta: "Open Playground",
                },
                {
                  icon: Brain, color: "amber",
                  title: "NL to SQL",
                  badge: "AI",
                  desc: "Describe what you need in plain English. Get production-ready SQL for your dialect — then optimize it with one click.",
                  href: "/nl2sql",
                  cta: "Try NL to SQL",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                const colMap: Record<string,{bg:string;text:string;badge:string}> = {
                  violet: {bg:"from-violet-600 to-purple-700",text:"text-violet-300",badge:"bg-violet-500/20 text-violet-300"},
                  emerald:{bg:"from-emerald-600 to-teal-700",text:"text-emerald-300",badge:"bg-emerald-500/20 text-emerald-300"},
                  amber:  {bg:"from-amber-600 to-orange-700",text:"text-amber-300",badge:"bg-amber-500/20 text-amber-300"},
                };
                const c = colMap[item.color];
                return (
                  <motion.div key={item.title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}}
                    className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white"/>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{item.badge}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-base mb-2">{item.title}</h3>
                      <p className="text-[12px] text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                    <Link href={item.href}
                      className={`mt-auto flex items-center gap-1.5 text-sm font-semibold ${c.text} hover:opacity-80 transition-opacity`}>
                      {item.cta} <ArrowRight className="w-3.5 h-3.5"/>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── Domains ── */}
        <Section id="domains" className="px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="text-xs text-violet-400 font-bold tracking-widest uppercase mb-3">Industry Coverage</div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">99 examples across<br/>12 domains</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Every example is a real-world, intentionally-flawed query from a specific domain — with explanations of every anti-pattern.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
              {DOMAINS.map((d,i)=>(
                <motion.div key={d.name} initial={{opacity:0,scale:0.95}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:i*0.04}}
                  className="glass-card rounded-xl p-4 hover:border-violet-500/25 transition-colors">
                  <div className="text-2xl mb-1.5">{d.icon}</div>
                  <div className="text-xs font-bold text-slate-200">{d.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{d.desc}</div>
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <Link href="/examples"
                className="inline-flex items-center gap-2 px-6 py-3 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 font-semibold rounded-xl transition-all hover:bg-violet-500/8">
                Browse All 99 Examples <ArrowRight className="w-4 h-4"/>
              </Link>
            </div>
          </div>
        </Section>

        {/* ── FAQ ── */}
        <Section id="faq" className="px-6 bg-gradient-to-b from-transparent via-violet-500/3 to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="text-xs text-violet-400 font-bold tracking-widest uppercase mb-3">FAQ</div>
              <h2 className="text-4xl font-black mb-4">Common Questions</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map(faq => <FaqItem key={faq.q} {...faq}/>)}
            </div>
          </div>
        </Section>

        {/* ── CTA ── */}
        <Section className="px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="glass-card rounded-3xl p-12 border border-violet-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 to-purple-500/5 pointer-events-none"/>
              <div className="relative">
                <div className="text-4xl mb-4">⚡</div>
                <h2 className="text-4xl md:text-5xl font-black mb-4">Start optimizing today</h2>
                <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                  Join developers who trust Smart Query Optimizer to ship faster, safer SQL.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Link href="/register"
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-violet-500/25 text-base">
                    Get Started Free <ArrowRight className="w-4 h-4"/>
                  </Link>
                  <Link href="/login"
                    className="flex items-center justify-center gap-2 px-8 py-4 border border-violet-500/30 hover:border-violet-500/50 text-slate-300 hover:text-white font-semibold rounded-2xl transition-all text-base">
                    <LogIn className="w-4 h-4"/>Sign In
                  </Link>
                </div>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                  {["✓ No credit card","✓ Privacy-first","✓ 12 SQL domains","✓ 4 export formats"].map(f=>(
                    <span key={f}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-violet-500/10 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white"/>
            </div>
            <span className="text-sm font-bold text-slate-300">Smart<span className="text-violet-400">Query</span> Optimizer</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-500">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">Register</Link>
            <Link href="#features" className="hover:text-slate-300 transition-colors">Features</Link>
            <Link href="#faq" className="hover:text-slate-300 transition-colors">FAQ</Link>
          </div>
          <p className="text-xs text-slate-600">SQL Intelligence Platform</p>
        </div>
      </footer>
    </div>
  );
}
