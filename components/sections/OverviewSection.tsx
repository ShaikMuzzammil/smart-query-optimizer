'use client';

import { useApp } from '@/lib/store';
import {
  Search, FileText, AlertTriangle, Database, TrendingUp,
  Upload, Activity, Clock, BarChart2, BookOpen
} from 'lucide-react';

function MetricCard({
  title, value, sub, icon: Icon, color, trend, onClick,
}: {
  title: string; value: string | number; sub?: string; icon: React.ElementType;
  color: string; trend?: string; onClick?: () => void;
}) {
  return (
    <div
      className={`metric-card ${color} cursor-pointer`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${colorMap[color]}20`, border: `1px solid ${colorMap[color]}30` }}>
          <Icon className="w-5 h-5" style={{ color: colorMap[color] }} />
        </div>
        {trend && (
          <span className="mono text-xs px-2 py-0.5 rounded"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', border: '1px solid rgba(16,185,129,0.2)' }}>
            {trend}
          </span>
        )}
      </div>
      <div className="stat-number mb-1" style={{ color: colorMap[color] }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{sub}</div>}
    </div>
  );
}

const colorMap: Record<string, string> = {
  amber: '#f59e0b', cyan: '#06b6d4', rose: '#f43f5e',
  emerald: '#10b981', violet: '#8b5cf6', orange: '#f97316',
};

export function OverviewSection() {
  const { state, navigateTo } = useApp();
  const { files, totalQueries, globalMetrics, searchHistory } = state;

  const totalWords = files.reduce((s, f) => s + f.stats.wordCount, 0);
  const totalLines = files.reduce((s, f) => s + f.stats.lineCount, 0);
  const avgReadability = files.length
    ? (files.reduce((s, f) => s + f.stats.readability.fleschKincaid, 0) / files.length).toFixed(1)
    : '—';

  const recentSearches = searchHistory.slice(0, 5);
  const topFiles = [...files].sort((a, b) => b.queryCount - a.queryCount).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="section-subtitle mb-1">Dashboard</div>
        <h1 className="section-title">Overview</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Real-time insights across all indexed files. All metrics update instantly.
        </p>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Queries" value={totalQueries} icon={Search} color="amber"
          sub="lifetime searches" trend={totalQueries > 0 ? 'LIVE' : undefined}
          onClick={() => navigateTo('search')} />
        <MetricCard title="Files Indexed" value={files.length} icon={FileText} color="cyan"
          sub="active in session" onClick={() => navigateTo('files')} />
        <MetricCard title="High-Impact Issues" value={globalMetrics.totalIssues} icon={AlertTriangle} color="rose"
          sub="errors, bugs, crashes" onClick={() => navigateTo('files')} />
        <MetricCard title="Index Terms" value={globalMetrics.indexTerms} icon={Database} color="emerald"
          sub="unique tokens" onClick={() => navigateTo('analytics')} />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Words" value={totalWords} icon={BookOpen} color="violet" sub="across all files" />
        <MetricCard title="Total Lines" value={totalLines} icon={Activity} color="orange" sub="line count sum" />
        <MetricCard title="Avg Readability" value={avgReadability} icon={TrendingUp} color="cyan"
          sub="Flesch-Kincaid score" />
        <MetricCard title="Search History" value={searchHistory.length} icon={Clock} color="amber"
          sub="queries logged" onClick={() => navigateTo('search')} />
      </div>

      {files.length === 0 ? (
        /* Empty state */
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Upload className="w-10 h-10" style={{ color: '#f59e0b', opacity: 0.6 }} />
          </div>
          <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            No files indexed yet
          </h3>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Upload .txt files to get real-time analysis. All metrics, charts, and search features activate automatically.
          </p>
          <button onClick={() => navigateTo('upload')} className="btn-primary">
            Upload Your First File
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Words preview */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Top Index Terms
              </h3>
              <button onClick={() => navigateTo('analytics')} className="btn-ghost text-xs">
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {globalMetrics.topGlobalWords.slice(0, 8).map((w, i) => {
                const max = globalMetrics.topGlobalWords[0]?.count || 1;
                const pct = (w.count / max) * 100;
                return (
                  <div key={w.word} className="flex items-center gap-3">
                    <span className="mono text-xs w-5 text-right flex-shrink-0"
                      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                      {i + 1}
                    </span>
                    <span className="mono text-xs w-28 truncate"
                      style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {w.word}
                    </span>
                    <div className="flex-1 progress-bar">
                      <div className="word-freq-bar" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="mono text-xs w-10 text-right flex-shrink-0"
                      style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                      {w.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Files summary */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                File Intelligence
              </h3>
              <button onClick={() => navigateTo('files')} className="btn-ghost text-xs">
                Manage →
              </button>
            </div>
            <div className="space-y-2">
              {files.slice(0, 6).map(file => (
                <div key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'rgba(13,21,32,0.6)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 flex-shrink-0"
                      style={{ color: file.stats.issues.length > 0 ? '#f43f5e' : '#06b6d4' }} />
                    <div className="min-w-0">
                      <div className="text-sm truncate" style={{ color: 'var(--text-primary)', maxWidth: '140px' }}>
                        {file.name}
                      </div>
                      <div className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
                        {file.stats.wordCount.toLocaleString()} words
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.stats.issues.length > 0 && (
                      <span className="badge badge-rose">{file.stats.issues.length} issues</span>
                    )}
                    <span className="badge badge-cyan">{file.stats.sentiment.overall}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  Recent Searches
                </h3>
                <button onClick={() => navigateTo('search')} className="btn-ghost text-xs">Search →</button>
              </div>
              <div className="space-y-2">
                {recentSearches.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{ background: 'rgba(13,21,32,0.5)', border: '1px solid rgba(30,58,95,0.3)' }}>
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <span className="mono text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        &ldquo;{h.query}&rdquo;
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-amber">{h.resultCount} hits</span>
                      <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                        {h.timestamp instanceof Date
                          ? h.timestamp.toLocaleTimeString()
                          : new Date(h.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issue distribution */}
          {files.some(f => f.stats.issues.length > 0) && (
            <div className="glass-card p-6">
              <h3 className="font-bold mb-5" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Issue Breakdown
              </h3>
              <div className="space-y-3">
                {(() => {
                  const kw: Record<string, number> = {};
                  files.forEach(f => f.stats.issues.forEach(issue => {
                    kw[issue.keyword] = (kw[issue.keyword] || 0) + 1;
                  }));
                  const sorted = Object.entries(kw).sort((a, b) => b[1] - a[1]).slice(0, 8);
                  const max = sorted[0]?.[1] || 1;
                  return sorted.map(([word, count]) => (
                    <div key={word} className="flex items-center gap-3">
                      <span className="mono text-xs w-20 truncate"
                        style={{ color: '#f43f5e', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                        {word}
                      </span>
                      <div className="flex-1 progress-bar">
                        <div className="progress-fill" style={{ width: `${(count/max)*100}%`, background: 'linear-gradient(90deg, #f43f5e, #f97316)' }} />
                      </div>
                      <span className="mono text-xs"
                        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', width: '24px', textAlign: 'right' }}>
                        {count}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
