// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "sonner";
const inter = { variable: "" };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "SmartQuery Pro", template: "%s | SmartQuery Pro" },
  description: "AI-powered SQL query optimizer with real-time analysis, Neon PostgreSQL, and an advanced AI engine. Detect N+1 queries, missing indexes, and anti-patterns instantly.",
  keywords: ["SQL optimizer", "query optimization", "AI", "PostgreSQL", "database performance", "AI optimization"],
  authors: [{ name: "SmartQuery Pro" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "SmartQuery Pro — AI SQL Optimizer",
    description: "Optimize SQL queries with advanced AI. Detect issues, get index recommendations, and reduce query complexity in seconds.",
    siteName: "SmartQuery Pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartQuery Pro — AI SQL Optimizer",
    description: "AI-powered SQL optimization with real-time analysis and Neon PostgreSQL.",
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
