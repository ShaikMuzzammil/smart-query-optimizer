'use client';

import { Sparkles, Wand2, GitBranch, BarChart3 } from 'lucide-react';
import GuideTip from '../ui/GuideTip';

interface OptimizerData {
  originalQuery: string;
  correctedQuery: string;
  expandedTerms: string[];
  synonymsUsed: string[];
  rankingStrategy: string;
  didYouMean: boolean;
  aiAssisted: boolean;
  estimatedResults: number;
}

export default function OptimizerPanel({ optimizer, onAcceptCorrection }: { optimizer: OptimizerData; onAcceptCorrection: (q: string) => void }) {
  return (
    <div className="card-base p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-accent" />
        <h3 className="font-display font-semibold text-sm text-ink">Query Optimizer</h3>
        {optimizer.aiAssisted && (
          <span className="badge bg-accent/10 text-accent border border-accent/20">
            <Sparkles className="w-3 h-3" /> AI-assisted
          </span>
        )}
        <GuideTip title="Query Optimizer" className="ml-auto">
          This panel shows exactly how your query was transformed before searching: spell correction, synonym
          expansion, and (if configured) Gemini's semantic suggestions.
        </GuideTip>
      </div>

      {optimizer.didYouMean && optimizer.correctedQuery !== optimizer.originalQuery.toLowerCase() && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-ink-muted">Did you mean</span>
          <button onClick={() => onAcceptCorrection(optimizer.correctedQuery)} className="text-accent font-medium hover:underline">
            "{optimizer.correctedQuery}"
          </button>
          <span className="text-ink-faint">?</span>
        </div>
      )}

      {optimizer.expandedTerms.length > 0 && (
        <div>
          <p className="text-xs text-ink-faint mb-1.5 flex items-center gap-1.5"><GitBranch className="w-3 h-3" /> Expanded search terms</p>
          <div className="flex flex-wrap gap-1.5">
            {optimizer.expandedTerms.map((term) => (
              <span key={term} className="badge bg-elevated text-ink-muted border border-border">{term}</span>
            ))}
          </div>
        </div>
      )}

      {optimizer.synonymsUsed.length > 0 && (
        <div>
          <p className="text-xs text-ink-faint mb-1.5">Synonyms applied</p>
          <div className="flex flex-wrap gap-1.5">
            {optimizer.synonymsUsed.map((s) => (
              <span key={s} className="badge bg-elevated text-ink-muted border border-border font-mono">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-1.5 text-xs text-ink-faint pt-1 border-t border-border/60">
        <BarChart3 className="w-3 h-3 mt-0.5 shrink-0" />
        <span className="font-mono leading-relaxed">{optimizer.rankingStrategy}</span>
      </div>
    </div>
  );
}
