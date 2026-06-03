'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useCallback } from 'react';
import { Zap, ChevronRight, ArrowDown, Terminal, Star } from 'lucide-react';
import { useTypewriter, useScrollAnimation } from '@/hooks';

const TYPEWRITER_STRINGS = [
  'PostgreSQL Queries',
  'MySQL JOINs',
  'SQL Server Procedures',
  'Slow Subqueries',
  'Missing Indexes',
  'N+1 Problems',
];

export default function HeroSection() {
  const { displayText } = useTypewriter({
    strings: TYPEWRITER_STRINGS,
    typingSpeed: 70,
    deletingSpeed: 35,
    pauseDuration: 2200,
  });

  const variants = useScrollAnimation();

  // Mouse parallax for hero mockup
  const rawX    = useMotionValue(0);
  const rawY    = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 80, damping: 25 });
  const springY = useSpring(rawY, { stiffness: 80, damping: 25 });
  const rotateX = useTransform(springY, [-30, 30], [6, -6]);
  const rotateY = useTransform(springX, [-30, 30], [-6, 6]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect    = e.currentTarget.getBoundingClientRect();
    rawX.set(((e.clientX - rect.left - rect.width / 2) / rect.width) * 60);
    rawY.set(((e.clientY - rect.top  - rect.height / 2) / rect.height) * 60);
  }, [rawX, rawY]);
  const handleMouseLeave = useCallback(() => { rawX.set(0); rawY.set(0); }, [rawX, rawY]);

  // Stagger word animation for headline
  const words = ['Smart', 'SQL', 'Optimization', 'Powered', 'by AI'];

  return (
    <section
      className="relative min-h-screen flex items-center pt-20 overflow-hidden"
      aria-label="Hero"
    >
      {/* Deep glow orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[rgba(0,128,255,0.06)] blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-[rgba(139,92,246,0.06)] blur-3xl pointer-events-none" />

      {/* Animated scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.3)] to-transparent"
          animate={{ y: ['-2%', '102%'] }}
          transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
        />
      </div>

      <div className="container-max relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — text */}
          <motion.div
            variants={variants.stagger}
            initial="hidden"
            animate="visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Top badge */}
            <motion.div variants={variants.fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 badge badge-cyan py-1.5 px-4 text-xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4ff] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00d4ff]" />
                </span>
                Powered by GPT-4o · Free to use
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-display font-black leading-[1.05] tracking-tight mb-6"
              variants={variants.stagger}
            >
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  variants={{
                    hidden:  { opacity: 0, y: 30  },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  className={`inline-block mr-4 ${
                    i === 0 || i === 4
                      ? 'text-gradient-cyber'
                      : i === 1
                      ? 'text-white'
                      : 'text-white'
                  }`}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            {/* Typewriter subtitle */}
            <motion.div variants={variants.fadeUp} className="mb-8">
              <p className="text-xl text-[#8899bb] leading-relaxed">
                AI-powered analysis for{' '}
                <span className="text-[#00d4ff] font-mono font-semibold">
                  {displayText}
                  <span className="animate-type-cursor inline-block w-0.5 h-5 bg-[#00d4ff] ml-0.5 align-middle" />
                </span>
              </p>
              <p className="text-[#8899bb] mt-2 leading-relaxed">
                Get index suggestions, execution cost estimates, and side-by-side diffs — in under 10 seconds.
              </p>
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={variants.fadeUp} className="flex flex-wrap gap-4 mb-10">
              <Link href="/optimizer">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary px-8 py-4 text-sm gap-2 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Terminal size={16} />
                    Launch Optimizer
                    <ChevronRight size={16} />
                  </span>
                  {/* Animated shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                  />
                </motion.button>
              </Link>
              <Link href="/examples">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-secondary px-8 py-4 text-sm gap-2"
                >
                  <Zap size={16} />
                  View Examples
                </motion.button>
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div variants={variants.fadeUp} className="flex flex-wrap items-center gap-5 text-sm text-[#8899bb]">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[0,1,2,3,4].map(i => (
                    <Star key={i} size={13} className="text-[#ffd700] fill-[#ffd700]" />
                  ))}
                </div>
                <span>4.9/5 from 500+ devs</span>
              </div>
              <span className="text-[#333]">·</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                No signup required
              </span>
              <span className="text-[#333]">·</span>
              <span>8 databases supported</span>
            </motion.div>
          </motion.div>

          {/* Right — Hero mockup panel */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0  }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block perspective-1000"
            style={{ perspective: 1000 }}
          >
            <motion.div
              style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
              className="relative"
            >
              {/* Glow behind card */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[rgba(0,212,255,0.15)] to-[rgba(0,128,255,0.1)] blur-3xl scale-90 translate-y-8" />

              {/* Main card */}
              <div className="relative cyber-card rounded-2xl overflow-hidden border-[rgba(0,212,255,0.2)] shadow-[0_0_60px_rgba(0,212,255,0.1)]">
                {/* Terminal header */}
                <div className="terminal-header flex items-center gap-2 px-4 py-3">
                  <div className="terminal-dot bg-[#ff5f57]" />
                  <div className="terminal-dot bg-[#febc2e]" />
                  <div className="terminal-dot bg-[#28c840]" />
                  <span className="ml-3 text-[#8899bb] text-xs font-mono">smart-query-optimizer — optimizer</span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Input query */}
                  <div>
                    <div className="text-[10px] font-mono text-[#445566] uppercase tracking-widest mb-2">Input Query</div>
                    <div className="bg-[#050510] rounded-xl p-4 font-mono text-xs leading-relaxed border border-[rgba(0,212,255,0.08)]">
                      <span className="text-[#569cd6]">SELECT </span>
                      <span className="text-[#9cdcfe]">*</span>
                      <br />
                      <span className="text-[#569cd6]">FROM </span>
                      <span className="text-[#9cdcfe]">orders</span>
                      <br />
                      <span className="text-[#569cd6]">JOIN </span>
                      <span className="text-[#9cdcfe]">customers</span>
                      <span className="text-[#d4d4d4]"> ON </span>
                      <span className="text-[#9cdcfe]">customers.id</span>
                      <span className="text-[#d4d4d4]"> = </span>
                      <span className="text-[#9cdcfe]">orders.cid</span>
                      <br />
                      <span className="text-[#569cd6]">WHERE</span>
                      <span className="text-[#d4d4d4]"> status = </span>
                      <span className="text-[#ce9178]">'pending'</span>
                      <span className="text-[#6a9955]"> -- no index!</span>
                    </div>
                  </div>

                  {/* Arrow + metrics */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(0,212,255,0.3)] to-transparent" />
                    <div className="mx-4 flex flex-col items-center">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#0080ff] flex items-center justify-center shadow-neon-cyan"
                      >
                        <Zap size={14} className="text-black" fill="black" />
                      </motion.div>
                      <span className="text-[10px] font-mono text-[#00ff88] font-bold mt-1">+87%</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-[rgba(0,212,255,0.3)] via-transparent to-transparent" />
                  </div>

                  {/* Optimized query */}
                  <div>
                    <div className="text-[10px] font-mono text-[#00ff88] uppercase tracking-widest mb-2">Optimized ✓</div>
                    <div className="bg-[rgba(0,255,136,0.04)] rounded-xl p-4 font-mono text-xs leading-relaxed border border-[rgba(0,255,136,0.1)]">
                      <span className="text-[#569cd6]">SELECT </span>
                      <span className="text-[#9cdcfe]">o.id, o.total, c.name</span>
                      <br />
                      <span className="text-[#569cd6]">FROM </span>
                      <span className="text-[#9cdcfe]">orders</span>
                      <span className="text-[#d4d4d4]"> o</span>
                      <br />
                      <span className="text-[#569cd6]">JOIN </span>
                      <span className="text-[#9cdcfe]">customers</span>
                      <span className="text-[#d4d4d4]"> c</span>
                      <span className="text-[#569cd6]"> USING </span>
                      <span className="text-[#9cdcfe]">(customer_id)</span>
                      <br />
                      <span className="text-[#569cd6]">WHERE </span>
                      <span className="text-[#9cdcfe]">o.status</span>
                      <span className="text-[#d4d4d4]"> = </span>
                      <span className="text-[#ce9178]">'pending'</span>
                    </div>
                  </div>

                  {/* Metric chips */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Cost', before: '1,240', after: '161', color: '#00d4ff' },
                      { label: 'Time', before: '4.2s', after: '180ms', color: '#00ff88' },
                      { label: 'Rows', before: '850K', after: '1.2K', color: '#8b5cf6' },
                    ].map(m => (
                      <div key={m.label} className="bg-[rgba(255,255,255,0.03)] rounded-lg p-2.5 border border-[rgba(255,255,255,0.05)] text-center">
                        <div className="text-[9px] text-[#445566] uppercase tracking-widest mb-1">{m.label}</div>
                        <div className="text-[10px] text-[#445566] line-through">{m.before}</div>
                        <div className="text-sm font-bold" style={{ color: m.color }}>{m.after}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[#445566] text-xs uppercase tracking-widest">Explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown size={18} className="text-[#445566]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
