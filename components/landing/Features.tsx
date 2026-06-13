import {
  Network, Sparkles, ShieldAlert, Smile, Tags, FileQuestion,
  LineChart, History, Bell, FileStack, UserCog, Microscope,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Network,
    title: 'Real Inverted Index + BM25',
    description: 'Every upload is tokenized, stemmed, and indexed into a genuine inverted index. Results are ranked with the BM25 algorithm (k1=1.5, b=0.75), not a substring match.',
    color: 'text-primary',
  },
  {
    icon: Sparkles,
    title: 'AI Query Optimizer',
    description: 'Typos get corrected, abbreviations expanded, and Gemini suggests semantically related terms — turning "eror handeling" into a query that actually finds what you meant.',
    color: 'text-accent',
  },
  {
    icon: ShieldAlert,
    title: '15+ Document Health Checks',
    description: 'Every document is scanned for PII, placeholder text, repetition, low readability, negative sentiment spikes, and more — surfaced as actionable issues.',
    color: 'text-warning',
  },
  {
    icon: Smile,
    title: 'Sentiment & Readability',
    description: 'Automatic sentiment scoring and Flesch-Kincaid / Coleman-Liau readability grading help you understand tone and clarity at a glance.',
    color: 'text-success',
  },
  {
    icon: Tags,
    title: 'Named Entity Extraction',
    description: 'People, places, organizations, dates, and monetary amounts are automatically pulled out of your documents and made searchable.',
    color: 'text-primary-light',
  },
  {
    icon: FileQuestion,
    title: 'AI Summaries & Q&A',
    description: 'Generate a TL;DR for any document, or ask natural-language questions across your whole library and get cited answers from Gemini.',
    color: 'text-accent',
  },
  {
    icon: LineChart,
    title: 'Live Analytics Dashboard',
    description: 'Track queries over time, file growth, top search terms, and sentiment trends with auto-refreshing charts built on Recharts.',
    color: 'text-primary',
  },
  {
    icon: History,
    title: 'Document Versioning',
    description: 'Re-upload a file with the same name and SmartQuery Pro keeps the previous version, word count, and timestamp for comparison.',
    color: 'text-ink-muted',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'A built-in notification center alerts you to processing results, detected issues, AI summaries, and account events as they happen.',
    color: 'text-warning',
  },
  {
    icon: FileStack,
    title: 'Multi-Format Uploads',
    description: 'Drag and drop .txt, .md, .pdf, and .docx files up to 10MB. Text is extracted, cleaned, and indexed automatically.',
    color: 'text-success',
  },
  {
    icon: UserCog,
    title: 'Personalized Ranking',
    description: 'SmartQuery Pro learns which terms lead to useful results for you and gently boosts matching documents in future searches.',
    color: 'text-primary-light',
  },
  {
    icon: Microscope,
    title: 'Explainable Scoring',
    description: 'Every result includes a full breakdown — term frequency, IDF, recency boost, and personalization — so ranking is never a black box.',
    color: 'text-accent',
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <p className="section-eyebrow">Everything in one workspace</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            A real search engine, an AI co-pilot, and a research analyst — built in.
          </h2>
          <p className="mt-4 text-ink-muted leading-relaxed">
            SmartQuery Pro isn't a wrapper around an LLM call. The ranking, indexing, and document analysis are
            deterministic and explainable — AI is layered on top to make search smarter, not to replace it.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-base p-6 hover:border-ring transition-colors group">
              <div className={`w-10 h-10 rounded-lg bg-elevated flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-ink mb-1.5">{f.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
