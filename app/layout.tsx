// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "sonner";
const inter = { variable: "" };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "QueryForge — AI Database Performance Platform", template: "%s | QueryForge" },
  description: "Production-grade SQL optimization powered by dual AI engines. Detect N+1 anti-patterns, get index recommendations, NL-to-SQL conversion, PII redaction, and export in 4 formats.",
  keywords: ["SQL optimizer", "query optimization", "AI database", "PostgreSQL performance", "NL2SQL", "database engineering"],
  authors: [{ name: "QueryForge" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "QueryForge — AI Database Performance Platform",
    description: "Optimize SQL with AI. Detect anti-patterns, get index recommendations, convert natural language to SQL, and export anywhere.",
    siteName: "QueryForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "QueryForge — AI Database Performance Platform",
    description: "Production-grade SQL optimization with dual AI engine (Claude + Gemini), live scanner, and full history.",
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
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
