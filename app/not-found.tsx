// app/not-found.tsx
import Link from "next/link";
import { Zap, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030309] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-black text-violet-500/20 mb-2 font-mono">404</div>
        <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto -mt-12 mb-6">
          <Zap className="w-7 h-7 text-violet-400"/>
        </div>
        <h1 className="text-2xl font-black mb-2">Page Not Found</h1>
        <p className="text-slate-400 text-sm mb-8">This page doesn't exist or has been moved.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors glow-violet">
          <Home className="w-4 h-4"/>Back to Home
        </Link>
      </div>
    </div>
  );
}
