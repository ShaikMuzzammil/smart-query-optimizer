// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "SmartQuery — SQL Intelligence Platform",
  description:
    "Production-grade SQL optimization, Natural Language to SQL, Schema Vault, and analytics. Supports PostgreSQL, MySQL, SQLite, BigQuery, and MS SQL Server.",
  keywords: ["SQL optimizer", "Natural Language to SQL", "query optimization", "database performance"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#030309] text-white antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0a0a18",
                border: "1px solid rgba(124,58,237,.3)",
                color: "#e2e8f0",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
