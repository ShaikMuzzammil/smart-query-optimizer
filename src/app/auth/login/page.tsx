'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({email:'',password:''})
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [showP, setShowP] = useState(false)

  const handleSubmit = async(e: React.FormEvent)=>{
    e.preventDefault(); setErr(''); setLoading(true)
    try{
      const res = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form),credentials:'include'})
      const data = await res.json()
      if(res.ok&&data.ok){ localStorage.setItem('sq_user',JSON.stringify(data.user)); router.push('/dashboard') }
      else setErr(data.error||'Login failed')
    }catch{ setErr('Network error') }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'80px 24px'}}>
      <div style={{width:'100%',maxWidth:420,animation:'scaleIn 0.4s ease both'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 0 30px rgba(0,198,255,0.3)'}}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{fontFamily:'Syne',fontWeight:700,fontSize:28,color:'white',marginBottom:8}}>Welcome Back</h1>
          <p style={{color:'#7A9CC0'}}>Sign in to your SmartQuery account</p>
        </div>
        <div className="card" style={{padding:32}}>
          {err&&<div style={{background:'rgba(255,23,68,0.1)',border:'1px solid rgba(255,23,68,0.3)',borderRadius:8,padding:'10px 14px',color:'#FF1744',fontSize:13,marginBottom:16}}>{err}</div>}
          <div style={{background:'rgba(0,198,255,0.06)',border:'1px solid rgba(0,198,255,0.15)',borderRadius:8,padding:'10px 14px',color:'#7A9CC0',fontSize:12,marginBottom:20'}}>
            💡 Sign up first if you don&apos;t have an account yet.
          </div>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <label style={{display:'block',color:'#7A9CC0',fontSize:12,fontWeight:500,marginBottom:6}}>Email</label>
              <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} className="inp" style={{width:'100%',padding:'12px 16px',borderRadius:10,fontSize:14}} placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{display:'block',color:'#7A9CC0',fontSize:12,fontWeight:500,marginBottom:6}}>Password</label>
              <div style={{position:'relative'}}>
                <input type={showP?'text':'password'} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} className="inp" style={{width:'100%',padding:'12px 40px 12px 16px',borderRadius:10,fontSize:14}} placeholder="••••••••" required />
                <button type="button" onClick={()=>setShowP(!showP)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#7A9CC0',fontSize:16}}>{showP?'🙈':'👁️'}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-p" style={{padding:'13px',borderRadius:10,fontSize:14,marginTop:4,opacity:loading?0.7:1}}>
              <span style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
                {loading&&<div style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>}
                {loading?'Signing in…':'Sign In'}
              </span>
            </button>
          </form>
        </div>
        <p style={{textAlign:'center',color:'#7A9CC0',fontSize:14,marginTop:20}}>
          No account? <Link href="/auth/signup" style={{color:'#00C6FF',fontWeight:600,textDecoration:'none'}}>Create one free</Link>
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
