'use client';
// components/sections/HomeSection.tsx
import React, { useEffect, useRef } from 'react';
import { useApp, useMetrics } from '../../lib/AppContext';

const FEATURES = [
  { icon: '⬆', title: 'Smart Upload', desc: 'Drag & drop .txt files for instant deep analysis with real-time processing', color: 'var(--accent)' },
  { icon: '⌕', title: 'BM25 Search', desc: 'Industry-grade BM25 scoring with 20+ filters, regex, fuzzy, and proximity search', color: 'var(--accent2)' },
  { icon: '◉', title: 'Live Analytics', desc: 'Canvas-rendered charts: word frequency, sentiment, readability, and issue distribution', color: 'var(--accent3)' },
  { icon: '▦', title: 'File Manager', desc: 'Sortable table with detailed per-file analysis modals and export capabilities', color: 'var(--accent4)' },
  { icon: '♦', title: 'Issue Detection', desc: '25+ issue patterns detected by severity: critical, high, medium, low', color: 'var(--accent)' },
  { icon: '✦', title: 'Readability', desc: 'Flesch-Kincaid scores, sentiment analysis, lexical density, and bigrams', color: 'var(--accent2)' },
];

const DEMO_STATS = [
  { label: 'Analysis Metrics', value: '40+' },
  { label: 'Search Filters', value: '20+' },
  { label: 'Issue Patterns', value: '25' },
  { label: 'Chart Types', value: '8' },
];

export default function HomeSection() {
  const { navigate } = useApp();
  const { totalFiles, totalQueries } = useMetrics();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; opacity: number; size: number; color: string }[] = [];
    const colors = ['#00ff9d', '#00c8ff', '#a78bfa'];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.5 + 0.1,
        size: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,255,157,${0.05 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: 'rgba(7,16,32,0.8)', border: '1px solid rgba(0,255,157,0.12)', minHeight: 380, display: 'flex', alignItems: 'center', marginBottom: 28 }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '52px 48px', maxWidth: 620 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(0,255,157,0.08)', border: '1px solid rgba(0,255,157,0.2)', borderRadius: 20, fontSize: 12, color: 'var(--accent)', fontFamily: 'JetBrains Mono', marginBottom: 20, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite', boxShadow: '0 0 6px var(--accent)' }} />
            v3.0 ADVANCED · PRODUCTION READY
          </div>

          <h1 style={{ fontFamily: 'Syne', fontSize: 46, fontWeight: 800, lineHeight: 1.1, marginBottom: 16, color: 'var(--text)' }}>
            Smart{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Query
            </span>
            {' '}Optimizer
          </h1>

          <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
            Distributed text analysis engine with BM25 search scoring, real-time analytics, 40+ analysis metrics, and production-grade deployment.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('upload')}>
              <span>↑</span> Upload & Analyze
            </button>
            {totalFiles > 0 ? (
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('overview')}>
                <span>◈</span> Dashboard ({totalFiles} files)
              </button>
            ) : (
              <button className="btn btn-ghost btn-lg" onClick={() => navigate('overview')}>
                <span>◈</span> View Dashboard
              </button>
            )}
          </div>

          {totalQueries > 0 && (
            <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>
              ✓ {totalFiles} files indexed · {totalQueries} queries executed this session
            </div>
          )}
        </div>

        {/* Right side terminal decoration */}
        <div style={{ position: 'absolute', right: 48, top: '50%', transform: 'translateY(-50%)', fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text3)', lineHeight: 2, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {['> analyzing text corpus...', '> building inverted index...', '> computing BM25 scores...', '> sentiment: POSITIVE', '> readability: EASY', '> index terms: ready'].map((line, i) => (
            <div key={i} style={{ animation: `fadeUp 0.4s ease ${i * 0.1}s both`, color: i === 5 ? 'var(--accent)' : i === 4 ? 'var(--accent2)' : 'var(--text3)' }}>
              {line}
              {i === 5 && <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Demo stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {DEMO_STATS.map((s, i) => (
          <div key={i} className="metric-card" style={{ textAlign: 'center', animationDelay: `${i * 0.05}s` }}>
            <div className="metric-value" style={{ fontSize: 36 }}>{s.value}</div>
            <div className="metric-label" style={{ justifyContent: 'center', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features grid */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>Core Capabilities</h2>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div className="grid-3" style={{ gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card card-hover" style={{ padding: '18px 20px', animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: f.color + '18', border: `1px solid ${f.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: f.color, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{f.title}</div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Get Started</div>
            <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>Upload a .txt file to begin analysis. No account needed — all data stays in your session.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['overview', 'search', 'analytics', 'settings'].map(s => (
              <button key={s} className="btn btn-ghost btn-sm" onClick={() => navigate(s)} style={{ textTransform: 'capitalize' }}>
                {s === 'overview' ? '◈' : s === 'search' ? '⌕' : s === 'analytics' ? '◉' : '⚙'} {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
