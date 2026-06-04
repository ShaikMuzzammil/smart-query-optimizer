'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const CATS = [
  { id:'general', label:'General Question', icon:'💬' },
  { id:'bug',     label:'Bug Report',       icon:'🐛' },
  { id:'feature', label:'Feature Request',  icon:'✨' },
  { id:'enterprise',label:'Enterprise',     icon:'🏢' },
]

export default function ContactPage() {
  const [form, setForm]     = useState({ name:'', email:'', subject:'', category:'general', message:'' })
  const [sending, setSend]  = useState(false)
  const [sent, setSent]     = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.name.trim())                                     e.name    = 'Name is required'
    if (!form.email.trim())                                    e.email   = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email   = 'Invalid email'
    if (!form.subject.trim())                                  e.subject = 'Subject is required'
    if (form.message.length < 10)                              e.message = 'Message too short (min 10 chars)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setSend(true)
    try {
      const res  = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Send failed')
      setSent(true)
    } catch(e:any) { setErrors({ submit: e.message }) }
    finally { setSend(false) }
  }

  const inp = (field: string, val: string) => { setForm(f=>({...f,[field]:val})); if (errors[field]) setErrors(e=>({...e,[field]:''})) }

  const inputStyle = (field: string) => ({
    width:'100%', padding:'11px 14px', background:'rgba(10,22,48,0.8)', border:`1px solid ${errors[field]?'rgba(255,23,68,0.5)':'rgba(0,198,255,0.18)'}`, borderRadius:9, color:'#E8F4FD', fontSize:14, outline:'none', fontFamily:'Outfit,sans-serif', boxSizing:'border-box' as const, transition:'border-color 0.2s',
  })

  if (sent) return (
    <>
      <Navbar />
      <main style={{ minHeight:'100vh', paddingTop:90, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', maxWidth:440, padding:'0 24px' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#00E676,#00C6FF)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:36 }}>✅</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', marginBottom:12 }}>Message Sent!</h1>
          <p style={{ color:'#7A9CC0', lineHeight:1.7, marginBottom:28 }}>Thanks <strong style={{color:'#E8F4FD'}}>{form.name}</strong>! We'll reply to <strong style={{color:'#00C6FF'}}>{form.email}</strong> within 24–48 hours.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button onClick={()=>setSent(false)} className="btn-o" style={{ padding:'11px 24px', borderRadius:10, fontSize:14, cursor:'pointer' }}>Send Another</button>
            <Link href="/optimizer" className="btn-p" style={{ padding:'11px 24px', borderRadius:10, fontSize:14, textDecoration:'none' }}><span>Try Optimizer</span></Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )

  return (
    <>
      <Navbar />
      <main style={{ minHeight:'100vh', paddingTop:90, paddingBottom:80 }}>
        <div style={{ maxWidth:860, margin:'0 auto', padding:'0 20px' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(0,198,255,0.08)', border:'1px solid rgba(0,198,255,0.2)', borderRadius:100, padding:'4px 14px', fontSize:11, color:'#00C6FF', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:14 }}>Contact</div>
            <h1 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:10 }}>Get in <span className="gtext">Touch</span></h1>
            <p style={{ color:'#7A9CC0', fontSize:16 }}>Questions, bugs, or enterprise pricing? We respond within 24 hours.</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:24 }}>
            {/* Sidebar */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontSize:22, marginBottom:10 }}>⏱</div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Response Time</div>
                <div style={{ color:'#7A9CC0', fontSize:13 }}>24–48 hours</div>
              </div>
              <div className="card" style={{ padding:16 }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:600, fontSize:13, marginBottom:10, color:'#7A9CC0', textTransform:'uppercase', letterSpacing:'0.06em' }}>Topic</div>
                {CATS.map(c => (
                  <button key={c.id} onClick={()=>inp('category',c.id)}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, marginBottom:4, border:`1px solid ${form.category===c.id?'rgba(0,198,255,0.3)':'transparent'}`, background:form.category===c.id?'rgba(0,198,255,0.08)':'transparent', color:form.category===c.id?'#00C6FF':'#7A9CC0', fontSize:13, cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                    <span>{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="glass" style={{ borderRadius:16, padding:'32px 28px', display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>Name <span style={{color:'#FF1744'}}>*</span></label>
                  <input value={form.name} onChange={e=>inp('name',e.target.value)} placeholder="Your name" style={inputStyle('name')}
                    onFocus={e=>(e.target.style.borderColor='#00C6FF')} onBlur={e=>(e.target.style.borderColor=errors.name?'rgba(255,23,68,0.5)':'rgba(0,198,255,0.18)')} />
                  {errors.name && <div style={{color:'#FF1744',fontSize:11,marginTop:4}}>{errors.name}</div>}
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>Email <span style={{color:'#FF1744'}}>*</span></label>
                  <input type="email" value={form.email} onChange={e=>inp('email',e.target.value)} placeholder="you@company.com" style={inputStyle('email')}
                    onFocus={e=>(e.target.style.borderColor='#00C6FF')} onBlur={e=>(e.target.style.borderColor=errors.email?'rgba(255,23,68,0.5)':'rgba(0,198,255,0.18)')} />
                  {errors.email && <div style={{color:'#FF1744',fontSize:11,marginTop:4}}>{errors.email}</div>}
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>Subject <span style={{color:'#FF1744'}}>*</span></label>
                <input value={form.subject} onChange={e=>inp('subject',e.target.value)} placeholder="Brief description" style={inputStyle('subject')}
                  onFocus={e=>(e.target.style.borderColor='#00C6FF')} onBlur={e=>(e.target.style.borderColor=errors.subject?'rgba(255,23,68,0.5)':'rgba(0,198,255,0.18)')} />
                {errors.subject && <div style={{color:'#FF1744',fontSize:11,marginTop:4}}>{errors.subject}</div>}
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>Message <span style={{color:'#FF1744'}}>*</span></label>
                <textarea value={form.message} onChange={e=>inp('message',e.target.value)} rows={6} placeholder="Describe your question or issue…"
                  style={{ ...inputStyle('message'), resize:'none' } as any}
                  onFocus={e=>(e.target.style.borderColor='#00C6FF')} onBlur={e=>(e.target.style.borderColor=errors.message?'rgba(255,23,68,0.5)':'rgba(0,198,255,0.18)')} />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  {errors.message ? <div style={{color:'#FF1744',fontSize:11}}>{errors.message}</div> : <span />}
                  <span style={{color:'#445566',fontSize:11}}>{form.message.length}/5000</span>
                </div>
              </div>

              {errors.submit && <div style={{color:'#FF1744',fontSize:13,padding:'10px 14px',background:'rgba(255,23,68,0.08)',borderRadius:8}}>⚠ {errors.submit}</div>}

              <button type="submit" disabled={sending} className="btn-p"
                style={{ padding:'13px', borderRadius:10, fontSize:15, fontWeight:700, border:'none', cursor:sending?'not-allowed':'pointer', opacity:sending?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {sending ? (
                  <><div style={{width:16,height:16,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',animation:'spin 0.8s linear infinite'}} /><span>Sending…</span></>
                ) : <span>📨 Send Message</span>}
              </button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
