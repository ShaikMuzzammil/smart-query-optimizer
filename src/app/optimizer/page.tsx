import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WizardShell from '@/components/optimizer/WizardShell';

export const metadata: Metadata = {
  title: 'Optimizer',
  description: 'AI-powered SQL query optimizer — paste your query and get instant performance improvements.',
};

export default function OptimizerPage() {
  return (
    <main>
      <Navbar />
      <section className="min-h-screen pt-28 pb-20 relative">
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[rgba(0,212,255,0.05)] blur-3xl rounded-full pointer-events-none" />
        <div className="container-max relative z-10">
          <div className="text-center mb-12">
            <span className="badge badge-cyan mb-4 inline-flex">
              <span className="relative flex h-1.5 w-1.5 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4ff] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00d4ff]" />
              </span>
              AI-Powered Optimizer
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
              Smart <span className="text-gradient-cyber">Query Optimizer</span>
            </h1>
            <p className="text-[#8899bb] text-lg max-w-xl mx-auto">
              Paste your SQL, select your database, and let GPT-4o analyze, optimize, and explain every improvement.
            </p>
          </div>
          <WizardShell />
        </div>
      </section>
      <Footer />
    </main>
  );
}
