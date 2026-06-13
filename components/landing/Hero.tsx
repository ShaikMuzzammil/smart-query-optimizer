import Link from 'next/link';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import SearchDemo from './SearchDemo';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid-pattern bg-radial-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 badge bg-elevated border border-border text-primary-light mb-6">
              <Sparkles className="w-3 h-3" /> Powered by Gemini AI
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.1]">
              Search your documents like a{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">search engine</span>.
            </h1>

            <p className="mt-6 text-lg text-ink-muted max-w-xl leading-relaxed">
              SmartQuery Pro indexes your files with a real inverted index and BM25 ranking, fixes typos and expands
              your queries with AI, and surfaces sentiment, readability, and entity insights — all in one
              dashboard.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register" className="btn-primary text-base px-6 py-3">
                Start free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-secondary text-base px-6 py-3">
                <PlayCircle className="w-4 h-4" /> Try the live demo
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-muted">
              <Metric value="BM25" label="ranking engine" />
              <Metric value="15+" label="document health checks" />
              <Metric value="<300ms" label="typical search time" />
              <Metric value="4" label="file formats supported" />
            </div>
          </div>

          <SearchDemo />
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display font-bold text-ink text-lg">{value}</span>
      <span>{label}</span>
    </div>
  );
}
