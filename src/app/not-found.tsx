import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <main>
      <Navbar />
      <section className="min-h-screen pt-28 pb-20 flex items-center justify-center">
        <div className="container-max max-w-lg text-center">
          <div
            className="text-8xl font-display font-black mb-4 text-gradient-cyber"
            style={{ lineHeight: 1 }}
          >
            404
          </div>
          <div className="text-4xl mb-6">🌌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-[#8899bb] mb-8">
            The page you're looking for doesn't exist — or it got optimized out of existence.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="btn-secondary px-6 py-3 text-sm">← Home</Link>
            <Link href="/optimizer" className="btn-primary px-6 py-3 text-sm">Launch Optimizer</Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
