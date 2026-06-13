import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative py-24 border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-radial-blue pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
          Your documents deserve a real search engine.
        </h2>
        <p className="mt-4 text-lg text-ink-muted max-w-xl mx-auto leading-relaxed">
          Free to start. No credit card required. Bring your own Gemini API key for AI features, or explore the
          core search engine without one.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register" className="btn-primary text-base px-7 py-3.5">
            Create your workspace <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="btn-secondary text-base px-7 py-3.5">
            <PlayCircle className="w-4 h-4" /> Try the demo account
          </Link>
        </div>
      </div>
    </section>
  );
}
