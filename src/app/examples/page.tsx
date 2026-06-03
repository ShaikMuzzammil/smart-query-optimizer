import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ExamplesBrowser from '@/components/ExamplesBrowser';

export const metadata: Metadata = {
  title: 'Examples',
  description: 'Browse real-world SQL optimization examples — from N+1 fixes to window function rewrites.',
};

export default function ExamplesPage() {
  return (
    <main>
      <Navbar />
      <section className="min-h-screen pt-28 pb-20">
        <div className="container-max">
          <div className="text-center mb-12">
            <span className="badge badge-purple mb-4 inline-flex">8 Databases · 8 Examples</span>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
              Real-World <span className="text-gradient-accent">SQL Examples</span>
            </h1>
            <p className="text-[#8899bb] text-lg max-w-2xl mx-auto">
              Browse common SQL anti-patterns. Click any example to load it into the optimizer and see the AI-powered improvement in action.
            </p>
          </div>
          <ExamplesBrowser />
        </div>
      </section>
      <Footer />
    </main>
  );
}
