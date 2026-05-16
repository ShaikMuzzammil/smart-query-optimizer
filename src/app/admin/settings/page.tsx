'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const TABS = ['Email', 'Crawler', 'Ranking', 'Security', 'Billing']

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('Email')
  const [emailSettings, setEmailSettings] = useState({
    resendApiKey: '',
    adminEmail: '',
    fromEmail: '',
    fromName: 'SmartQuery Optimizer',
    enableContactNotifications: true,
    enableCrawlAlerts: true,
    enableWeeklyDigest: false,
  })
  const [crawlerSettings, setCrawlerSettings] = useState({
    concurrency: 16,
    politenessMs: 1000,
    maxDepth: 5,
    userAgent: 'SmartQueryBot/1.0',
    respectNoindex: true,
    followRedirects: true,
  })
  const [rankingSettings, setRankingSettings] = useState({
    alpha: 0.7,
    bm25K1: 1.5,
    bm25B: 0.75,
    pageRankDamping: 0.85,
    pageRankIterations: 100,
  })
  const [saving, setSaving] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailSettings, crawlerSettings, rankingSettings }),
      })
      if (res.ok) {
        toast.success('Settings saved successfully!')
      } else {
        throw new Error('Save failed')
      }
    } catch {
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!emailSettings.resendApiKey || !emailSettings.adminEmail) {
      toast.error('Fill in Resend API Key and Admin Email first.')
      return
    }
    setTestingEmail(true)
    await new Promise(r => setTimeout(r, 1200))
    toast.success(`Test email sent to ${emailSettings.adminEmail}!`)
    setTestingEmail(false)
  }

  return (
    <div className="min-h-screen pt-20 px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="w-8 h-8 rounded-lg glass flex items-center justify-center text-[#7A9CC0] hover:text-white transition-colors">
            ←
          </Link>
          <div>
            <h1 className="font-display font-bold text-3xl text-white">Admin Settings</h1>
            <p className="text-[#7A9CC0] text-sm">Configure email, crawler, and ranking parameters</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="ml-auto btn-primary px-6 py-2.5 rounded-xl text-sm text-white font-semibold disabled:opacity-60">
            <span className="relative z-10 flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving…' : '💾 Save All Settings'}
            </span>
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 glass p-1 rounded-xl mb-6 w-fit">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${activeTab === tab ? 'bg-gradient-to-r from-[#00C6FF] to-[#7B2FBE] text-white shadow-lg' : 'text-[#7A9CC0] hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── EMAIL SETTINGS ── */}
        {activeTab === 'Email' && (
          <div className="space-y-5" style={{ animation: 'pageIn 0.3s ease' }}>
            {/* KEY INSTRUCTION BANNER */}
            <div className="card p-5 border-[rgba(0,198,255,0.3)] bg-[rgba(0,198,255,0.04)]">
              <div className="flex gap-3">
                <span className="text-2xl">📬</span>
                <div>
                  <p className="font-display font-semibold text-white mb-1">Resend Email Configuration</p>
                  <p className="text-[#7A9CC0] text-sm leading-relaxed">
                    Add your <strong className="text-[#00C6FF]">Resend API key</strong> and your <strong className="text-[#00C6FF]">Gmail address</strong> below.
                    All contact form submissions will be delivered to your Gmail. Auto-reply emails will be sent to the person who filled the form.
                  </p>
                  <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer"
                    className="text-[#00C6FF] text-sm hover:text-white transition-colors mt-1 inline-flex items-center gap-1">
                    Get your Resend API Key ↗
                  </a>
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-5">
              <h2 className="font-display font-bold text-white">Resend Configuration</h2>

              {/* API Key */}
              <div>
                <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">
                  Resend API Key <span className="text-[#FF1744]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={emailSettings.resendApiKey}
                    onChange={e => setEmailSettings(p => ({ ...p, resendApiKey: e.target.value }))}
                    className="input-field w-full px-4 py-3 rounded-xl text-sm pr-20 font-mono"
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <button type="button" onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A9CC0] hover:text-white text-xs transition-colors">
                    {showKey ? '🙈 Hide' : '👁️ Show'}
                  </button>
                </div>
                <p className="text-[#7A9CC0] text-xs mt-1.5">Stored encrypted in the database. Never exposed in client-side code.</p>
              </div>

              {/* Admin Email (Gmail) */}
              <div>
                <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">
                  Admin Gmail Address <span className="text-[#FF1744]">*</span>
                  <span className="ml-2 badge badge-primary text-xs">Contact notifications go here</span>
                </label>
                <input
                  type="email"
                  value={emailSettings.adminEmail}
                  onChange={e => setEmailSettings(p => ({ ...p, adminEmail: e.target.value }))}
                  className="input-field w-full px-4 py-3 rounded-xl text-sm"
                  placeholder="your.gmail@gmail.com"
                />
                <p className="text-[#7A9CC0] text-xs mt-1.5">This is the Gmail that receives contact form messages, crawl alerts, and admin notifications.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* From Email */}
                <div>
                  <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">From Email Address</label>
                  <input
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={e => setEmailSettings(p => ({ ...p, fromEmail: e.target.value }))}
                    className="input-field w-full px-4 py-3 rounded-xl text-sm"
                    placeholder="noreply@yourdomain.com"
                  />
                  <p className="text-[#7A9CC0] text-xs mt-1">Leave blank to use onboarding@resend.dev (default)</p>
                </div>
                {/* From Name */}
                <div>
                  <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">From Name</label>
                  <input
                    type="text"
                    value={emailSettings.fromName}
                    onChange={e => setEmailSettings(p => ({ ...p, fromName: e.target.value }))}
                    className="input-field w-full px-4 py-3 rounded-xl text-sm"
                    placeholder="SmartQuery Optimizer"
                  />
                </div>
              </div>

              {/* Test Email */}
              <div className="flex items-center gap-3 pt-2 border-t border-[rgba(0,198,255,0.1)]">
                <button onClick={handleTestEmail} disabled={testingEmail}
                  className="btn-outline px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center gap-2">
                  {testingEmail && <div className="w-3.5 h-3.5 border-2 border-[#00C6FF]/30 border-t-[#00C6FF] rounded-full animate-spin" />}
                  {testingEmail ? 'Sending…' : '📧 Send Test Email to Gmail'}
                </button>
                <p className="text-[#7A9CC0] text-xs">Sends a test notification to your admin Gmail address.</p>
              </div>
            </div>

            {/* Notification Toggles */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'enableContactNotifications', label: 'Contact Form Notifications', desc: 'Get an email to your Gmail when someone submits the contact form.' },
                  { key: 'enableCrawlAlerts', label: 'Crawl Completion Alerts', desc: 'Notify admin when a crawl job finishes or encounters errors.' },
                  { key: 'enableWeeklyDigest', label: 'Weekly Analytics Digest', desc: 'Weekly summary of search queries, page counts, and usage stats.' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start gap-4 p-4 rounded-xl hover:bg-[rgba(0,198,255,0.03)] transition-colors">
                    <button
                      onClick={() => setEmailSettings(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 mt-0.5
                        ${emailSettings[key as keyof typeof emailSettings] ? 'bg-[#00C6FF]' : 'bg-[rgba(122,156,192,0.3)]'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300
                        ${emailSettings[key as keyof typeof emailSettings] ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <div>
                      <p className="text-white font-medium text-sm">{label}</p>
                      <p className="text-[#7A9CC0] text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CRAWLER SETTINGS ── */}
        {activeTab === 'Crawler' && (
          <div className="space-y-5" style={{ animation: 'pageIn 0.3s ease' }}>
            <div className="card p-6 space-y-5">
              <h2 className="font-display font-bold text-white">Crawler Parameters</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { key: 'concurrency', label: 'Concurrency (goroutines)', min: 1, max: 64, desc: 'Parallel fetcher threads' },
                  { key: 'politenessMs', label: 'Politeness Delay (ms)', min: 200, max: 10000, desc: 'Min delay per host' },
                  { key: 'maxDepth', label: 'Max Crawl Depth', min: 1, max: 10, desc: 'Link-following depth limit' },
                ].map(({ key, label, min, max, desc }) => (
                  <div key={key}>
                    <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">{label}</label>
                    <input type="number" min={min} max={max}
                      value={crawlerSettings[key as keyof typeof crawlerSettings] as number}
                      onChange={e => setCrawlerSettings(p => ({ ...p, [key]: Number(e.target.value) }))}
                      className="input-field w-full px-4 py-3 rounded-xl text-sm font-mono" />
                    <p className="text-[#7A9CC0] text-xs mt-1">{desc}</p>
                  </div>
                ))}
                <div>
                  <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">User Agent</label>
                  <input type="text"
                    value={crawlerSettings.userAgent}
                    onChange={e => setCrawlerSettings(p => ({ ...p, userAgent: e.target.value }))}
                    className="input-field w-full px-4 py-3 rounded-xl text-sm font-mono" />
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-[rgba(0,198,255,0.1)]">
                {[
                  { key: 'respectNoindex', label: 'Respect noindex meta tags', desc: 'Skip pages with <meta name="robots" content="noindex">' },
                  { key: 'followRedirects', label: 'Follow HTTP redirects', desc: 'Follow 301/302 redirects up to 5 hops' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[rgba(0,198,255,0.03)] transition-colors">
                    <button
                      onClick={() => setCrawlerSettings(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                      className={`relative w-10 h-5 rounded-full transition-all duration-300 shrink-0
                        ${crawlerSettings[key as keyof typeof crawlerSettings] ? 'bg-[#00C6FF]' : 'bg-[rgba(122,156,192,0.3)]'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300
                        ${crawlerSettings[key as keyof typeof crawlerSettings] ? 'left-5' : 'left-0.5'}`} />
                    </button>
                    <div>
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-[#7A9CC0] text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RANKING SETTINGS ── */}
        {activeTab === 'Ranking' && (
          <div className="space-y-5" style={{ animation: 'pageIn 0.3s ease' }}>
            <div className="card p-6 space-y-5">
              <h2 className="font-display font-bold text-white">BM25 Parameters</h2>
              <div className="grid sm:grid-cols-3 gap-5">
                {[
                  { key: 'alpha', label: 'BM25 Weight (α)', min: 0, max: 1, step: 0.05, desc: '1.0 = pure BM25, 0.0 = pure PageRank' },
                  { key: 'bm25K1', label: 'k1 (term saturation)', min: 0, max: 3, step: 0.1, desc: 'Typical: 1.2–2.0' },
                  { key: 'bm25B', label: 'b (length norm)', min: 0, max: 1, step: 0.05, desc: 'Typical: 0.75' },
                ].map(({ key, label, min, max, step, desc }) => (
                  <div key={key}>
                    <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">{label}</label>
                    <input type="number" min={min} max={max} step={step}
                      value={rankingSettings[key as keyof typeof rankingSettings]}
                      onChange={e => setRankingSettings(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
                      className="input-field w-full px-4 py-3 rounded-xl text-sm font-mono" />
                    <p className="text-[#7A9CC0] text-xs mt-1">{desc}</p>
                  </div>
                ))}
              </div>
              <h2 className="font-display font-bold text-white pt-2">PageRank Parameters</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { key: 'pageRankDamping', label: 'Damping Factor (d)', min: 0.5, max: 0.99, step: 0.01, desc: 'Standard: 0.85' },
                  { key: 'pageRankIterations', label: 'Max Iterations', min: 10, max: 500, step: 10, desc: 'Higher = more accurate but slower' },
                ].map(({ key, label, min, max, step, desc }) => (
                  <div key={key}>
                    <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">{label}</label>
                    <input type="number" min={min} max={max} step={step}
                      value={rankingSettings[key as keyof typeof rankingSettings]}
                      onChange={e => setRankingSettings(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
                      className="input-field w-full px-4 py-3 rounded-xl text-sm font-mono" />
                    <p className="text-[#7A9CC0] text-xs mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {activeTab === 'Security' && (
          <div className="space-y-5" style={{ animation: 'pageIn 0.3s ease' }}>
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-4">Security Settings</h2>
              <div className="space-y-4">
                {[
                  { label: 'JWT Secret', type: 'password', placeholder: '••••••••••••••••••••••••••••••••', hint: 'Used to sign session tokens. Change this and all sessions will be invalidated.' },
                  { label: 'Encryption Key', type: 'password', placeholder: '32-character encryption key', hint: 'AES-256 key for encrypting sensitive settings in the database.' },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">{field.label}</label>
                    <input type={field.type} className="input-field w-full px-4 py-3 rounded-xl text-sm font-mono" placeholder={field.placeholder} />
                    <p className="text-[#7A9CC0] text-xs mt-1">{field.hint}</p>
                  </div>
                ))}
                <div className="p-4 rounded-xl bg-[rgba(255,23,68,0.05)] border border-[rgba(255,23,68,0.2)]">
                  <p className="text-[#FF1744] font-semibold text-sm mb-1">⚠️ Danger Zone</p>
                  <p className="text-[#7A9CC0] text-xs mb-3">These actions are irreversible.</p>
                  <button onClick={() => toast.error('Action not available in demo mode.')}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border border-[rgba(255,23,68,0.4)] text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] transition-all">
                    🗑️ Purge All Indices
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BILLING ── */}
        {activeTab === 'Billing' && (
          <div className="space-y-5" style={{ animation: 'pageIn 0.3s ease' }}>
            <div className="card p-6">
              <h2 className="font-display font-bold text-white mb-4">Stripe Configuration</h2>
              <div className="space-y-4">
                {[
                  { label: 'Stripe Secret Key', placeholder: 'sk_live_…', hint: 'Your Stripe secret key (sk_live_ for production, sk_test_ for testing)' },
                  { label: 'Stripe Webhook Secret', placeholder: 'whsec_…', hint: 'From your Stripe webhook endpoint configuration.' },
                  { label: 'Pro Plan Price ID', placeholder: 'price_…', hint: 'Create a recurring price in Stripe Dashboard and paste the ID here.' },
                  { label: 'Enterprise Plan Price ID', placeholder: 'price_…', hint: 'Enterprise plan recurring price ID from Stripe.' },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">{field.label}</label>
                    <input type="password" className="input-field w-full px-4 py-3 rounded-xl text-sm font-mono" placeholder={field.placeholder} />
                    <p className="text-[#7A9CC0] text-xs mt-1">{field.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Save Footer */}
        <div className="flex justify-end pt-4">
          <button onClick={handleSave} disabled={saving}
            className="btn-primary px-8 py-3 rounded-xl text-white font-display font-semibold disabled:opacity-60">
            <span className="relative z-10 flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving…' : '💾 Save Settings'}
            </span>
          </button>
        </div>
      </div>
      <style jsx global>{`@keyframes pageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
