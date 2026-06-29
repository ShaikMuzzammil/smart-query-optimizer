import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Smart Query Optimizer — SQL Intelligence Platform",
  description: "AI-powered SQL optimization, natural language to SQL conversion, schema visualization, and query analytics across 12 industry domains.",
  keywords: "SQL optimizer, NL to SQL, database performance, query analysis, schema visualization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
