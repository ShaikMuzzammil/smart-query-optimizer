"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInClient() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, #1a0033 0%, #0a0014 70%)" }}>
      <div className="glass rounded-2xl p-10 w-full max-w-md text-center animate-fadeIn" style={{ border: "1px solid rgba(124,58,237,0.3)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-glow"
          style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}>
          <span className="text-3xl">⚡</span>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ background: "linear-gradient(135deg, #fff, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Smart Query Optimizer
        </h1>
        <p className="text-sm mb-8" style={{ color: "#7c6f94" }}>
          SQL Intelligence Platform · 12 Industry Domains
        </p>
        <div className="space-y-4 mb-8 text-left">
          {[
            ["⚡", "Instant anti-pattern detection"],
            ["🤖", "AI-powered SQL rewriting"],
            ["🔒", "Personally Identifiable Information (PII) auto-redaction"],
            ["📊", "Universal analytics across all features"],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-3 text-sm" style={{ color: "#c084fc" }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={async () => { setLoading(true); await signIn("google", { callbackUrl: "/dashboard" }); }}
          disabled={loading}
          className="w-full py-3 px-6 rounded-xl font-semibold text-white glow-btn flex items-center justify-center gap-3"
        >
          {loading ? (
            <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</>
          ) : (
            <><svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google</>
          )}
        </button>
        <p className="text-xs mt-6" style={{ color: "#4a3d5c" }}>
          Your queries are processed securely. Personally Identifiable Information (PII) is auto-redacted before any AI processing.
        </p>
      </div>
    </div>
  );
}
