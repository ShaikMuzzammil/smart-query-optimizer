'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { BarChart2, Upload } from 'lucide-react';

function BarChartCanvas({
  labels, values, color, label, horizontal = false,
}: {
  labels: string[]; values: number[]; color: string; label: string; horizontal?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || !labels.length) return;

    const loadChart = async () => {
      // @ts-ignore
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const ctx = canvasRef.current!.getContext('2d');
      if (!ctx) return;

      const gradient = ctx.createLinearGradient(0, 0, horizontal ? 400 : 0, horizontal ? 0 : 300);
      gradient.addColorStop(0, color + 'CC');
      gradient.addColorStop(1, color + '44');

      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label,
            data: values,
            backgroundColor: gradient,
            borderColor: color,
            borderWidth: 1,
            borderRadius: 4,
          }],
        },
        options: {
          indexAxis: horizontal ? 'y' : 'x',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0d1520',
              borderColor: 'rgba(30,58,95,0.8)',
              borderWidth: 1,
              titleColor: '#e2e8f0',
              bodyColor: '#94a3b8',
              titleFont: { family: 'Space Mono', size: 11 },
              bodyFont: { family: 'Space Mono', size: 10 },
            },
          },
          scales: {
            x: {
              ticks: {
                color: '#475569',
                font: { family: 'Space Mono', size: 10 },
                maxRotation: horizontal ? 0 : 35,
              },
              grid: { color: 'rgba(30,58,95,0.3)' },
            },
            y: {
              ticks: { color: '#475569', font: { family: 'Space Mono', size: 10 } },
              grid: { color: 'rgba(30,58,95,0.3)' },
            },
          },
        },
      });
    };

    loadChart();
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [labels, values, color, label, horizontal]);

  return (
    <div style={{ position: 'relative', height: '240px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

function DoughnutChartCanvas({ labels, values }: { labels: string[]; values: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || !labels.length) return;

    const loadChart = async () => {
      // @ts-ignore
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);

      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

      const ctx = canvasRef.current!.getContext('2d');
      if (!ctx) return;

      const COLORS = ['#f59e0b', '#06b6d4', '#10b981', '#f43f5e', '#8b5cf6', '#f97316', '#84cc16', '#ec4899'];

      chartRef.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: COLORS.slice(0, labels.length).map(c => c + 'CC'),
            borderColor: COLORS.slice(0, labels.length),
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94a3b8', font: { family: 'Space Mono', size: 10 }, padding: 12, boxWidth: 12 },
            },
            tooltip: {
              backgroundColor: '#0d1520',
              borderColor: 'rgba(30,58,95,0.8)',
              borderWidth: 1,
              titleColor: '#e2e8f0',
              bodyColor: '#94a3b8',
            },
          },
          cutout: '65%',
        },
      });
    };

    loadChart();
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [labels, values]);

  return (
    <div style={{ position: 'relative', height: '220px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

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
          <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            No data to visualize
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Upload files to generate charts and insights.</p>
          <button onClick={() => navigateTo('upload')} className="btn-primary">Upload Files</button>
        </div>
      </div>
    );
  }

  // Data prep
  const topWords = globalMetrics.topGlobalWords.slice(0, 12);
  const wordLabels = topWords.map(w => w.word);
  const wordValues = topWords.map(w => w.count);

  const issueLabels = files.filter(f => f.stats.issues.length > 0).map(f => f.name.replace('.txt', '').slice(0, 16));
  const issueValues = files.filter(f => f.stats.issues.length > 0).map(f => f.stats.issues.length);

  const fileLabels = files.map(f => f.name.replace('.txt', '').slice(0, 14));
  const wordCounts = files.map(f => f.stats.wordCount);
  const uniqueWords = files.map(f => f.stats.uniqueWordCount);

  const sentimentCounts = {
    positive: files.filter(f => f.stats.sentiment.overall === 'positive').length,
    neutral: files.filter(f => f.stats.sentiment.overall === 'neutral').length,
    negative: files.filter(f => f.stats.sentiment.overall === 'negative').length,
  };

  // Keyword issue breakdown
  const kwBreakdown: Record<string, number> = {};
  files.forEach(f => f.stats.issues.forEach(i => { kwBreakdown[i.keyword] = (kwBreakdown[i.keyword] || 0) + 1; }));
  const kwSorted = Object.entries(kwBreakdown).sort((a,b) => b[1]-a[1]).slice(0, 10);

  // Search query frequency
  const queryFreq: Record<string, number> = {};
  searchHistory.forEach(h => { queryFreq[h.query] = (queryFreq[h.query] || 0) + 1; });
  const topQueries = Object.entries(queryFreq).sort((a,b)=>b[1]-a[1]).slice(0,8);

  // Readability distribution
  const readBuckets = { 'Very Easy (90+)': 0, 'Easy (70-90)': 0, 'Standard (50-70)': 0, 'Difficult (<50)': 0 };
  files.forEach(f => {
    const s = f.stats.readability.fleschKincaid;
    if (s >= 90) readBuckets['Very Easy (90+)']++;
    else if (s >= 70) readBuckets['Easy (70-90)']++;
    else if (s >= 50) readBuckets['Standard (50-70)']++;
    else readBuckets['Difficult (<50)']++;
  });

  // Lexical density
  const lexLabels = files.map(f => f.name.replace('.txt','').slice(0,14));
  const lexValues = files.map(f => parseFloat(f.stats.lexicalDensity.toFixed(1)));

  // Summary stats
  const totalWords = files.reduce((s,f) => s+f.stats.wordCount, 0);
  const totalIssues = globalMetrics.totalIssues;
  const avgReadability = files.length ? files.reduce((s,f)=>s+f.stats.readability.fleschKincaid,0)/files.length : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="section-subtitle mb-1">Insights & Charts</div>
        <h1 className="section-title">Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Visual intelligence across {files.length} file{files.length !== 1 ? 's' : ''}. Charts update automatically.
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Words', val: totalWords.toLocaleString(), c: '#06b6d4' },
          { label: 'Index Terms', val: globalMetrics.indexTerms.toLocaleString(), c: '#10b981' },
          { label: 'Total Issues', val: totalIssues, c: '#f43f5e' },
          { label: 'Avg Readability', val: avgReadability.toFixed(1), c: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="metric-card amber text-center">
            <div className="mono text-2xl font-bold mb-1" style={{ color: s.c, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Top Terms */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Top 12 Index Terms
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Most frequent words across all files</p>
          {wordLabels.length > 0
            ? <BarChartCanvas labels={wordLabels} values={wordValues} color="#f59e0b" label="Frequency" />
            : <div className="h-48 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No data</div>}
        </div>

        {/* Issues per file */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Issues per File
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>High-impact keyword occurrences by file</p>
          {issueLabels.length > 0
            ? <BarChartCanvas labels={issueLabels} values={issueValues} color="#f43f5e" label="Issues" />
            : <div className="h-48 flex items-center justify-center text-sm" style={{ color: '#10b981' }}>✓ No issues detected</div>}
        </div>

        {/* Word count per file */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Word Count by File
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Total vs unique word comparison</p>
          <BarChartCanvas labels={fileLabels} values={wordCounts} color="#06b6d4" label="Total Words" />
        </div>

        {/* Sentiment distribution */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Sentiment Distribution
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Overall sentiment breakdown</p>
          {Object.values(sentimentCounts).some(v => v > 0)
            ? <DoughnutChartCanvas
                labels={['Positive', 'Neutral', 'Negative']}
                values={[sentimentCounts.positive, sentimentCounts.neutral, sentimentCounts.negative]}
              />
            : <div className="h-48 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No data</div>
          }
        </div>

        {/* Lexical density */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Lexical Density (%)
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Unique words ÷ total words per file</p>
          <BarChartCanvas labels={lexLabels} values={lexValues} color="#8b5cf6" label="Density %" />
        </div>

        {/* Issue keyword breakdown */}
        {kwSorted.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Issue Keyword Frequency
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Which critical keywords appear most</p>
            <BarChartCanvas
              labels={kwSorted.map(([k]) => k)}
              values={kwSorted.map(([,v]) => v)}
              color="#f97316"
              label="Count"
              horizontal
            />
          </div>
        )}

        {/* Readability distribution */}
        <div className="glass-card p-6">
          <h3 className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Readability Distribution
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Flesch-Kincaid score buckets</p>
          {Object.values(readBuckets).some(v => v > 0)
            ? <DoughnutChartCanvas
                labels={Object.keys(readBuckets)}
                values={Object.values(readBuckets)}
              />
            : <div className="h-48 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No data</div>
          }
        </div>

        {/* Search query chart */}
        {topQueries.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Top Search Queries
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Most repeated search terms</p>
            <BarChartCanvas
              labels={topQueries.map(([q]) => q.slice(0, 14))}
              values={topQueries.map(([,c]) => c)}
              color="#10b981"
              label="Times searched"
            />
          </div>
        )}
      </div>

      {/* Raw data table */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Full File Statistics Table
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
                <th>Lex. Density</th>
                <th>Searches</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id}>
                  <td className="font-medium" style={{ color: 'var(--text-primary)', maxWidth: '140px' }}>
                    <span className="truncate block" title={f.name}>{f.name}</span>
                  </td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)' }}>{f.stats.wordCount.toLocaleString()}</td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)' }}>{f.stats.uniqueWordCount.toLocaleString()}</td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)' }}>{f.stats.lineCount}</td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)' }}>{f.stats.sentenceCount}</td>
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
                      background: f.stats.sentiment.overall==='positive'?'rgba(16,185,129,0.15)':f.stats.sentiment.overall==='negative'?'rgba(244,63,94,0.15)':'rgba(148,163,184,0.15)',
                      color: f.stats.sentiment.overall==='positive'?'#10b981':f.stats.sentiment.overall==='negative'?'#f43f5e':'#94a3b8',
                      border: `1px solid ${f.stats.sentiment.overall==='positive'?'rgba(16,185,129,0.3)':f.stats.sentiment.overall==='negative'?'rgba(244,63,94,0.3)':'rgba(148,163,184,0.3)'}`,
                      fontSize: '0.6rem',
                    }}>
                      {f.stats.sentiment.overall}
                    </span>
                  </td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                    {f.stats.lexicalDensity.toFixed(1)}%
                  </td>
                  <td className="mono" style={{ fontFamily: 'var(--font-mono)', color: f.queryCount>0?'#f59e0b':'var(--text-muted)' }}>
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
