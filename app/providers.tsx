'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#131630',
            color: '#E8EDF8',
            border: '1px solid #1E2445',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#0D1025' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#0D1025' } },
        }}
      />
    </SessionProvider>
  );
}
