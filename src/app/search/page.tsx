'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'

const MOCK_RESULTS = (q: string) => [
  { title:`${q} — Complete Developer Guide 2025`, url:`docs.smartquery.io/guides/${q.replace(/\s/g,'-')}`, snippet:`Everything about <mark>${q}</mark>. Covers fundamentals, advanced patterns, performance optimization, and real-world production case studies.`, date:'2 days ago', domain:'docs.smartquery.io', pageRank:0.92, cached:true, size:'48 KB' },
  { title:`Understanding ${q}: A Deep Dive`, url:`blog.smartquery.io/deep-dive`, snippet:`We explore <mark>${q}</mark> from first principles — how it emerged, why it matters, and how to implement it at scale with benchmarks.`, date:'5 days ago', domain:'blog.smartquery.io', pageRank:0.87, cached:true, size:'62 KB' },
  { title:`${q} Performance Benchmarks — 2025`, url:`research.smartquery.io/benchmarks`, snippet:`Detailed performance analysis of <mark>${q}</mark> across hardware configurations. Throughput, latency, and memory usage under load.`, date:'1 week ago', domain:'research.smartquery.io', pageRank:0.81, cached:false, size:'124 KB' },
  { title:`Stack Overflow: Best practices for ${q}`, url:`stackoverflow.com/questions/tagged/${q.replace(/\s/g,'+')}`, snippet:`Top-voted answers on <mark>${q}</mark> best practices — curated by thousands of engineers with working code examples.`, date:'2 weeks ago', domain:'stackoverflow.com', pageRank:0.95, cached:true, size:'28 KB' },
  { title:`GitHub: Open Source ${q} Libraries`, url:`github.com/topics/${q.replace(/\s/g,'-')}`, snippet:`Explore open-source repositories implementing <mark>${q}</mark>. Sorted by stars, forks, and recent activity.`, date:'1 month ago', domain:'github.com', pageRank:0.98, cached:false, size:'15 KB' },
]

const DOMAIN_FILTERS = ['All', 'docs.smartquery.io', 'blog.smartquery.io', 'stackoverflow.com', 'github.com']
const DATE_FILTERS = ['Any time', 'Last 24h', 'Last week', 'Last month']

function SearchContent() {
  const params = useSearchParams()
  const router = useRouter()
  const q = params.get('q') || ''
  const [query, setQuery] = useState(q)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [latency, setLatency] = useState(0)
  const [cachedModal, setCachedModal] = useState<any>(null)
  const [domainFilter, setDomainFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('Any time')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSugg, setShowSugg] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (q) doSearch(q) }, [q])

  const doSearch = async (sq: string) => {
    setLoading(true)
    const start = Date.now()
    await new Promise(r => setTimeout(r, 400 + Math.random() * 250))
    setResults(MOCK_RESULTS(sq))
    setLatency(Date.now() - start)
    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
    setShowSugg(false)
  }

  const handleInput = (val: string) => {
    setQuery(val)
    if (val.length > 1) {
      setSuggestions([`${val} tutorial`, `${val} best practices`, `${val} examples`, `${val} 2025`])
      setShowSugg(true)
    } else setShowSugg(false)
  }

  const filtered = results.filter(r => domainFilter === 'All' || r.domain === domainFilter)

  return (
    <div className="min-h-screen pt-0">
      <Toaster position="top-right" toastOptions={{ style:{background:'rgba(10,22,48,0.95)',color:'#E8F4FD',border:'1px solid rgba(0,198,255,0.3)',borderRadius:'12px'} }} />

      {/* Search Topbar */}
      <div className="sticky top-0 z-40 navbar border-b border-[rgba(0,198,255,0.1)] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/" className="shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center shadow-glow-primary">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5"/><line x1="10" y1="10" x2="14" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </Link>
          <form onSubmit={handleSubmit} className="flex-1 relative">
            <div className="search-bar rounded-xl flex items-center px-4 py-2.5 gap-2">
              <svg className="w-4 h-4 text-[#00C6FF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
              <input ref={inputRef} type="text" value={query}
                onChange={e => handleInput(e.target.value)}
                onFocus={() => query.length > 1 && setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 160)}
                className="flex-1 bg-transparent text-[#E8F4FD] outline-none text-sm min-w-0"
                placeholder="Search your indices…"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
                  className="text-[#7A9CC0] hover:text-white text-lg leading-none shrink-0">×</button>
              )}
            </div>
            {showSugg && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 glass rounded-xl overflow-hidden z-50 shadow-xl border border-[rgba(0,198,255,0.15)]"
                style={{animation:'dropdownIn 0.18s ease both'}}>
                {suggestions.map((s, i) => (
                  <button key={i} type="button"
                    onClick={() => { setQuery(s); setShowSugg(false); router.push(`/search?q=${encodeURIComponent(s)}`) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#7A9CC0] hover:text-white hover:bg-[rgba(0,198,255,0.08)] transition-all flex items-center gap-3">
                    <svg className="w-3 h-3 text-[#00C6FF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </form>
          <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-[#7A9CC0] hover:text-white hover:bg-white/5 text-xs font-medium transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="flex gap-1 flex-wrap">
            {DOMAIN_FILTERS.map(f => (
              <button key={f} onClick={() => setDomainFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${domainFilter===f ? 'bg-[rgba(0,198,255,0.15)] text-[#00C6FF] border border-[rgba(0,198,255,0.3)]' : 'text-[#7A9CC0] hover:text-white hover:bg-white/5 border border-transparent'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-[rgba(0,198,255,0.15)] mx-1 hidden sm:block" />
          <div className="flex gap-1 flex-wrap">
            {DATE_FILTERS.map(f => (
              <button key={f} onClick={() => setDateFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${dateFilter===f ? 'bg-[rgba(123,47,190,0.15)] text-[#A855F7] border border-[rgba(123,47,190,0.3)]' : 'text-[#7A9CC0] hover:text-white hover:bg-white/5 border border-transparent'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Results stats */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between mb-4 text-xs text-[#7A9CC0]">
            <span>About <strong className="text-[#00C6FF]">{(filtered.length * 1247).toLocaleString()}</strong> results <span className="opacity-60">({latency}ms)</span></span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
              Live index
            </div>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="shimmer h-4 rounded w-3/4" />
                <div className="shimmer h-3 rounded w-1/3" />
                <div className="shimmer h-3 rounded w-full" />
                <div className="shimmer h-3 rounded w-5/6" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !q && (
          <div className="text-center py-24">
            <div className="text-7xl mb-5">🔍</div>
            <h2 className="font-display font-bold text-2xl text-white mb-3">Start Searching</h2>
            <p className="text-[#7A9CC0] mb-6">Enter a query above to search your indexed pages.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['machine learning', 'distributed systems', 'next.js performance', 'BM25 ranking'].map(q => (
                <button key={q} onClick={() => router.push(`/search?q=${encodeURIComponent(q)}`)}
                  className="px-4 py-2 rounded-full badge badge-primary text-sm hover:bg-[rgba(0,198,255,0.2)] transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && q && filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="font-display font-bold text-xl text-white mb-2">No results found</h3>
            <p className="text-[#7A9CC0] mb-4">Try different keywords or adjust your filters.</p>
            <button onClick={() => setDomainFilter('All')} className="badge badge-primary text-sm px-4 py-2">Clear filters</button>
          </div>
        )}

        {/* Results */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((r, i) => (
              <div key={i} className="card p-5 group" style={{animation:`slideUpIn 0.35s ease ${i*0.05}s both`}}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-[#00C6FF]/20 to-[#7B2FBE]/20 border border-[rgba(0,198,255,0.2)] flex items-center justify-center shrink-0">
                        <span className="text-[5px] text-[#00C6FF]">●</span>
                      </div>
                      <span className="text-[#7A9CC0] text-xs font-mono truncate">{r.domain}</span>
                    </div>
                    <a href="#" className="font-display font-semibold text-lg text-[#00C6FF] hover:text-white transition-colors leading-tight block group-hover:underline">
                      {r.title}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    <div className="hidden sm:flex items-center gap-1" title="PageRank score">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
                      <span className="text-[#7A9CC0] text-xs font-mono">{r.pageRank}</span>
                    </div>
                    {r.cached && (
                      <button onClick={() => setCachedModal(r)}
                        className="badge badge-primary text-xs hover:bg-[rgba(0,198,255,0.25)] transition-all">
                        Cached
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[#00C6FF] text-xs font-mono mb-2 opacity-70 truncate">{r.url}</p>
                <p className="text-[#7A9CC0] text-sm leading-relaxed mb-2"
                  dangerouslySetInnerHTML={{ __html: r.snippet }} />
                <div className="flex items-center gap-4 text-xs text-[#7A9CC0] opacity-60">
                  <span>{r.date}</span>
                  <span>{r.size}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cached Page Modal */}
      {cachedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{animation:'fadeIn 0.2s ease both'}}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setCachedModal(null)} />
          <div className="relative w-full max-w-3xl max-h-[80vh] glass rounded-2xl overflow-hidden shadow-2xl border border-[rgba(0,198,255,0.2)]"
            style={{animation:'scaleIn 0.22s ease both'}}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(0,198,255,0.1)]">
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-white text-sm truncate">{cachedModal.title}</p>
                <p className="text-[#7A9CC0] text-xs font-mono mt-0.5 truncate">{cachedModal.url}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <a href="#" className="text-[#00C6FF] text-xs hover:text-white transition-colors">↗ Live version</a>
                <button onClick={() => setCachedModal(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#7A9CC0] hover:text-white transition-all">✕</button>
              </div>
            </div>
            <div className="terminal rounded-none h-80 overflow-auto p-4 text-xs leading-relaxed">
              <div className="text-[#7A9CC0]">{`<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${cachedModal.title}</title>\n</head>\n<body>`}</div>
              <div className="text-[#00C6FF] mt-2">{'  <h1>'}{cachedModal.title}{'</h1>'}</div>
              <div className="text-[#7A9CC0] mt-2">{'  <!-- Cached snapshot · '}{cachedModal.date}{' -->'}</div>
              <div className="text-[#00E676] mt-2">{'  <p>'}{cachedModal.snippet.replace(/<[^>]+>/g, '')}{'</p>'}</div>
              <div className="text-[#7A9CC0] mt-4">{'</body>\n</html>'}</div>
            </div>
            <div className="px-5 py-3 border-t border-[rgba(0,198,255,0.1)] flex items-center justify-between text-xs text-[#7A9CC0]">
              <span>📅 Cached: {cachedModal.date} · {cachedModal.size}</span>
              <span className="badge badge-success">✓ Valid snapshot</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#7A9CC0]">
          <div className="w-5 h-5 border-2 border-[rgba(0,198,255,0.3)] border-t-[#00C6FF] rounded-full animate-spin" />
          Loading search…
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
