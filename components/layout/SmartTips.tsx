"use client";
// components/layout/SmartTips.tsx
// A floating, bottom-right contextual tips widget shown on every dashboard
// page. It reacts to whichever feature you're currently on and surfaces a
// relevant, actionable suggestion — deliberately branded as "Smart Tips"
// rather than referencing any underlying AI provider, consistent with the
// rest of the product's no-AI-name-exposed policy.
import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, X, ArrowRight, ChevronRight } from "lucide-react";

interface Tip {
  title: string;
  body: string;
  cta?: { label: string; href: string };
}

const TIPS_BY_ROUTE: Record<string, Tip[]> = {
  "/optimizer": [
    { title: "Use the Live Scanner", body: "Issues appear instantly below the editor as you type — you don't need to click Optimize to catch anti-patterns like SELECT * or missing LIMIT." },
    { title: "Check the dialect reference", body: "Click the [Dialect] Reference button next to your selected dialect for index types and functions specific to it." },
    { title: "No query handy?", body: "Use a sample category card to load a realistic query for any of the 9 supported domains." },
  ],
  "/nl2sql": [
    { title: "Load your schema first", body: "Open Schema Vault and load your DDL before converting — it eliminates hallucinated table/column names entirely.", cta: { label: "Open Schema Vault", href: "/schema" } },
    { title: "Be specific", body: "Mention grouping, filtering, and ordering explicitly in your prompt for more accurate generated SQL." },
  ],
  "/schema": [
    { title: "Paste full CREATE TABLE statements", body: "Include foreign key constraints so the Entity-Relationship diagram can detect relationships automatically." },
    { title: "Send schema to NL to SQL", body: "Once parsed, use \"Use in NL to SQL\" so every generated query matches your real structure.", cta: { label: "Go to NL to SQL", href: "/nl2sql" } },
  ],
  "/playground": [
    { title: "Edit and run for real", body: "Anything you type or change in the editor executes live against seeded sample tables — not just the canned demo output." },
    { title: "Stick to core SQL for live runs", body: "SELECT, WHERE, JOIN, GROUP BY, ORDER BY, LIMIT, and aggregates all run live; very advanced dialect-specific syntax may not." },
  ],
  "/examples": [
    { title: "Long query?", body: "Use the Expand/Collapse toggle on any card — or Expand All / Collapse All at the top — to control how much SQL is shown at once." },
    { title: "Send straight to Optimizer", body: "Click Optimize on any example to load it directly into the SQL Optimizer for a full analysis.", cta: { label: "Open Optimizer", href: "/optimizer" } },
  ],
  "/analytics": [
    { title: "Stats update across every feature", body: "Optimizer, NL to SQL, Schema Vault, and Playground all feed into these numbers — not just one tool." },
  ],
  "/history": [
    { title: "Favorite what matters", body: "Star results you reuse often so they're easy to find later." },
  ],
  "/settings": [
    { title: "Export before clearing", body: "If you clear your history, export it first from Data & Export — clearing can't be undone." },
  ],
  "/dashboard": [
    { title: "Start with your slowest query", body: "Paste your worst-performing SQL into the Optimizer first — it's the fastest way to see real impact.", cta: { label: "Open Optimizer", href: "/optimizer" } },
  ],
};

const DEFAULT_TIPS: Tip[] = [
  { title: "Explore SmartQuery", body: "Optimizer, NL to SQL, Schema Vault, Playground, Examples, and Analytics all work together — schema and queries flow between them automatically." },
];

export function SmartTips() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  const tips = useMemo(() => {
    const match = Object.keys(TIPS_BY_ROUTE).find(route => pathname?.startsWith(route));
    return (match ? TIPS_BY_ROUTE[match] : DEFAULT_TIPS);
  }, [pathname]);

  const tip = tips[tipIdx % tips.length];

  // Don't render on auth pages or the landing page
  if (!pathname || pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register")) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="absolute bottom-16 right-0 w-72 bg-[#0a0a1f] border border-violet-500/25 rounded-2xl shadow-2xl shadow-violet-950/50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/15 bg-violet-500/5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5"/> Smart Tips
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>
            <div className="p-4">
              <div className="text-xs font-semibold text-white mb-1.5">{tip.title}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{tip.body}</p>
              <div className="flex items-center justify-between">
                {tip.cta ? (
                  <button onClick={() => { router.push(tip.cta!.href); setOpen(false); }}
                    className="flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200 font-medium transition-colors">
                    {tip.cta.label} <ArrowRight className="w-3 h-3"/>
                  </button>
                ) : <span/>}
                {tips.length > 1 && (
                  <button onClick={() => setTipIdx(i => i + 1)}
                    className="flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                    Next tip <ChevronRight className="w-3 h-3"/>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(o => !o)}
        title="Smart Tips for this page"
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-violet-950/50 transition-all border ${
          open
            ? "bg-violet-600 border-violet-400/40 text-white"
            : "bg-[#0a0a1f] border-violet-500/30 text-violet-300 hover:border-violet-500/50 hover:bg-violet-500/10"
        }`}
      >
        {open ? <X className="w-5 h-5"/> : (
          <span className="relative flex items-center justify-center">
            <Lightbulb className="w-5 h-5"/>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
          </span>
        )}
      </button>
    </div>
  );
}
