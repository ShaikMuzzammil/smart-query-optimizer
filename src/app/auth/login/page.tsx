'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '../../../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        // Store user in localStorage for client-side nav
        localStorage.setItem('sq_user', JSON.stringify(data.user))
        toast.success(`Welcome back, ${data.user.name}!`)
        setTimeout(() => router.push('/dashboard'), 800)
      } else {
        toast.error(data.error || 'Invalid email or password')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style:{background:'rgba(10,22,48,0.95)',color:'#E8F4FD',border:'1px solid rgba(0,198,255,0.3)',borderRadius:'12px'} }} />
      <Navbar />
      <main className="min-h-screen flex items-center justify-center px-6 pt-20 pb-10">
        <div className="w-full max-w-md" style={{animation:'scaleIn 0.4s ease both'}}>
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] items-center justify-center mb-4 glow-primary">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5"/><line x1="10" y1="10" x2="14" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <h1 className="font-display font-bold text-3xl text-white mb-2">Welcome Back</h1>
            <p className="text-[#7A9CC0]">Sign in to your SmartQuery account</p>
          </div>

          <div className="card p-8">
            {/* Demo credentials notice */}
            <div className="mb-5 p-3 rounded-xl bg-[rgba(0,198,255,0.06)] border border-[rgba(0,198,255,0.15)]">
              <p className="text-[#7A9CC0] text-xs text-center">
                💡 Demo: use any email + password (min 8 chars) to register first, then log in.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))}
                  className={`input-field w-full px-4 py-3 rounded-xl text-sm ${errors.email?'border-[#FF1744]':''}`}
                  placeholder="you@example.com" autoComplete="email" />
                {errors.email && <p className="text-[#FF1744] text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[#7A9CC0] text-xs font-medium">Password</label>
                </div>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))}
                    className={`input-field w-full px-4 py-3 rounded-xl text-sm pr-10 ${errors.password?'border-[#FF1744]':''}`}
                    placeholder="••••••••" autoComplete="current-password" />
                  <button type="button" onClick={()=>setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A9CC0] hover:text-white transition-colors text-sm">
                    {showPass?'🙈':'👁️'}
                  </button>
                </div>
                {errors.password && <p className="text-[#FF1744] text-xs mt-1">{errors.password}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3.5 rounded-xl text-white font-display font-semibold text-sm disabled:opacity-60">
                <span className="flex items-center justify-center gap-2">
                  {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Signing in…' : 'Sign In'}
                </span>
              </button>
            </form>
          </div>

          <p className="text-center text-[#7A9CC0] text-sm mt-6">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-[#00C6FF] font-semibold hover:text-white transition-colors">Create one free</Link>
          </p>
        </div>
      </main>
    </>
  )
}
