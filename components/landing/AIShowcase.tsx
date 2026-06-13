import { Type, SpellCheck, Sparkles, GitBranch, BarChart3, ArrowRight } from 'lucide-react';

const PIPELINE = [
  {
    icon: Type,
    title: 'Raw Query',
    detail: '"eror handeling in api"',
    description: 'The exact string the user types — typos and all.',
  },
  {
    icon: SpellCheck,
    title: 'Spell Correction',
    detail: '"error handling in api"',
    description: 'A static correction dictionary plus Levenshtein fuzzy matching (distance ≤ 2) against your own document vocabulary.',
  },
  {
    icon: GitBranch,
    title: 'Synonym & Abbreviation Expansion',
    detail: '+ exception, management, endpoint',
    description: 'A built-in synonym dictionary expands common abbreviations and related terms — works even with zero AI configuration.',
  },
  {
    icon: Sparkles,
    title: 'Gemini AI Expansion',
    detail: '+ retry logic, exception handling, fault tolerance',
    description: 'If GEMINI_API_KEY is set, Gemini suggests additional semantically related terms based on the corrected query.',
  },
  {
    icon: BarChart3,
    title: 'BM25 + Boosts',
    detail: 'score = BM25 × (1 + 0.2·recency) × (1 + 0.1·personal)',
    description: 'Final ranking combines term relevance with a recency boost and a personalization boost learned from your search history.',
  },
];

export default function AIShowcase() {
  return (
    <section id="ai" className="relative py-24 border-t border-border bg-radial-amber">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <p className="section-eyebrow">The query optimizer pipeline</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            From a typo to a ranked, explainable result — in one request.
          </h2>
          <p className="mt-4 text-ink-muted leading-relaxed">
            Every search runs through this five-stage pipeline. The first three stages run with zero external
            dependencies; Gemini is layered on as an optional booster that degrades gracefully if no API key is
            configured.
          </p>
        </div>

        <div className="space-y-4">
          {PIPELINE.map((step, i) => (
            <div key={step.title} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 card-base p-5 sm:p-6">
              <div className="flex items-center gap-4 sm:w-72 shrink-0">
                <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center text-primary shrink-0">
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-mono text-ink-faint mb-0.5">Stage {i + 1}</p>
                  <h3 className="font-display font-semibold text-ink text-sm">{step.title}</h3>
                </div>
              </div>

              <div className="flex-1">
                <p className="font-mono text-xs sm:text-sm text-accent bg-elevated/70 border border-border rounded-lg px-3 py-2 inline-block mb-2">
                  {step.detail}
                </p>
                <p className="text-sm text-ink-muted leading-relaxed">{step.description}</p>
              </div>

              {i < PIPELINE.length - 1 && (
                <ArrowRight className="hidden sm:block w-4 h-4 text-ink-faint shrink-0 rotate-90 sm:rotate-0" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 card-base p-6 border-primary/30 bg-primary/5">
          <p className="text-sm text-ink-muted leading-relaxed">
            <span className="font-semibold text-ink">No AI key required to start.</span> SmartQuery Pro's core
            search — inverted index, BM25 ranking, spell correction, and synonym expansion — works fully offline
            from external AI APIs. Add a free{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary-light underline underline-offset-2">
              Gemini API key
            </a>{' '}
            to unlock AI query expansion, document summaries, and Q&A.
          </p>
        </div>
      </div>
    </section>
  );
}
