import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Zap, Shield, Globe, Code2, Brain, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Smart Query Optimizer — built to help developers write faster, better SQL.',
};

const TECH_STACK = [
  { name: 'Next.js 14', icon: '▲', desc: 'App Router + Server Actions' },
  { name: 'TypeScript',  icon: '🔷', desc: 'End-to-end type safety' },
  { name: 'GPT-4o',      icon: '🧠', desc: 'AI optimization engine' },
  { name: 'MongoDB',     icon: '🍃', desc: 'History persistence' },
  { name: 'Resend',      icon: '📧', desc: 'Transactional email' },
  { name: 'Framer Motion', icon: '✨', desc: 'Animations' },
  { name: 'Tailwind CSS', icon: '🎨', desc: 'Utility-first styling' },
  { name: 'Vercel',       icon: '🚀', desc: 'Edge deployment' },
];

const VALUES = [
  { icon: Brain,     title: 'AI-First',     desc: 'We believe the best developer tools are amplified by AI, not replaced by it.',       color: '#00d4ff' },
  { icon: Shield,    title: 'Privacy',       desc: 'Your query data is never stored on AI servers beyond the request window.',           color: '#8b5cf6' },
  { icon: TrendingUp,title: 'Performance',  desc: 'Every optimization is data-driven. We back suggestions with cost estimates.',        color: '#00ff88' },
  { icon: Globe,     title: 'Accessibility', desc: 'Free tier with no signup required. Great tooling should be accessible to everyone.', color: '#ff6600' },
  { icon: Code2,     title: 'Openness',      desc: 'Built with open-source technologies. We share knowledge freely.',                    color: '#0080ff' },
];

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      <section className="min-h-screen pt-28 pb-20">
        <div className="container-max max-w-4xl">

          {/* Hero */}
          <div className="text-center mb-20">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#0080ff] flex items-center justify-center mx-auto mb-6 shadow-neon-cyan">
              <Zap size={36} className="text-black" fill="black" />
            </div>
            <h1 className="text-5xl font-display font-black text-white mb-6">
              About <span className="text-gradient-cyber">Smart Query Optimizer</span>
            </h1>
            <p className="text-[#8899bb] text-xl leading-relaxed max-w-2xl mx-auto">
              Smart Query Optimizer was built out of frustration — watching developers spend hours hunting down
              slow queries that a few well-placed indexes could have fixed in seconds. We built the tool
              we wished existed.
            </p>
          </div>

          {/* Mission */}
          <div className="glass-card p-10 mb-14 text-center">
            <div className="text-3xl mb-4">🎯</div>
            <h2 className="text-2xl font-display font-bold text-white mb-4">Our Mission</h2>
            <p className="text-[#8899bb] text-lg leading-relaxed max-w-2xl mx-auto">
              To make SQL optimization accessible to every developer — from the junior engineer writing
              their first JOIN to the senior DBA tuning a multi-terabyte warehouse. GPT-4o as a pair
              programmer for your database layer.
            </p>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-display font-bold text-white text-center mb-10">
              What We <span className="text-gradient-cyber">Stand For</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {VALUES.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="cyber-card p-5 hover:border-[rgba(0,212,255,0.2)] transition-all">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${color}18`, border: `1px solid ${color}25` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <h3 className="text-white font-bold mb-1.5">{title}</h3>
                  <p className="text-[#8899bb] text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack */}
          <div className="mb-16">
            <h2 className="text-3xl font-display font-bold text-white text-center mb-10">
              Built With <span className="text-gradient-accent">Modern Tech</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TECH_STACK.map(t => (
                <div
                  key={t.name}
                  className="glass-card p-4 text-center hover:border-[rgba(0,212,255,0.2)] transition-all"
                >
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-[#445566] text-xs mt-0.5">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <a href="/optimizer" className="btn-primary px-10 py-4 text-sm inline-flex gap-2">
              <Zap size={16} />
              Try Smart Query Optimizer — Free
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
