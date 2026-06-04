'use client';
// components/sections/AnalyticsSection.tsx
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useApp } from '../../lib/AppContext';
import type { FileData } from '../../lib/types';

// ─── Chart primitives ───────────────────────────────────────────────────────

function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: any[]) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx, canvas.width, canvas.height);
    });
    observer.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx, canvas.width, canvas.height);
    return () => observer.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

function VBarChart({ data, colors, height = 180 }: { data: { label: string; value: number }[]; colors?: string[]; height?: number }) {
  const defaultColors = ['#00ff9d', '#00c8ff', '#a78bfa', '#f59e0b', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'];
  const cs = colors || defaultColors;
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    if (data.length === 0) return;
    const pad = { l: 8, r: 8, t: 16, b: 36 };
    const max = Math.max(...data.map(d => d.value), 1);
    const bw = Math.max(6, (W - pad.l - pad.r) / data.length - 4);
    const totalW = data.length * (bw + 4);
    const startX = pad.l + Math.max(0, (W - pad.l - pad.r - totalW) / 2);
    data.forEach((d, i) => {
      const x = startX + i * (bw + 4);
      const barH = Math.max(2, ((d.value / max) * (H - pad.t - pad.b)));
      const y = H - pad.b - barH;
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      const col = cs[i % cs.length];
      grad.addColorStop(0, col);
      grad.addColorStop(1, col + '44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, barH, [3, 3, 0, 0]);
      else ctx.rect(x, y, bw, barH);
      ctx.fill();
      // Value label
      ctx.fillStyle = col;
      ctx.font = `bold 10px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(d.value > 999 ? (d.value / 1000).toFixed(1) + 'k' : String(d.value), x + bw / 2, Math.max(y - 4, pad.t + 10));
      // X label
      ctx.fillStyle = 'rgba(120,160,200,0.7)';
      ctx.font = '9px JetBrains Mono, monospace';
      const lbl = d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label;
      ctx.fillText(lbl, x + bw / 2, H - pad.b + 14);
    });
  }, [data, cs, height]);
  return <canvas ref={ref} style={{ width: '100%', height }} />;
}

function HBarChart({ data, color = '#00ff9d', height = 180 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    if (data.length === 0) return;
    const max = Math.max(...data.map(d => d.value), 1);
    const rowH = H / data.length;
    const barH = Math.max(4, rowH * 0.5);
    const labelW = 100;
    const pad = 12;
    data.forEach((d, i) => {
      const y = i * rowH + (rowH - barH) / 2;
      const barW = Math.max(4, ((d.value / max) * (W - labelW - pad - 50)));
      // Label
      ctx.fillStyle = 'rgba(120,160,200,0.8)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      const lbl = d.label.length > 12 ? d.label.slice(0, 11) + '…' : d.label;
      ctx.fillText(lbl, labelW, y + barH / 2 + 3);
      // Bar
      const grad = ctx.createLinearGradient(labelW + pad, 0, labelW + pad + barW, 0);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '66');
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(labelW + pad, y, barW, barH, 3);
      else ctx.rect(labelW + pad, y, barW, barH);
      ctx.fill();
      // Value
      ctx.fillStyle = color;
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(String(d.value), labelW + pad + barW + 6, y + barH / 2 + 3);
    });
  }, [data, color, height]);
  return <canvas ref={ref} style={{ width: '100%', height }} />;
}

function DonutChart({ segments, height = 180 }: { segments: { label: string; value: number; color: string }[]; height?: number }) {
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const total = segments.reduce((s, d) => s + d.value, 0);
    if (total === 0) return;
    const cx = W * 0.38, cy = H / 2, r = Math.min(cx, cy) - 8, inner = r * 0.55;
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
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#071020'; ctx.fill();
    ctx.fillStyle = '#d8e8ff';
    ctx.font = `bold 15px Syne, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(segments[0] ? Math.round((segments[0].value / total) * 100) + '%' : '', cx, cy - 8);
    ctx.fillStyle = '#7a9fc0'; ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(segments[0]?.label || '', cx, cy + 8);
    // Legend
    const lx = W * 0.68, ly = cy - (segments.length * 18) / 2;
    segments.forEach((seg, i) => {
      ctx.fillStyle = seg.color;
      ctx.fillRect(lx, ly + i * 20, 10, 10);
      ctx.fillStyle = 'rgba(180,210,240,0.8)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
      ctx.fillText(`${seg.label} ${pct}%`, lx + 14, ly + i * 20);
    });
  }, [segments, height]);
  return <canvas ref={ref} style={{ width: '100%', height }} />;
}

function LineChart({ data, color = '#00ff9d', height = 140 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    if (data.length < 2) return;
    const pad = { l: 8, r: 8, t: 20, b: 24 };
    const max = Math.max(...data.map(d => d.value), 1);
    const points = data.map((d, i) => ({
      x: pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r),
      y: pad.t + (1 - d.value / max) * (H - pad.t - pad.b),
    }));
    // Fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, H - pad.b);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, H - pad.b);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.t, 0, H - pad.b);
    grad.addColorStop(0, color + '44'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.fill();
    // Line
    ctx.beginPath();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    // Dots
    points.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
    });
  }, [data, color, height]);
  return <canvas ref={ref} style={{ width: '100%', height }} />;
}

// ─── Main Component ──────────────────────────────────────────────────────────

type ChartTab = 'words' | 'files' | 'issues' | 'readability' | 'sentiment' | 'searches' | 'density' | 'severity';

export default function AnalyticsSection() {
  const { state, navigate } = useApp();
  const { files, searchHistory } = state;
  const [activeTab, setActiveTab] = useState<ChartTab>('words');

  const globalTopWords = useMemo(() => {
    const map = new Map<string, number>();
    files.forEach(f => f.analysis.topWords.forEach(w => map.set(w.word, (map.get(w.word) || 0) + w.count)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([label, value]) => ({ label, value }));
  }, [files]);

  const fileWordCounts = useMemo(() => files.map(f => ({ label: f.name.replace('.txt', '').slice(0, 14), value: f.analysis.wordCount })), [files]);
  const fileIssueCounts = useMemo(() => files.map(f => ({ label: f.name.replace('.txt', '').slice(0, 14), value: f.analysis.issues.reduce((s, i) => s + i.count, 0) })).sort((a, b) => b.value - a.value), [files]);
  const readabilityData = useMemo(() => files.map(f => ({ label: f.name.replace('.txt', '').slice(0, 10), value: f.analysis.readability.score })), [files]);
  const sentimentData = useMemo(() => files.map(f => ({ label: f.name.replace('.txt', '').slice(0, 10), value: f.analysis.sentiment.score + 100 })), [files]);
  const densityData = useMemo(() => files.map(f => ({ label: f.name.replace('.txt', '').slice(0, 10), value: f.analysis.lexicalDensity })), [files]);

  const issueSeverities = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    files.forEach(f => f.analysis.issues.forEach(i => { counts[i.severity] += i.count; }));
    return [
      { label: 'Critical', value: counts.critical, color: '#ff2244' },
      { label: 'High', value: counts.high, color: '#ff4455' },
      { label: 'Medium', value: counts.medium, color: '#ffd700' },
      { label: 'Low', value: counts.low, color: '#00c8ff' },
    ];
  }, [files]);

  const sentimentDistribution = useMemo(() => {
    let pos = 0, neg = 0, neu = 0;
    files.forEach(f => { pos += f.analysis.sentiment.positiveCount; neg += f.analysis.sentiment.negativeCount; neu += Math.max(0, f.analysis.wordCount - f.analysis.sentiment.positiveCount - f.analysis.sentiment.negativeCount); });
    return [
      { label: 'Positive', value: pos, color: '#00ff9d' },
      { label: 'Negative', value: neg, color: '#ff4455' },
      { label: 'Neutral', value: neu, color: '#3a5070' },
    ];
  }, [files]);

  const recentSearchTerms = useMemo(() => {
    const map = new Map<string, number>();
    searchHistory.forEach(s => map.set(s.query, (map.get(s.query) || 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }));
  }, [searchHistory]);

  const TABS: { id: ChartTab; label: string; icon: string }[] = [
    { id: 'words', label: 'Top Terms', icon: '▤' },
    { id: 'files', label: 'Word Count', icon: '▦' },
    { id: 'issues', label: 'Issues', icon: '⚠' },
    { id: 'severity', label: 'Severity', icon: '◉' },
    { id: 'readability', label: 'Readability', icon: '✦' },
    { id: 'sentiment', label: 'Sentiment', icon: '♦' },
    { id: 'density', label: 'Lexical', icon: '◈' },
    { id: 'searches', label: 'Searches', icon: '⌕' },
  ];

  const totalWords = files.reduce((s, f) => s + f.analysis.wordCount, 0);
  const avgReadability = files.length > 0 ? Math.round(files.reduce((s, f) => s + f.analysis.readability.score, 0) / files.length) : 0;
  const totalIssues = files.reduce((s, f) => s + f.analysis.issues.reduce((is, i) => is + i.count, 0), 0);

  if (files.length === 0) {
    return (
      <div>
        <div className="section-header">
          <div>
            <div className="section-title"><span className="section-icon">◉</span> Analytics</div>
            <div className="section-subtitle">Visual insights across all indexed files</div>
          </div>
        </div>
        <div className="empty-state card">
          <div className="empty-icon">◉</div>
          <div className="empty-title">No Data to Visualize</div>
          <div className="empty-desc">Upload files to see charts for word frequency, issues, readability, sentiment, and more.</div>
          <button className="btn btn-primary" onClick={() => navigate('upload')}><span>↑</span> Upload Files</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title"><span className="section-icon">◉</span> Analytics & Insights</div>
          <div className="section-subtitle">Canvas-rendered charts · auto-updates on file changes</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('upload')}><span>↑</span> Add More Files</button>
      </div>

      {/* Summary row */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Files Analyzed', value: files.length, color: 'var(--accent)' },
          { label: 'Total Words', value: totalWords.toLocaleString(), color: 'var(--accent2)' },
          { label: 'Total Issues', value: totalIssues, color: 'var(--danger)' },
          { label: 'Avg Readability', value: avgReadability + '/100', color: 'var(--accent3)' },
        ].map((s, i) => (
          <div key={i} className="metric-card" style={{ padding: '14px 18px' }}>
            <div className="metric-label">{s.label}</div>
            <div className="metric-value" style={{ fontSize: 26, background: `linear-gradient(135deg, ${s.color}, var(--accent2))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <div className="panel-title">{TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}</div>
          <span className="badge badge-neutral" style={{ fontSize: 10 }}>{files.length} files · {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="panel-body" style={{ padding: '16px 20px' }}>
          {activeTab === 'words' && (
            <>
              <HBarChart data={globalTopWords} color="var(--accent)" height={Math.max(180, globalTopWords.length * 28)} />
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {globalTopWords.slice(0, 9).map((w, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: 12, fontFamily: 'JetBrains Mono' }}>
                    <span style={{ color: 'var(--text2)' }}>#{i + 1} {w.label}</span>
                    <span style={{ color: 'var(--accent)' }}>{w.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {activeTab === 'files' && (
            <>
              <VBarChart data={fileWordCounts} height={200} />
              <div className="table-wrap" style={{ marginTop: 16 }}>
                <table><thead><tr><th>File</th><th>Words</th><th>Lines</th><th>Chars</th></tr></thead>
                  <tbody>{files.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{f.name}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>{f.analysis.wordCount.toLocaleString()}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent2)' }}>{f.analysis.lineCount.toLocaleString()}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--text2)' }}>{f.analysis.charCount.toLocaleString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}
          {activeTab === 'issues' && (
            <>
              <HBarChart data={fileIssueCounts} color="var(--danger)" height={Math.max(140, fileIssueCounts.length * 28)} />
              <div className="table-wrap" style={{ marginTop: 16 }}>
                <table><thead><tr><th>File</th><th>Total Issues</th><th>Critical</th><th>High</th><th>Medium</th><th>Low</th></tr></thead>
                  <tbody>{files.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}>{f.name}</td>
                      <td><span className={`badge ${f.analysis.issues.reduce((s, i) => s + i.count, 0) > 0 ? 'badge-danger' : 'badge-success'}`}>{f.analysis.issues.reduce((s, i) => s + i.count, 0)}</span></td>
                      {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
                        <td key={sev} style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: sev === 'critical' || sev === 'high' ? 'var(--danger)' : sev === 'medium' ? 'var(--warning)' : 'var(--accent2)' }}>
                          {f.analysis.issues.filter(i => i.severity === sev).reduce((s, i) => s + i.count, 0)}
                        </td>
                      ))}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}
          {activeTab === 'severity' && (
            <div className="grid-2" style={{ gap: 24 }}>
              <div>
                <DonutChart segments={issueSeverities} height={220} />
              </div>
              <div>
                {issueSeverities.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, textTransform: 'capitalize' }}>{s.label}</div>
                      <div className="progress-wrap" style={{ marginTop: 4, height: 3 }}>
                        <div className="progress-bar" style={{ width: `${issueSeverities.reduce((a, b) => a + b.value, 0) > 0 ? (s.value / issueSeverities.reduce((a, b) => a + b.value, 0)) * 100 : 0}%`, background: s.color }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontFamily: 'Syne', fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'readability' && (
            <>
              <VBarChart data={readabilityData} colors={readabilityData.map(d => d.value >= 60 ? '#00ff9d' : d.value >= 40 ? '#f59e0b' : '#ff4455')} height={200} />
              <div className="table-wrap" style={{ marginTop: 16 }}>
                <table><thead><tr><th>File</th><th>Score</th><th>Level</th><th>Words/Sentence</th><th>Chars/Word</th></tr></thead>
                  <tbody>{files.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}>{f.name}</td>
                      <td><span className={`badge ${f.analysis.readability.score >= 60 ? 'badge-success' : f.analysis.readability.score >= 40 ? 'badge-warning' : 'badge-danger'}`}>{f.analysis.readability.score}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>{f.analysis.readability.level}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--accent2)' }}>{f.analysis.readability.avgWordsPerSentence}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--accent3)' }}>{f.analysis.readability.avgCharsPerWord}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}
          {activeTab === 'sentiment' && (
            <div className="grid-2" style={{ gap: 24 }}>
              <div>
                <DonutChart segments={sentimentDistribution} height={220} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 10, textTransform: 'uppercase' }}>PER FILE SENTIMENT</div>
                {files.map(f => (
                  <div key={f.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontFamily: 'JetBrains Mono' }}>
                      <span style={{ color: 'var(--text2)' }}>{f.name.slice(0, 20)}</span>
                      <span style={{ color: f.analysis.sentiment.score >= 15 ? 'var(--accent)' : f.analysis.sentiment.score <= -15 ? 'var(--danger)' : 'var(--text3)' }}>
                        {f.analysis.sentiment.score > 0 ? '+' : ''}{f.analysis.sentiment.score}
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex' }}>
                      <div style={{ width: `${f.analysis.sentiment.positiveCount / Math.max(f.analysis.sentiment.positiveCount + f.analysis.sentiment.negativeCount, 1) * 100}%`, background: 'var(--accent)', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'density' && (
            <>
              <VBarChart data={densityData} colors={densityData.map(d => d.value >= 60 ? '#a78bfa' : d.value >= 40 ? '#00c8ff' : '#00ff9d')} height={200} />
              <div className="table-wrap" style={{ marginTop: 16 }}>
                <table><thead><tr><th>File</th><th>Lexical Density</th><th>Unique Words</th><th>Total Words</th><th>Bigrams</th></tr></thead>
                  <tbody>{files.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}>{f.name}</td>
                      <td><span className="badge badge-purple">{f.analysis.lexicalDensity}%</span></td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)', fontSize: 12 }}>{f.analysis.uniqueWordCount.toLocaleString()}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--text2)', fontSize: 12 }}>{f.analysis.wordCount.toLocaleString()}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent3)', fontSize: 12 }}>{f.analysis.topBigrams.length}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}
          {activeTab === 'searches' && (
            <>
              {recentSearchTerms.length > 0 ? (
                <>
                  <HBarChart data={recentSearchTerms} color="var(--accent3)" height={Math.max(140, recentSearchTerms.length * 28)} />
                  <div className="table-wrap" style={{ marginTop: 16 }}>
                    <table><thead><tr><th>Query</th><th>Times</th><th>Results</th><th>Time</th></tr></thead>
                      <tbody>{searchHistory.slice(0, 15).map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>"{s.query}"</td>
                          <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent3)', fontSize: 12 }}>—</td>
                          <td><span className={`badge ${s.resultCount > 0 ? 'badge-success' : 'badge-neutral'}`}>{s.resultCount}</span></td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)' }}>{new Date(s.timestamp).toLocaleTimeString()}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon" style={{ fontSize: 32 }}>⌕</div>
                  <div className="empty-desc">No search history yet — run some searches to see analytics.</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Global bigrams table */}
      {files.some(f => f.analysis.topBigrams.length > 0) && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">◈ Global Bigrams</div>
          </div>
          <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(() => {
              const map = new Map<string, number>();
              files.forEach(f => f.analysis.topBigrams.forEach(b => map.set(b.phrase, (map.get(b.phrase) || 0) + b.count)));
              return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([phrase, count], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: 12, fontFamily: 'JetBrains Mono', border: '1px solid rgba(167,139,250,0.1)' }}>
                  <span style={{ color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{phrase}"</span>
                  <span style={{ color: 'var(--accent3)', marginLeft: 8, flexShrink: 0 }}>{count}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
