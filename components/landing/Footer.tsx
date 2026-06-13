import Link from 'next/link';
import Logo from '../ui/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Logo />
        <div className="flex items-center gap-6 text-sm text-ink-muted">
          <a href="#features" className="hover:text-ink transition-colors">Features</a>
          <a href="#ai" className="hover:text-ink transition-colors">AI Optimizer</a>
          <a href="#guide" className="hover:text-ink transition-colors">Guide</a>
          <Link href="/login" className="hover:text-ink transition-colors">Sign in</Link>
        </div>
        <p className="text-xs text-ink-faint">Built with Next.js, MongoDB & Gemini AI.</p>
      </div>
    </footer>
  );
}
