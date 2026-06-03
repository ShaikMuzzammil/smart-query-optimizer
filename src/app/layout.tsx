import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Smart Query Optimizer — AI-Powered SQL Optimization',
    template: '%s | Smart Query Optimizer',
  },
  description:
    'Craft, Optimize, Deploy — Your SQL, Supercharged by AI. Get instant GPT-4o-powered query optimization, index suggestions, execution cost analysis, and more.',
  keywords: [
    'SQL optimizer', 'query optimization', 'AI SQL', 'database performance',
    'PostgreSQL', 'MySQL', 'index suggestions', 'query analyzer',
  ],
  authors: [{ name: 'Smart Query Optimizer' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Smart Query Optimizer — AI-Powered SQL Optimization',
    description: 'AI-powered SQL optimization with real-time analysis, index suggestions, and execution cost estimates.',
    siteName: 'Smart Query Optimizer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Query Optimizer',
    description: 'AI-powered SQL query optimizer',
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#050508" />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <div className="relative min-h-screen bg-[#050508] overflow-x-hidden">
          {/* Global cyber grid background */}
          <div className="fixed inset-0 bg-cyber-grid bg-grid-md pointer-events-none z-0 opacity-100" />
          {/* Radial glow overlay */}
          <div className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.06) 0%, transparent 60%)' }}
          />
          <div className="relative z-10">{children}</div>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0d0d1e',
              color: '#e8f4ff',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: '10px',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(0,212,255,0.05)',
            },
            success: {
              iconTheme: { primary: '#00ff88', secondary: '#050508' },
            },
            error: {
              iconTheme: { primary: '#ff0080', secondary: '#050508' },
            },
          }}
        />
      </body>
    </html>
  );
}
