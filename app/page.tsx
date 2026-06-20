"use client";
// app/page.tsx
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Zap, Shield, BarChart3, Database, Code2, Star,
         CheckCircle2, LogIn, Sparkles,
         TrendingUp, Clock } from "lucide-react";

// ── Framer Motion variants
const fadeUp   = { hidden:{opacity:0,y:30}, show:{opacity:1,y:0,transition:{duration:.6,ease:"easeOut"}} };
const stagger  = { show:{transition:{staggerChildren:.12}} };
const scaleIn  = { hidden:{opacity:0,scale:.9}, show:{opacity:1,scale:1,transition:{duration:.5}} };

// ── SQL code snippets for animated hero
const BEFORE_SQL = `SELECT p.id, p.name,
  (SELECT SUM(oi.qty * oi.price)
   FROM order_items oi
   WHERE oi.product_id = p.id)
     AS revenue
FROM products p
WHERE YEAR(created_at) = 2024
ORDER BY revenue DESC;`;

const AFTER_SQL = `SELECT p.id, p.name,
  COALESCE(SUM(oi.qty * oi.price), 0)
    AS revenue
FROM products p
LEFT JOIN order_items oi
  ON oi.product_id = p.id
WHERE created_at >= '2024-01-01'
  AND created_at < '2025-01-01'
GROUP BY p.id, p.name
ORDER BY revenue DESC
LIMIT 100;`;

const FEATURES = [
  { icon:<Zap className="w-5 h-5"/>, title:"Claude AI Optimization", desc:"Powered by Claude Sonnet — the same model trusted by Fortune 500 teams. Instant rewrites with detailed explanations.", color:"violet" },
  { icon:<Shield className="w-5 h-5"/>, title:"Live Anti-Pattern Scanner", desc:"10 regex-based rules detect N+1 queries, leading wildcards, implicit joins, and more as you type — zero API latency.", color:"emerald" },
  { icon:<BarChart3 className="w-5 h-5"/>, title:"Real-Time Analytics", desc:"Track performance gains, issue types, and optimization streaks. Recharts dashboards update with every query.", color:"pink" },
  { icon:<Database className="w-5 h-5"/>, title:"Neon PostgreSQL Storage", desc:"Every optimization saved permanently. Filter by domain, search by content, export as SQL or JSON.", color:"amber" },
  { icon:<Code2 className="w-5 h-5"/>, title:"SQL Syntax Highlighting", desc:"Token-based highlighting for keywords, functions, strings, and numbers. Before/after split-view comparison.", color:"blue" },
  { icon:<Star className="w-5 h-5"/>, title:"36+ Domain Examples", desc:"Real queries from E-Commerce, Healthcare, Finance, HR, Analytics, Social, Real Estate, and Logistics.", color:"violet" },
];

const STATS = [
  { value:"82%", label:"Avg Performance Gain", icon:<TrendingUp className="w-4 h-4"/> },
  { value:"36+", label:"Domain Examples",       icon:<Database className="w-4 h-4"/> },
  { value:"10",  label:"Anti-Pattern Rules",    icon:<Shield className="w-4 h-4"/> },
  { value:"<2s", label:"Avg Optimization Time", icon:<Clock className="w-4 h-4"/> },
];

function SqlBlock({ code, label, gain }: { code:string; label:string; gain?:string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-violet-500/25 bg-[#020208]">
      <div className="flex items-center justify-between px-4 py-2 bg-violet-500/10 border-b border-violet-500/20">
        <span className="text-[10px] text-violet-400 font-mono tracking-widest">{label}</span>
        {gain && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">{gain}</span>}
      </div>
      <pre className="p-4 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">{code}</pre>
    </div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start","end start"] });
  const heroY     = useTransform(scrollYProgress, [0,1], ["0%","30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0,.8], [1,0]);

  return (
    <div className="min-h-screen bg-[#030309] text-slate-100 overflow-hidden">

      {/* ── Animated background ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-cyber-grid opacity-40"/>
        <motion.div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full hero-blob"
          style={{background:"radial-gradient(circle,rgba(124,58,237,.15) 0%,transparent 70%)"}}
          animate={{scale:[1,1.15,1],rotate:[0,10,0]}} transition={{duration:8,repeat:Infinity}}/>
        <motion.div className="absolute -bottom-60 -right-40 w-[500px] h-[500px] rounded-full hero-blob"
          style={{background:"radial-gradient(circle,rgba(6,214,160,.08) 0%,transparent 70%)"}}
          animate={{scale:[1,1.2,1],rotate:[0,-10,0]}} transition={{duration:10,repeat:Infinity,delay:1}}/>
      </div>

      {/* ── Nav ── */}
      <motion.nav initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:.5}}
        className="fixed top-0 inset-x-0 z-50 border-b border-violet-500/15 bg-[#030309]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-400"/>
            </div>
            <span className="font-bold text-sm">SmartQuery <span className="text-violet-400">Pro</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            {[["Features","#features"],["How It Works","#how-it-works"]].map(([label,href])=>(
              <a key={label} href={href} className="hover:text-white transition-colors">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Sign in</Link>
            <Link href="/register"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all glow-violet">
              Get Started <ArrowRight className="w-3.5 h-3.5 inline ml-1"/>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative z-10 pt-36 pb-24 px-6">
        <motion.div style={{y:heroY,opacity:heroOpacity}} className="max-w-7xl mx-auto">
          <motion.div variants={stagger} initial="hidden" animate="show" className="text-center mb-16">
            <motion.div variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs mb-6">
              <Sparkles className="w-3.5 h-3.5"/>
              Powered by Claude Sonnet AI · Neon PostgreSQL
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
              Optimize SQL Queries<br/>
              <span className="gradient-text">with AI in Seconds</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Detect N+1 anti-patterns, missing indexes, and performance bottlenecks instantly.
              Get AI-powered rewrites with index recommendations, complexity analysis, and full explanations.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Link href="/register"
                className="group px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all glow-violet flex items-center gap-2">
                Start Optimizing Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </Link>
              <Link href="/login"
                className="px-8 py-3.5 border border-violet-500/30 hover:border-violet-500/60 text-slate-300 hover:text-white font-medium rounded-xl transition-all backdrop-blur-sm flex items-center gap-2">
                <LogIn className="w-4 h-4"/> Sign In
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Code Demo */}
          <motion.div variants={scaleIn} initial="hidden" animate="show"
            className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
            <div>
              <SqlBlock code={BEFORE_SQL} label="▶ ORIGINAL · N+1 + Date Function Issues"/>
              <div className="mt-3 flex flex-wrap gap-2">
                {["N+1 Subquery","YEAR() on Index","No LIMIT"].map(t=>(
                  <span key={t} className="text-[10px] px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <SqlBlock code={AFTER_SQL} label="✓ OPTIMIZED · Claude AI" gain="+82%"/>
              <div className="mt-3 flex flex-wrap gap-2">
                {["LEFT JOIN + GROUP BY","Range Date Filter","LIMIT 100 Added"].map(t=>(
                  <span key={t} className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">✓ {t}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 border-y border-violet-500/10 bg-violet-500/5 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s,i)=>(
            <motion.div key={s.label}
              initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
              transition={{delay:i*.1}}
              className="text-center">
              <div className="text-3xl font-black text-violet-400 mb-1 font-mono">{s.value}</div>
              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs">
                {s.icon}{s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-24 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="text-center mb-16">
            <div className="text-xs text-violet-400 font-medium tracking-widest uppercase mb-4">Everything You Need</div>
            <h2 className="text-4xl font-black mb-4">Built for Database Performance</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every feature is designed to help you write faster, safer SQL — from instant pattern detection to AI-powered rewrites.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f,i)=>(
              <motion.div key={f.title}
                initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
                transition={{delay:i*.08}}
                className="glass-card glass-card-hover rounded-2xl p-6 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 
                  ${f.color==="violet" ? "bg-violet-500/15 text-violet-400" :
                    f.color==="emerald" ? "bg-emerald-500/15 text-emerald-400" :
                    f.color==="pink"    ? "bg-rose-500/15 text-rose-400" :
                    f.color==="amber"   ? "bg-amber-500/15 text-amber-400" :
                    "bg-sky-500/15 text-sky-400"}`}>
                  {f.icon}
                </div>
                <h3 className="font-bold mb-2 text-sm">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 border-t border-violet-500/10 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Three Steps to Faster SQL</h2>
            <p className="text-slate-400">No configuration. No infrastructure. Just paste and optimize.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n:"01", title:"Paste Your Query", desc:"Drop any SQL query into the editor. The live scanner immediately highlights anti-patterns as you type — zero latency." },
              { n:"02", title:"Click Optimize", desc:"Claude AI analyzes your query, identifies all issues, and generates an optimized version with index recommendations." },
              { n:"03", title:"Review & Export", desc:"Compare before/after in split view. Copy the optimized SQL or export as a file. History saved automatically to Neon." },
            ].map((step,i)=>(
              <motion.div key={step.n}
                initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}}
                transition={{delay:i*.15}}
                className="relative">
                <div className="text-7xl font-black text-violet-500/10 absolute -top-4 -left-2 font-mono">{step.n}</div>
                <div className="relative glass-card rounded-2xl p-6 pt-8">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-4 h-4 text-violet-400"/>
                  </div>
                  <h3 className="font-bold mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-24 px-6">
        <motion.div initial={{opacity:0,scale:.95}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}
          className="max-w-3xl mx-auto text-center">
          <div className="animated-border rounded-3xl p-12">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-violet-400"/>
            </div>
            <h2 className="text-4xl font-black mb-4">Start Optimizing Today</h2>
            <p className="text-slate-400 mb-8 text-lg">Free to start. 20 optimizations per hour. No credit card required.</p>
            <Link href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all text-lg glow-violet">
              Create Free Account <ArrowRight className="w-5 h-5"/>
            </Link>
            <p className="text-xs text-slate-500 mt-4">
              Already have an account? <Link href="/login" className="text-violet-400 hover:text-violet-300">Sign in →</Link>
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-violet-500/10 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-violet-400"/>
            </div>
            <span className="text-sm font-bold">SmartQuery <span className="text-violet-400">Pro</span></span>
          </div>
          <p className="text-xs text-slate-500">Built with Next.js 14 · Neon PostgreSQL · Claude AI · Vercel</p>
          <Link href="/register" className="text-xs text-violet-400 hover:text-violet-300 font-medium">Get started free →</Link>
        </div>
      </footer>
    </div>
  );
}
