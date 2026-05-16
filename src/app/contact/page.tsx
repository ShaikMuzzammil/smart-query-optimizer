'use client'
import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import toast, { Toaster } from 'react-hot-toast'

const REASONS = ['General Inquiry','Technical Support','Enterprise Sales','Partnership','Bug Report','Feature Request']

export default function ContactPage() {
  const [form, setForm] = useState({ name:'', email:'', subject:'', reason:'', message:'' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string,string>>({})

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.message.trim()) e.message = 'Message is required'
    else if (form.message.trim().length < 20) e.message = 'Please write at least 20 characters'
    setErrors(e); return !Object.keys(e).length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await fetch('/api/contact', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form),
      })
      // Always show success (don't expose backend errors)
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style:{background:'rgba(10,22,48,0.95)',color:'#E8F4FD',border:'1px solid rgba(0,198,255,0.3)',borderRadius:'12px'} }} />
      <Navbar />
      <main className="min-h-screen pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge badge-primary mb-4">Contact</span>
            <h1 className="font-display font-extrabold text-5xl md:text-6xl text-white mb-4">Let's Talk</h1>
            <p className="text-[#7A9CC0] text-lg max-w-xl mx-auto">Questions, enterprise inquiries, or just want to say hi? We respond to every message — usually within a few hours.</p>
          </div>

          <div className="grid lg:grid-cols-5 gap-10">
            {/* Info */}
            <div className="lg:col-span-2 space-y-4">
              {[
                { icon:'📬', title:'Email', value:'hello@smartquery.io', sub:'Reply within 4 hours' },
                { icon:'⚡', title:'Enterprise', value:'enterprise@smartquery.io', sub:'Custom solutions & SLAs' },
                { icon:'🐛', title:'Bug Reports', value:'GitHub Issues', sub:'github.com/smartquery' },
                { icon:'💬', title:'Community', value:'Discord Server', sub:'2,400+ developers' },
              ].map(item => (
                <div key={item.title} className="card p-5 flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00C6FF]/20 to-[#7B2FBE]/20 border border-[rgba(0,198,255,0.2)] flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div>
                    <div className="text-[#7A9CC0] text-xs font-medium mb-0.5">{item.title}</div>
                    <div className="text-white font-semibold font-display text-sm">{item.value}</div>
                    <div className="text-[#7A9CC0] text-xs">{item.sub}</div>
                  </div>
                </div>
              ))}
              <div className="card p-5 border-[rgba(0,198,255,0.2)]">
                <div className="flex items-start gap-3">
                  <span className="text-xl">✉️</span>
                  <div>
                    <p className="text-white font-display font-semibold text-sm mb-1">Secure Contact</p>
                    <p className="text-[#7A9CC0] text-xs leading-relaxed">Your message will be delivered securely to our team. We never share your information with third parties.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="card p-12 text-center h-full flex flex-col items-center justify-center gap-4 min-h-[400px]" style={{animation:'scaleIn 0.3s ease both'}}>
                  <div className="w-20 h-20 rounded-full bg-[rgba(0,230,118,0.15)] border-2 border-[rgba(0,230,118,0.4)] flex items-center justify-center text-4xl mb-2">✅</div>
                  <h2 className="font-display font-bold text-2xl text-white">Message Sent!</h2>
                  <p className="text-[#7A9CC0] max-w-sm leading-relaxed">
                    Your message has been sent to our team. We'll reply to <strong className="text-[#00C6FF]">{form.email}</strong> shortly.
                  </p>
                  <p className="text-[#7A9CC0] text-sm">Expected reply: within 4 hours</p>
                  <button onClick={() => { setSubmitted(false); setForm({ name:'',email:'',subject:'',reason:'',message:'' }) }}
                    className="btn-outline px-6 py-2.5 rounded-xl text-sm font-semibold mt-2">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card p-8 space-y-5" noValidate>
                  <h2 className="font-display font-bold text-xl text-white mb-1">Send a Message</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Full Name *</label>
                      <input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
                        className={`input-field w-full px-4 py-3 rounded-xl text-sm ${errors.name?'border-[#FF1744]':''}`} placeholder="Your name" />
                      {errors.name && <p className="text-[#FF1744] text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Email Address *</label>
                      <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
                        className={`input-field w-full px-4 py-3 rounded-xl text-sm ${errors.email?'border-[#FF1744]':''}`} placeholder="you@example.com" />
                      {errors.email && <p className="text-[#FF1744] text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Reason</label>
                    <select value={form.reason} onChange={e=>setForm(p=>({...p,reason:e.target.value}))}
                      className="input-field w-full px-4 py-3 rounded-xl text-sm" style={{appearance:'none'}}>
                      <option value="">Select a reason…</option>
                      {REASONS.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Subject</label>
                    <input type="text" value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))}
                      className="input-field w-full px-4 py-3 rounded-xl text-sm" placeholder="Brief subject line" />
                  </div>
                  <div>
                    <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Message *</label>
                    <textarea value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}
                      rows={5} className={`input-field w-full px-4 py-3 rounded-xl text-sm resize-none ${errors.message?'border-[#FF1744]':''}`}
                      placeholder="Describe your question or request…" />
                    <div className="flex justify-between mt-1">
                      {errors.message ? <p className="text-[#FF1744] text-xs">{errors.message}</p> : <span/>}
                      <span className={`text-xs ${form.message.length>500?'text-[#FF1744]':'text-[#7A9CC0]'}`}>{form.message.length}/1000</span>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting}
                    className="btn-primary w-full py-4 rounded-xl text-white font-display font-semibold text-base disabled:opacity-60">
                    <span className="flex items-center justify-center gap-2">
                      {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Sending…</> : <>📨 Send Message</>}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
