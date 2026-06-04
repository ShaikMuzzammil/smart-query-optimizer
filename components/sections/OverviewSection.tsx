'use client';
// components/sections/OverviewSection.tsx
import React, { useEffect, useRef, useMemo } from 'react';
import { useApp, useMetrics } from '../../lib/AppContext';
import { formatBytes } from '../../lib/analyzer';

function MiniBarChart({ data, label, color = 'var(--accent)' }: { data: { label: string; value: number }[]; label: string; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...data.map(d => d.value), 1);
    const barW = Math.max(4, (W / data.length) - 3);
    data.forEach((d, i) => {
      const x = i * (W / data.length) + (W / data.length - barW) / 2;
      const h = Math.max(2, (d.value / max) * (H - 24));
      const y = H - h - 20;
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, 3);
      ctx.fill();
      if (data.length <= 10) {
        ctx.fillStyle = 'rgba(120,160,200,0.7)';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(d.label.slice(0, 6), x + barW / 2, H - 6);
      }
    });
  }, [data, color]);
  return (
    <div style={{ position: 'relative', width: '100%', height: 80 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {data.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>
          No data
        </div>
      )}
    </div>
  );
}

function DonutChart({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);
    const total = positive + negative + neutral || 1;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 8, inner = r * 0.58;
    const segments = [
      { value: positive, color: '#00ff9d' },
      { value: negative, color: '#ff4455' },
      { value: neutral, color: '#3a5070' },
    ];
    let angle = -Math.PI / 2;
    segments.forEach(seg => {
      if (seg.value === 0) return;
      const sweep = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      angle += sweep;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#071020';
    ctx.fill();
    ctx.fillStyle = '#00ff9d';
    ctx.font = `bold 13px Syne, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const pct = Math.round((positive / total) * 100);
    ctx.fillText(pct + '%', cx, cy - 6);
    ctx.fillStyle = '#7a9fc0';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText('POS', cx, cy + 8);
  }, [positive, negative, neutral]);
  return <canvas ref={canvasRef} style={{ width: '100%', height: 110 }} />;
}

export default function OverviewSection() {
  const { state, navigate } = useApp();
  const { files, searchHistory, totalQueries } = state;
  const { totalFiles, totalWords, totalLines, totalChars, highImpactIssues, indexTerms } = useMetrics();

  const recentSearches = searchHistory.slice(0, 6);

  const globalTopWords = useMemo(() => {
    const map = new Map<string, number>();
    files.forEach(f => f.analysis.topWords.forEach(w => map.set(w.word, (map.get(w.word) || 0) + w.count)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([word, count]) => ({ label: word, value: count }));
  }, [files]);

  const issuesByFile = useMemo(() =>
    files.map(f => ({ label: f.name.replace('.txt', '').slice(0, 12), value: f.analysis.issues.reduce((s, i) => s + i.count, 0) })),
    [files]
  );

  const sentimentTotals = useMemo(() => {
    let pos = 0, neg = 0, neut = 0;
    files.forEach(f => {
      pos += f.analysis.sentiment.positiveCount;
      neg += f.analysis.sentiment.negativeCount;
      const total = f.analysis.wordCount;
      neut += Math.max(0, total - f.analysis.sentiment.positiveCount - f.analysis.sentiment.negativeCount);
    });
    return { pos: Math.round(pos), neg: Math.round(neg), neut: Math.round(neut) };
  }, [files]);

  const avgReadability = useMemo(() => {
    if (files.length === 0) return 0;
    return Math.round(files.reduce((s, f) => s + f.analysis.readability.score, 0) / files.length);
  }, [files]);

  const METRIC_CARDS = [
    { label: 'Total Queries', value: totalQueries, icon: '⌕', sub: `${recentSearches.length} recent`, color: 'var(--accent)' },
    { label: 'Files Indexed', value: totalFiles, icon: '▦', sub: `${formatBytes(files.reduce((s, f) => s + f.size, 0))} total`, color: 'var(--accent2)' },
    { label: 'High-Impact Issues', value: highImpactIssues, icon: '⚠', sub: 'critical + high severity', color: highImpactIssues > 0 ? 'var(--danger)' : 'var(--accent)' },
    { label: 'Index Terms', value: indexTerms, icon: '◈', sub: 'unique content tokens', color: 'var(--accent3)' },
    { label: 'Total Words', value: totalWords.toLocaleString(), icon: '▤', sub: `${totalLines.toLocaleString()} lines`, color: 'var(--accent4)' },
    { label: 'Avg Readability', value: avgReadability > 0 ? avgReadability + '%' : '—', icon: '✦', sub: avgReadability >= 60 ? 'Easy to read' : avgReadability >= 40 ? 'Moderate' : files.length > 0 ? 'Complex' : 'No files', color: 'var(--accent2)' },
  ];

  if (files.length === 0) {
    return (
      <div>
        <div className="section-header">
          <div>
            <div className="section-title"><span className="section-icon">◈</span> Dashboard Overview</div>
            <div className="section-subtitle">Real-time metrics update instantly as you upload and search</div>
          </div>
        </div>
        <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r3)', background: 'var(--card)' }}>
          <div className="empty-icon">◈</div>
          <div className="empty-title">No Files Indexed Yet</div>
          <div className="empty-desc">Upload your first .txt file to see live metrics, analytics, and detailed analysis across all sections.</div>
          <button className="btn btn-primary" onClick={() => navigate('upload')}>
            <span>↑</span> Upload First File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title"><span className="section-icon">◈</span> Dashboard Overview</div>
          <div className="section-subtitle">Live metrics — updates instantly as you upload files and run searches</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('upload')}><span>↑</span> Upload</button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('analytics')}><span>◉</span> Analytics</button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {METRIC_CARDS.map((m, i) => (
          <div key={i} className="metric-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ background: `linear-gradient(135deg, ${m.color}, var(--accent2))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
            </div>
            <div className="metric-sub">{m.sub}</div>
            <div className="metric-icon">{m.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Top Words Chart */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">▤ Top Index Terms</div>
            <span className="badge badge-info">{globalTopWords.length} terms</span>
          </div>
          <div className="panel-body">
            {globalTopWords.length > 0 ? (
              <>
                <MiniBarChart data={globalTopWords} label="Top Words" color="var(--accent)" />
                <div style={{ marginTop: 10 }}>
                  {globalTopWords.slice(0, 6).map((w, i) => (
                    <div key={i} className="word-bar-wrap">
                      <div className="word-bar-label">{w.label}</div>
                      <div className="word-bar-track">
                        <div className="word-bar-fill" style={{ width: `${(w.value / globalTopWords[0].value) * 100}%` }} />
                      </div>
                      <div className="word-bar-count">{w.value}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)', fontSize: 12 }}>No word data yet</div>
            )}
          </div>
        </div>

        {/* Issues + Sentiment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <div className="panel-title">⚠ Issues by File</div>
              <span className="badge badge-danger">{highImpactIssues} critical+high</span>
            </div>
            <div className="panel-body">
              {issuesByFile.length > 0 ? (
                <MiniBarChart data={issuesByFile} label="Issues" color="var(--danger)" />
              ) : (
                <div style={{ textAlign: 'center', padding: 16, color: 'var(--text3)', fontSize: 12 }}>No issues detected</div>
              )}
            </div>
          </div>

          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <div className="panel-title">✦ Sentiment Distribution</div>
              <span className="badge badge-success">{sentimentTotals.pos} positive</span>
            </div>
            <div className="panel-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 110, flexShrink: 0 }}>
                <DonutChart positive={sentimentTotals.pos} negative={sentimentTotals.neg} neutral={sentimentTotals.neut} />
              </div>
              <div style={{ flex: 1 }}>
                {[
                  { label: 'Positive', count: sentimentTotals.pos, color: 'var(--accent)' },
                  { label: 'Negative', count: sentimentTotals.neg, color: 'var(--danger)' },
                  { label: 'Neutral', count: sentimentTotals.neut, color: 'var(--text3)' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: s.color, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{s.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Files summary + Recent searches */}
      <div className="grid-2">
        {/* Files summary */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">▦ Indexed Files</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('files')} style={{ fontSize: 11 }}>View All →</button>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(0,255,157,0.04)' }}>
                  {['File', 'Words', 'Issues', 'Sentiment'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {files.slice(0, 6).map((f, i) => (
                  <tr key={f.id} style={{ borderBottom: i < files.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>{f.name}</td>
                    <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>{f.analysis.wordCount.toLocaleString()}</td>
                    <td style={{ padding: '9px 14px' }}>
                      <span className={`badge ${f.analysis.issues.length > 0 ? 'badge-danger' : 'badge-neutral'}`}>
                        {f.analysis.issues.reduce((s, i) => s + i.count, 0)}
                      </span>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <span style={{ fontSize: 11, color: f.analysis.sentiment.score >= 15 ? 'var(--accent)' : f.analysis.sentiment.score <= -15 ? 'var(--danger)' : 'var(--text2)', fontFamily: 'JetBrains Mono' }}>
                        {f.analysis.sentiment.label.split(' ').map(w => w[0]).join('')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {files.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No files indexed</div>
            )}
          </div>
        </div>

        {/* Recent Searches */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">⌕ Recent Searches</div>
            <span className="badge badge-info">{totalQueries} total</span>
          </div>
          <div className="panel-body">
            {recentSearches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)', fontSize: 12 }}>
                <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }}>⌕</div>
                No searches yet
              </div>
            ) : (
              recentSearches.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < recentSearches.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>⌕</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text)', fontFamily: 'JetBrains Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{s.query}"</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{s.resultCount} result{s.resultCount !== 1 ? 's' : ''} · {s.filesSearched} file{s.filesSearched !== 1 ? 's' : ''}</div>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: 10 }}>{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))
            )}
            {recentSearches.length > 0 && (
              <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 10 }} onClick={() => navigate('search')}>
                Go to Search →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
