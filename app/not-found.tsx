import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import Logo from '../components/ui/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid-pattern bg-radial-blue">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <p className="font-display text-6xl font-bold text-ink mb-2">404</p>
        <h1 className="font-display text-xl font-semibold text-ink mb-2">Page not found</h1>
        <p className="text-sm text-ink-muted mb-6">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary text-sm">
            <Home className="w-3.5 h-3.5" /> Go home
          </Link>
          <Link href="/search" className="btn-secondary text-sm">
            <Search className="w-3.5 h-3.5" /> Search
          </Link>
        </div>
      </div>
    </div>
  );
}
