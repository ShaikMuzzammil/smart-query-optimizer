'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import {
  FileStack, Search as SearchIcon, Hash, ShieldAlert, UploadCloud, Sparkles, Loader2, ArrowRight, Database,
} from 'lucide-react';
import { fetcher, postJSON } from '../../../lib/fetcher';
import { formatNumber, timeAgo } from '../../../lib/utils';
import { AnalyticsResponse, ClientFile } from '../../../types';
import MetricCard from '../../../components/dashboard/MetricCard';
import QueriesChart from '../../../components/dashboard/charts/QueriesChart';
import TopTermsChart from '../../../components/dashboard/charts/TopTermsChart';
import GuideTip from '../../../components/ui/GuideTip';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);

  const { data: analytics, isLoading: analyticsLoading, mutate: mutateAnalytics } = useSWR<AnalyticsResponse>('/api/analytics', fetcher, {
    refreshInterval: 15000,
  });
  const { data: filesData, mutate: mutateFiles } = useSWR<{ files: ClientFile[] }>('/api/files', fetcher, { refreshInterval: 15000 });

  const files = filesData?.files || [];
  const hasFiles = files.length > 0;

  async function loadDemoData() {
    setSeeding(true);
    try {
      const res = await postJSON('/api/demo/seed', {});
      if (res.seeded > 0) {
        toast.success(`${res.seeded} demo documents indexed!`);
      } else {
        toast('Demo documents are already loaded.');
      }
      mutateFiles();
      mutateAnalytics();
    } catch (err: any) {
      toast.error(err.message || 'Failed to load demo data.');
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome / empty state */}
      {!hasFiles && (
        <div className="card-base p-8 text-center bg-radial-blue">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink mb-2">Your index is empty</h2>
          <p className="text-sm text-ink-muted max-w-md mx-auto mb-6">
            Upload your own documents, or load 5 ready-made example files (privacy policy, error logs, customer
            feedback, meeting notes, API docs) to explore search, analytics, and AI insights instantly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={loadDemoData} disabled={seeding} className="btn-primary">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Load demo documents
            </button>
            <Link href="/upload" className="btn-secondary">
              <UploadCloud className="w-4 h-4" /> Upload a file
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">Overview</h2>
          <GuideTip title="Dashboard">
            This page summarizes your workspace: how many documents are indexed, how many searches you've run, the
            size of your vocabulary, and any health issues detected across your documents. It refreshes automatically
            every 15 seconds.
          </GuideTip>
        </div>
        <Link href="/search" className="btn-secondary text-sm">
          <SearchIcon className="w-3.5 h-3.5" /> Go to search
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={FileStack} label="Files indexed" value={formatNumber(analytics?.totals.filesIndexed || 0)} accent="primary" loading={analyticsLoading} />
        <MetricCard icon={SearchIcon} label="Total queries" value={formatNumber(analytics?.totals.totalQueries || 0)} accent="accent" loading={analyticsLoading} />
        <MetricCard icon={Hash} label="Index terms" value={formatNumber(analytics?.totals.indexTerms || 0)} accent="success" loading={analyticsLoading} />
        <MetricCard icon={ShieldAlert} label="Issues detected" value={formatNumber(analytics?.totals.highImpactIssues || 0)} accent="warning" loading={analyticsLoading} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display font-semibold text-sm text-ink">Queries over time</h3>
            <GuideTip title="Queries over time">
              Number of searches you've run per day over the last 14 days. Spikes can indicate active research
              sessions or testing of the query optimizer.
            </GuideTip>
          </div>
          {analytics ? <QueriesChart data={analytics.queriesOverTime} /> : <div className="h-[220px] skeleton" />}
        </div>

        <div className="card-base p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-display font-semibold text-sm text-ink">Top terms (TF-IDF)</h3>
            <GuideTip title="Top terms">
              The most distinctive terms across your entire document library, weighted by TF-IDF. High scores mean a
              term appears frequently in a document but rarely elsewhere in your corpus.
            </GuideTip>
          </div>
          {analytics ? <TopTermsChart data={analytics.topTerms.slice(0, 6)} /> : <div className="h-[220px] skeleton" />}
        </div>
      </div>

      {/* Recent activity + top files */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-base p-5">
          <h3 className="font-display font-semibold text-sm text-ink mb-3">Recent searches</h3>
          {analytics?.recentQueries.length ? (
            <div className="space-y-2">
              {analytics.recentQueries.map((q, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/60 last:border-0">
                  <div className="min-w-0">
                    <p className="text-ink truncate font-mono text-xs">{q.query}</p>
                    {q.correctedQuery && <p className="text-xs text-accent">→ {q.correctedQuery}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs text-ink-muted">{q.resultCount} result{q.resultCount !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-ink-faint">{timeAgo(q.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-faint py-6 text-center">No searches yet. <Link href="/search" className="text-primary-light">Run your first search →</Link></p>
          )}
        </div>

        <div className="card-base p-5">
          <h3 className="font-display font-semibold text-sm text-ink mb-3">Most-searched files</h3>
          {analytics?.topFiles.filter((f) => f.queryCount > 0).length ? (
            <div className="space-y-2">
              {analytics.topFiles.filter((f) => f.queryCount > 0).map((f) => (
                <button
                  key={f.id}
                  onClick={() => router.push(`/files/${f.id}`)}
                  className="flex items-center justify-between w-full text-sm py-1.5 border-b border-border/60 last:border-0 hover:text-primary-light transition-colors text-left"
                >
                  <span className="text-ink truncate font-mono text-xs">{f.fileName}</span>
                  <span className="text-xs text-ink-muted shrink-0 ml-3">{f.queryCount} hit{f.queryCount !== 1 ? 's' : ''}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-faint py-6 text-center">Search activity will appear here once you start querying your documents.</p>
          )}
        </div>
      </div>

      {hasFiles && (
        <div className="flex flex-wrap gap-3">
          <Link href="/upload" className="btn-secondary text-sm">
            <UploadCloud className="w-4 h-4" /> Upload more files
          </Link>
          <Link href="/ai-insights" className="btn-secondary text-sm">
            <Sparkles className="w-4 h-4" /> AI insights <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
