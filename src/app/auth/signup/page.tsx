'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '../../../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})

  const strength = () => {
    const p = form.password; let s = 0
    if (p.length>=8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }
  const sLabel = ['','Weak','Fair','Good','Strong'][strength()]
  const sColor = ['','#FF1744','#FFD600','#00C6FF','#00E676'][strength()]

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.name.trim()) e.name = 'Name required'
    if (!form.email.trim()) e.email = 'Email required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (form.password.length < 8) e.password = 'At least 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e); return !Object.keys(e).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name:form.name, email:form.email, password:form.password }),
        credentials:'include',
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        localStorage.setItem('sq_user', JSON.stringify(data.user))
        toast.success('Account created! Welcome to SmartQuery 🎉')
        setTimeout(() => router.push('/dashboard'), 900)
      } else {
        toast.error(data.error || 'Registration failed')
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
      <main className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-md" style={{animation:'scaleIn 0.4s ease both'}}>
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] items-center justify-center mb-4 glow-primary">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5"/><line x1="10" y1="10" x2="14" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <h1 className="font-display font-bold text-3xl text-white mb-2">Create Your Account</h1>
            <p className="text-[#7A9CC0]">Start with 1,000 free pages — no credit card needed</p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Full Name</label>
                <input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                  className={`input-field w-full px-4 py-3 rounded-xl text-sm ${errors.name?'border-[#FF1744]':''}`}
                  placeholder="Your name" autoComplete="name" />
                {errors.name && <p className="text-[#FF1744] text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Email Address</label>
                <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
                  className={`input-field w-full px-4 py-3 rounded-xl text-sm ${errors.email?'border-[#FF1744]':''}`}
                  placeholder="you@example.com" autoComplete="email" />
                {errors.email && <p className="text-[#FF1744] text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}
                    className={`input-field w-full px-4 py-3 rounded-xl text-sm pr-10 ${errors.password?'border-[#FF1744]':''}`}
                    placeholder="Min. 8 characters" autoComplete="new-password" />
                  <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A9CC0] hover:text-white text-sm">{showPass?'🙈':'👁️'}</button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">{[...Array(4)].map((_,i)=><div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{background:i<strength()?sColor:'rgba(122,156,192,0.2)'}}/>)}</div>
                    <p className="text-xs" style={{color:sColor}}>{sLabel}</p>
                  </div>
                )}
                {errors.password && <p className="text-[#FF1744] text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Confirm Password</label>
                <input type="password" value={form.confirm} onChange={e=>setForm(p=>({...p,confirm:e.target.value}))}
                  className={`input-field w-full px-4 py-3 rounded-xl text-sm ${errors.confirm?'border-[#FF1744]':''}`}
                  placeholder="Repeat password" autoComplete="new-password" />
                {errors.confirm && <p className="text-[#FF1744] text-xs mt-1">{errors.confirm}</p>}
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3.5 rounded-xl text-white font-display font-semibold text-sm disabled:opacity-60">
                <span className="flex items-center justify-center gap-2">
                  {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                  {loading ? 'Creating account…' : '🚀 Create Free Account'}
                </span>
              </button>
              <p className="text-[#7A9CC0] text-xs text-center">
                By signing up you agree to our <Link href="/terms" className="text-[#00C6FF] hover:text-white">Terms</Link> and <Link href="/privacy" className="text-[#00C6FF] hover:text-white">Privacy Policy</Link>.
              </p>
            </form>
          </div>
          <p className="text-center text-[#7A9CC0] text-sm mt-6">
            Already have an account? <Link href="/auth/login" className="text-[#00C6FF] font-semibold hover:text-white transition-colors">Sign in</Link>
          </p>
        </div>
      </main>
    </>
  )
}
