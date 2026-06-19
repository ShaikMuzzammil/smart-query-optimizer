"use client";
// app/(auth)/register/page.tsx
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reqs = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Contains a number",     valid: /\d/.test(password) },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); setLoading(false); return; }

      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.ok) { toast.success("Account created! Welcome to SmartQuery Pro 🎉"); router.push("/dashboard"); }
      else { toast.success("Account created! Please sign in."); router.push("/login"); }
    } catch {
      setError("Something went wrong. Please try again."); setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#030309] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none"/>
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{background:"radial-gradient(circle,rgba(6,214,160,.1) 0%,transparent 70%)"}}/>

      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.5}}
        className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-400"/>
            </div>
            <span className="font-bold">SmartQuery <span className="text-violet-400">Pro</span></span>
          </Link>
          <h1 className="text-2xl font-black mb-2">Create your account</h1>
          <p className="text-slate-400 text-sm">Start optimizing SQL queries with AI — free</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {error && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
              className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} required minLength={2}
                  placeholder="Jane Doe"
                  className="w-full bg-[#050510] border border-violet-500/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"/>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full bg-[#050510] border border-violet-500/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"/>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}
                  placeholder="••••••••"
                  className="w-full bg-[#050510] border border-violet-500/20 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"/>
                <button type="button" onClick={()=>setShowPw(p=>!p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {reqs.map(r=>(
                    <div key={r.label} className={`flex items-center gap-1.5 text-[11px] ${r.valid?"text-emerald-400":"text-slate-500"}`}>
                      <CheckCircle2 className="w-3 h-3"/>{r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 glow-violet mt-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Creating account…</span></> : <><span>Create Free Account</span><ArrowRight className="w-4 h-4"/></>}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account? <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in →</Link>
          </p>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-6">By creating an account, you agree to our Terms and Privacy Policy.</p>
      </motion.div>
    </div>
  );
}
