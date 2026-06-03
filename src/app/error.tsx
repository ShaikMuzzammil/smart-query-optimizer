'use client';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#050508] text-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
          <p className="text-[#8899bb] mb-6 text-sm">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={reset}
            className="btn-primary px-8 py-3 text-sm"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
