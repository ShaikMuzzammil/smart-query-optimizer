'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import toast, { Toaster } from 'react-hot-toast'

const TYPING_PHRASES = ['site:github.com machine learning','distributed systems AND performance','next.js optimization 2025','BM25 ranking algorithm','site:arxiv.org transformers']

const FEATURES = [
  { icon:'🕷️', title:'Distributed Crawler', desc:'Polite, Bloom-filter-powered crawler. Crawls millions of pages respecting robots.txt and Crawl-Delay headers automatically.', color:'from-[#00C6FF] to-[#0080FF]', glow:'rgba(0,198,255,0.15)' },
  { icon:'📊', title:'Inverted Index', desc:'Compressed positional postings with var-byte encoding. Supports phrase queries, Boolean operators, and site: filters.', color:'from-[#7B2FBE] to-[#A855F7]', glow:'rgba(123,47,190,0.15)' },
  { icon:'⚡', title:'BM25 + PageRank', desc:'Hybrid ranking combining BM25 text relevance with iterative PageRank authority. Sub-100ms query latency on millions of docs.', color:'from-[#FF6B35] to-[#FF1744]', glow:'rgba(255,107,53,0.15)' },
  { icon:'📡', title:'Real-Time Updates', desc:'WebSocket-powered live crawl status, Redis autocomplete, and streaming search results. Watch your index grow live.', color:'from-[#00E676] to-[#00C6FF]', glow:'rgba(0,230,118,0.15)' },
  { icon:'🔐', title:'Secure Auth', desc:'JWT sessions, bcrypt passwords, per-user API keys with sliding-window rate limiting. Enterprise-grade security.', color:'from-[#FFD600] to-[#FF6B35]', glow:'rgba(255,214,0,0.15)' },
  { icon:'📬', title:'Smart Email Alerts', desc:'Resend-powered transactional emails. Contact form notifications go directly to your Gmail. Auto-replies to users.', color:'from-[#A855F7] to-[#7B2FBE]', glow:'rgba(168,85,247,0.15)' },
]

const HOW = [
  { step:'01', icon:'🕷️', title:'Crawl', desc:'Add seed URLs. Our distributed crawler explores the web politely, following links and respecting robots.txt.' },
  { step:'02', icon:'📁', title:'Index',  desc:'Raw HTML is tokenized, stemmed, and compressed into a positional inverted index with PageRank computation.' },
  { step:'03', icon:'🔍', title:'Search', desc:'BM25+PageRank hybrid scoring delivers sub-second results with autocomplete, facets, and cached page preview.' },
]

const STATS = [
  { value:'10M+', label:'Pages Indexed' },
  { value:'<100ms', label:'Query Latency' },
  { value:'99.9%', label:'Uptime SLA' },
  { value:'2,400+', label:'Active Users' },
]

const TESTIMONIALS = [
  { quote:'SmartQuery replaced our entire Elasticsearch setup. BM25+PageRank gives way better results out of the box.', name:'Arjun Sharma', role:'CTO at Devstack.io', avatar:'AS' },
  { quote:'The crawler is incredibly polite and fast. We indexed 500k pages overnight without a single rate-limit issue.', name:'Priya Menon', role:'Lead Engineer at SearchLabs', avatar:'PM' },
  { quote:'Admin email setup took 2 minutes. Our whole team gets crawl alerts directly in Gmail. Absolutely brilliant.', name:'Rahul Verma', role:'Solo Founder', avatar:'RV' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [typingText, setTypingText] = useState('')
  const [typingIdx, setTypingIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSugg, setShowSugg] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  // Typewriter
  useEffect(() => {
    const phrase = TYPING_PHRASES[typingIdx]
    const speed = deleting ? 35 : 75
    const t = setTimeout(() => {
      if (!deleting && typingText.length < phrase.length) setTypingText(phrase.slice(0, typingText.length+1))
      else if (deleting && typingText.length > 0) setTypingText(typingText.slice(0,-1))
      else if (!deleting) setTimeout(() => setDeleting(true), 2200)
      else { setDeleting(false); setTypingIdx((typingIdx+1) % TYPING_PHRASES.length) }
    }, speed)
    return () => clearTimeout(t)
  }, [typingText, deleting, typingIdx])

  // Stats intersection
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true) }, { threshold:0.3 })
    if (statsRef.current) obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true); setShowSugg(false)
    await new Promise(r => setTimeout(r, 500))
    setResults([
      { title:`${query} — Complete Developer Guide`, url:`docs.smartquery.io/guide`, snippet:`Learn everything about <mark>${query}</mark>. Covers fundamentals, advanced patterns, and production best practices.`, date:'2 days ago', score:'0.94' },
      { title:`Understanding ${query}: A Deep Dive`, url:`blog.smartquery.io/deep-dive`, snippet:`We explore <mark>${query}</mark> from first principles with real benchmarks and code examples.`, date:'5 days ago', score:'0.87' },
      { title:`${query} Performance Benchmarks 2025`, url:`research.smartquery.io/bench`, snippet:`Detailed analysis of <mark>${query}</mark> across different hardware configurations and load patterns.`, date:'1 week ago', score:'0.81' },
    ])
    setSearching(false)
  }

  const handleInput = (val: string) => {
    setQuery(val)
    if (val.length > 1) { setSuggestions([`${val} tutorial`,`${val} best practices`,`${val} examples`,`${val} guide`]); setShowSugg(true) }
    else setShowSugg(false)
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style:{background:'rgba(10,22,48,0.95)',color:'#E8F4FD',border:'1px solid rgba(0,198,255,0.3)',borderRadius:'12px',fontFamily:'Outfit,sans-serif'}, success:{iconTheme:{primary:'#00E676',secondary:'#050B18'}}, error:{iconTheme:{primary:'#FF1744',secondary:'#050B18'}} }} />
      <Navbar />

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/5 w-80 h-80 rounded-full pointer-events-none opacity-20" style={{background:'radial-gradient(circle,#00C6FF,transparent)',animation:'float 8s ease-in-out infinite'}} />
        <div className="absolute bottom-1/3 right-1/5 w-60 h-60 rounded-full pointer-events-none opacity-15" style={{background:'radial-gradient(circle,#7B2FBE,transparent)',animation:'float 11s ease-in-out infinite 2s'}} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 badge badge-primary mb-6" style={{animation:'slideUpIn 0.5s ease both'}}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
            BM25 + PageRank hybrid ranking — now live
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-tight mb-6" style={{animation:'slideUpIn 0.6s ease 0.1s both'}}>
            Search the Web.<br/><span className="gradient-text">Your Way.</span>
          </h1>

          <p className="text-[#7A9CC0] text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{animation:'slideUpIn 0.6s ease 0.2s both'}}>
            Build a production-grade search engine — distributed crawler, compressed inverted index, sub-100ms queries, stunning real-time UI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16" style={{animation:'slideUpIn 0.6s ease 0.3s both'}}>
            <Link href="/auth/signup" className="btn-primary px-8 py-4 rounded-xl text-white font-semibold text-lg glow-primary">
              <span>🚀 Start for Free</span>
            </Link>
            <Link href="/search" className="btn-outline px-8 py-4 rounded-xl text-lg font-semibold">
              🔍 Try Live Demo
            </Link>
          </div>

          {/* Live Search Demo */}
          <div className="max-w-2xl mx-auto" style={{animation:'slideUpIn 0.6s ease 0.4s both'}}>
            <form onSubmit={doSearch} className="relative">
              <div className="search-bar rounded-2xl flex items-center px-5 py-3.5 gap-3">
                <svg className="w-5 h-5 text-[#00C6FF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
                <input type="text" value={query} onChange={e => handleInput(e.target.value)} onFocus={() => query.length>1 && setShowSugg(true)} onBlur={() => setTimeout(()=>setShowSugg(false),180)}
                  placeholder={typingText + '|'}
                  className="flex-1 bg-transparent text-[#E8F4FD] placeholder-[#7A9CC0] outline-none text-sm font-mono" />
                <button type="submit" disabled={searching} className="btn-primary px-5 py-2 rounded-xl text-sm text-white font-semibold shrink-0 disabled:opacity-60">
                  <span>{searching ? '...' : 'Search'}</span>
                </button>
              </div>
              {showSugg && (
                <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl overflow-hidden shadow-2xl z-20" style={{animation:'dropdownIn 0.2s ease both'}}>
                  {suggestions.map((s,i) => (
                    <button key={i} type="button" onClick={() => { setQuery(s); setShowSugg(false) }}
                      className="w-full text-left px-5 py-3 text-sm text-[#7A9CC0] hover:text-white hover:bg-[rgba(0,198,255,0.08)] transition-all flex items-center gap-3">
                      <svg className="w-3.5 h-3.5 text-[#00C6FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </form>
            {results.length>0 && (
              <div className="mt-4 space-y-3 text-left">
                {results.map((r,i) => (
                  <div key={i} className="card p-4" style={{animation:`slideUpIn 0.4s ease ${i*0.07}s both`}}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <a href="/search" className="font-display font-semibold text-[#00C6FF] hover:text-white transition-colors text-sm leading-snug">{r.title}</a>
                      <span className="badge badge-primary text-xs shrink-0">Score: {r.score}</span>
                    </div>
                    <p className="text-[#7A9CC0] text-xs font-mono mb-1.5">{r.url}</p>
                    <p className="text-[#7A9CC0] text-xs leading-relaxed" dangerouslySetInnerHTML={{__html:r.snippet}} />
                    <p className="text-[#7A9CC0] text-xs mt-2 opacity-60">{r.date}</p>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <Link href={`/search?q=${encodeURIComponent(query)}`} className="text-[#00C6FF] text-sm hover:text-white transition-colors">
                    View all results →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 px-6" ref={statsRef}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          {STATS.map(s => (
            <div key={s.label} className={`text-center card p-6 transition-all duration-700 ${statsVisible?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
              <div className="stat-value text-3xl md:text-4xl mb-2">{s.value}</div>
              <div className="text-[#7A9CC0] text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-7xl mx-auto" />

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge badge-primary mb-4">How It Works</span>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-3">Three Steps to Your Own Search Engine</h2>
            <p className="text-[#7A9CC0] text-lg max-w-xl mx-auto">From seed URL to sub-second results in minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW.map((step,i) => (
              <div key={step.step} className="card p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 font-display font-extrabold text-8xl text-white/[0.03] leading-none select-none">{step.step}</div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <span className="badge badge-primary mb-3 text-xs">Step {step.step}</span>
                <h3 className="font-display font-bold text-xl text-white mb-3">{step.title}</h3>
                <p className="text-[#7A9CC0] leading-relaxed text-sm">{step.desc}</p>
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#00C6FF] to-transparent w-0 group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge badge-primary mb-4">Features</span>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white mb-3">Everything a Search Engine Needs</h2>
            <p className="text-[#7A9CC0] text-lg max-w-xl mx-auto">From the crawler to the query server — every component is production-grade.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-6 group relative overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{background:`radial-gradient(circle at 50% 0%,${f.glow},transparent 70%)`}} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}>{f.icon}</div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{f.title}</h3>
                <p className="text-[#7A9CC0] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CRAWLER TERMINAL ── */}
      <section id="crawler" className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="badge badge-primary mb-4">Live Crawler</span>
            <h2 className="font-display font-bold text-4xl text-white mb-4">Watch Your Index Grow in Real Time</h2>
            <p className="text-[#7A9CC0] leading-relaxed mb-6">WebSocket-powered live crawl monitoring. Every page discovered, every link followed — streamed directly to your dashboard.</p>
            <ul className="space-y-2.5">
              {['Bloom filter deduplication','robots.txt compliance','Per-host politeness delay','Auto-pause on error spike'].map(item => (
                <li key={item} className="flex items-center gap-3 text-[#7A9CC0] text-sm">
                  <span className="w-5 h-5 rounded-full bg-[rgba(0,230,118,0.15)] border border-[rgba(0,230,118,0.3)] flex items-center justify-center text-[#00E676] text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link href="/auth/signup" className="btn-primary px-6 py-3 rounded-xl text-white font-semibold inline-flex">
                <span>Start Crawling Free</span>
              </Link>
            </div>
          </div>
          <div className="terminal scan-line-container">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500" /><div className="terminal-dot bg-yellow-400" /><div className="terminal-dot bg-green-500" />
              <span className="text-[#7A9CC0] text-xs ml-3">crawler.log — live</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            </div>
            <div className="p-4 space-y-1.5 text-xs leading-relaxed h-72 overflow-hidden">
              {[
                ['12:34:01','text-[#7A9CC0]','Starting crawler — seed: docs.smartquery.io'],
                ['12:34:02','text-[#00C6FF]','Fetching robots.txt → Allow: /'],
                ['12:34:02','text-[#00E676]','✓ Indexed: /docs/bm25 (245 tokens)'],
                ['12:34:03','text-[#00E676]','✓ Indexed: /docs/crawler (189 tokens)'],
                ['12:34:03','text-[#7A9CC0]','Politeness delay: 1.2s for this host'],
                ['12:34:04','text-[#00E676]','✓ Indexed: /blog/pagerank (302 tokens)'],
                ['12:34:05','text-[#FFD600]','⚠ Skipping: /private (noindex meta)'],
                ['12:34:05','text-[#00E676]','✓ Indexed: /docs/api (98 tokens)'],
                ['12:34:06','text-[#00C6FF]','New domain: blog.smartquery.io → fetching robots'],
                ['12:34:07','text-[#00E676]','✓ Indexed: /blog/distributed-search (441 tokens)'],
                ['12:34:07','text-[#7A9CC0]','Pages: 47 | Errors: 0 | Queue: 312'],
                ['12:34:08','text-[#00E676]','✓ Indexed: /blog/inverted-index (288 tokens)'],
              ].map(([t,c,m],i) => (
                <div key={i} className="flex gap-3" style={{animation:`fadeInLine 0.3s ease ${i*0.14}s both`}}>
                  <span className="text-[#7A9CC0] shrink-0">[{t}]</span>
                  <span className={c}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-4xl text-white mb-3">Loved by Developers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t,i) => (
              <div key={i} className="card p-6">
                <div className="flex mb-3">{[...Array(5)].map((_,j) => <span key={j} className="text-[#FFD600] text-sm">★</span>)}</div>
                <p className="text-[#7A9CC0] text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center text-white text-xs font-bold font-display">{t.avatar}</div>
                  <div><div className="text-white text-sm font-semibold font-display">{t.name}</div><div className="text-[#7A9CC0] text-xs">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,198,255,0.05)] to-[rgba(123,47,190,0.05)]" />
            <div className="relative z-10">
              <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-4">
                Ready to Build Your<br/><span className="gradient-text">Search Engine?</span>
              </h2>
              <p className="text-[#7A9CC0] text-lg mb-8 max-w-xl mx-auto">Start free. No credit card. Index your first pages today.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="btn-primary px-8 py-4 rounded-xl text-white font-semibold text-lg"><span>🚀 Get Started Free</span></Link>
                <Link href="/docs" className="btn-outline px-8 py-4 rounded-xl text-lg font-semibold">Read the Docs</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
