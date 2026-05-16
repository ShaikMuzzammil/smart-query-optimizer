'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

const INIT_INDICES = [
  { id:'1', name:'Tech News Index', domains:['techcrunch.com','wired.com'], status:'CRAWLING', pages:12450, size:'48 MB', lastCrawled:'2 min ago', progress:67 },
  { id:'2', name:'Research Papers', domains:['arxiv.org'], status:'COMPLETED', pages:5200, size:'21 MB', lastCrawled:'3h ago', progress:100 },
  { id:'3', name:'Dev Docs Index', domains:['docs.python.org'], status:'IDLE', pages:890, size:'4 MB', lastCrawled:'1 day ago', progress:100 },
]
const STATS_DEF = [
  { label:'Total Queries', value:'24,891', change:'+12%', up:true, icon:'🔍' },
  { label:'Pages Indexed', value:'18,540', change:'+8%', up:true, icon:'📄' },
  { label:'Avg Latency', value:'87ms', change:'-5%', up:true, icon:'⚡' },
  { label:'Credits Left', value:'650', change:'350 used', up:null, icon:'💳' },
]
const NAV = [
  { id:'overview', label:'Overview', icon:'📊' },
  { id:'indices',  label:'Indices',  icon:'📁' },
  { id:'search',   label:'Search',   icon:'🔍' },
  { id:'analytics',label:'Analytics',icon:'📈' },
  { id:'api',      label:'API Keys', icon:'🔑' },
  { id:'settings', label:'Settings', icon:'⚙️' },
]
const STATUS_COLOR: Record<string,string> = { CRAWLING:'#00C6FF', COMPLETED:'#00E676', IDLE:'#7A9CC0', ERROR:'#FF1744', PAUSED:'#FFD600' }

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [indices, setIndices] = useState(INIT_INDICES)
  const [user, setUser] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showExpand, setShowExpand] = useState<string|null>(null)
  const [newIdx, setNewIdx] = useState({ name:'', domains:'', depth:'3' })
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [apiKey, setApiKey] = useState('sq_live_••••••••••••••••••••••••••••••••')
  const [keyRevealed, setKeyRevealed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sq_user')
    if (stored) { setUser(JSON.parse(stored)) }
    else { router.push('/auth/login') }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' })
    localStorage.removeItem('sq_user')
    toast.success('Signed out successfully')
    setTimeout(() => router.push('/'), 700)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQ.trim()) return
    setSearching(true)
    await new Promise(r=>setTimeout(r,600))
    setSearchResults([
      { title:`${searchQ} — Developer Guide`, url:`docs.smartquery.io/guide`, score:'0.94', date:'2 days ago' },
      { title:`Understanding ${searchQ}`, url:`blog.smartquery.io/deep-dive`, score:'0.87', date:'5 days ago' },
      { title:`${searchQ} Best Practices 2025`, url:`research.smartquery.io/bench`, score:'0.81', date:'1 week ago' },
    ])
    setSearching(false)
  }

  const handleCreateIndex = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIdx.name || !newIdx.domains) { toast.error('Name and domains are required'); return }
    const id = Date.now().toString()
    const domains = newIdx.domains.split(',').map(d=>d.trim()).filter(Boolean)
    setIndices(prev => [...prev, { id, name:newIdx.name, domains, status:'IDLE', pages:0, size:'0 MB', lastCrawled:'Just created', progress:0 }])
    setNewIdx({ name:'', domains:'', depth:'3' })
    setShowCreate(false)
    toast.success(`Index "${newIdx.name}" created!`)
  }

  const handleCrawl = (id: string, name: string) => {
    setIndices(prev => prev.map(i => i.id===id ? {...i, status:'CRAWLING', progress:0} : i))
    toast.success(`Crawl started for "${name}"`)
    // Simulate progress
    let p = 0
    const interval = setInterval(() => {
      p += Math.floor(Math.random()*8)+2
      if (p >= 100) { p = 100; clearInterval(interval)
        setIndices(prev => prev.map(i => i.id===id ? {...i, status:'COMPLETED', progress:100, lastCrawled:'Just now'} : i))
        toast.success(`"${name}" crawl complete!`)
      } else {
        setIndices(prev => prev.map(i => i.id===id ? {...i, progress:p} : i))
      }
    }, 600)
  }

  const handlePause = (id: string) => {
    setIndices(prev => prev.map(i => i.id===id ? {...i, status:'PAUSED'} : i))
    toast('Crawl paused', { icon:'⏸️' })
  }

  const handleDelete = (id: string, name: string) => {
    setIndices(prev => prev.filter(i => i.id !== id))
    setShowExpand(null)
    toast.success(`"${name}" deleted`)
  }

  const handleRotateKey = () => {
    const newKey = 'sq_live_' + Array.from({length:32},()=>'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random()*36)]).join('')
    setApiKey(newKey)
    setKeyRevealed(true)
    toast.success('API key rotated!')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050B18]">
      <Toaster position="top-right" toastOptions={{ style:{background:'rgba(10,22,48,0.95)',color:'#E8F4FD',border:'1px solid rgba(0,198,255,0.3)',borderRadius:'12px'} }} />

      {/* Sidebar */}
      <aside className={`${collapsed?'w-16':'w-60'} transition-all duration-300 flex flex-col shrink-0 border-r border-[rgba(0,198,255,0.1)] bg-[rgba(10,22,48,0.8)] backdrop-blur-xl`}>
        <div className={`h-16 flex items-center ${collapsed?'justify-center':'px-5 gap-3'} border-b border-[rgba(0,198,255,0.1)]`}>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center shrink-0 shadow-glow-primary">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5"/><line x1="10" y1="10" x2="14" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            {!collapsed && <span className="font-display font-bold text-white text-sm">SmartQuery</span>}
          </Link>
          {!collapsed && (
            <button onClick={()=>setCollapsed(true)} className="ml-auto text-[#7A9CC0] hover:text-white p-1 rounded transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={()=>setCollapsed(false)} className="mx-auto mt-2 w-6 h-6 glass rounded flex items-center justify-center text-[#7A9CC0] hover:text-white text-xs">›</button>
        )}

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button key={item.id} onClick={()=>setTab(item.id)}
              className={`sidebar-link w-full ${tab===item.id?'active':''} ${collapsed?'justify-center':''}`}
              title={collapsed?item.label:undefined}>
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[rgba(0,198,255,0.1)]">
          {!collapsed && (
            <div className="card p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#7A9CC0] text-xs">Free Plan</span>
                <Link href="/docs" className="text-[#00C6FF] text-xs font-semibold hover:text-white">Docs</Link>
              </div>
              <div className="progress-bar h-1.5 mb-1"><div className="progress-fill h-full" style={{width:'35%'}}/></div>
              <p className="text-[#7A9CC0] text-xs">350 / 1,000 pages</p>
            </div>
          )}
          <button onClick={handleLogout} className={`sidebar-link w-full text-[#FF6B35] hover:text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] ${collapsed?'justify-center':''}`}>
            <span className="text-base shrink-0">🚪</span>
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[rgba(0,198,255,0.1)] bg-[rgba(5,11,24,0.8)] backdrop-blur-xl shrink-0">
          <div>
            <h1 className="font-display font-bold text-white text-lg capitalize">{tab}</h1>
            <p className="text-[#7A9CC0] text-xs">Welcome back{user?.name ? `, ${user.name}` : ''} 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>setShowCreate(true)}
              className="btn-primary px-4 py-2 rounded-xl text-sm text-white font-semibold">
              <span>+ New Index</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center text-white text-xs font-bold font-display">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl">

            {/* ── OVERVIEW ── */}
            {tab==='overview' && (
              <div className="space-y-6" style={{animation:'pageIn 0.3s ease both'}}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {STATS_DEF.map(s => (
                    <div key={s.label} className="card p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{s.icon}</span>
                        <span className="text-[#7A9CC0] text-xs">{s.label}</span>
                      </div>
                      <p className="font-display font-bold text-2xl text-white mb-1">{s.value}</p>
                      <p className={`text-xs font-medium ${s.up===true?'text-[#00E676]':s.up===false?'text-[#FF1744]':'text-[#7A9CC0]'}`}>{s.change}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-bold text-white">Recent Indices</h2>
                    <button onClick={()=>setTab('indices')} className="text-[#00C6FF] text-sm hover:text-white transition-colors">View all →</button>
                  </div>
                  <div className="space-y-3">
                    {indices.slice(0,3).map(idx => (
                      <div key={idx.id} className="card p-4 flex items-center gap-4">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{background:STATUS_COLOR[idx.status]}}/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-display font-semibold text-white text-sm truncate">{idx.name}</p>
                            <span className="badge text-xs shrink-0" style={{background:`${STATUS_COLOR[idx.status]}20`,border:`1px solid ${STATUS_COLOR[idx.status]}40`,color:STATUS_COLOR[idx.status]}}>{idx.status}</span>
                          </div>
                          <p className="text-[#7A9CC0] text-xs font-mono">{idx.domains.join(', ')}</p>
                          {idx.status==='CRAWLING' && <div className="progress-bar h-1 mt-2"><div className="progress-fill h-full" style={{width:`${idx.progress}%`}}/></div>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white text-sm font-semibold font-display">{idx.pages.toLocaleString()}</p>
                          <p className="text-[#7A9CC0] text-xs">pages</p>
                        </div>
                        <button onClick={()=>setShowExpand(idx.id)} className="text-[#7A9CC0] hover:text-white p-1 transition-colors text-lg">⋯</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── INDICES ── */}
            {tab==='indices' && (
              <div className="space-y-4" style={{animation:'pageIn 0.3s ease both'}}>
                {indices.map(idx => (
                  <div key={idx.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C6FF]/20 to-[#7B2FBE]/20 border border-[rgba(0,198,255,0.2)] flex items-center justify-center text-xl">📁</div>
                        <div>
                          <h3 className="font-display font-bold text-white">{idx.name}</h3>
                          <p className="text-[#7A9CC0] text-xs font-mono">{idx.domains.join(' · ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge text-xs" style={{background:`${STATUS_COLOR[idx.status]}20`,border:`1px solid ${STATUS_COLOR[idx.status]}40`,color:STATUS_COLOR[idx.status]}}>{idx.status}</span>
                        <button onClick={()=>setShowExpand(idx.id)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[#7A9CC0] hover:text-white transition-all text-lg">⋯</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {[['Pages',idx.pages.toLocaleString()],['Size',idx.size],['Last Crawl',idx.lastCrawled]].map(([l,v])=>(
                        <div key={l} className="text-center p-3 rounded-xl bg-[rgba(0,198,255,0.04)] border border-[rgba(0,198,255,0.06)]">
                          <p className="text-[#7A9CC0] text-xs mb-1">{l}</p>
                          <p className="font-display font-bold text-white text-sm">{v}</p>
                        </div>
                      ))}
                    </div>
                    {idx.status==='CRAWLING' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-[#7A9CC0] mb-1"><span>Progress</span><span>{idx.progress}%</span></div>
                        <div className="progress-bar h-2"><div className="progress-fill h-full" style={{width:`${idx.progress}%`}}/></div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={()=>{setTab('search');setSearchQ('')}} className="btn-outline px-4 py-2 rounded-lg text-sm font-semibold">🔍 Search</button>
                      {idx.status!=='CRAWLING' && (
                        <button onClick={()=>handleCrawl(idx.id,idx.name)} className="btn-primary px-4 py-2 rounded-lg text-sm text-white font-semibold"><span>🕷️ Crawl Now</span></button>
                      )}
                      {idx.status==='CRAWLING' && (
                        <button onClick={()=>handlePause(idx.id)} className="px-4 py-2 rounded-lg text-sm font-semibold border border-[rgba(255,214,0,0.3)] text-[#FFD600] hover:bg-[rgba(255,214,0,0.08)] transition-all">⏸ Pause</button>
                      )}
                      <button onClick={()=>setShowExpand(idx.id)} className="px-4 py-2 rounded-lg text-sm font-semibold border border-[rgba(122,156,192,0.2)] text-[#7A9CC0] hover:text-white hover:border-[rgba(122,156,192,0.4)] transition-all">📋 Details</button>
                    </div>
                  </div>
                ))}
                {indices.length===0 && (
                  <div className="text-center py-20 card p-12">
                    <div className="text-6xl mb-4">📁</div>
                    <h3 className="font-display font-bold text-xl text-white mb-2">No indices yet</h3>
                    <p className="text-[#7A9CC0] mb-6">Create your first search index to get started.</p>
                    <button onClick={()=>setShowCreate(true)} className="btn-primary px-6 py-3 rounded-xl text-white font-semibold"><span>+ Create Index</span></button>
                  </div>
                )}
              </div>
            )}

            {/* ── SEARCH ── */}
            {tab==='search' && (
              <div style={{animation:'pageIn 0.3s ease both'}}>
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="search-bar rounded-xl flex items-center px-4 py-3 gap-3">
                    <svg className="w-4 h-4 text-[#00C6FF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
                    <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} className="flex-1 bg-transparent text-[#E8F4FD] outline-none text-sm" placeholder="Search your indices…" />
                    <button type="submit" disabled={searching} className="btn-primary px-4 py-2 rounded-lg text-sm text-white font-semibold"><span>{searching?'..':'Search'}</span></button>
                  </div>
                </form>
                {searching && <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="card p-5 space-y-2"><div className="shimmer h-4 rounded w-3/4"/><div className="shimmer h-3 rounded w-1/3"/><div className="shimmer h-3 rounded w-full"/></div>)}</div>}
                {!searching && searchResults.length>0 && (
                  <div className="space-y-3">
                    {searchResults.map((r,i)=>(
                      <div key={i} className="card p-5" style={{animation:`slideUpIn 0.3s ease ${i*0.06}s both`}}>
                        <div className="flex items-start justify-between mb-1">
                          <a href="#" className="font-display font-semibold text-[#00C6FF] hover:text-white transition-colors">{r.title}</a>
                          <span className="badge badge-primary text-xs shrink-0 ml-2">Score: {r.score}</span>
                        </div>
                        <p className="text-[#7A9CC0] text-xs font-mono mb-2">{r.url}</p>
                        <p className="text-[#7A9CC0] text-xs">{r.date}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!searching && searchResults.length===0 && (
                  <div className="text-center py-20 text-[#7A9CC0]">
                    <div className="text-5xl mb-3">🔍</div>
                    <p>Enter a query and press Search to explore your indices.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {tab==='analytics' && (
              <div className="space-y-5" style={{animation:'pageIn 0.3s ease both'}}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[['Total Searches','24,891','↑ 12% this week'],['Top Query','machine learning','Most searched term'],['Click Rate','64.2%','↑ 3.1% vs last month'],['Avg Position','2.3','↓ 0.4 improvement']].map(([l,v,s])=>(
                    <div key={l} className="card p-5">
                      <p className="text-[#7A9CC0] text-xs mb-2">{l}</p>
                      <p className="font-display font-bold text-xl text-white mb-1 break-all">{v}</p>
                      <p className="text-[#00E676] text-xs">{s}</p>
                    </div>
                  ))}
                </div>
                <div className="card p-6">
                  <h3 className="font-display font-bold text-white mb-4">Top Queries This Week</h3>
                  <div className="space-y-3">
                    {[['machine learning',1240,94],['distributed systems',980,87],['next.js performance',756,78],['BM25 ranking',543,65],['web crawler design',412,52]].map(([q,count,pct],i)=>(
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[#7A9CC0] text-xs w-5 shrink-0 font-mono">{i+1}</span>
                        <span className="text-white text-sm flex-1 min-w-0 truncate">{q}</span>
                        <div className="progress-bar w-28 h-1.5"><div className="progress-fill h-full" style={{width:`${pct}%`}}/></div>
                        <span className="text-[#7A9CC0] text-xs w-12 text-right shrink-0">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── API KEYS ── */}
            {tab==='api' && (
              <div className="space-y-5" style={{animation:'pageIn 0.3s ease both'}}>
                <div className="card p-6">
                  <h2 className="font-display font-bold text-white mb-4">Your API Key</h2>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="input-field flex-1 px-4 py-3 rounded-xl text-sm font-mono text-[#7A9CC0] overflow-hidden text-ellipsis">
                      {keyRevealed ? apiKey : 'sq_live_••••••••••••••••••••••••••••••••'}
                    </div>
                    <button onClick={()=>setKeyRevealed(!keyRevealed)} className="btn-outline px-3 py-3 rounded-xl text-sm">{keyRevealed?'🙈':'👁️'}</button>
                    <button onClick={()=>{navigator.clipboard.writeText(apiKey);toast.success('Copied!')}} className="btn-outline px-3 py-3 rounded-xl text-sm">📋</button>
                    <button onClick={handleRotateKey} className="px-4 py-3 rounded-xl text-sm font-semibold border border-[rgba(255,107,53,0.3)] text-[#FF6B35] hover:bg-[rgba(255,107,53,0.08)] transition-all">🔄 Rotate</button>
                  </div>
                  <p className="text-[#7A9CC0] text-xs">Keep your API key secret. Rotating it invalidates the previous key immediately.</p>
                </div>
                <div className="card p-6">
                  <h3 className="font-display font-bold text-white mb-3">Quick API Example</h3>
                  <div className="terminal rounded-xl text-xs">
                    <div className="terminal-header"><div className="terminal-dot bg-red-500"/><div className="terminal-dot bg-yellow-400"/><div className="terminal-dot bg-green-500"/><span className="text-[#7A9CC0] text-xs ml-3">bash</span><button onClick={()=>toast.success('Copied!')} className="ml-auto text-[#7A9CC0] hover:text-white text-xs">Copy</button></div>
                    <pre className="p-4 leading-relaxed overflow-x-auto">{`curl -X POST https://api.smartquery.io/v1/search \\
  -H "Authorization: Bearer ${keyRevealed?apiKey:'sq_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"q":"distributed systems","index_id":"idx_123"}'`}</pre>
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-display font-bold text-white mb-3">Usage This Month</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[['API Calls','2,840 / 10,000'],['Search Calls','1,920'],['Index Calls','920']].map(([l,v])=>(
                      <div key={l} className="text-center p-4 rounded-xl bg-[rgba(0,198,255,0.04)] border border-[rgba(0,198,255,0.06)]">
                        <p className="text-[#7A9CC0] text-xs mb-1">{l}</p>
                        <p className="text-white font-display font-bold text-sm">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab==='settings' && (
              <div className="space-y-5" style={{animation:'pageIn 0.3s ease both'}}>
                <div className="card p-6">
                  <h2 className="font-display font-bold text-white mb-5">Profile Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center text-white text-2xl font-bold font-display">{user?.name?.[0]?.toUpperCase()||'U'}</div>
                      <div>
                        <p className="font-display font-bold text-white text-lg">{user?.name||'User'}</p>
                        <p className="text-[#7A9CC0] text-sm">{user?.email||'user@example.com'}</p>
                        <span className="badge badge-primary text-xs mt-1">Free Plan</span>
                      </div>
                    </div>
                    {['Name','Email'].map(field=>(
                      <div key={field}>
                        <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">{field}</label>
                        <input type={field==='Email'?'email':'text'} defaultValue={field==='Name'?user?.name:user?.email} className="input-field w-full px-4 py-3 rounded-xl text-sm" />
                      </div>
                    ))}
                    <button onClick={()=>toast.success('Profile updated!')} className="btn-primary px-6 py-2.5 rounded-xl text-white font-semibold text-sm"><span>Save Changes</span></button>
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-display font-bold text-white mb-4">Notifications</h3>
                  {[['Crawl completion alerts','Get notified when a crawl finishes'],['Weekly analytics digest','Summary of search stats every Monday'],['Error alerts','Instant alerts for crawler errors']].map(([l,d])=>(
                    <div key={l} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[rgba(0,198,255,0.03)] transition-colors mb-2">
                      <button onClick={()=>toast.success('Preference saved!')} className="relative w-10 h-5 rounded-full bg-[#00C6FF] shrink-0"><span className="absolute top-0.5 left-5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"/></button>
                      <div><p className="text-white text-sm font-medium">{l}</p><p className="text-[#7A9CC0] text-xs">{d}</p></div>
                    </div>
                  ))}
                </div>
                <div className="card p-6 border-[rgba(255,23,68,0.15)]">
                  <h3 className="font-display font-bold text-[#FF1744] mb-3">⚠️ Danger Zone</h3>
                  <p className="text-[#7A9CC0] text-sm mb-4">These actions are irreversible. Please be certain.</p>
                  <div className="flex gap-3">
                    <button onClick={()=>toast.error('Action not available in demo mode.')} className="px-4 py-2 rounded-lg text-sm font-semibold border border-[rgba(255,23,68,0.3)] text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] transition-all">🗑️ Delete All Indices</button>
                    <button onClick={()=>{toast('Account deletion requires email confirmation.');}} className="px-4 py-2 rounded-lg text-sm font-semibold border border-[rgba(255,23,68,0.3)] text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] transition-all">❌ Delete Account</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── EXPAND/DETAILS MODAL ── */}
      {showExpand && (() => {
        const idx = indices.find(i=>i.id===showExpand)!
        if (!idx) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{animation:'fadeIn 0.2s ease both'}}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setShowExpand(null)}/>
            <div className="relative w-full max-w-lg glass rounded-2xl border border-[rgba(0,198,255,0.2)] overflow-hidden shadow-2xl" style={{animation:'scaleIn 0.25s ease both'}}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,198,255,0.1)]">
                <h2 className="font-display font-bold text-white text-lg">{idx.name}</h2>
                <button onClick={()=>setShowExpand(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#7A9CC0] hover:text-white transition-all text-lg">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[['Status',idx.status],['Pages',idx.pages.toLocaleString()],['Size',idx.size],['Last Crawled',idx.lastCrawled],['Domains',idx.domains.join(', ')],['Progress',`${idx.progress}%`]].map(([l,v])=>(
                    <div key={l} className="p-3 rounded-xl bg-[rgba(0,198,255,0.04)] border border-[rgba(0,198,255,0.06)]">
                      <p className="text-[#7A9CC0] text-xs mb-1">{l}</p>
                      <p className="text-white text-sm font-semibold font-display break-all">{v}</p>
                    </div>
                  ))}
                </div>
                {idx.status==='CRAWLING' && <div className="progress-bar h-2"><div className="progress-fill h-full" style={{width:`${idx.progress}%`}}/></div>}
                <div className="flex gap-2 flex-wrap pt-2">
                  {idx.status!=='CRAWLING' && <button onClick={()=>{handleCrawl(idx.id,idx.name);setShowExpand(null)}} className="btn-primary px-4 py-2 rounded-lg text-sm text-white font-semibold"><span>🕷️ Crawl Now</span></button>}
                  {idx.status==='CRAWLING' && <button onClick={()=>{handlePause(idx.id);setShowExpand(null)}} className="px-4 py-2 rounded-lg text-sm border border-[rgba(255,214,0,0.3)] text-[#FFD600]">⏸ Pause</button>}
                  <button onClick={()=>{setTab('search');setShowExpand(null)}} className="btn-outline px-4 py-2 rounded-lg text-sm font-semibold">🔍 Search</button>
                  <button onClick={()=>handleDelete(idx.id,idx.name)} className="px-4 py-2 rounded-lg text-sm border border-[rgba(255,23,68,0.3)] text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] transition-all font-semibold">🗑️ Delete</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── CREATE INDEX MODAL ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{animation:'fadeIn 0.2s ease both'}}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setShowCreate(false)}/>
          <div className="relative w-full max-w-md glass rounded-2xl p-6 border border-[rgba(0,198,255,0.2)] shadow-2xl" style={{animation:'scaleIn 0.25s ease both'}}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-white text-xl">Create New Index</h2>
              <button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#7A9CC0] hover:text-white transition-all text-lg">✕</button>
            </div>
            <form onSubmit={handleCreateIndex} className="space-y-4">
              <div>
                <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Index Name *</label>
                <input type="text" value={newIdx.name} onChange={e=>setNewIdx(p=>({...p,name:e.target.value}))}
                  className="input-field w-full px-4 py-3 rounded-xl text-sm" placeholder="My Docs Index" required/>
              </div>
              <div>
                <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Seed Domains (comma-separated) *</label>
                <input type="text" value={newIdx.domains} onChange={e=>setNewIdx(p=>({...p,domains:e.target.value}))}
                  className="input-field w-full px-4 py-3 rounded-xl text-sm" placeholder="docs.example.com, blog.example.com" required/>
              </div>
              <div>
                <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Crawl Depth</label>
                <select value={newIdx.depth} onChange={e=>setNewIdx(p=>({...p,depth:e.target.value}))}
                  className="input-field w-full px-4 py-3 rounded-xl text-sm" style={{appearance:'none'}}>
                  {['1','2','3','4','5'].map(d=><option key={d} value={d}>Depth {d} — {['1 hop','2 hops','3 hops','4 hops','5 hops'][+d-1]}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowCreate(false)} className="flex-1 btn-outline py-3 rounded-xl text-sm font-semibold">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-3 rounded-xl text-sm text-white font-semibold"><span>Create & Crawl</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
