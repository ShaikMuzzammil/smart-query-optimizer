'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Smile, Frown, Meh, ShieldAlert, Sparkles, Loader2, History, Tags, Trash2, Star,
} from 'lucide-react';
import Link from 'next/link';
import { fetcher, patchJSON, postJSON } from '../../../../lib/fetcher';
import { cn, timeAgo } from '../../../../lib/utils';
import GuideTip from '../../../../components/ui/GuideTip';

const SENTIMENT_ICON: Record<string, any> = { positive: Smile, negative: Frown, neutral: Meh };
const SENTIMENT_COLOR: Record<string, string> = { positive: 'text-success', negative: 'text-danger', neutral: 'text-ink-muted' };

interface FileDetail {
  id: string;
  fileName: string;
  fileType: string;
  content: string;
  wordCount: number;
  charCount: number;
  status: string;
  errorMessage?: string;
  analysis?: any;
  summary?: string;
  tags: string[];
  pinned: boolean;
  queryCount: number;
  version: number;
  previousVersions: { version: number; wordCount: number; uploadedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export default function FileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data, mutate } = useSWR<{ file: FileDetail }>(id ? `/api/files/${id}` : null, fetcher);
  const file = data?.file;
  const [summarizing, setSummarizing] = useState(false);
  const [tagInput, setTagInput] = useState('');

  async function generateSummary() {
    setSummarizing(true);
    try {
      const res = await postJSON('/api/ai/summarize', { fileId: id });
      toast.success(res.aiAssisted ? 'AI summary generated.' : 'Summary generated (extractive mode).');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate summary.');
    } finally {
      setSummarizing(false);
    }
  }

  async function togglePin() {
    if (!file) return;
    await patchJSON(`/api/files/${id}`, { pinned: !file.pinned });
    mutate();
  }

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !tagInput.trim()) return;
    const tags = Array.from(new Set([...(file.tags || []), tagInput.trim()])).slice(0, 10);
    await patchJSON(`/api/files/${id}`, { tags });
    setTagInput('');
    mutate();
  }

  async function removeTag(tag: string) {
    if (!file) return;
    const tags = (file.tags || []).filter((t) => t !== tag);
    await patchJSON(`/api/files/${id}`, { tags });
    mutate();
  }

  async function deleteFile() {
    if (!window.confirm('Delete this file permanently?')) return;
    const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('File deleted.');
      router.push('/files');
    } else {
      toast.error('Failed to delete file.');
    }
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-40" />
        <div className="skeleton h-60" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto text-center py-20">
        <p className="text-ink-muted">File not found.</p>
        <Link href="/files" className="text-primary-light text-sm hover:underline mt-2 inline-block">← Back to files</Link>
      </div>
    );
  }

  const SentimentIcon = file.analysis ? SENTIMENT_ICON[file.analysis.sentiment.label] : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/files" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to files
      </Link>

      {/* Header */}
      <div className="card-base p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-xl font-bold text-ink break-all">{file.fileName}</h1>
            <p className="text-sm text-ink-muted mt-1">
              {file.wordCount.toLocaleString()} words · {(file.charCount / 1024).toFixed(1)}KB · uploaded {timeAgo(file.createdAt)}
              {file.version > 1 && <span className="ml-2 badge bg-elevated text-ink-muted">v{file.version}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={togglePin} className={cn('btn-secondary text-sm', file.pinned && 'border-accent text-accent')}>
              <Star className={cn('w-3.5 h-3.5', file.pinned && 'fill-current')} /> {file.pinned ? 'Pinned' : 'Pin'}
            </button>
            <button onClick={deleteFile} className="btn-secondary text-sm hover:text-danger hover:border-danger">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <Tags className="w-3.5 h-3.5 text-ink-faint" />
          {(file.tags || []).map((tag) => (
            <button key={tag} onClick={() => removeTag(tag)} className="badge bg-elevated text-ink-muted border border-border hover:border-danger hover:text-danger transition-colors">
              {tag} ×
            </button>
          ))}
          <form onSubmit={addTag} className="inline-flex">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag…"
              className="bg-transparent border-b border-dashed border-border text-xs text-ink px-1 py-0.5 focus:outline-none focus:border-primary w-24"
            />
          </form>
        </div>
      </div>

      {file.status === 'failed' && (
        <div className="card-base p-5 border-danger/30 bg-danger/5">
          <p className="text-sm text-danger">{file.errorMessage || 'This file could not be processed.'}</p>
        </div>
      )}

      {file.status === 'indexed' && file.analysis && (
        <>
          {/* Summary */}
          <div className="card-base p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-display font-semibold text-ink">AI Summary</h3>
              <GuideTip title="AI Summary">
                Generates a 3-5 sentence TL;DR using Gemini if configured, otherwise an extractive summary built from
                the most information-dense sentences in the document.
              </GuideTip>
            </div>
            {file.summary ? (
              <p className="text-sm text-ink-muted leading-relaxed">{file.summary}</p>
            ) : (
              <p className="text-sm text-ink-faint">No summary generated yet.</p>
            )}
            <button onClick={generateSummary} disabled={summarizing} className="btn-secondary text-sm mt-4">
              {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {file.summary ? 'Regenerate summary' : 'Generate summary'}
            </button>
          </div>

          {/* Analysis grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card-base p-5">
              <h3 className="font-display font-semibold text-sm text-ink mb-3">Sentiment & Readability</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Sentiment</span>
                  <span className={cn('flex items-center gap-1.5 font-medium', SENTIMENT_COLOR[file.analysis.sentiment.label])}>
                    {SentimentIcon && <SentimentIcon className="w-4 h-4" />}
                    {file.analysis.sentiment.label} ({file.analysis.sentiment.comparative})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Readability grade</span>
                  <span className="font-medium text-ink">{file.analysis.readability.gradeLevel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Flesch-Kincaid</span>
                  <span className="font-mono text-ink">{file.analysis.readability.fleschKincaid}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Coleman-Liau</span>
                  <span className="font-mono text-ink">{file.analysis.readability.colemanLiau}</span>
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <h3 className="font-display font-semibold text-sm text-ink mb-3">Top Keywords</h3>
              {file.analysis.keywords?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {file.analysis.keywords.map((kw: any) => (
                    <Link key={kw.term} href={`/search?q=${encodeURIComponent(kw.term)}`} className="badge bg-elevated text-primary-light border border-border hover:border-primary transition-colors">
                      {kw.term}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-faint">No keywords extracted.</p>
              )}
            </div>
          </div>

          {/* Entities */}
          {!!file.analysis.entities?.length && (
            <div className="card-base p-5">
              <h3 className="font-display font-semibold text-sm text-ink mb-3">Named Entities</h3>
              <div className="flex flex-wrap gap-1.5">
                {file.analysis.entities.map((e: any, i: number) => (
                  <span key={i} className="badge bg-elevated text-ink-muted border border-border">
                    {e.text} <span className="text-ink-faint ml-1">{e.type}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {!!file.analysis.issues?.length && (
            <div className="card-base p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-warning" />
                <h3 className="font-display font-semibold text-sm text-ink">Detected Issues ({file.analysis.issues.length})</h3>
              </div>
              <ul className="space-y-2">
                {file.analysis.issues.map((issue: string, i: number) => (
                  <li key={i} className="text-sm text-ink-muted leading-relaxed flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Version history */}
          {!!file.previousVersions?.length && (
            <div className="card-base p-5">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-ink-muted" />
                <h3 className="font-display font-semibold text-sm text-ink">Version History</h3>
              </div>
              <div className="space-y-2">
                {[...file.previousVersions].reverse().map((v) => (
                  <div key={v.version} className="flex items-center justify-between text-sm py-1.5 border-b border-border/60 last:border-0">
                    <span className="badge bg-elevated text-ink-muted">v{v.version}</span>
                    <span className="text-ink-muted">{v.wordCount.toLocaleString()} words</span>
                    <span className="text-ink-faint text-xs">{timeAgo(v.uploadedAt)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm py-1.5">
                  <span className="badge bg-primary/10 text-primary-light">v{file.version} (current)</span>
                  <span className="text-ink-muted">{file.wordCount.toLocaleString()} words</span>
                  <span className="text-ink-faint text-xs">{timeAgo(file.updatedAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Content preview */}
          <div className="card-base p-5">
            <h3 className="font-display font-semibold text-sm text-ink mb-3">Content Preview</h3>
            <pre className="text-xs text-ink-muted whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
              {file.content.slice(0, 2000)}
              {file.content.length > 2000 && '…'}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
