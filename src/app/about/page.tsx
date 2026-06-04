import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const TECH = [
  { name: 'Next.js 14', icon: '▲', desc: 'App Router + API Routes' },
  { name: 'GPT-4o',     icon: '🧠', desc: 'AI optimization engine' },
  { name: 'MongoDB',    icon: '🍃', desc: 'History persistence' },
  { name: 'Resend',     icon: '📧', desc: 'Email notifications' },
  { name: 'TypeScript', icon: '🔷', desc: 'End-to-end type safety' },
  { name: 'Tailwind',   icon: '🎨', desc: 'Utility-first styling' },
]
const VALUES = [
  { icon: '🧠', t: 'AI-First',    d: 'GPT-4o analyzes query semantics, not just pattern matching.' },
  { icon: '🔒', t: 'Privacy',     d: 'Queries are never stored on AI servers beyond the request.' },
  { icon: '⚡', t: 'Performance', d: 'Every suggestion is backed by cost estimates and benchmarks.' },
  { icon: '🌐', t: 'Open Access', d: 'Free tier, no signup required. Great tooling for everyone.' },
]

export default function About() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: 90, paddingBottom: 80 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,198,255,0.08)', border: '1px solid rgba(0,198,255,0.2)', borderRadius: 100, padding: '5px 16px', fontSize: 12, color: '#00C6FF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 24 }}>
              About Us
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontFamily: 'Syne,sans-serif', fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
              About <span className="gtext">Smart Query Optimizer</span>
            </h1>
            <p style={{ color: '#7A9CC0', fontSize: 18, lineHeight: 1.7, maxWidth: 620, margin: '0 auto' }}>
              Built out of frustration — watching developers spend hours hunting slow queries that a few well-placed indexes could have fixed in seconds. We built the tool we wished existed.
            </p>
          </div>

          {/* Mission */}
          <div className="card" style={{ padding: '40px', marginBottom: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
            <h2 style={{ fontSize: '1.6rem', fontFamily: 'Syne,sans-serif', fontWeight: 700, marginBottom: 12 }}>Our Mission</h2>
            <p style={{ color: '#7A9CC0', fontSize: 16, lineHeight: 1.8, maxWidth: 600, margin: '0 auto' }}>
              Make SQL optimization accessible to every developer — from the junior engineer writing their first JOIN to the senior DBA tuning a multi-terabyte warehouse. GPT-4o as your pair programmer for the database layer.
            </p>
          </div>

          {/* Values */}
          <div style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: '1.6rem', fontFamily: 'Syne,sans-serif', fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>What We <span className="gtext">Stand For</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
              {VALUES.map(v => (
                <div key={v.t} className="card" style={{ padding: 24 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{v.icon}</div>
                  <h3 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, marginBottom: 8 }}>{v.t}</h3>
                  <p style={{ color: '#7A9CC0', fontSize: 13, lineHeight: 1.6 }}>{v.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack */}
          <div style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: '1.6rem', fontFamily: 'Syne,sans-serif', fontWeight: 700, textAlign: 'center', marginBottom: 32 }}>Built With <span className="gtext">Modern Tech</span></h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
              {TECH.map(t => (
                <div key={t.name} className="card" style={{ padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ color: '#7A9CC0', fontSize: 12 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/optimizer" className="btn-p" style={{ padding: '14px 40px', borderRadius: 10, fontSize: 15, textDecoration: 'none', gap: 10 }}>
              <span>⚡ Try the Optimizer — Free</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
