"use client";
// app/error.tsx
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[APP ERROR]", error); }, [error]);

  return (
    <div className="min-h-screen bg-[#030309] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-rose-400"/>
        </div>
        <h1 className="text-2xl font-black mb-2">Something went wrong</h1>
        <p className="text-slate-400 text-sm mb-2">An unexpected error occurred. This has been logged.</p>
        {error.digest && <p className="text-xs text-slate-600 font-mono mb-6">Digest: {error.digest}</p>}
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">
            <RotateCcw className="w-4 h-4"/>Try Again
          </button>
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 border border-violet-500/30 text-slate-300 text-sm font-medium rounded-xl transition-colors">
            <Home className="w-4 h-4"/>Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
