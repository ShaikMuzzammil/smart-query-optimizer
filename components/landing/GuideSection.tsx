'use client';

import { useState } from 'react';
import { Search, UploadCloud, LineChart, Sparkles, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const TABS = [
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    title: 'Searching with the query optimizer',
    tips: [
      'Type naturally — full sentences, questions, or short keyword fragments all work.',
      'Watch for the "Did you mean?" suggestion when the optimizer detects a likely typo.',
      'Click "Explain this result" on any result card to see the BM25 term breakdown: term frequency, IDF, recency boost, and personalization.',
      'Use the filter drawer to narrow by sentiment, file type, date range, or minimum word count.',
      'Your search history feeds personalized ranking — terms from searches that returned results get a small future boost.',
    ],
  },
  {
    id: 'upload',
    label: 'Upload & Analysis',
    icon: UploadCloud,
    title: 'Uploading and analyzing documents',
    tips: [
      'Drag and drop or browse for .txt, .md, .pdf, and .docx files up to 10MB each.',
      'Each file is automatically tokenized, stemmed, and added to your personal inverted index.',
      'Open any file to see its full analysis: keywords, named entities, sentiment, readability grade, and detected issues.',
      'Re-uploading a file with the same name creates a new version — previous versions remain visible in the file detail view.',
      'Pin important files from the file list to keep them at the top and easy to find.',
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: LineChart,
    title: 'Reading your analytics dashboard',
    tips: [
      'The "Queries Over Time" chart shows your search activity for the last 14 days.',
      '"File Growth" tracks how many documents you have added each day.',
      'The "Top Terms" panel aggregates keyword scores across your whole library — useful for spotting recurring themes.',
      'Sentiment trend shows how the tone of newly added documents has shifted over time.',
      'The dashboard polls for updates every 15 seconds, so changes from uploads or searches appear automatically.',
    ],
  },
  {
    id: 'ai',
    label: 'AI Insights',
    icon: Sparkles,
    title: 'Using AI summaries and Q&A',
    tips: [
      'Open any document and click "Generate Summary" for a 3-5 sentence TL;DR.',
      'Without a Gemini API key, summaries use an extractive fallback (the most information-dense sentences) — still useful, just less fluent.',
      'Use the Q&A panel to ask natural-language questions across your entire document library at once.',
      'Answers cite the source file names so you can verify and dig deeper.',
      'AI features are rate-limited to protect your API quota — if you hit the limit, wait a minute and try again.',
    ],
  },
];

export default function GuideSection() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <section id="guide" className="relative py-24 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="section-eyebrow">In-app guide</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            Every page ships with its own guide.
          </h2>
          <p className="mt-4 text-ink-muted leading-relaxed">
            Look for the <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-elevated text-primary text-xs align-middle mx-1">?</span>
            icon throughout the dashboard for contextual tips. Here's a preview of what each area covers.
          </p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors text-left shrink-0',
                  active === t.id ? 'bg-elevated text-ink border border-primary/40' : 'text-ink-muted hover:text-ink hover:bg-elevated/60 border border-transparent'
                )}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="card-base p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold text-ink mb-5">{tab.title}</h3>
            <ul className="space-y-3.5">
              {tab.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ink-muted leading-relaxed">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
