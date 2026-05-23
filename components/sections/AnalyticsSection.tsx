'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '../../lib/store';
import { BarChart2, Upload } from 'lucide-react';

// ─── Pure Canvas Bar Chart ────────────────────────────────────────────────────
interface BarChartProps {
  labels: string[];
  values: number[];
  color: string;
  title: string;
  horizontal?: boolean;
}

function BarChart({ labels, values, color, title, horizontal = false }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !labels.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    const max = Math.max(...values, 1);
    const PAD_LEFT = horizontal ? 90 : 36;
    const PAD_RIGHT = 16;
    const PAD_TOP = 16;
    const PAD_BOTTOM = horizontal ? 24 : 52;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = H - PAD_TOP - PAD_BOTTOM;

    // Grid lines
    ctx.strokeStyle = 'rgba(30,58,95,0.5)';
    ctx.lineWidth = 1;
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      if (horizontal) {
        const x = PAD_LEFT + (chartW / gridCount) * i;
        ctx.beginPath(); ctx.moveTo(x, PAD_TOP); ctx.lineTo(x, PAD_TOP + chartH); ctx.stroke();
        ctx.fillStyle = 'rgba(71,85,105,0.8)';
        ctx.font = `${9 * dpr / dpr}px "Space Mono", monospace`;
        ctx.textAlign = 'center';
        const val = Math.round((max / gridCount) * i);
        ctx.fillText(String(val), x, PAD_TOP + chartH + 14);
      } else {
        const y = PAD_TOP + chartH - (chartH / gridCount) * i;
        ctx.beginPath(); ctx.moveTo(PAD_LEFT, y); ctx.lineTo(PAD_LEFT + chartW, y); ctx.stroke();
        ctx.fillStyle = 'rgba(71,85,105,0.8)';
        ctx.font = `9px "Space Mono", monospace`;
        ctx.textAlign = 'right';
        ctx.fillText(String(Math.round((max / gridCount) * i)), PAD_LEFT - 6, y + 3);
      }
    }

    // Bars
    const n = labels.length;
    if (horizontal) {
      const barH = Math.min(22, (chartH / n) - 6);
      const gap = chartH / n;
      labels.forEach((label, i) => {
        const barW = (values[i] / max) * chartW;
        const y = PAD_TOP + i * gap + (gap - barH) / 2;

        // Gradient bar
        const grad = ctx.createLinearGradient(PAD_LEFT, 0, PAD_LEFT + barW, 0);
        grad.addColorStop(0, color + 'ee');
        grad.addColorStop(1, color + '55');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(PAD_LEFT, y, Math.max(barW, 2), barH, 3);
        ctx.fill();

        // Label
        ctx.fillStyle = 'rgba(148,163,184,0.9)';
        ctx.font = `9px "Space Mono", monospace`;
        ctx.textAlign = 'right';
        const truncated = label.length > 11 ? label.slice(0, 11) + '…' : label;
        ctx.fillText(truncated, PAD_LEFT - 6, y + barH / 2 + 3);

        // Value
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.fillText(String(values[i]), PAD_LEFT + barW + 5, y + barH / 2 + 3);
      });
    } else {
      const barW = Math.min(36, (chartW / n) - 4);
      const gap = chartW / n;
      labels.forEach((label, i) => {
        const barH = (values[i] / max) * chartH;
        const x = PAD_LEFT + i * gap + (gap - barW) / 2;
        const y = PAD_TOP + chartH - barH;

        const grad = ctx.createLinearGradient(0, y, 0, PAD_TOP + chartH);
        grad.addColorStop(0, color + 'ee');
        grad.addColorStop(1, color + '33');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, Math.max(barH, 2), 3);
        ctx.fill();

        // X label (rotated)
        ctx.save();
        ctx.translate(x + barW / 2, PAD_TOP + chartH + 8);
        ctx.rotate(-Math.PI / 4);
        ctx.fillStyle = 'rgba(148,163,184,0.9)';
        ctx.font = `8px "Space Mono", monospace`;
        ctx.textAlign = 'right';
        const truncated = label.length > 10 ? label.slice(0, 10) + '…' : label;
        ctx.fillText(truncated, 0, 0);
        ctx.restore();

        // Value on top
        if (barH > 16) {
          ctx.fillStyle = color;
          ctx.font = `8px "Space Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(String(values[i]), x + barW / 2, y - 4);
        }
      });
    }
  }, [labels, values, color, horizontal]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '220px', display: 'block' }}
    />
  );
}

// ─── Pure Canvas Donut Chart ──────────────────────────────────────────────────
const DONUT_COLORS = ['#f59e0b','#06b6d4','#10b981','#f43f5e','#8b5cf6','#f97316','#84cc16','#ec4899'];

function DonutChart({ labels, values }: { labels: string[]; values: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !labels.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const total = values.reduce((a, b) => a + b, 0) || 1;
    // Chart takes left 55%, legend takes right 45%
    const chartAreaW = W * 0.52;
    const cx = chartAreaW / 2;
    const cy = H / 2;
    const outerR = Math.min(cx, cy) - 8;
    const innerR = outerR * 0.62;

    let startAngle = -Math.PI / 2;
    values.forEach((val, i) => {
      const sweep = (val / total) * 2 * Math.PI;
      const color = DONUT_COLORS[i % DONUT_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep);
      ctx.closePath();
      ctx.fillStyle = color + 'cc';
      ctx.fill();
      ctx.strokeStyle = '#0d1520';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sweep;
    });

    // Inner hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = '#0d1520';
    ctx.fill();

    // Center text
    const nonZero = values.filter(v => v > 0).length;
    ctx.fillStyle = 'rgba(226,232,240,0.9)';
    ctx.font = `bold 18px "Space Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(String(nonZero), cx, cy + 3);
    ctx.font = `8px "Space Mono", monospace`;
    ctx.fillStyle = 'rgba(71,85,105,0.9)';
    ctx.fillText('types', cx, cy + 16);

    // Legend (right side)
    const legendX = chartAreaW + 12;
    const itemH = 20;
    const startY = H / 2 - (labels.length * itemH) / 2;
    labels.forEach((label, i) => {
      const color = DONUT_COLORS[i % DONUT_COLORS.length];
      const y = startY + i * itemH;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(legendX, y + 4, 10, 10, 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(148,163,184,0.9)';
      ctx.font = `8.5px "Space Mono", monospace`;
      ctx.textAlign = 'left';
      const pct = total > 0 ? Math.round((values[i] / total) * 100) : 0;
      const truncated = label.length > 14 ? label.slice(0, 14) + '…' : label;
      ctx.fillText(`${truncated} (${pct}%)`, legendX + 14, y + 13);
    });
  }, [labels, values]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '200px', display: 'block' }}
    />
  );
}

// ─── Mini horizontal bar (word frequency) ────────────────────────────────────
function WordFreqTable({ words }: { words: { word: string; count: number }[] }) {
  const max = words[0]?.count || 1;
  return (
    <div className="space-y-2">
      {words.map((w, i) => (
        <div key={w.word} className="flex items-center gap-2">
          <span className="mono text-xs w-5 text-right flex-shrink-0"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
            {i + 1}
          </span>
          <span className="mono text-xs w-24 truncate flex-shrink-0"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
            {w.word}
          </span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(30,58,95,0.4)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${(w.count / max) * 100}%`, background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
          </div>
          <span className="mono text-xs w-10 text-right flex-shrink-0"
            style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            {w.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export function AnalyticsSection() {
  const { state, navigateTo } = useApp();
  const { files, globalMetrics, totalQueries, searchHistory } = state;

  if (files.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <div className="section-subtitle mb-1">Insights & Charts</div>
          <h1 className="section-title">Analytics</h1>
        </div>
        <div className="glass-card p-16 text-center">
          <BarChart2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <h3 className="text-xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            No data to visualize
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Upload files to generate charts and insights.
          </p>
          <button onClick={() => navigateTo('upload')} className="btn-primary">
            Upload Files
          </button>
        </div>
      </div>
    );
  }

  // ── Data preparation ──────────────────────────────────────────────────────
  const topWords = globalMetrics.topGlobalWords.slice(0, 12);

  const filesWithIssues = files.filter(f => f.stats.issues.length > 0);
  const issueLabels = filesWithIssues.map(f => f.name.replace('.txt', '').slice(0, 16));
  const issueValues = filesWithIssues.map(f => f.stats.issues.length);

  const fileLabels = files.map(f => f.name.replace('.txt', '').slice(0, 14));
  const wordCounts = files.map(f => f.stats.wordCount);

  const sentimentCounts = [
    files.filter(f => f.stats.sentiment.overall === 'positive').length,
    files.filter(f => f.stats.sentiment.overall === 'neutral').length,
    files.filter(f => f.stats.sentiment.overall === 'negative').length,
  ];

  const kwBreakdown: Record<string, number> = {};
  files.forEach(f => f.stats.issues.forEach(i => {
    kwBreakdown[i.keyword] = (kwBreakdown[i.keyword] || 0) + 1;
  }));
  const kwSorted = Object.entries(kwBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const readBuckets = [0, 0, 0, 0];
  files.forEach(f => {
    const s = f.stats.readability.fleschKincaid;
    if (s >= 90) readBuckets[0]++;
    else if (s >= 70) readBuckets[1]++;
    else if (s >= 50) readBuckets[2]++;
    else readBuckets[3]++;
  });

  const lexLabels = files.map(f => f.name.replace('.txt', '').slice(0, 14));
  const lexValues = files.map(f => parseFloat(f.stats.lexicalDensity.toFixed(1)));

  const queryFreq: Record<string, number> = {};
  searchHistory.forEach(h => { queryFreq[h.query] = (queryFreq[h.query] || 0) + 1; });
  const topQueries = Object.entries(queryFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const totalWords = files.reduce((s, f) => s + f.stats.wordCount, 0);
  const avgReadability = files.reduce((s, f) => s + f.stats.readability.fleschKincaid, 0) / files.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="section-subtitle mb-1">Insights & Charts</div>
        <h1 className="section-title">Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Visual intelligence across {files.length} file{files.length !== 1 ? 's' : ''}. Updates automatically on upload or delete.
        </p>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Words', val: totalWords.toLocaleString(), c: '#06b6d4' },
          { label: 'Index Terms', val: globalMetrics.indexTerms.toLocaleString(), c: '#10b981' },
          { label: 'Total Issues', val: globalMetrics.totalIssues, c: '#f43f5e' },
          { label: 'Avg Readability', val: avgReadability.toFixed(1), c: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="metric-card amber text-center">
            <div className="mono text-2xl font-bold mb-1"
              style={{ color: s.c, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Top 12 terms — word freq table (guaranteed pixel-perfect) */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Top 12 Index Terms
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Most frequent words across all files
          </p>
          <WordFreqTable words={topWords} />
        </div>

        {/* Word count per file */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Word Count by File
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Total words per indexed document
          </p>
          <BarChart labels={fileLabels} values={wordCounts} color="#06b6d4" title="Words" />
        </div>

        {/* Issues per file */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Issues per File
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            High-impact keyword occurrences by document
          </p>
          {issueLabels.length > 0 ? (
            <BarChart labels={issueLabels} values={issueValues} color="#f43f5e" title="Issues" />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span>
              </div>
              <p className="text-sm" style={{ color: '#10b981' }}>No issues detected in any file</p>
            </div>
          )}
        </div>

        {/* Sentiment distribution */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Sentiment Distribution
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Positive / neutral / negative breakdown across files
          </p>
          {sentimentCounts.some(v => v > 0) ? (
            <DonutChart
              labels={['Positive', 'Neutral', 'Negative']}
              values={sentimentCounts}
            />
          ) : (
            <div className="h-48 flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}>No data</div>
          )}
        </div>

        {/* Lexical density */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Lexical Density (%)
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Unique words ÷ total words — higher = more varied vocabulary
          </p>
          <BarChart labels={lexLabels} values={lexValues} color="#8b5cf6" title="Density %" />
        </div>

        {/* Issue keyword breakdown */}
        {kwSorted.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-bold mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Issue Keyword Frequency
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Which critical keywords appear most across all files
            </p>
            <BarChart
              labels={kwSorted.map(([k]) => k)}
              values={kwSorted.map(([, v]) => v)}
              color="#f97316"
              title="Count"
              horizontal
            />
          </div>
        )}

        {/* Readability distribution */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Readability Distribution
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Flesch-Kincaid score buckets across all documents
          </p>
          <DonutChart
            labels={['Very Easy (90+)', 'Easy (70–90)', 'Standard (50–70)', 'Difficult (<50)']}
            values={readBuckets}
          />
        </div>

        {/* Top search queries */}
        {topQueries.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-bold mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Top Search Queries
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Most frequently repeated search terms this session
            </p>
            <BarChart
              labels={topQueries.map(([q]) => q.slice(0, 14))}
              values={topQueries.map(([, c]) => c)}
              color="#10b981"
              title="Times searched"
              horizontal
            />
          </div>
        )}

        {/* Per-file readability detail */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Readability Score by File
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Flesch-Kincaid score per document (0 = very hard, 100 = very easy)
          </p>
          <BarChart
            labels={fileLabels}
            values={files.map(f => parseFloat(f.stats.readability.fleschKincaid.toFixed(1)))}
            color="#f59e0b"
            title="FK Score"
          />
        </div>
      </div>

      {/* Raw data table */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Full File Statistics
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Words</th>
                <th>Unique</th>
                <th>Lines</th>
                <th>Sentences</th>
                <th>Issues</th>
                <th>Readability</th>
                <th>Sentiment</th>
                <th>Lex Density</th>
                <th>Queries</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)', maxWidth: '140px' }}>
                    <span className="truncate block" title={f.name}>{f.name}</span>
                  </td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)' }}>
                    {f.stats.wordCount.toLocaleString()}
                  </td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)' }}>
                    {f.stats.uniqueWordCount.toLocaleString()}
                  </td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)' }}>
                    {f.stats.lineCount}
                  </td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)' }}>
                    {f.stats.sentenceCount}
                  </td>
                  <td>
                    {f.stats.issues.length > 0
                      ? <span className="badge badge-rose">{f.stats.issues.length}</span>
                      : <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>0</span>}
                  </td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                    {f.stats.readability.fleschKincaid.toFixed(1)}
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: f.stats.sentiment.overall === 'positive' ? 'rgba(16,185,129,0.15)'
                        : f.stats.sentiment.overall === 'negative' ? 'rgba(244,63,94,0.15)'
                        : 'rgba(148,163,184,0.15)',
                      color: f.stats.sentiment.overall === 'positive' ? '#10b981'
                        : f.stats.sentiment.overall === 'negative' ? '#f43f5e'
                        : '#94a3b8',
                      border: `1px solid ${f.stats.sentiment.overall === 'positive' ? 'rgba(16,185,129,0.3)'
                        : f.stats.sentiment.overall === 'negative' ? 'rgba(244,63,94,0.3)'
                        : 'rgba(148,163,184,0.3)'}`,
                      fontSize: '0.6rem',
                    }}>
                      {f.stats.sentiment.overall}
                    </span>
                  </td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                    {f.stats.lexicalDensity.toFixed(1)}%
                  </td>
                  <td className="mono" style={{
                    fontFamily: 'var(--font-mono)',
                    color: f.queryCount > 0 ? '#f59e0b' : 'var(--text-muted)',
                  }}>
                    {f.queryCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
