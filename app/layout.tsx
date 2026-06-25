// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "Smart Query Optimizer — SQL Intelligence Platform", template: "%s | Smart Query Optimizer" },
  description: "Production-grade SQL optimization. Detect anti-patterns, get index recommendations, convert natural language to SQL, PII redaction, and export in 4 formats. 12 industry domains, 99 examples.",
  keywords: ["SQL optimizer", "query optimization", "database performance", "PostgreSQL", "NL2SQL", "SQL playground", "schema vault"],
  authors: [{ name: "Smart Query Optimizer" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Smart Query Optimizer — SQL Intelligence Platform",
    description: "Optimize SQL queries with AI. Anti-pattern detection, index recommendations, natural language to SQL, schema visualization, and in-browser playground.",
    siteName: "Smart Query Optimizer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Query Optimizer — SQL Intelligence Platform",
    description: "Production-grade SQL optimization with live scanner, 99 examples across 12 domains, schema vault, and SQL playground.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#030309] font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(9,9,24,.97)",
                border: "1px solid rgba(124,58,237,.3)",
                color: "#e2e8f0",
                fontSize: "13px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
