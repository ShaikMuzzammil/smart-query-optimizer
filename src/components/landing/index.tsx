'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, Check, Quote, Terminal, ArrowRight, Zap } from 'lucide-react';
import { STATS, FEATURES, TESTIMONIALS, PRICING_PLANS, FAQ_ITEMS } from '../../data/features';
import { useScrollAnimation, useAnimatedCounter } from '../../hooks';

// ══════════════════════════════════════════════════════════
// STATS SECTION
// ══════════════════════════════════════════════════════════
function StatCard({ value, suffix, label, icon, delay }: any) {
  const { count, ref } = useAnimatedCounter(value);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-4xl md:text-5xl font-display font-black text-gradient-cyber mb-1">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-[#8899bb] text-sm">{label}</div>
    </motion.div>
  );
}

export function StatsSection() {
  return (
    <section className="section-padding relative">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,212,255,0.02)_0%,transparent_50%,rgba(139,92,246,0.02)_100%)] pointer-events-none" />
      <div className="container-max">
        <div className="glass-card p-10 md:p-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 divide-x-0 md:divide-x divide-[rgba(0,212,255,0.1)]">
            {STATS.map((stat, i) => (
              <StatCard key={i} {...stat} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
// FEATURES SECTION
// ══════════════════════════════════════════════════════════
export function FeaturesSection() {
  const variants = useScrollAnimation();
  return (
    <section id="features" className="section-padding">
      <div className="container-max">
        <motion.div
          variants={variants.fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge badge-cyan mb-4">Features</span>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
            Everything You Need to <span className="text-gradient-cyber">Optimize</span>
          </h2>
          <p className="text-[#8899bb] text-lg max-w-2xl mx-auto">
            A complete SQL optimization toolkit powered by GPT-4o — from index recommendations to execution plan analysis.
          </p>
        </motion.div>

        <motion.div
          variants={variants.stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((feat) => (
            <motion.div
              key={feat.id}
              variants={variants.fadeUp}
              whileHover={{ y: -4, scale: 1.01 }}
              className="cyber-card p-6 glass-card-hover group cursor-default"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${feat.color}18`, border: `1px solid ${feat.color}22` }}
              >
                {feat.icon}
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{feat.title}</h3>
              <p className="text-[#8899bb] text-sm leading-relaxed mb-4">{feat.description}</p>
              {feat.highlight && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: `${feat.color}18`, color: feat.color, border: `1px solid ${feat.color}25` }}
                >
                  <Zap size={10} />
                  {feat.highlight}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
// HOW IT WORKS SECTION
// ══════════════════════════════════════════════════════════
const HOW_STEPS = [
  {
    num: '01',
    title: 'Enter Your Query',
    desc: 'Paste your SQL or describe your intent in plain English. Optionally include your schema for hyper-accurate results. Choose your database engine and optimization goal.',
    icon: '📝',
    color: '#00d4ff',
  },
  {
    num: '02',
    title: 'Confirm & Launch',
    desc: 'Review your settings in the confirmation step. Toggle the execution plan, adjust AI creativity, then press Launch — our AI takes over from here.',
    icon: '🚀',
    color: '#8b5cf6',
  },
  {
    num: '03',
    title: 'Get Your Results',
    desc: 'Receive a full optimization report: improved query, diff view, index recommendations, cost estimates, and a detailed explanation of every change made.',
    icon: '⚡',
    color: '#00ff88',
  },
];

export function HowItWorksSection() {
  const variants = useScrollAnimation();
  return (
    <section id="how-it-works" className="section-padding relative">
      <div className="absolute inset-y-0 left-0 right-0 bg-[linear-gradient(180deg,transparent,rgba(0,128,255,0.03),transparent)] pointer-events-none" />
      <div className="container-max">
        <motion.div
          variants={variants.fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge badge-purple mb-4">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
            Three Steps to <span className="text-gradient-accent">Blazing Fast</span> SQL
          </h2>
          <p className="text-[#8899bb] text-lg max-w-xl mx-auto">
            From raw query to optimized output in under 10 seconds.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-14 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5 bg-gradient-to-r from-[#00d4ff] via-[#8b5cf6] to-[#00ff88] opacity-30" />

          <motion.div
            variants={variants.stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 relative z-10"
          >
            {HOW_STEPS.map((step, i) => (
              <motion.div key={i} variants={variants.fadeUp} className="text-center group">
                <div className="relative inline-block mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl mx-auto"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}20, ${step.color}08)`,
                      border: `2px solid ${step.color}30`,
                      boxShadow: `0 0 30px ${step.color}15`,
                    }}
                  >
                    {step.icon}
                  </motion.div>
                  <div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-black"
                    style={{ background: step.color, color: '#000' }}
                  >
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-[#8899bb] text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link href="/optimizer">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary px-8 py-4 inline-flex gap-2"
            >
              <Terminal size={16} />
              Try It Now — Free
              <ArrowRight size={16} />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
// TESTIMONIALS SECTION
// ══════════════════════════════════════════════════════════
export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const variants = useScrollAnimation();

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="testimonials" className="section-padding">
      <div className="container-max">
        <motion.div
          variants={variants.fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="badge badge-green mb-4">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
            Loved by <span className="text-gradient-success">Developers</span>
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{   opacity: 0, scale: 0.96,  y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card p-8 md:p-10 text-center"
            >
              <Quote size={36} className="text-[rgba(0,212,255,0.3)] mx-auto mb-6" />
              <blockquote className="text-xl text-white font-medium leading-relaxed mb-8">
                "{TESTIMONIALS[active].quote}"
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm">
                  {TESTIMONIALS[active].author.split(' ').map(w => w[0]).join('')}
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold">{TESTIMONIALS[active].author}</div>
                  <div className="text-[#8899bb] text-sm">{TESTIMONIALS[active].role} · {TESTIMONIALS[active].company}</div>
                </div>
                <div className="ml-4 flex gap-1">
                  {[...Array(TESTIMONIALS[active].rating)].map((_, i) => (
                    <span key={i} className="text-[#ffd700] text-sm">★</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Testimonial ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active
                    ? 'w-8 bg-[#00d4ff]'
                    : 'w-1.5 bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.4)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
// PRICING SECTION
// ══════════════════════════════════════════════════════════
export function PricingSection() {
  const variants = useScrollAnimation();
  return (
    <section id="pricing" className="section-padding">
      <div className="container-max">
        <motion.div
          variants={variants.fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="badge badge-orange mb-4">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
            Simple, <span className="text-gradient-cyber">Transparent</span> Pricing
          </h2>
          <p className="text-[#8899bb] text-lg">Start free. Upgrade when you're ready.</p>
        </motion.div>

        <motion.div
          variants={variants.stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {PRICING_PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              variants={variants.scaleIn}
              whileHover={{ y: -4 }}
              className={`relative rounded-2xl p-7 flex flex-col ${
                plan.highlighted
                  ? 'border-2 border-[#00d4ff] bg-gradient-to-b from-[rgba(0,212,255,0.08)] to-[rgba(0,128,255,0.04)] shadow-neon-cyan'
                  : 'glass-card'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge badge-cyan px-4 py-1 text-[11px] shadow-neon-cyan whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-white font-display font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-[#8899bb] text-sm">{plan.description}</p>
              </div>
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  {plan.price === 'Custom' ? (
                    <span className="text-4xl font-display font-black text-white">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-display font-black text-gradient-cyber">${plan.price}</span>
                      <span className="text-[#8899bb] text-sm mb-1">/{plan.period}</span>
                    </>
                  )}
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#c8d8e8]">
                    <Check size={14} className="text-[#00ff88] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.id === 'enterprise' ? '/contact' : '/optimizer'}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlighted
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
// FAQ SECTION
// ══════════════════════════════════════════════════════════
function FaqItem({ item, isOpen, onToggle }: { item: typeof FAQ_ITEMS[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`glass-card overflow-hidden transition-all duration-300 ${isOpen ? 'border-[rgba(0,212,255,0.25)]' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left focus-ring"
        aria-expanded={isOpen}
      >
        <span className={`font-semibold text-base transition-colors ${isOpen ? 'text-[#00d4ff]' : 'text-white'}`}>
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 ml-4"
        >
          <ChevronDown size={18} className={isOpen ? 'text-[#00d4ff]' : 'text-[#8899bb]'} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-[#8899bb] text-sm leading-relaxed border-t border-[rgba(0,212,255,0.08)] pt-4">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);
  const variants = useScrollAnimation();
  return (
    <section id="faq" className="section-padding">
      <div className="container-max max-w-3xl">
        <motion.div
          variants={variants.fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="badge badge-blue mb-4">FAQ</span>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
            Common <span className="text-gradient-cyber">Questions</span>
          </h2>
        </motion.div>
        <motion.div
          variants={variants.stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-3"
        >
          {FAQ_ITEMS.map((item) => (
            <motion.div key={item.id} variants={variants.fadeUp}>
              <FaqItem
                item={item}
                isOpen={openId === item.id}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════
// CTA SECTION
// ══════════════════════════════════════════════════════════
export function CtaSection() {
  const variants = useScrollAnimation();
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,128,255,0.06)] via-transparent to-[rgba(139,92,246,0.06)] pointer-events-none" />
      <div className="absolute inset-0 bg-cyber-grid-sm opacity-50 pointer-events-none" />

      <div className="container-max relative z-10">
        <motion.div
          variants={variants.scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl mb-6"
          >
            ⚡
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-display font-black text-white mb-6 leading-tight">
            Ready to Forge <span className="text-gradient-cyber">Faster Queries?</span>
          </h2>
          <p className="text-[#8899bb] text-lg mb-10">
            Join 4,000+ developers using Smart Query Optimizer. Free to start, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/optimizer">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary px-10 py-4 text-sm"
              >
                <Terminal size={16} />
                Launch Optimizer — Free
                <ArrowRight size={16} />
              </motion.button>
            </Link>
            <Link href="/examples">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary px-10 py-4 text-sm"
              >
                Browse Examples
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
