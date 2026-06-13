'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, FileText, ArrowRight } from 'lucide-react';
import { SearchResultItem } from '../../types';
import { timeAgo } from '../../lib/utils';

export default function ResultCard({ result, maxScore }: { result: SearchResultItem; maxScore: number }) {
  const [expanded, setExpanded] = useState(false);
  const pct = maxScore > 0 ? Math.round((result.score / maxScore) * 100) : 0;

  return (
    <div className="card-base p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-elevated flex items-center justify-center text-primary shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <Link href={`/files/${result.id}`} className="font-medium text-sm text-ink hover:text-primary-light transition-colors truncate block">
              {result.fileName}
            </Link>
            <p className="text-xs text-ink-faint">{timeAgo(result.uploadDate)}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display font-bold text-primary-light">{pct}%</p>
          <p className="text-xs text-ink-faint">match</p>
        </div>
      </div>

      <div className="h-1 bg-border rounded-full overflow-hidden mt-3 mb-3">
        <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <p className="text-sm text-ink-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: result.snippet }} />

      <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-1.5 text-xs text-primary-light hover:underline mt-3">
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? 'Hide score breakdown' : 'Explain this result'}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-3 animate-fade-in">
          <div className="grid grid-cols-3 gap-2 text-center">
            <ScoreStat label="BM25 raw" value={result.rawBm25.toFixed(3)} />
            <ScoreStat label="Recency boost" value={`+${(result.recencyBoost * 20).toFixed(1)}%`} />
            <ScoreStat label="Personal boost" value={`+${(result.personalBoost * 10).toFixed(1)}%`} />
          </div>

          {result.termContributions.length > 0 && (
            <div>
              <p className="text-xs text-ink-faint mb-1.5">Term contributions</p>
              <div className="space-y-1.5">
                {result.termContributions.map((tc) => (
                  <div key={tc.term} className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-ink w-20 truncate">{tc.term}</span>
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${Math.min((tc.contribution / Math.max(result.termContributions[0].contribution, 0.001)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-ink-faint font-mono w-12 text-right">tf={tc.tf}</span>
                    <span className="text-ink-faint font-mono w-16 text-right">idf={tc.idf}</span>
                    <span className="text-ink font-mono w-16 text-right">{tc.contribution}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href={`/files/${result.id}`} className="inline-flex items-center gap-1.5 text-xs text-primary-light hover:underline">
            View full document <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function ScoreStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-elevated rounded-lg py-2 px-1">
      <p className="font-mono font-semibold text-sm text-ink">{value}</p>
      <p className="text-xs text-ink-faint mt-0.5">{label}</p>
    </div>
  );
}
