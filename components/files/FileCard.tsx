'use client';

import Link from 'next/link';
import { FileText, FileCode, File as FileIcon, Star, Trash2, Smile, Frown, Meh, ShieldAlert, Search } from 'lucide-react';
import { ClientFile } from '../../types';
import { cn, timeAgo } from '../../lib/utils';

const TYPE_ICONS: Record<string, any> = { txt: FileText, md: FileCode, pdf: FileIcon, docx: FileIcon };
const SENTIMENT_ICON: Record<string, any> = { positive: Smile, negative: Frown, neutral: Meh };
const SENTIMENT_COLOR: Record<string, string> = { positive: 'text-success', negative: 'text-danger', neutral: 'text-ink-muted' };

interface FileCardProps {
  file: ClientFile;
  onTogglePin: (file: ClientFile) => void;
  onDelete: (file: ClientFile) => void;
}

export default function FileCard({ file, onTogglePin, onDelete }: FileCardProps) {
  const TypeIcon = TYPE_ICONS[file.fileType] || FileIcon;
  const SentimentIcon = file.analysis ? SENTIMENT_ICON[file.analysis.sentiment.label] : null;

  return (
    <div className="card-base p-4 sm:p-5 group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center text-primary shrink-0">
          <TypeIcon className="w-[18px] h-[18px]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/files/${file.id}`} className="font-medium text-sm text-ink truncate hover:text-primary-light transition-colors">
              {file.fileName}
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onTogglePin(file)}
                className={cn('p-1.5 rounded-md hover:bg-elevated transition-colors', file.pinned ? 'text-accent' : 'text-ink-faint hover:text-ink-muted')}
                aria-label={file.pinned ? 'Unpin' : 'Pin'}
              >
                <Star className={cn('w-3.5 h-3.5', file.pinned && 'fill-current')} />
              </button>
              <button onClick={() => onDelete(file)} className="p-1.5 rounded-md text-ink-faint hover:text-danger hover:bg-elevated transition-colors" aria-label="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-ink-muted">
            <span>{file.wordCount.toLocaleString()} words</span>
            {file.status === 'indexed' ? (
              <>
                {SentimentIcon && (
                  <span className={cn('flex items-center gap-1', SENTIMENT_COLOR[file.analysis!.sentiment.label])}>
                    <SentimentIcon className="w-3 h-3" /> {file.analysis!.sentiment.label}
                  </span>
                )}
                {!!file.analysis?.issues.length && (
                  <span className="flex items-center gap-1 text-warning">
                    <ShieldAlert className="w-3 h-3" /> {file.analysis.issues.length}
                  </span>
                )}
                {file.queryCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Search className="w-3 h-3" /> {file.queryCount}
                  </span>
                )}
                {file.version > 1 && <span className="badge bg-elevated text-ink-muted">v{file.version}</span>}
              </>
            ) : file.status === 'failed' ? (
              <span className="text-danger">Processing failed</span>
            ) : (
              <span>Processing…</span>
            )}
            <span className="text-ink-faint">{timeAgo(file.createdAt)}</span>
          </div>

          {!!file.tags?.length && (
            <div className="flex flex-wrap gap-1 mt-2">
              {file.tags.map((tag) => (
                <span key={tag} className="badge bg-elevated text-ink-muted border border-border">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
