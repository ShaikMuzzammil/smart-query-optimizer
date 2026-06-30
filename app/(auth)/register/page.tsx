"use client";
// app/(auth)/register/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, Eye, EyeOff, User, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { signIn, useSession } from "next-auth/react";

const PERKS = ["Unlimited optimizations","Natural Language to SQL","PII auto-redaction","25 domain examples","CSV + JSON + PDF export","Persistent history"];

export default function RegisterPage() {
  const router = useRouter();
  const { update } = useSession();
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed."); setLoading(false); return; }
      toast.success("Account created! Signing you in…");
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.ok) {
        await update();
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch { setError("Something went wrong. Please try again."); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#03020d] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"/>
      <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{background:"radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 70%)"}}/>

      <Link href="/" className="fixed top-5 left-5 z-20 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-violet-500/20 bg-[#03020d]/80 hover:bg-violet-500/10 hover:border-violet-500/40 text-slate-400 hover:text-white text-sm font-medium transition-all backdrop-blur-sm">
        <ArrowLeft className="w-4 h-4"/>Back to Home
      </Link>

      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.4}} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-5 h-5 text-white"/>
            </div>
            <span className="font-black text-lg">Smart<span className="text-violet-400">Query</span></span>
          </Link>
          <h1 className="text-2xl font-black mb-2">Create your account</h1>
          <p className="text-slate-400 text-sm">Free forever · No credit card required</p>
        </div>

        <div className="rounded-2xl p-4 mb-4 bg-[#06061a] border border-violet-500/15">
          <div className="grid grid-cols-2 gap-1.5">
            {PERKS.map(p=>(
              <div key={p} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0"/>{p}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-8 bg-[#06061a] border border-violet-500/15">
          {error && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-5 flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}
            </motion.div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} required
                  placeholder="Your name" autoComplete="name"
                  className="w-full bg-[#050510] border border-violet-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"/>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                  placeholder="you@example.com" autoComplete="email"
                  className="w-full bg-[#050510] border border-violet-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"/>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Password <span className="text-slate-600">(min 8 chars)</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}
                  placeholder="At least 8 characters" autoComplete="new-password"
                  className="w-full bg-[#050510] border border-violet-500/20 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
              {password.length>0&&(
                <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${password.length<6?"bg-rose-500 w-1/4":password.length<8?"bg-amber-500 w-1/2":password.length<12?"bg-emerald-500 w-3/4":"bg-emerald-400 w-full"}`}/>
                </div>
              )}
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-2">
              {loading?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Creating account…</span></>:<><span>Create Free Account</span><ArrowRight className="w-4 h-4"/></>}
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign in →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
