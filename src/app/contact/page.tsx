'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Contact() {
  const [form, setForm] = useState({name:'',email:'',subject:'',message:''})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async(e: React.FormEvent)=>{
    e.preventDefault(); setErr(''); setLoading(true)
    try{
      await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
      setDone(true)
    }catch{ setErr('Failed to send. Please try again.') }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',padding:'100px 24px 60px',maxWidth:700,margin:'0 auto'}}>
      <Link href="/" style={{color:'#00C6FF',textDecoration:'none',fontSize:14,display:'inline-flex',alignItems:'center',gap:6,marginBottom:36}}>← Back to Home</Link>
      <div className="badge bp" style={{marginBottom:14}}>Contact</div>
      <h1 style={{fontFamily:'Syne',fontWeight:800,fontSize:'clamp(32px,5vw,52px)',color:'white',marginBottom:10}}>Let&apos;s Talk</h1>
      <p style={{color:'#7A9CC0',marginBottom:40,fontSize:16,lineHeight:1.6}}>Questions, bug reports, or partnership inquiries — we reply to everything.</p>
      {done?(
        <div className="card" style={{padding:48,textAlign:'center',animation:'scaleIn 0.3s ease both'}}>
          <div style={{fontSize:60,marginBottom:16}}>✅</div>
          <h2 style={{fontFamily:'Syne',fontWeight:700,fontSize:24,color:'white',marginBottom:8}}>Message Sent!</h2>
          <p style={{color:'#7A9CC0',marginBottom:24}}>We&apos;ll reply to <strong style={{color:'#00C6FF'}}>{form.email}</strong> within a few hours.</p>
          <button onClick={()=>{setDone(false);setForm({name:'',email:'',subject:'',message:''})}} className="btn-o" style={{padding:'10px 24px',borderRadius:10,fontSize:14}}>Send Another</button>
        </div>
      ):(
        <div className="card" style={{padding:32}}>
          {err&&<div style={{background:'rgba(255,23,68,0.1)',border:'1px solid rgba(255,23,68,0.3)',borderRadius:8,padding:'10px 14px',color:'#FF1744',fontSize:13,marginBottom:16}}>{err}</div>}
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div>
                <label style={{display:'block',color:'#7A9CC0',fontSize:12,fontWeight:500,marginBottom:5}}>Name *</label>
                <input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="inp" style={{width:'100%',padding:'11px 14px',borderRadius:10,fontSize:14}} placeholder="Your name" required/>
              </div>
              <div>
                <label style={{display:'block',color:'#7A9CC0',fontSize:12,fontWeight:500,marginBottom:5}}>Email *</label>
                <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} className="inp" style={{width:'100%',padding:'11px 14px',borderRadius:10,fontSize:14}} placeholder="you@example.com" required/>
              </div>
            </div>
            <div>
              <label style={{display:'block',color:'#7A9CC0',fontSize:12,fontWeight:500,marginBottom:5}}>Subject</label>
              <input type="text" value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} className="inp" style={{width:'100%',padding:'11px 14px',borderRadius:10,fontSize:14}} placeholder="Brief subject"/>
            </div>
            <div>
              <label style={{display:'block',color:'#7A9CC0',fontSize:12,fontWeight:500,marginBottom:5}}>Message *</label>
              <textarea value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} className="inp" rows={5} style={{width:'100%',padding:'11px 14px',borderRadius:10,fontSize:14,resize:'none'}} placeholder="Your message (min 10 characters)…" required minLength={10}/>
              <p style={{color:'#7A9CC0',fontSize:11,marginTop:4,textAlign:'right'}}>{form.message.length}/1000</p>
            </div>
            <button type="submit" disabled={loading} className="btn-p" style={{padding:'13px',borderRadius:10,fontSize:14,opacity:loading?0.7:1}}>
              <span style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
                {loading&&<div style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>}
                {loading?'Sending…':'📨 Send Message'}
              </span>
            </button>
            <p style={{color:'#7A9CC0',fontSize:11,textAlign:'center'}}>Your message is delivered to our team. No API keys exposed.</p>
          </form>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
