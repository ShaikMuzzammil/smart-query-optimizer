"use client";
// app/page.tsx — QueryForge Landing Page
import { motion, useScroll, useTransform, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight, Zap, Shield, BarChart3, Database, Code2, Star,
  CheckCircle2, LogIn, Sparkles, TrendingUp, Clock, FileDown,
  Upload, BookOpen, Cpu, ChevronDown, ChevronUp, Menu, X,
  Brain, Lock, Globe, Layers, GitBranch, Search,
} from "lucide-react";

// ── constants ─────────────────────────────────────────────────────────────────
const NAV: [string, string][] = [
  ["Features", "#features"],["How It Works", "#how-it-works"],
  ["Domains", "#domains"],["FAQ", "#faq"],
];
const BEFORE_SQL = `-- ❌ 3 critical anti-patterns detected
SELECT p.id, p.name,
  (SELECT SUM(oi.qty * oi.price)
   FROM order_items oi
   WHERE oi.product_id = p.id) AS revenue
FROM products p
WHERE YEAR(p.created_at) = 2024
ORDER BY revenue DESC;`;

const AFTER_SQL = `-- ✓ LEFT JOIN eliminates correlated subquery (N+1)
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
  { icon: Brain,     color: "violet", title: "Dual AI Engine",          desc: "Claude as primary, Gemini as automatic fallback. If one provider is down or rate-limited, the other takes over instantly — zero downtime." },
  { icon: Zap,       color: "amber",  title: "NL to SQL",               desc: "Type plain English like 'show me top 10 customers by revenue last month' and get production-ready optimized SQL instantly." },
  { icon: Shield,    color: "emerald",title: "PII Redaction",            desc: "Before any query reaches the AI, email addresses, SSNs, and card numbers are automatically masked. GDPR-safe by design." },
  { icon: Globe,     color: "sky",    title: "Multi-Dialect Support",    desc: "PostgreSQL, MySQL, SQLite, BigQuery, MS SQL Server. The AI tailors every optimization to your database's specific syntax and features." },
  { icon: Search,    color: "violet", title: "Live Anti-Pattern Scanner",desc: "10 regex rules run client-side as you type — zero API calls. N+1, leading wildcards, implicit joins, missing LIMIT flagged in milliseconds." },
  { icon: Upload,    color: "pink",   title: "File Upload",              desc: "Drag-and-drop a .sql or .txt file straight into the editor. No copy-paste needed for large scripts." },
  { icon: BarChart3, color: "emerald",title: "Deep Analytics",           desc: "Charts, domain breakdown, streak tracking, AI engine usage split, and estimated query cost scores across your full history." },
  { icon: FileDown,  color: "amber",  title: "Export Everywhere",        desc: "Download as annotated .sql, structured .json, spreadsheet-ready .csv, or a multi-page .pdf report with full analysis." },
  { icon: Database,  color: "sky",    title: "Persistent History",       desc: "Every optimization saved to Neon PostgreSQL with full details. Search, filter by domain/type, star favorites, and re-optimize anytime." },
  { icon: Lock,      color: "violet", title: "Secure & Private",         desc: "Your queries are stored privately, never shared between users, never used for AI training. Rate-limited to prevent abuse." },
  { icon: Layers,    color: "pink",   title: "99 Example Library",       desc: "Real intentionally-flawed queries across 12 industries. Filter by domain and difficulty. One click loads any into the optimizer." },
  { icon: GitBranch, color: "emerald",title: "Query Fingerprinting",     desc: "Similar queries are grouped and tracked together. See performance trends across query patterns, not just individual queries." },
];

const DOMAINS = [
  { icon:"🛒",name:"E-Commerce",desc:"JOIN optimization, cart analytics"},
  { icon:"🏥",name:"Healthcare",desc:"Patient records, lab queries"},
  { icon:"🏦",name:"Banking",   desc:"Transactions, fraud detection"},
  { icon:"👥",name:"HR & Payroll",desc:"Employee queries, payroll"},
  { icon:"📊",name:"SaaS Analytics",desc:"User events, cohort analysis"},
  { icon:"💬",name:"Social Media",desc:"Posts, followers, feed queries"},
  { icon:"🏠",name:"Real Estate",desc:"Listings, agent performance"},
  { icon:"🚚",name:"Logistics", desc:"Shipments, inventory, routes"},
  { icon:"🎓",name:"Education", desc:"Student grades, enrollment"},
  { icon:"🎮",name:"Gaming",    desc:"Leaderboards, achievements"},
  { icon:"📣",name:"Marketing", desc:"Campaigns, leads, conversions"},
  { icon:"✈️",name:"Travel",   desc:"Bookings, hotel analytics"},
];

const STEPS = [
  { n:"01",icon:"📋",title:"Paste or Upload SQL",     badge:"Zero setup",         desc:"Drop any SQL into the editor or drag a .sql file. The live scanner immediately flags anti-patterns — no API call needed." },
  { n:"02",icon:"⚡",title:"AI Analyzes & Rewrites",  badge:"Dual AI engine",     desc:"Claude (or Gemini as fallback) dissects every clause, identifies all issues, and writes an optimized rewrite with inline comments explaining every change." },
  { n:"03",icon:"📊",title:"Review Deep Analysis",    badge:"8 analysis dimensions",desc:"See the performance gain %, cost score, complexity before/after, estimated rows scanned, index recommendations, and PII detection results." },
  { n:"04",icon:"📥",title:"Export & Track History",  badge:"4 export formats",   desc:"Copy the SQL, or export as .sql, .json, .csv, or .pdf. Your entire history is saved and searchable. Download bulk reports anytime." },
];

const FAQS = [
  { q:"Does it work with Gemini only (no Anthropic key)?", a:"Yes — QueryForge works with either provider or both. If you only set GEMINI_API_KEY, Gemini handles all optimizations. If you set ANTHROPIC_API_KEY too, Claude runs primary with Gemini as automatic fallback. Get a free Gemini key at aistudio.google.com/apikey." },
  { q:"Is my SQL data private?", a:"Completely. Each query is stored privately in your own account, never visible to other users, and never used to train AI models. PII (emails, SSNs, card numbers) is automatically masked before reaching any AI provider." },
  { q:"What SQL dialects are supported?", a:"PostgreSQL, MySQL, SQLite, BigQuery, and MS SQL Server. Select your dialect before optimizing and the AI uses your database's specific syntax, functions, and features." },
  { q:"What is Natural Language to SQL (NL2SQL)?", a:"You type a plain English question like 'show me the top 10 products by revenue last month' and QueryForge converts it to production-ready SQL for your chosen dialect — then you can optimize it further with one click." },
  { q:"Can I export my optimization history?", a:"Yes. Single queries export as SQL, JSON, CSV, or PDF. Your entire history exports as a bulk CSV or multi-page PDF report from the History or Settings pages." },
  { q:"Is it really free?", a:"Yes — 20 optimizations per hour, no credit card required, no trial period. Create an account and start immediately." },
];

const COMPARE_ROWS = [
  { feature:"Anti-pattern detection",      qf:true,  manual:"Hours of review" },
  { feature:"AI query rewrite",            qf:true,  manual:"Senior DBA required" },
  { feature:"Natural language → SQL",      qf:true,  manual:false },
  { feature:"PII redaction before AI",     qf:true,  manual:false },
  { feature:"Index recommendations",       qf:true,  manual:"Requires EXPLAIN analysis" },
  { feature:"Complexity before/after",     qf:true,  manual:false },
  { feature:"Multi-dialect support",       qf:true,  manual:"Separate tools per DB" },
  { feature:"Export SQL/JSON/CSV/PDF",     qf:true,  manual:"Manual formatting" },
  { feature:"History + analytics",         qf:true,  manual:false },
];

const STATS = [
  { value:"82%",  label:"Avg performance gain",   icon:<TrendingUp className="w-4 h-4"/> },
  { value:"99",   label:"Domain SQL examples",    icon:<BookOpen className="w-4 h-4"/> },
  { value:"12",   label:"Industry domains",       icon:<Database className="w-4 h-4"/> },
  { value:"<2s",  label:"Avg optimization time",  icon:<Clock className="w-4 h-4"/> },
];

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState("");
  useEffect(() => {
    let ticking = false;
    const compute = () => {
      ticking = false;
      const scrollY = window.scrollY + 100;
      let cur = "";
      for (const id of ids) { const el = document.getElementById(id); if (el && el.offsetTop <= scrollY) cur = id; }
      setActive(cur);
    };
    const h = () => { if (!ticking) { ticking = true; requestAnimationFrame(compute); } };
    compute();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, [ids]);
  return active;
}

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const dur = 1200;
    const steps = 40;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setCount(Math.round((target * i) / steps));
      if (i >= steps) clearInterval(timer);
    }, dur / steps);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-violet-500/15 rounded-2xl overflow-hidden bg-white/[0.02]">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-violet-500/5 transition-colors">
        <span className="font-semibold text-sm text-slate-100">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-violet-400 flex-shrink-0"/> : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0"/>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
            className="overflow-hidden">
            <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const colorMap: Record<string,string> = {
  violet:"bg-violet-500/15 text-violet-400", amber:"bg-amber-500/15 text-amber-400",
  emerald:"bg-emerald-500/15 text-emerald-400", sky:"bg-sky-500/15 text-sky-400",
  pink:"bg-rose-500/15 text-rose-400",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start","end start"] });
  const heroY  = useTransform(scrollYProgress, [0,1], ["0%","20%"]);
  const heroOp = useTransform(scrollYProgress, [0,0.7], [1, 0]);
  const active = useScrollSpy(["features","how-it-works","domains","faq"]);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#03020d] text-slate-100 overflow-x-hidden">

      {/* ── Animated background ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-cyber-grid opacity-20"/>
        {/* Orb 1 */}
        <motion.div className="absolute -top-80 -left-80 w-[900px] h-[900px] rounded-full"
          style={{background:"radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 65%)"}}
          animate={{scale:[1,1.3,1],rotate:[0,20,0]}} transition={{duration:14,repeat:Infinity,ease:"easeInOut"}}/>
        {/* Orb 2 */}
        <motion.div className="absolute -bottom-80 -right-80 w-[700px] h-[700px] rounded-full"
          style={{background:"radial-gradient(circle,rgba(6,214,160,.07) 0%,transparent 65%)"}}
          animate={{scale:[1,1.2,1],rotate:[0,-15,0]}} transition={{duration:16,repeat:Infinity,delay:3,ease:"easeInOut"}}/>
        {/* Orb 3 - middle accent */}
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{background:"radial-gradient(circle,rgba(247,37,133,.04) 0%,transparent 65%)"}}
          animate={{scale:[1,1.4,1]}} transition={{duration:10,repeat:Infinity,delay:5,ease:"easeInOut"}}/>
      </div>

      {/* ── Nav ── */}
      <motion.nav initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}}
        className="fixed top-0 inset-x-0 z-50 border-b border-violet-500/10 bg-[#03020d]/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white"/>
            </div>
            <span className="font-black text-sm">Query<span className="text-violet-400">Forge</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm">
            {NAV.map(([label, href]) => {
              const id = href.slice(1);
              const isAct = active === id;
              return (
                <a key={label} href={href}
                  className={`relative pb-1 transition-colors ${isAct ? "text-white" : "text-slate-400 hover:text-white"}`}>
                  {label}
                  {isAct && <motion.span layoutId="ul" className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-violet-400 rounded-full" transition={{type:"spring",stiffness:400,damping:30}}/>}
                </a>
              );
            })}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5"/>Sign in
            </Link>
            <Link href="/register"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all glow-violet flex items-center gap-1.5">
              Get Started Free <ArrowRight className="w-3.5 h-3.5"/>
            </Link>
          </div>
          <button onClick={() => setMobileOpen(o=>!o)} className="md:hidden p-2 text-slate-400 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
              className="md:hidden overflow-hidden border-t border-violet-500/10 bg-[#03020d]">
              <div className="px-6 py-5 space-y-3">
                {NAV.map(([label, href]) => (
                  <a key={label} href={href} onClick={()=>setMobileOpen(false)}
                    className="block text-sm text-slate-400 hover:text-white py-1 transition-colors">{label}</a>
                ))}
                <div className="pt-4 border-t border-violet-500/10 flex flex-col gap-2">
                  <Link href="/login" onClick={()=>setMobileOpen(false)} className="text-sm text-slate-400 py-2">Sign in</Link>
                  <Link href="/register" onClick={()=>setMobileOpen(false)}
                    className="text-center py-3 bg-violet-600 text-white text-sm font-bold rounded-xl">Get Started Free</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO                                                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative z-10 pt-32 pb-16 px-6 min-h-[100vh] flex flex-col justify-center">
        <motion.div style={{y:heroY, opacity:heroOp}} className="max-w-7xl mx-auto">
          {/* Badge */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}}
            className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-violet-500/30 bg-violet-500/8 text-violet-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5"/>
              AI Database Performance Platform · Claude + Gemini · 12 Industry Domains
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:.15}}
            className="text-center font-black tracking-tight mb-6 leading-[1.05]"
            style={{fontSize:"clamp(2.8rem,7vw,5.5rem)"}}>
            Database Performance<br/>
            <span className="gradient-text">Engineering, Automated.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2}}
            className="text-center text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            QueryForge transforms broken SQL into production-grade queries — with anti-pattern detection,
            AI rewrites, NL-to-SQL conversion, PII redaction, and export in 4 formats.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.25}}
            className="flex flex-wrap gap-4 justify-center mb-14">
            <Link href="/register"
              className="group px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold rounded-xl transition-all glow-violet flex items-center gap-2 text-base shadow-2xl shadow-violet-500/30">
              Start Free — No Credit Card
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
            </Link>
            <Link href="/login"
              className="px-8 py-4 border border-violet-500/25 hover:border-violet-500/50 hover:bg-violet-500/6 text-slate-300 hover:text-white font-medium rounded-xl transition-all flex items-center gap-2 text-base">
              <LogIn className="w-4 h-4"/>Sign In
            </Link>
          </motion.div>

          {/* SQL Demo cards */}
          <motion.div initial={{opacity:0,y:36,scale:.97}} animate={{opacity:1,y:0,scale:1}} transition={{delay:.3}}
            className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Before */}
              <div className="rounded-2xl overflow-hidden border border-rose-500/25 bg-[#020208]">
                <div className="flex items-center justify-between px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20">
                  <span className="text-[10px] text-rose-400 font-mono font-bold tracking-widest">▶ ORIGINAL — 3 ISSUES DETECTED</span>
                </div>
                <pre className="p-4 text-[11px] font-mono text-slate-400 leading-[1.75] overflow-x-auto">{BEFORE_SQL}</pre>
                <div className="px-4 pb-3 flex gap-2 flex-wrap">
                  {["N+1 Correlated Subquery","YEAR() Blocks Index","No LIMIT Clause"].map(t=>(
                    <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">{t}</span>
                  ))}
                </div>
              </div>
              {/* After */}
              <div className="rounded-2xl overflow-hidden border border-emerald-500/25 bg-[#020208]">
                <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest">✓ AI OPTIMIZED</span>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">+82% faster</span>
                </div>
                <pre className="p-4 text-[11px] font-mono text-emerald-300/80 leading-[1.75] overflow-x-auto">{AFTER_SQL}</pre>
              </div>
            </div>
            {/* Fix labels */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {["✓ LEFT JOIN replaces N+1","✓ Range filter enables index","✓ LIMIT 100 added","✓ COALESCE handles NULLs"].map(t=>(
                <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 font-medium">{t}</span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STATS                                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-violet-500/10 bg-gradient-to-r from-violet-500/5 via-purple-500/3 to-violet-500/5 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s,i)=>(
            <motion.div key={s.label} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}
              className="text-center">
              <div className="text-4xl font-black text-violet-300 font-mono mb-1">{s.value}</div>
              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs">{s.icon}{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FEATURES                                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-28 px-6 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-16">
            <div className="text-xs text-violet-400 font-bold tracking-widest uppercase mb-3">Full Platform</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Everything a DBA Needs,<br/>Automated by AI</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">From simple query fixes to enterprise-grade analysis — QueryForge covers the full database performance stack.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FEATURES.map((f,i)=>(
              <motion.div key={f.title} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:(i%4)*.06}}
                className="glass-card glass-card-hover rounded-2xl p-5 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[f.color]}`}>
                  <f.icon className="w-5 h-5"/>
                </div>
                <h3 className="font-bold text-sm mb-2 group-hover:text-violet-200 transition-colors">{f.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-10 py-28 px-6 border-t border-violet-500/10 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-16">
            <div className="text-xs text-violet-400 font-bold tracking-widest uppercase mb-3">Simple Workflow</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">From Broken SQL to<br/>Production-Ready in 4 Steps</h2>
            <p className="text-slate-400 text-lg">No configuration. No infrastructure. Just paste and let AI do the engineering.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-5">
            {STEPS.map((step,i)=>(
              <motion.div key={step.n} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}
                className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{step.icon}</span>
                  <div>
                    <div className="text-[10px] text-violet-400 font-mono font-bold">{step.n}</div>
                    <div className="font-bold">{step.title}</div>
                  </div>
                  <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">{step.badge}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Tech stack */}
          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="mt-16 text-center">
            <div className="text-xs text-slate-600 tracking-widest uppercase mb-5">Full Technology Stack</div>
            <div className="flex flex-wrap justify-center gap-2.5">
              {["Next.js 14","TypeScript","Tailwind CSS","Framer Motion","Neon PostgreSQL","Prisma ORM","NextAuth.js","Claude AI","Gemini AI","Recharts","pdf-lib","Vercel"].map(t=>(
                <span key={t} className="px-3 py-1.5 rounded-full border border-violet-500/12 bg-violet-500/4 text-[11px] text-slate-400">{t}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* VS COMPARISON                                               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-28 px-6 border-t border-violet-500/10">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-12">
            <div className="text-xs text-violet-400 font-bold tracking-widest uppercase mb-3">Why QueryForge</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">QueryForge vs Manual DBA Work</h2>
            <p className="text-slate-400 text-lg">What would take a senior DBA hours — or sometimes just never gets done — QueryForge does in seconds.</p>
          </motion.div>
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="glass-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 border-b border-violet-500/15 bg-violet-500/5">
              <div className="px-5 py-3 text-xs font-bold text-slate-400">Feature</div>
              <div className="px-5 py-3 text-xs font-bold text-violet-300 text-center">QueryForge</div>
              <div className="px-5 py-3 text-xs font-bold text-slate-500 text-center">Manual</div>
            </div>
            {COMPARE_ROWS.map((row,i)=>(
              <div key={row.feature} className={`grid grid-cols-3 border-b border-violet-500/8 ${i%2===0?"bg-transparent":"bg-violet-500/3"}`}>
                <div className="px-5 py-3.5 text-xs text-slate-300">{row.feature}</div>
                <div className="px-5 py-3.5 text-center">
                  {row.qf ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto"/> : <span className="text-slate-600 text-xs">—</span>}
                </div>
                <div className="px-5 py-3.5 text-center text-[10px] text-slate-500">{row.manual === true ? <CheckCircle2 className="w-4 h-4 text-slate-500 mx-auto"/> : row.manual === false ? <X className="w-4 h-4 text-rose-500/50 mx-auto"/> : row.manual}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DOMAINS                                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="domains" className="relative z-10 py-28 px-6 border-t border-violet-500/10 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-14">
            <div className="text-xs text-violet-400 font-bold tracking-widest uppercase mb-3">99 Real Examples</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">12 Industry Domains</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">Every example is a real intentionally-flawed query with a real optimized fix. Filter by domain and difficulty in the app.</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
            {DOMAINS.map((d,i)=>(
              <motion.div key={d.name} initial={{opacity:0,scale:.9}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{delay:(i%6)*.06}}
                className="glass-card glass-card-hover rounded-2xl p-4 text-center cursor-default group">
                <div className="text-3xl mb-2">{d.icon}</div>
                <div className="text-[11px] font-bold text-slate-200 mb-1">{d.name}</div>
                <div className="text-[9px] text-slate-500 group-hover:text-slate-400 transition-colors">{d.desc}</div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} className="text-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 border border-violet-500/25 hover:border-violet-500/50 text-slate-300 hover:text-white font-medium rounded-xl transition-all hover:bg-violet-500/6">
              Explore all 99 examples inside the app <ArrowRight className="w-4 h-4"/>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FAQ                                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section id="faq" className="relative z-10 py-28 px-6 border-t border-violet-500/10 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-14">
            <div className="text-xs text-violet-400 font-bold tracking-widest uppercase mb-3">FAQ</div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Common Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {FAQS.map(item => <FaqItem key={item.q} q={item.q} a={item.a}/>)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CTA                                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-28 px-6 border-t border-violet-500/10">
        <motion.div initial={{opacity:0,scale:.96}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}
          className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl p-14 text-center overflow-hidden border border-violet-500/30">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-600/12 via-purple-600/6 to-transparent"/>
            <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"/>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/40">
                <Zap className="w-8 h-8 text-white"/>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-3">Start Engineering<br/>Better SQL Today</h2>
              <p className="text-slate-400 mb-4 text-lg">Free to start. 20 optimizations/hour. No credit card.</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 justify-center mb-8 text-xs text-emerald-400 font-medium">
                {["✓ Dual AI engine (Claude + Gemini)","✓ NL to SQL converter","✓ PII redaction","✓ 99 domain examples","✓ CSV + PDF export","✓ Full history"].map(f=>(
                  <span key={f}>{f}</span>
                ))}
              </div>
              <Link href="/register"
                className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold rounded-xl transition-all text-lg glow-violet shadow-2xl shadow-violet-500/40">
                Create Free Account <ArrowRight className="w-5 h-5"/>
              </Link>
              <p className="text-xs text-slate-500 mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Sign in →</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-violet-500/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white"/>
                </div>
                <span className="text-sm font-black">Query<span className="text-violet-400">Forge</span></span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">AI-powered database performance engineering platform. Dual-provider AI, 12 industry domains, production-grade exports.</p>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-3">Platform</div>
              <div className="space-y-2">
                {[["Features","#features"],["How It Works","#how-it-works"],["12 Domains","#domains"],["FAQ","#faq"]].map(([l,h])=>(
                  <a key={l} href={h} className="block text-xs text-slate-400 hover:text-white transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-3">Account</div>
              <div className="space-y-2">
                <Link href="/login" className="block text-xs text-slate-400 hover:text-white transition-colors">Sign In</Link>
                <Link href="/register" className="block text-xs text-slate-400 hover:text-white transition-colors">Create Free Account</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-violet-500/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">Built with Next.js 14 · Neon PostgreSQL · Claude & Gemini AI · Vercel</p>
            <Link href="/register" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">Get started free →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
