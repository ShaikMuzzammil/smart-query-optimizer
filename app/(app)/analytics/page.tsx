'use client';

import useSWR from 'swr';
import { Download, FileStack, Search as SearchIcon, Hash, ShieldAlert, GraduationCap } from 'lucide-react';
import { fetcher } from '../../../lib/fetcher';
import { formatNumber, timeAgo } from '../../../lib/utils';
import { AnalyticsResponse } from '../../../types';
import MetricCard from '../../../components/dashboard/MetricCard';
import QueriesChart from '../../../components/dashboard/charts/QueriesChart';
import FileGrowthChart from '../../../components/dashboard/charts/FileGrowthChart';
import SentimentChart from '../../../components/dashboard/charts/SentimentChart';
import TopTermsChart from '../../../components/dashboard/charts/TopTermsChart';
import GuideTip from '../../../components/ui/GuideTip';

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR<AnalyticsResponse>('/api/analytics', fetcher, { refreshInterval: 15000 });

  function exportData(format: 'json' | 'csv') {
    if (!data) return;
    let blob: Blob;
    let filename: string;

    if (format === 'json') {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      filename = 'smartquery-analytics.json';
    } else {
      const rows = [
        ['date', 'queries', 'files_uploaded'],
        ...data.queriesOverTime.map((q, i) => [q.date, String(q.count), String(data.fileGrowth[i]?.count ?? 0)]),
      ];
      const csv = rows.map((r) => r.join(',')).join('\n');
      blob = new Blob([csv], { type: 'text/csv' });
      filename = 'smartquery-analytics.csv';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">Analytics</h2>
          <GuideTip title="Analytics">
            All charts on this page reflect your activity over the last 14 days and refresh automatically. Use the
            export buttons to download your data as JSON or CSV for further analysis.
          </GuideTip>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportData('csv')} disabled={!data} className="btn-secondary text-sm">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => exportData('json')} disabled={!data} className="btn-secondary text-sm">
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard icon={FileStack} label="Files indexed" value={formatNumber(data?.totals.filesIndexed || 0)} accent="primary" loading={isLoading} />
        <MetricCard icon={SearchIcon} label="Total queries" value={formatNumber(data?.totals.totalQueries || 0)} accent="accent" loading={isLoading} />
        <MetricCard icon={Hash} label="Index terms" value={formatNumber(data?.totals.indexTerms || 0)} accent="success" loading={isLoading} />
        <MetricCard icon={ShieldAlert} label="Issues" value={formatNumber(data?.totals.highImpactIssues || 0)} accent="warning" loading={isLoading} />
        <MetricCard icon={GraduationCap} label="Avg. readability" value={data?.totals.avgReadabilityGrade || '—'} accent="primary" loading={isLoading} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-base p-5">
          <h3 className="font-display font-semibold text-sm text-ink mb-3">Queries over time (14d)</h3>
          {data ? <QueriesChart data={data.queriesOverTime} /> : <div className="h-[220px] skeleton" />}
        </div>

        <div className="card-base p-5">
          <h3 className="font-display font-semibold text-sm text-ink mb-3">File growth (14d)</h3>
          {data ? <FileGrowthChart data={data.fileGrowth} /> : <div className="h-[220px] skeleton" />}
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display font-semibold text-sm text-ink">Sentiment trend</h3>
            <GuideTip title="Sentiment trend">
              Shows the sentiment label distribution of documents added each day — useful for spotting shifts in
              tone across reviews, logs, or reports over time.
            </GuideTip>
          </div>
          {data ? <SentimentChart data={data.sentimentTrend} /> : <div className="h-[220px] skeleton" />}
        </div>

        <div className="card-base p-5">
          <h3 className="font-display font-semibold text-sm text-ink mb-3">Top terms across your corpus</h3>
          {data ? <TopTermsChart data={data.topTerms} /> : <div className="h-[260px] skeleton" />}
        </div>
      </div>

      {/* Recent queries table */}
      <div className="card-base p-5">
        <h3 className="font-display font-semibold text-sm text-ink mb-3">Recent query log</h3>
        {data?.recentQueries.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-faint border-b border-border">
                  <th className="py-2 pr-4 font-medium">Query</th>
                  <th className="py-2 pr-4 font-medium">Corrected</th>
                  <th className="py-2 pr-4 font-medium">Results</th>
                  <th className="py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {data.recentQueries.map((q, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-ink">{q.query}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-accent">{q.correctedQuery || '—'}</td>
                    <td className="py-2 pr-4 text-ink-muted">{q.resultCount}</td>
                    <td className="py-2 text-ink-faint text-xs">{timeAgo(q.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-faint py-6 text-center">No queries logged yet.</p>
        )}
      </div>
    </div>
  );
}
