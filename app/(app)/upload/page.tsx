'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSWRConfig } from 'swr';
import { CheckCircle2, XCircle, Loader2, FileText, ArrowRight, Smile, Frown, Meh, ShieldAlert } from 'lucide-react';
import DropZone from '../../../components/upload/DropZone';
import GuideTip from '../../../components/ui/GuideTip';
import { ClientFile } from '../../../types';
import { cn } from '../../../lib/utils';

interface QueueItem {
  id: string;
  file: File;
  status: 'uploading' | 'done' | 'error';
  result?: ClientFile;
  error?: string;
}

const SENTIMENT_ICON: Record<string, any> = { positive: Smile, negative: Frown, neutral: Meh };
const SENTIMENT_COLOR: Record<string, string> = { positive: 'text-success', negative: 'text-danger', neutral: 'text-ink-muted' };

export default function UploadPage() {
  const { mutate } = useSWRConfig();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: File[]) {
    const items: QueueItem[] = files.map((file) => ({ id: `${file.name}-${Date.now()}-${Math.random()}`, file, status: 'uploading' }));
    setQueue((prev) => [...items, ...prev]);
    setUploading(true);

    for (const item of items) {
      try {
        const formData = new FormData();
        formData.append('file', item.file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok || data.error) {
          setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: data.file ? 'done' : 'error', result: data.file, error: data.error } : q)));
        } else {
          setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'done', result: data.file } : q)));
        }
      } catch (err: any) {
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: 'Network error during upload.' } : q)));
      }
    }

    setUploading(false);
    mutate('/api/files');
    mutate('/api/analytics');
    mutate('/api/notifications');
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">Upload documents</h2>
        <GuideTip title="Uploading documents">
          Each file is parsed for text, tokenized, stemmed, and added to your personal inverted index. NLP analysis
          (sentiment, readability, named entities, and 15+ issue checks) runs immediately and results appear below.
          Re-uploading a file with the same name creates a new version.
        </GuideTip>
      </div>

      <DropZone onFiles={handleFiles} disabled={uploading} />

      {queue.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-sm text-ink-muted">Processing results</h3>
          {queue.map((item) => (
            <UploadResultCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadResultCard({ item }: { item: QueueItem }) {
  const { file, status, result, error } = item;

  return (
    <div className="card-base p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-elevated flex items-center justify-center text-primary shrink-0 mt-0.5">
          <FileText className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-ink truncate text-sm">{file.name}</p>
            <StatusBadge status={status} />
          </div>

          {status === 'uploading' && <p className="text-xs text-ink-muted mt-1">Extracting text, running NLP analysis…</p>}

          {status === 'error' && <p className="text-xs text-danger mt-1">{error}</p>}

          {status === 'done' && result && result.status === 'failed' && (
            <p className="text-xs text-danger mt-1">{result.errorMessage || error}</p>
          )}

          {status === 'done' && result && result.status === 'indexed' && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                <span>{result.wordCount.toLocaleString()} words</span>
                <span className="flex items-center gap-1">
                  {(() => {
                    const Icon = SENTIMENT_ICON[result.analysis?.sentiment.label || 'neutral'];
                    return <Icon className={cn('w-3.5 h-3.5', SENTIMENT_COLOR[result.analysis?.sentiment.label || 'neutral'])} />;
                  })()}
                  {result.analysis?.sentiment.label}
                </span>
                <span>Readability: {result.analysis?.readability.gradeLevel}</span>
                {!!result.analysis?.issues.length && (
                  <span className="flex items-center gap-1 text-warning">
                    <ShieldAlert className="w-3.5 h-3.5" /> {result.analysis.issues.length} issue{result.analysis.issues.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {!!result.analysis?.keywords.length && (
                <div className="flex flex-wrap gap-1.5">
                  {result.analysis.keywords.slice(0, 6).map((kw) => (
                    <span key={kw.term} className="badge bg-elevated text-primary-light border border-border">
                      {kw.term}
                    </span>
                  ))}
                </div>
              )}

              <Link href={`/files/${result.id}`} className="inline-flex items-center gap-1.5 text-xs text-primary-light hover:underline">
                View full analysis <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: QueueItem['status'] }) {
  if (status === 'uploading') {
    return (
      <span className="badge bg-elevated text-ink-muted shrink-0">
        <Loader2 className="w-3 h-3 animate-spin" /> Processing
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="badge bg-danger/10 text-danger shrink-0">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  }
  return (
    <span className="badge bg-success/10 text-success shrink-0">
      <CheckCircle2 className="w-3 h-3" /> Indexed
    </span>
  );
}
