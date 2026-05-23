'use client';

import { useApp } from '../../lib/store';
import {
  Search, Upload, BarChart2, Shield, Zap, Brain, FileText,
  ArrowRight, Database, Activity, Globe
} from 'lucide-react';

export function HomeSection() {
  const { navigateTo, state } = useApp();
  const { files, totalQueries, globalMetrics } = state;

  const features = [
    { icon: Brain, title: 'AI-Powered Analysis', desc: 'Readability scores, sentiment analysis, lexical density, and 15+ advanced metrics per document.', color: '#8b5cf6', badge: 'SMART' },
    { icon: Search, title: '20 Search Filters', desc: 'Exact match, regex, fuzzy, proximity, sentiment context, frequency analysis, and more.', color: '#06b6d4', badge: 'ADVANCED' },
    { icon: Shield, title: 'Issue Detection', desc: 'Automatically flags errors, exceptions, crashes, vulnerabilities, and 14+ critical keywords.', color: '#f43f5e', badge: 'SECURITY' },
    { icon: BarChart2, title: 'Live Analytics', desc: 'Real-time charts for term frequency, issue distribution, word count analysis, and sentiment.', color: '#10b981', badge: 'CHARTS' },
    { icon: Zap, title: 'Instant Indexing', desc: 'Inverted index built on upload. Search across all files simultaneously with relevance scoring.', color: '#f59e0b', badge: 'FAST' },
    { icon: Globe, title: 'Session Persistence', desc: 'Your files and search history survive page refreshes. Export your full session as JSON/CSV/TXT.', color: '#f97316', badge: 'PERSIST' },
  ];

  const stats = [
    { label: 'Search Filters', value: '20', color: '#f59e0b' },
    { label: 'Analysis Metrics', value: '15+', color: '#06b6d4' },
    { label: 'Issue Keywords', value: '20', color: '#f43f5e' },
    { label: 'Export Formats', value: '3', color: '#10b981' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar - minimal on landing */}
      <header className="flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: 'rgba(30,58,95,0.4)', backdropFilter: 'blur(12px)', background: 'rgba(8,12,20,0.8)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}>
            <Database className="w-4.5 h-4.5" style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <div className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: '#f59e0b', letterSpacing: '-0.01em' }}>
              SmartQuery
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
              OPTIMIZER v2.0
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {files.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs" style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                {files.length} file{files.length !== 1 ? 's' : ''} indexed
              </span>
            </div>
          )}
          <button onClick={() => navigateTo('overview')} className="btn-secondary">
            {files.length > 0 ? 'Dashboard →' : 'Get Started →'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        {/* Hero section */}
        <section className="relative px-8 py-24 overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
            <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full opacity-5"
              style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)' }} />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <Activity className="w-3 h-3" style={{ color: '#f59e0b' }} />
              <span className="text-xs font-semibold" style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                ADVANCED TEXT INTELLIGENCE PLATFORM
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-none"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
              <span style={{ color: 'var(--text-primary)' }}>Analyze.</span>{' '}
              <span style={{ color: '#f59e0b' }}>Search.</span>{' '}
              <span style={{ color: 'var(--text-primary)' }}>Understand.</span>
            </h1>

            <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              Upload text files and get instant deep analysis — readability scores, sentiment, issue detection, word frequency maps, and powerful 20-filter search. All in your browser.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigateTo('upload')} className="btn-primary flex items-center gap-2 text-sm px-8 py-3">
                <Upload className="w-4 h-4" />
                Upload Your First File
              </button>
              {files.length > 0 && (
                <button onClick={() => navigateTo('overview')} className="btn-secondary flex items-center gap-2 text-sm px-8 py-3">
                  <BarChart2 className="w-4 h-4" />
                  View Dashboard
                </button>
              )}
            </div>

            {/* Live stats if files exist */}
            {files.length > 0 && (
              <div className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto">
                {[
                  { label: 'Files Indexed', value: files.length, color: '#06b6d4' },
                  { label: 'Total Queries', value: totalQueries, color: '#f59e0b' },
                  { label: 'Issues Found', value: globalMetrics.totalIssues, color: '#f43f5e' },
                ].map(s => (
                  <div key={s.label} className="glass-card p-4 text-center">
                    <div className="mono text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-mono)' }}>
                      {s.value.toLocaleString()}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                      {s.label.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Platform stats */}
        <section className="px-8 py-8 border-y" style={{ borderColor: 'rgba(30,58,95,0.4)', background: 'rgba(13,21,32,0.5)' }}>
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="mono text-3xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                  {s.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features grid */}
        <section className="px-8 py-20 max-w-6xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Everything You Need
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Professional text analysis tools, all running locally in your browser — no backend required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="glass-card glass-card-hover p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}>
                      <Icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                          {f.title}
                        </span>
                        <span className="badge" style={{
                          background: `${f.color}15`, color: f.color,
                          border: `1px solid ${f.color}30`, fontSize: '0.55rem', padding: '0.15rem 0.5rem'
                        }}>
                          {f.badge}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="px-8 py-16 border-t" style={{ borderColor: 'rgba(30,58,95,0.4)', background: 'rgba(13,21,32,0.4)' }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Ready to analyze your files?
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
              Upload any .txt file and get a complete intelligence report in seconds. No signup. No limits. 100% private.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => navigateTo('upload')} className="btn-primary flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Start Analyzing
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigateTo('search')} className="btn-ghost flex items-center gap-2">
                <Search className="w-4 h-4" />
                Try Search
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-8 py-6 border-t" style={{ borderColor: 'rgba(30,58,95,0.3)' }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
              © 2025 SmartQuery Optimizer — All data processed locally
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="mono text-xs" style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                No data leaves your browser
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
