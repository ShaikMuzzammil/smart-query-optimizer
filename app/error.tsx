'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app error boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-base bg-grid-pattern bg-radial-blue">
      <div className="card-base shadow-elevated p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="font-display text-xl font-bold text-ink mb-2">Something went wrong</h1>
        <p className="text-sm text-ink-muted mb-1 leading-relaxed">
          An unexpected error occurred while rendering this page. This has been logged for review.
        </p>
        {error?.message && (
          <p className="font-mono text-xs text-ink-faint bg-elevated rounded-lg px-3 py-2 mt-3 mb-1 break-words text-left">
            {error.message}
          </p>
        )}
        {error?.digest && <p className="text-xs text-ink-faint mt-1">Digest: {error.digest}</p>}

        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => reset()} className="btn-secondary text-sm">
            <RotateCcw className="w-3.5 h-3.5" /> Try again
          </button>
          <Link href="/" className="btn-primary text-sm">
            <Home className="w-3.5 h-3.5" /> Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
