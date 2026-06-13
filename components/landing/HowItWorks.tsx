import { UserPlus, UploadCloud, SearchCheck, LayoutDashboard } from 'lucide-react';

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create a workspace',
    description: 'Register with email, or sign in with the demo account (demo@smartquery.com / password) — no setup required to explore.',
  },
  {
    icon: UploadCloud,
    title: 'Upload your documents',
    description: 'Drag in .txt, .md, .pdf, or .docx files. Each one is parsed, tokenized, and analyzed for sentiment, readability, entities, and issues in seconds.',
  },
  {
    icon: SearchCheck,
    title: 'Search with the optimizer',
    description: 'Type naturally — even with typos. The optimizer corrects, expands, and explains every result with a full BM25 score breakdown.',
  },
  {
    icon: LayoutDashboard,
    title: 'Explore insights',
    description: 'Watch the analytics dashboard update with your activity, generate AI summaries, and ask questions across your whole library.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <p className="section-eyebrow">Getting started</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            From zero to indexed in under a minute.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative card-base p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center text-primary">
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="font-display font-bold text-2xl text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="font-display font-semibold text-ink mb-1.5">{step.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
