"use client";
// app/(auth)/login/page.tsx
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [noAccount, setNoAccount] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setNoAccount(false);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) { setError("Incorrect email or password."); setNoAccount(true); setLoading(false); return; }
      toast.success("Welcome back to QueryForge!");
      router.push("/dashboard");
    } catch { setError("Something went wrong. Please try again."); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#03020d] flex items-center justify-center px-4 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none"/>
      <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{background:"radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 70%)"}}/>

      {/* Home button */}
      <Link href="/" className="fixed top-5 left-5 z-20 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-violet-500/20 bg-[#03020d]/80 hover:bg-violet-500/10 hover:border-violet-500/40 text-slate-400 hover:text-white text-sm font-medium transition-all backdrop-blur-sm">
        <ArrowLeft className="w-4 h-4"/> Back to Home
      </Link>

      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.4}} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-5 h-5 text-white"/>
            </div>
            <span className="font-black text-lg">Query<span className="text-violet-400">Forge</span></span>
          </Link>
          <h1 className="text-2xl font-black mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm">Sign in to your QueryForge account</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {error && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-5">
              <div className="flex items-center gap-2 text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0"/>{error}
              </div>
              {noAccount && (
                <Link href="/register" className="flex items-center gap-1.5 mt-2 text-violet-400 hover:text-violet-300 font-medium text-xs">
                  <UserPlus className="w-3.5 h-3.5"/>No account yet? Create one free →
                </Link>
              )}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full bg-[#050510] border border-violet-500/20 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 glow-violet mt-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Signing in…</span></> : <><span>Sign In</span><ArrowRight className="w-4 h-4"/></>}
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-6">
            No account?{" "}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Create one free →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
