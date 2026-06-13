'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global error boundary]', error);
  }, [error]);

  // Inline styles only - this replaces the entire root layout (including
  // globals.css), so we can't rely on Tailwind classes being available.
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07091A',
          color: '#E8EDF8',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '1rem',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '100%',
            background: '#0D1025',
            border: '1px solid #1E2445',
            borderRadius: 14,
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ fontSize: '0.875rem', color: '#8B9CC8', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            A critical error occurred while loading SmartQuery Pro. Please try again.
          </p>
          {error?.message && (
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#4B5680',
                background: '#131630',
                borderRadius: 8,
                padding: '0.5rem 0.75rem',
                marginBottom: '0.5rem',
                wordBreak: 'break-word',
                textAlign: 'left',
              }}
            >
              {error.message}
            </p>
          )}
          {error?.digest && <p style={{ fontSize: '0.75rem', color: '#4B5680' }}>Digest: {error.digest}</p>}
          <button
            onClick={() => reset()}
            style={{
              marginTop: '1.25rem',
              background: 'linear-gradient(135deg, #4F8EF7 0%, #3B7AE4 100%)',
              color: '#07091A',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: 'none',
              borderRadius: 10,
              padding: '0.65rem 1.4rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
