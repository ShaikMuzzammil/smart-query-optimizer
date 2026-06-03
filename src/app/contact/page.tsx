'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Mail, MessageSquare, Tag, User } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import type { ContactFormData } from '@/types';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'general',    label: 'General Question', icon: '💬' },
  { id: 'bug',        label: 'Bug Report',        icon: '🐛' },
  { id: 'feature',    label: 'Feature Request',   icon: '✨' },
  { id: 'billing',    label: 'Billing',           icon: '💳' },
  { id: 'enterprise', label: 'Enterprise',        icon: '🏢' },
];

export default function ContactPage() {
  const [form, setForm]       = useState<ContactFormData>({
    name: '', email: '', subject: '', category: 'general', message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [errors, setErrors]   = useState<Partial<ContactFormData>>({});

  const validate = (): boolean => {
    const e: Partial<ContactFormData> = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.message.trim()) e.message = 'Message is required';
    else if (form.message.length < 20) e.message = 'Message must be at least 20 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    try {
      const res  = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Send failed');
      setSent(true);
      toast.success('Message sent successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const update = (field: keyof ContactFormData, val: string) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  if (sent) {
    return (
      <main>
        <Navbar />
        <section className="min-h-screen pt-28 pb-20 flex items-center">
          <div className="container-max max-w-md text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00ff88] to-[#00d4ff] flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-black" />
              </div>
              <h1 className="text-3xl font-display font-black text-white mb-4">Message Sent!</h1>
              <p className="text-[#8899bb] mb-8">
                Thanks for reaching out, <strong className="text-white">{form.name}</strong>.
                We'll get back to you at <strong className="text-[#00d4ff]">{form.email}</strong> within 24–48 hours.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setSent(false)} className="btn-secondary px-6 py-3 text-sm">
                  Send Another
                </button>
                <a href="/optimizer" className="btn-primary px-6 py-3 text-sm">
                  Try Optimizer
                </a>
              </div>
            </motion.div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <section className="min-h-screen pt-28 pb-20">
        <div className="container-max max-w-5xl">
          <div className="text-center mb-12">
            <span className="badge badge-cyan mb-4 inline-flex">Contact Us</span>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4">
              Get in <span className="text-gradient-cyber">Touch</span>
            </h1>
            <p className="text-[#8899bb] text-lg">Have a question, bug report, or want to discuss enterprise pricing? We respond within 24 hours.</p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Info sidebar */}
            <div className="lg:col-span-2 space-y-4">
              {[
                { icon: Mail, title: 'Email', desc: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'hello@smart-query-optimizer.vercel.app', color: '#00d4ff' },
                { icon: MessageSquare, title: 'Response Time', desc: 'Within 24–48 hours', color: '#8b5cf6' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="glass-card p-5 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}18`, border: `1px solid ${color}25` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{title}</div>
                    <div className="text-[#8899bb] text-sm">{desc}</div>
                  </div>
                </div>
              ))}

              <div className="glass-card p-5">
                <h3 className="text-white font-semibold mb-3 text-sm">Topic</h3>
                <div className="space-y-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => update('category', cat.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        form.category === cat.id
                          ? 'bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]'
                          : 'text-[#8899bb] hover:text-white hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="glass-card p-7 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-1.5">
                      <User size={13} className="inline mr-1.5 mb-0.5" />
                      Name <span className="text-[#ff0080]">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                      placeholder="Your name"
                      className={`form-input ${errors.name ? 'error' : ''}`}
                      maxLength={100}
                    />
                    {errors.name && <p className="text-[#ff0080] text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-1.5">
                      <Mail size={13} className="inline mr-1.5 mb-0.5" />
                      Email <span className="text-[#ff0080]">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      placeholder="you@company.com"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                    />
                    {errors.email && <p className="text-[#ff0080] text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">
                    <Tag size={13} className="inline mr-1.5 mb-0.5" />
                    Subject <span className="text-[#ff0080]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => update('subject', e.target.value)}
                    placeholder="Brief description"
                    className={`form-input ${errors.subject ? 'error' : ''}`}
                    maxLength={200}
                  />
                  {errors.subject && <p className="text-[#ff0080] text-xs mt-1">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-1.5">
                    <MessageSquare size={13} className="inline mr-1.5 mb-0.5" />
                    Message <span className="text-[#ff0080]">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={e => update('message', e.target.value)}
                    rows={6}
                    placeholder="Describe your question or issue in detail…"
                    className={`form-input resize-none ${errors.message ? 'error' : ''}`}
                    maxLength={5000}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.message ? (
                      <p className="text-[#ff0080] text-xs">{errors.message}</p>
                    ) : <span />}
                    <span className="text-[#445566] text-xs">{form.message.length}/5000</span>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={sending}
                  whileHover={!sending ? { scale: 1.01 } : {}}
                  whileTap={!sending ? { scale: 0.98 } : {}}
                  className="btn-primary w-full py-4 text-sm justify-center gap-2 relative overflow-hidden"
                >
                  {sending ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 rounded-full border-2 border-black border-t-transparent"
                      />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
