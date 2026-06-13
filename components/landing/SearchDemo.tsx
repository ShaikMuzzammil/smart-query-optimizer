'use client';

import { useEffect, useState } from 'react';
import { Search, Sparkles, Zap } from 'lucide-react';

const STAGES = [
  { query: 'eror handeling', stage: 'typing' as const },
  { query: 'eror handeling', stage: 'correcting' as const },
  { query: 'error handling', stage: 'results' as const },
];

const EXPANDED_TERMS = ['error', 'handling', 'exception', 'management', 'api'];

const RESULTS = [
  {
    fileName: 'engineering-meeting-notes.md',
    score: 94,
    snippet: 'Priya proposed a centralized <mark class="term-highlight">error</mark> <mark class="term-highlight">handling</mark> middleware that returns structured, user-friendly messages…',
  },
  {
    fileName: 'production-error-log.txt',
    score: 87,
    snippet: 'ERROR [api-gateway] Connection timeout while calling payments-service… retry <mark class="term-highlight">handling</mark> triggered after 3 attempts.',
  },
  {
    fileName: 'api-documentation-excerpt.md',
    score: 71,
    snippet: 'All endpoints return structured JSON <mark class="term-highlight">errors</mark>… file processing failures set status to failed with a suggested fix.',
  },
];

export default function SearchDemo() {
  const [stageIdx, setStageIdx] = useState(0);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    const stage = STAGES[stageIdx];

    if (stage.stage === 'typing') {
      if (typed.length < stage.query.length) {
        const t = setTimeout(() => setTyped(stage.query.slice(0, typed.length + 1)), 55);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setStageIdx(1), 700);
        return () => clearTimeout(t);
      }
    }

    if (stage.stage === 'correcting') {
      const t = setTimeout(() => {
        setTyped('error handling');
        setStageIdx(2);
      }, 1200);
      return () => clearTimeout(t);
    }

    if (stage.stage === 'results') {
      const t = setTimeout(() => {
        setStageIdx(0);
        setTyped('');
      }, 5500);
      return () => clearTimeout(t);
    }
  }, [stageIdx, typed]);

  const stage = STAGES[stageIdx].stage;

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
      <div className="relative card-base shadow-elevated p-5 animate-glow">
        {/* Search bar */}
        <div className="flex items-center gap-3 input-field !py-3">
          <Search className="w-4 h-4 text-ink-faint shrink-0" />
          <span className="font-mono text-sm text-ink flex-1 truncate">
            {typed}
            <span className="inline-block w-[2px] h-4 bg-primary ml-0.5 align-middle animate-pulse" />
          </span>
          <Zap className="w-4 h-4 text-accent shrink-0" />
        </div>

        {/* Did you mean */}
        <div className="mt-3 min-h-[28px]">
          {stage === 'correcting' || stage === 'results' ? (
            <div className="flex items-center gap-2 text-sm animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-ink-muted">
                Did you mean <span className="text-accent font-medium">error handling</span>?
              </span>
            </div>
          ) : (
            <div className="h-[20px]" />
          )}
        </div>

        {/* Expanded terms */}
        <div className="mt-2 flex flex-wrap gap-1.5 min-h-[26px]">
          {stage === 'results' &&
            EXPANDED_TERMS.map((term, i) => (
              <span
                key={term}
                className="badge bg-elevated text-primary-light border border-border animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {term}
              </span>
            ))}
        </div>

        {/* Results */}
        <div className="mt-4 space-y-2.5 min-h-[180px]">
          {stage === 'results' &&
            RESULTS.map((r, i) => (
              <div
                key={r.fileName}
                className="rounded-lg border border-border bg-elevated/60 p-3 animate-slide-up"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs text-ink-muted truncate">{r.fileName}</span>
                  <span className="text-xs font-semibold text-primary-light shrink-0 ml-2">{r.score}% match</span>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full" style={{ width: `${r.score}%` }} />
                </div>
                <p className="text-xs text-ink-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: r.snippet }} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
