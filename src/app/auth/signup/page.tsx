'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const router = useRouter()
  const [form, setForm] = useState({name:'',email:'',password:'',confirm:''})
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [showP, setShowP] = useState(false)

  const strength = ()=>{const p=form.password;let s=0;if(p.length>=8)s++;if(/[A-Z]/.test(p))s++;if(/[0-9]/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;return s}
  const sColor = ['','#FF1744','#FFD600','#00C6FF','#00E676'][strength()]
  const sLabel = ['','Weak','Fair','Good','Strong'][strength()]

  const handleSubmit = async(e: React.FormEvent)=>{
    e.preventDefault(); setErr('')
    if(form.password!==form.confirm){setErr('Passwords do not match');return}
    if(form.password.length<8){setErr('Password must be at least 8 characters');return}
    setLoading(true)
    try{
      const res = await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.name,email:form.email,password:form.password}),credentials:'include'})
      const data = await res.json()
      if(res.ok&&data.ok){ localStorage.setItem('sq_user',JSON.stringify(data.user)); router.push('/dashboard') }
      else setErr(data.error||'Registration failed')
    }catch{ setErr('Network error') }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'80px 24px'}}>
      <div style={{width:'100%',maxWidth:440,animation:'scaleIn 0.4s ease both'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 0 30px rgba(0,198,255,0.3)'}}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{fontFamily:'Syne',fontWeight:700,fontSize:28,color:'white',marginBottom:8}}>Create Account</h1>
          <p style={{color:'#7A9CC0'}}>Free forever. No credit card needed.</p>
        </div>
        <div className="card" style={{padding:32}}>
          {err&&<div style={{background:'rgba(255,23,68,0.1)',border:'1px solid rgba(255,23,68,0.3)',borderRadius:8,padding:'10px 14px',color:'#FF1744',fontSize:13,marginBottom:16}}>{err}</div>}
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
            {[{k:'name',l:'Full Name',t:'text',ph:'Your name'},{k:'email',l:'Email',t:'email',ph:'you@example.com'}].map(f=>(
              <div key={f.k}>
                <label style={{display:'block',color:'#7A9CC0',fontSize:12,fontWeight:500,marginBottom:5}}>{f.l}</label>
                <input type={f.t} value={form[f.k as keyof typeof form]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} className="inp" style={{width:'100%',padding:'11px 15px',borderRadius:10,fontSize:14}} placeholder={f.ph} required />
              </div>
            ))}
            <div>
              <label style={{display:'block',color:'#7A9CC0',fontSize:12,fontWeight:500,marginBottom:5}}>Password</label>
              <div style={{position:'relative'}}>
                <input type={showP?'text':'password'} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} className="inp" style={{width:'100%',padding:'11px 38px 11px 15px',borderRadius:10,fontSize:14}} placeholder="Min 8 chars" required />
                <button type="button" onClick={()=>setShowP(!showP)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#7A9CC0',fontSize:15}}>{showP?'🙈':'👁️'}</button>
              </div>
              {form.password&&<div style={{marginTop:8}}>
                <div style={{display:'flex',gap:3,marginBottom:4}}>{[...Array(4)].map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<strength()?sColor:'rgba(122,156,192,0.2)',transition:'background 0.3s'}}/>)}</div>
                <p style={{color:sColor,fontSize:11}}>{sLabel}</p>
              </div>}
            </div>
            <div>
              <label style={{display:'block',color:'#7A9CC0',fontSize:12,fontWeight:500,marginBottom:5}}>Confirm Password</label>
              <input type="password" value={form.confirm} onChange={e=>setForm(p=>({...p,confirm:e.target.value}))} className="inp" style={{width:'100%',padding:'11px 15px',borderRadius:10,fontSize:14}} placeholder="Repeat password" required />
            </div>
            <button type="submit" disabled={loading} className="btn-p" style={{padding:'13px',borderRadius:10,fontSize:14,marginTop:4,opacity:loading?0.7:1}}>
              <span style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
                {loading&&<div style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>}
                {loading?'Creating…':'🚀 Create Free Account'}
              </span>
            </button>
          </form>
        </div>
        <p style={{textAlign:'center',color:'#7A9CC0',fontSize:14,marginTop:20}}>
          Already have an account? <Link href="/auth/login" style={{color:'#00C6FF',fontWeight:600,textDecoration:'none'}}>Sign in</Link>
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
