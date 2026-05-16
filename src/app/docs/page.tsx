'use client'
import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

const SECTIONS = [
  { id:'overview', label:'Overview', icon:'📖', title:'Smart Query Optimizer', body:'Production-grade distributed web search engine combining a polite crawler, compressed inverted index, BM25+PageRank hybrid ranking, and a real-time Next.js 14 UI.',
    subs:[
      { title:'Architecture', text:'Three tiers: (1) Crawler — polite multi-threaded frontier crawler with Redis URL queue and Bloom filters; (2) Index Server — gRPC service with BM25 scoring and PageRank; (3) Web App — Next.js 14 App Router, Prisma ORM, Resend email.' },
      { title:'Tech Stack', text:'Next.js 14 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Redis · Resend · bcrypt · JWT · gRPC' },
    ]
  },
  { id:'quickstart', label:'Quick Start', icon:'⚡', title:'Quick Start', body:'Get your own search engine running in under 5 minutes.',
    subs:[
      { title:'1. Install', code:`npm install` },
      { title:'2. Configure Environment', code:`cp .env.example .env.local\n# Fill in DATABASE_URL, RESEND_API_KEY, ADMIN_EMAIL` },
      { title:'3. Push Database Schema', code:`npx prisma db push\nnpx prisma generate` },
      { title:'4. Run', code:`npm run dev\n# Visit http://localhost:3000` },
    ]
  },
  { id:'email', label:'Email Setup', icon:'📬', title:'Email Setup (Resend)', body:'SmartQuery uses Resend to send all emails. Contact form notifications go to your Gmail. Users receive styled auto-replies.',
    subs:[
      { title:'Step 1 — Get Resend API Key', text:'Create a free account at resend.com/api-keys and generate a new key.' },
      { title:'Step 2 — Add to .env.local', code:`RESEND_API_KEY=re_YOUR_KEY_HERE\nADMIN_EMAIL=YOUR_GMAIL@gmail.com\nDEFAULT_FROM_EMAIL=onboarding@resend.dev` },
      { title:'Step 3 — (Optional) Verify Domain', text:'Add a DNS TXT record for your domain at resend.com/domains. Once verified, change DEFAULT_FROM_EMAIL to noreply@yourdomain.com.' },
      { title:'How It Works', text:'Contact form → POST /api/contact → Resend sends (1) admin notification to your Gmail, (2) auto-reply confirmation to the sender. No API keys are exposed to the browser.' },
    ]
  },
  { id:'api', label:'API Reference', icon:'🔌', title:'API Reference', body:'All endpoints are REST. Pass your API key in the Authorization header.',
    subs:[
      { title:'Authentication', code:`Authorization: Bearer sq_live_your_api_key_here` },
      { title:'POST /api/search', code:`curl -X POST https://api.smartquery.io/v1/search \\\n  -H "Authorization: Bearer sq_live_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{"q":"distributed systems","index_id":"idx_123","page":1,"per_page":10}'` },
      { title:'POST /api/indices', code:`curl -X POST https://api.smartquery.io/v1/indices \\\n  -H "Authorization: Bearer sq_live_..." \\\n  -d '{"name":"My Docs","seed_urls":["https://docs.example.com"],"depth":3}'` },
      { title:'GET /api/indices/:id/stats', code:`curl https://api.smartquery.io/v1/indices/idx_123/stats \\\n  -H "Authorization: Bearer sq_live_..."` },
    ]
  },
  { id:'crawler', label:'Crawler', icon:'🕷️', title:'Distributed Crawler', body:'Polite, multi-threaded Mercator-style frontier crawler.',
    subs:[
      { title:'URL Frontier', text:'Redis-backed priority queue with per-host sub-queues to enforce politeness delays. Bloom filters prevent re-crawling duplicate URLs across restarts.' },
      { title:'Robots.txt', text:'Fetches and caches robots.txt for every unique host. Respects Crawl-Delay, Allow/Disallow directives, Sitemap entries, and noindex meta tags.' },
      { title:'Configuration', code:`CRAWLER_CONCURRENCY=16\nCRAWLER_POLITENESS_MS=1000\nCRAWLER_MAX_DEPTH=5\nCRAWLER_USER_AGENT="SmartQueryBot/1.0"` },
    ]
  },
  { id:'ranking', label:'Ranking', icon:'📊', title:'BM25 + PageRank', body:'Hybrid ranking: 70% BM25 text relevance + 30% PageRank authority score.',
    subs:[
      { title:'BM25', text:'Best Match 25 bag-of-words ranking. Parameters k1=1.5, b=0.75 by default. Scores normalised to [0,1] per result set.' },
      { title:'PageRank', text:'Iterative PageRank over in-link graph computed after each full crawl. Damping factor d=0.85, converges in ~100 iterations.' },
      { title:'Hybrid Score Formula', code:`final_score = alpha * bm25_score + (1 - alpha) * pagerank_score\n// Default alpha = 0.7 (tunable per-index in Admin Settings)` },
    ]
  },
  { id:'deployment', label:'Deployment', icon:'🚀', title:'Deployment', body:'Deploy to any Node.js host. Vercel is recommended for the Next.js web app.',
    subs:[
      { title:'Vercel', code:`npm i -g vercel\nvercel\n# Add env vars in Vercel dashboard` },
      { title:'Docker', code:`docker build -t smart-query-optimizer .\ndocker run -p 3000:3000 --env-file .env.local smart-query-optimizer` },
      { title:'Stripe Webhook', text:'Set your Stripe webhook URL to https://your-domain.vercel.app/api/stripe/webhook in the Stripe Dashboard, then paste the webhook secret into STRIPE_WEBHOOK_SECRET.' },
    ]
  },
  { id:'changelog', label:'Changelog', icon:'📋', title:'Changelog', body:'All notable changes to SmartQuery Optimizer.',
    subs:[
      { title:'v2.1.0 — May 2025', text:'• Custom cursor with lerp animation\n• Navbar scroll-based section highlighting\n• Dashboard index expand/detail modal with close button\n• Contact form: no API keys exposed to browser\n• Fixed: 404 page for all unknown routes\n• Removed all pricing pages and references' },
      { title:'v2.0.0 — January 2025', text:'• Next.js 14 App Router migration\n• Resend email integration → Gmail notifications\n• BM25+PageRank hybrid ranking\n• Redis autocomplete with sliding-window cache\n• JWT auth with bcrypt password hashing' },
      { title:'v1.0.0 — July 2024', text:'• Initial release\n• Distributed crawler with Bloom filter deduplication\n• Compressed positional inverted index\n• Basic Next.js UI with search and dashboard' },
    ]
  },
]

export default function DocsPage() {
  const [activeId, setActiveId] = useState('overview')
  const [search, setSearch] = useState('')

  const section = SECTIONS.find(s => s.id === activeId)!
  const filtered = search ? SECTIONS.filter(s => s.label.toLowerCase().includes(search.toLowerCase())) : SECTIONS
  const idx = SECTIONS.findIndex(s => s.id === activeId)
  const prev = SECTIONS[idx - 1]
  const next = SECTIONS[idx + 1]

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 flex">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 hidden lg:flex flex-col">
          <div className="sticky top-16 h-[calc(100vh-4rem)] flex flex-col glass border-r border-[rgba(0,198,255,0.1)] overflow-y-auto">
            <div className="p-4 border-b border-[rgba(0,198,255,0.1)]">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7A9CC0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search docs…" className="input-field w-full pl-9 pr-3 py-2 rounded-lg text-xs" />
              </div>
            </div>
            <nav className="p-3 flex-1">
              <p className="text-[#7A9CC0] text-xs font-semibold uppercase tracking-widest mb-3 px-3">Documentation</p>
              {filtered.map(s => (
                <button key={s.id} onClick={() => { setActiveId(s.id); setSearch('') }}
                  className={`sidebar-link w-full mb-0.5 ${activeId === s.id ? 'active' : ''}`}>
                  <span className="text-sm">{s.icon}</span>
                  <span className="text-sm">{s.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 px-6 lg:px-10 py-12" key={activeId} style={{animation:'pageIn 0.3s ease both'}}>
          <div className="max-w-3xl">
            <span className="badge badge-primary text-xs mb-4">{section.icon} {section.label}</span>
            <h1 className="font-display font-extrabold text-4xl text-white mb-4">{section.title}</h1>
            <p className="text-[#7A9CC0] text-lg leading-relaxed mb-10 border-l-2 border-[rgba(0,198,255,0.3)] pl-4">{section.body}</p>

            <div className="space-y-10">
              {section.subs.map((sub, i) => (
                <div key={i}>
                  <h2 className="font-display font-bold text-xl text-white mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[#00C6FF]/20 to-[#7B2FBE]/20 border border-[rgba(0,198,255,0.2)] flex items-center justify-center text-xs text-[#00C6FF] font-mono shrink-0">{i+1}</span>
                    {sub.title}
                  </h2>
                  {sub.text && <p className="text-[#7A9CC0] leading-relaxed mb-4 whitespace-pre-line">{sub.text}</p>}
                  {sub.code && (
                    <div className="terminal">
                      <div className="terminal-header">
                        <div className="terminal-dot bg-red-500"/><div className="terminal-dot bg-yellow-400"/><div className="terminal-dot bg-green-500"/>
                        <span className="text-[#7A9CC0] text-xs ml-3 font-mono">code</span>
                        <button onClick={() => navigator.clipboard.writeText(sub.code!)} className="ml-auto text-[#7A9CC0] hover:text-white text-xs transition-colors">Copy</button>
                      </div>
                      <pre className="p-4 text-xs leading-relaxed overflow-x-auto text-[#00E676] font-mono">{sub.code}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center justify-between mt-16 pt-8 border-t border-[rgba(0,198,255,0.1)]">
              {prev ? (
                <button onClick={() => setActiveId(prev.id)}
                  className="flex items-center gap-2 text-[#7A9CC0] hover:text-white transition-colors group">
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  <div className="text-left"><div className="text-xs text-[#7A9CC0]">Previous</div><div className="font-semibold text-sm">{prev.label}</div></div>
                </button>
              ) : <div />}
              {next ? (
                <button onClick={() => setActiveId(next.id)}
                  className="flex items-center gap-2 text-[#7A9CC0] hover:text-white transition-colors group text-right">
                  <div><div className="text-xs text-[#7A9CC0]">Next</div><div className="font-semibold text-sm">{next.label}</div></div>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              ) : <div />}
            </div>
          </div>
        </div>

        {/* Right TOC */}
        <aside className="w-48 shrink-0 hidden xl:block">
          <div className="sticky top-24 p-6">
            <p className="text-[#7A9CC0] text-xs font-semibold uppercase tracking-widest mb-3">On this page</p>
            {section.subs.map((sub, i) => (
              <a key={i} href="#" className="block text-[#7A9CC0] hover:text-[#00C6FF] text-xs py-1.5 transition-colors border-l border-[rgba(0,198,255,0.1)] hover:border-[#00C6FF] pl-3">
                {sub.title}
              </a>
            ))}
          </div>
        </aside>
      </main>
      <Footer />
    </>
  )
}
