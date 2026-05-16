import type { Metadata } from 'next'
import './globals.css'
import Cursor from '../components/Cursor'

export const metadata: Metadata = {
  title: 'SmartQuery Optimizer — Build Your Own Search Engine',
  description: 'Production-grade distributed web search engine with BM25+PageRank, real-time crawling, and sub-100ms query latency.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Cursor />
        <div className="bg-animated" aria-hidden="true" />
        <div className="grid-bg fixed inset-0 z-0 opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
