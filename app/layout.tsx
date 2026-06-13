import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'SmartQuery Pro — AI Document Intelligence & Query Optimizer',
  description:
    'Upload documents, get instant BM25-ranked full-text search with an AI-powered query optimizer, NLP insights, sentiment analysis, and real-time analytics dashboards.',
  keywords: ['document search', 'query optimizer', 'BM25', 'AI search', 'NLP', 'full-text search', 'Gemini AI'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
