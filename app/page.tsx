"use client";
// app/page.tsx — Smart Query Optimizer landing page
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight, Zap, Shield, BarChart3, Database, Code2, Star, CheckCircle2,
  LogIn, Sparkles, TrendingUp, Clock, FileDown, Upload, BookOpen, Cpu,
  ChevronDown, ChevronUp, Menu, X,
} from "lucide-react";

// ── Types & constants ─────────────────────────────────────────────────────────
const NAV_LINKS: [string, string][] = [
  ["Features", "#features"], ["Domains", "#domains"],
  ["How It Works", "#how-it-works"], ["FAQ", "#faq"],
];

const DOMAINS = [
  { icon: "🛒", name: "E-Commerce",         color: "#f72585" },
  { icon: "🏥", name: "Healthcare",          color: "#06d6a0" },
  { icon: "🏦", name: "Banking & Finance",   color: "#fbbf24" },
  { icon: "👥", name: "HR & Payroll",        color: "#38bdf8" },
  { icon: "📊", name: "SaaS Analytics",      color: "#a78bfa" },
  { icon: "💬", name: "Social Media",        color: "#f97316" },
  { icon: "🏠", name: "Real Estate",         color: "#10b981" },
  { icon: "🚚", name: "Logistics",           color: "#8b5cf6" },
  { icon: "🎓", name: "Education",           color: "#22d3ee" },
  { icon: "🎮", name: "Gaming",              color: "#ec4899" },
  { icon: "📣", name: "Marketing",           color: "#84cc16" },
  { icon: "✈️", name: "Travel & Hotels",    color: "#fb923c" },
];

const FEATURES = [
  {
    icon: <Zap className="w-5 h-5" />, color: "violet",
    title: "Dual AI Engine",
    desc: "Claude is the primary optimizer. If it's rate-limited or unavailable, Gemini steps in automatically — so optimizations never fail due to a single provider.",
  },
  {
    icon: <Shield className="w-5 h-5" />, color: "emerald",
    title: "Live Anti-Pattern Scanner",
    desc: "10 regex rules run instantly in the browser as you type — no API call needed. Catches N+1 queries, leading wildcards, implicit joins, and more in real time.",
  },
  {
    icon: <Upload className="w-5 h-5" />, color: "sky",
    title: "File Upload",
    desc: "Drag and drop a .sql or .txt file straight onto the editor. Load it, optimize it, export the result. Works entirely in-browser.",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />, color: "pink",
    title: "Analytics Dashboard",
    desc: "Track performance gains over time, see which domains you optimize most, follow your daily streak, and monitor which AI engine handled each query.",
  },
  {
    icon: <FileDown className="w-5 h-5" />, color: "amber",
    title: "Export Anywhere",
    desc: "Download any optimization — or your entire history — as annotated SQL, JSON, CSV (Excel-ready), or a formatted multi-page PDF report.",
  },
  {
    icon: <BookOpen className="w-5 h-5" />, color: "violet",
    title: "99 Domain Examples",
    desc: "Real, intentionally-flawed queries across 12 industries. Filter by domain and difficulty. One click loads any example straight into the Optimizer.",
  },
  {
    icon: <Database className="w-5 h-5" />, color: "emerald",
    title: "Persistent History",
    desc: "Every optimization saved to Neon PostgreSQL — issues, improvements, index recommendations, complexity before/after, and the full SQL diff.",
  },
  {
    icon: <Code2 className="w-5 h-5" />, color: "sky",
    title: "SQL Syntax Highlighting",
    desc: "Token-aware highlighting for keywords, functions, strings, and numbers. Before/after split view so you can see exactly what changed.",
  },
  {
    icon: <Cpu className="w-5 h-5" />, color: "pink",
    title: "Advanced Analysis",
    desc: "Estimated query cost score (1–100), before/after row-scan estimates, readability notes, and complexity class — not just 'here's the rewrite'.",
  },
];

const STATS = [
  { value: "82%", label: "Avg Performance Gain",  icon: <TrendingUp className="w-4 h-4" /> },
  { value: "99",  label: "Domain Examples",         icon: <BookOpen className="w-4 h-4" /> },
  { value: "12",  label: "Industry Domains",         icon: <Database className="w-4 h-4" /> },
  { value: "<2s", label: "Avg Optimization Time",   icon: <Clock className="w-4 h-4" /> },
];

const STEPS = [
  {
    n: "01", icon: "📋", title: "Paste Your Query",
    desc: "Drop any SQL into the editor — or drag-and-drop a .sql file. The live scanner immediately highlights anti-patterns as you type, with zero API latency.",
    badge: "Zero latency",
  },
  {
    n: "02", icon: "⚡", title: "AI Optimizes It",
    desc: "Our AI engine (Claude primary, Gemini fallback) analyzes every clause, identifies all issues, and generates a fully optimized rewrite with index recommendations and complexity analysis.",
    badge: "Dual AI engine",
  },
  {
    n: "03", icon: "📥", title: "Review & Export",
    desc: "Compare before/after in split view. Copy the optimized SQL, or export as SQL, JSON, CSV, or a formatted PDF report. Your full history is saved automatically.",
    badge: "4 export formats",
  },
];

const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes — 20 optimizations per hour, no credit card, no trial period. Create an account and start immediately.",
  },
  {
    q: "What SQL dialects are supported?",
    a: "The optimizer is tuned for PostgreSQL but handles MySQL, SQLite, and standard ANSI SQL equally well. It understands CTEs, window functions, subqueries, and all common join types.",
  },
  {
    q: "Is my SQL data private?",
    a: "Every optimization is saved privately to your own account — it's never shared with other users, used to train AI models, or visible to anyone else.",
  },
  {
    q: "What happens if the primary AI is down?",
    a: "The app automatically retries against a second AI provider (Gemini) if Claude is rate-limited or temporarily unavailable. You'll still get a result — the UI shows which engine handled your request.",
  },
  {
    q: "Can I export my optimizations?",
    a: "Yes — any single query exports as SQL, JSON, CSV, or PDF. Your entire history exports as a bulk CSV or multi-page PDF report from the History or Settings page.",
  },
  {
    q: "Do I need to know SQL internals to use this?",
    a: "No. Every issue is explained in plain English, with a description of the real-world performance impact and what the fix does. The live scanner flags issues as you type.",
  },
];

const BEFORE_SQL = `SELECT p.id, p.name,
  (SELECT SUM(oi.qty * oi.price)
   FROM order_items oi
   WHERE oi.product_id = p.id)
     AS revenue
FROM products p
WHERE YEAR(created_at) = 2024
ORDER BY revenue DESC;`;

const AFTER_SQL = `-- ✓ LEFT JOIN replaces correlated subquery
-- ✓ Range filter replaces YEAR() function
-- ✓ LIMIT added to bound result set
SELECT p.id, p.name,
  COALESCE(SUM(oi.qty * oi.price), 0) AS revenue
FROM products p
LEFT JOIN order_items oi
  ON oi.product_id = p.id
WHERE p.created_at >= '2024-01-01'
  AND p.created_at  < '2025-01-01'
GROUP BY p.id, p.name
ORDER BY revenue DESC
LIMIT 100;`;

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState("");
  useEffect(() => {
    let ticking = false;
    const compute = () => {
      ticking = false;
      const scrollY = window.scrollY + 100;
      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollY) current = id;
      }
      setActive(current);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(compute); } };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [ids]);
  return active;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SqlPreview({ code, label, gain, issues }: { code: string; label: string; gain?: string; issues?: string[] }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-violet-500/25 bg-[#020208]">
      <div className="flex items-center justify-between px-4 py-2.5 bg-violet-500/10 border-b border-violet-500/20">
        <span className="text-[10px] text-violet-300 font-mono tracking-widest font-semibold">{label}</span>
        {gain && <span className="text-[11px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">{gain}</span>}
      </div>
      <pre className="p-4 text-[11px] font-mono text-slate-300 leading-[1.7] overflow-x-auto">{code}</pre>
      {issues && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {issues.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">{t}</span>)}
        </div>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-violet-500/5 transition-colors">
        <span className="font-semibold text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-violet-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOp = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const active = useScrollSpy(["features", "domains", "how-it-works", "faq"]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const colorMap: Record<string, string> = {
    violet: "bg-violet-500/15 text-violet-400",
    emerald: "bg-emerald-500/15 text-emerald-400",
    sky: "bg-sky-500/15 text-sky-400",
    pink: "bg-rose-500/15 text-rose-400",
    amber: "bg-amber-500/15 text-amber-400",
  };

  return (
    <div className="min-h-screen bg-[#030309] text-slate-100 overflow-x-hidden">

      {/* ── Fixed background ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid opacity-30" />
        <motion.div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,.12) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }} transition={{ duration: 10, repeat: Infinity }} />
        <motion.div className="absolute -bottom-80 -right-60 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,214,160,.07) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], rotate: [0, -12, 0] }} transition={{ duration: 12, repeat: Infinity, delay: 2 }} />
      </div>

      {/* ── Nav ── */}
      <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 inset-x-0 z-50 border-b border-violet-500/15 bg-[#030309]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <span className="font-bold text-sm">Smart Query <span className="text-violet-400">Optimizer</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7 text-sm">
            {NAV_LINKS.map(([label, href]) => {
              const id = href.slice(1);
              const isActive = active === id;
              return (
                <a key={label} href={href}
                  className={`relative pb-1 transition-colors ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`}>
                  {label}
                  {isActive && (
                    <motion.span layoutId="nav-pill"
                      className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-violet-400 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                  )}
                </a>
              );
            })}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" />Sign in
            </Link>
            <Link href="/register"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all glow-violet flex items-center gap-1.5">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(o => !o)} className="md:hidden p-2 text-slate-400 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-violet-500/15 bg-[#030309]">
              <div className="px-6 py-4 space-y-3">
                {NAV_LINKS.map(([label, href]) => (
                  <a key={label} href={href} onClick={() => setMobileOpen(false)}
                    className="block text-sm text-slate-400 hover:text-white py-1 transition-colors">{label}</a>
                ))}
                <div className="pt-3 border-t border-violet-500/15 flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    className="text-sm text-slate-400 hover:text-white py-2 transition-colors">Sign in</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}
                    className="w-full text-center py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl">
                    Get Started Free
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative z-10 pt-32 pb-20 px-6">
        <motion.div style={{ y: heroY, opacity: heroOp }} className="max-w-7xl mx-auto">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Dual AI Engine (Claude + Gemini) · Neon PostgreSQL · 12 Industry Domains
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="text-center text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            SQL Queries. Optimized<br />
            <span className="gradient-text">by AI in Seconds.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-center text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Detect N+1 anti-patterns, missing indexes, and performance bottlenecks instantly.
            Get AI-powered rewrites with index recommendations, complexity analysis, and full explanations.
          </motion.p>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="flex flex-wrap gap-4 justify-center mb-16">
            <Link href="/register"
              className="group px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all glow-violet flex items-center gap-2 text-base">
              Start Optimizing Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="px-8 py-3.5 border border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/8 text-slate-300 hover:text-white font-medium rounded-xl transition-all flex items-center gap-2 text-base">
              <LogIn className="w-4 h-4" />Sign In
            </Link>
          </motion.div>

          {/* Hero SQL demo */}
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <SqlPreview code={BEFORE_SQL} label="▶  ORIGINAL — 3 issues detected"
                  issues={["N+1 Correlated Subquery", "YEAR() Blocks Index", "No LIMIT"]} />
              </div>
              <div>
                <SqlPreview code={AFTER_SQL} label="✓  AI OPTIMIZED" gain="+82% faster" />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["LEFT JOIN + GROUP BY", "Range Date Filter", "LIMIT 100 Added"].map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">✓ {t}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* STATS BAR                                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-violet-500/10 bg-violet-500/5 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <div className="text-4xl font-black text-violet-300 font-mono mb-1">{s.value}</div>
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">{s.icon}{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* FEATURES                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-24 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <div className="text-xs text-violet-400 font-semibold tracking-widest uppercase mb-3">Everything Built In</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Built for Real Database Work</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Every feature designed to help you write faster, safer SQL — from instant browser-side detection to full AI-powered analysis and export.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="glass-card glass-card-hover rounded-2xl p-6 group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${colorMap[f.color]}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold mb-2 text-sm group-hover:text-violet-200 transition-colors">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* DOMAIN SHOWCASE                                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section id="domains" className="relative z-10 py-24 px-6 border-t border-violet-500/10 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <div className="text-xs text-violet-400 font-semibold tracking-widest uppercase mb-3">99 Real Queries</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">12 Industry Domains</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Every example is a real, intentionally-flawed SQL query — with a real optimized fix. Filter by domain, difficulty, or search term inside the app.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
            {DOMAINS.map((d, i) => (
              <motion.div key={d.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform cursor-default">
                <div className="text-3xl mb-2">{d.icon}</div>
                <div className="text-[11px] font-semibold text-slate-300 leading-tight">{d.name}</div>
              </motion.div>
            ))}
          </div>

          {/* Example query preview cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { domain: "E-Commerce", icon: "🛒", title: "Top Products by Revenue", issue: "Correlated subquery runs once per row", gain: 82, fix: "LEFT JOIN + GROUP BY eliminates N+1 pattern" },
              { domain: "Healthcare", icon: "🏥", title: "30-Day Readmission Rate", issue: "YEAR() on created_at blocks index scan",  gain: 76, fix: "Range filter lets the index work normally" },
              { domain: "Finance",    icon: "💹", title: "Portfolio Daily Returns",  issue: "NOT IN with nullable subquery",           gain: 91, fix: "NOT EXISTS handles NULLs correctly" },
            ].map((ex, i) => (
              <motion.div key={ex.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass-card glass-card-hover rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-violet-400">{ex.icon} {ex.domain}</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">+{ex.gain}%</span>
                </div>
                <h3 className="font-bold text-sm mb-1">{ex.title}</h3>
                <p className="text-[11px] text-rose-400 mb-2">⚠ {ex.issue}</p>
                <p className="text-[11px] text-emerald-400">✓ {ex.fix}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 border border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/8 text-slate-300 hover:text-white font-medium rounded-xl transition-all">
              Sign up to explore all 99 examples <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 border-t border-violet-500/10 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <div className="text-xs text-violet-400 font-semibold tracking-widest uppercase mb-3">Simple Process</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Three Steps to Faster SQL</h2>
            <p className="text-slate-400 text-lg">No configuration. No infrastructure. Just paste and optimize.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div key={step.n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%+0px)] w-6 h-[2px] bg-gradient-to-r from-violet-500/40 to-transparent" />
                )}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{step.icon}</span>
                    <div>
                      <div className="text-[10px] font-mono text-violet-500 font-bold">{step.n}</div>
                      <div className="font-bold text-sm">{step.title}</div>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">{step.desc}</p>
                  <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                    {step.badge}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tech stack row */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mt-16 text-center">
            <div className="text-xs text-slate-600 tracking-widest uppercase mb-5">Technology Stack</div>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Next.js 14", color: "#fff" },
                { label: "TypeScript", color: "#3178c6" },
                { label: "Tailwind CSS", color: "#38bdf8" },
                { label: "Framer Motion", color: "#a78bfa" },
                { label: "Neon PostgreSQL", color: "#00e599" },
                { label: "Prisma ORM", color: "#5a67d8" },
                { label: "NextAuth.js", color: "#7c3aed" },
                { label: "Claude AI", color: "#c97a3a" },
                { label: "Gemini AI", color: "#34a853" },
                { label: "Recharts", color: "#f72585" },
                { label: "Vercel", color: "#fff" },
              ].map(({ label, color }) => (
                <span key={label}
                  className="px-3 py-1.5 rounded-full border border-violet-500/15 bg-violet-500/5 text-[11px] font-medium text-slate-400">
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* FAQ                                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="relative z-10 py-24 px-6 border-t border-violet-500/10 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <div className="text-xs text-violet-400 font-semibold tracking-widest uppercase mb-3">FAQ</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Common Questions</h2>
            <p className="text-slate-400 text-lg">Everything you need to know before getting started.</p>
          </motion.div>
          <div className="space-y-3">
            {FAQS.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CTA                                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-24 px-6 border-t border-violet-500/10">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl p-12 text-center overflow-hidden border border-violet-500/30 bg-gradient-to-b from-violet-500/10 to-transparent">
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-violet-400" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">Start Optimizing Today</h2>
              <p className="text-slate-400 mb-3 text-lg">Free to start. 20 optimizations per hour. No credit card required.</p>
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {["✓ Dual AI engine", "✓ 99 examples", "✓ CSV + PDF export", "✓ Full history"].map(f => (
                  <span key={f} className="text-xs text-emerald-400 font-medium">{f}</span>
                ))}
              </div>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all text-lg glow-violet">
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-slate-500 mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Sign in →</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                            */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-violet-500/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-sm font-bold">Smart Query <span className="text-violet-400">Optimizer</span></span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                AI-powered SQL optimization with dual-provider resilience, full history, and export everywhere.
              </p>
            </div>
            {/* Product links */}
            <div>
              <div className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase mb-3">Product</div>
              <div className="space-y-2">
                {[["Features", "#features"], ["12 Domains", "#domains"], ["How It Works", "#how-it-works"], ["FAQ", "#faq"]].map(([l, h]) => (
                  <a key={l} href={h} className="block text-xs text-slate-400 hover:text-white transition-colors">{l}</a>
                ))}
              </div>
            </div>
            {/* Account links */}
            <div>
              <div className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase mb-3">Account</div>
              <div className="space-y-2">
                {[["Sign In", "/login"], ["Register Free", "/register"]].map(([l, h]) => (
                  <Link key={l} href={h} className="block text-xs text-slate-400 hover:text-white transition-colors">{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-violet-500/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">Built with Next.js 14 · Neon PostgreSQL · Claude & Gemini AI · Vercel</p>
            <Link href="/register" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Get started free →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
