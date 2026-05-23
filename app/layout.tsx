import type { Metadata } from 'next';
import { AppProvider } from '../lib/store';
import { CustomStyles } from '../components/CustomStyles';

export const metadata: Metadata = {
  title: 'SmartQuery Optimizer — Advanced Text Intelligence Platform',
  description: 'Next-generation text analysis, search, and intelligence platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Tailwind CSS via CDN — no PostCSS build step needed */}
        <script src="https://cdn.tailwindcss.com" async={false} />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Syne:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <CustomStyles />
      </head>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
