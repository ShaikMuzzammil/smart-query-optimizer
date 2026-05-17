'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

const NAV = [
  { id:'overview',  label:'Overview',  icon:'📊' },
  { id:'upload',    label:'Upload',    icon:'📤' },
  { id:'indices',   label:'My Files',  icon:'📁' },
  { id:'search',    label:'Search',    icon:'🔍' },
  { id:'analytics', label:'Analytics', icon:'📈' },
  { id:'settings',  label:'Settings',  icon:'⚙️' },
]

const IMPACT_COLOR: Record<string,string> = { HIGH:'#FF1744', MEDIUM:'#FFD600', LOW:'#00E676' }
const STATUS_COLOR: Record<string,string> = { COMPLETED:'#00E676', INDEXING:'#00C6FF', ERROR:'#FF1744', IDLE:'#7A9CC0' }

function fmt(n: number) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : n.toString() }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) }

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [user, setUser] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [expandedFile, setExpandedFile] = useState<any>(null)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [searchLatency, setSearchLatency] = useState(0)
  const [settings, setSettings] = useState({ resendApiKey:'', adminEmail:'', fromName:'SmartQuery Optimizer', crawlAlerts:true, weeklyDigest:false, bm25K1:'1.5', bm25B:'0.75', alpha:'0.7' })
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [collapsed2, setCollapsed2] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sq_user')
    if (!stored) { router.push('/auth/login'); return }
    setUser(JSON.parse(stored))
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const res = await fetch('/api/indices')
      const data = await res.json()
      if (data.indices) setFiles(data.indices)
    } catch {}
  }

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith('.txt')) { toast.error('Only .txt files supported'); return }
    if (file.size > 5*1024*1024) { toast.error('Max file size is 5MB'); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload', { method:'POST', body:fd })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast.success(`"${data.file.name}" indexed — ${fmt(data.file.wordCount)} words`)
        setFiles(prev => [data.file, ...prev])
        setTab('indices')
      } else toast.error(data.error || 'Upload failed')
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleUpload(f)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleUpload(f)
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/indices/${id}`, { method:'DELETE' })
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== id))
        if (expandedFile?.id === id) setExpandedFile(null)
        toast.success(`"${name}" deleted`)
      } else toast.error('Delete failed')
    } catch { toast.error('Delete failed') }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQ.trim()) return
    setSearching(true); setSearchResults([])
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQ)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
      setSearchLatency(data.latencyMs || 0)
      if (!data.results?.length) toast('No results found', { icon:'🔍' })
    } catch { toast.error('Search failed') }
    finally { setSearching(false) }
  }

  const handleViewDetail = async (file: any) => {
    try {
      const res = await fetch(`/api/indices/${file.id}`)
      const data = await res.json()
      setExpandedFile(data.file || file)
    } catch { setExpandedFile(file) }
  }

  const handleSaveSettings = async () => {
    await fetch('/api/admin/settings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ emailSettings: settings }) })
    setSettingsSaved(true)
    toast.success('Settings saved!')
    setTimeout(() => setSettingsSaved(false), 3000)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' })
    localStorage.removeItem('sq_user')
    toast.success('Signed out')
    setTimeout(() => router.push('/'), 700)
  }

  const totalWords = files.reduce((s,f) => s+(f.wordCount||0), 0)
  const totalFiles = files.length
  const avgVocab = files.length ? Math.round(files.reduce((s,f) => s+(f.vocabRichness||0),0)/files.length) : 0
  const indexSize = new Set(files.flatMap(f => (f.topKeywords||[]).map((k:any) => k.word))).size

  const highlightText = (text: string, terms: string[]) => {
    let t = text
    terms.forEach(term => { t = t.replace(new RegExp(`(${term})`, 'gi'), '<mark>$1</mark>') })
    return t
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050B18]">
      <Toaster position="top-right" toastOptions={{ style:{background:'rgba(10,22,48,0.95)',color:'#E8F4FD',border:'1px solid rgba(0,198,255,0.3)',borderRadius:'12px',fontFamily:'Outfit,sans-serif'} }} />

      {/* Sidebar */}
      <aside className={`${collapsed?'w-16':'w-60'} transition-all duration-300 flex flex-col shrink-0 border-r border-[rgba(0,198,255,0.1)] bg-[rgba(5,11,24,0.92)] backdrop-blur-xl`}>
        <div className={`h-16 flex items-center ${collapsed?'justify-center px-2':'px-5 gap-3'} border-b border-[rgba(0,198,255,0.1)]`}>
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center shrink-0">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5"/><line x1="10" y1="10" x2="14" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            {!collapsed && <span className="font-display font-bold text-white text-sm truncate">SmartQuery</span>}
          </Link>
          {!collapsed && <button onClick={()=>setCollapsed(true)} className="ml-auto text-[#7A9CC0] hover:text-white p-1">‹</button>}
          {collapsed && <button onClick={()=>setCollapsed(false)} className="absolute left-14 top-5 w-5 h-5 glass rounded text-[#7A9CC0] text-xs flex items-center justify-center">›</button>}
        </div>

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
            <div className="card p-3 mb-2">
              <p className="text-[#7A9CC0] text-xs mb-1">Files Indexed</p>
              <p className="font-display font-bold text-white text-lg">{totalFiles}</p>
              <p className="text-[#7A9CC0] text-xs">{fmt(totalWords)} words total</p>
            </div>
          )}
          <button onClick={handleLogout} className={`sidebar-link w-full text-[#FF6B35] hover:text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] ${collapsed?'justify-center':''}`}>
            <span className="text-base">🚪</span>
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[rgba(0,198,255,0.1)] bg-[rgba(5,11,24,0.85)] backdrop-blur-xl shrink-0 sticky top-0 z-20">
          <div>
            <h1 className="font-display font-bold text-white text-lg capitalize">{NAV.find(n=>n.id===tab)?.label}</h1>
            <p className="text-[#7A9CC0] text-xs">Welcome back{user?.name?`, ${user.name}`:''} 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>setTab('upload')} className="btn-primary px-4 py-2 rounded-xl text-sm text-white font-semibold">
              <span>+ Upload File</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center text-white text-xs font-bold font-display">
              {user?.name?.[0]?.toUpperCase()||'U'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">

            {/* ── OVERVIEW ── */}
            {tab==='overview' && (
              <div className="space-y-6" style={{animation:'pageIn 0.3s ease both'}}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label:'Files Indexed', value:totalFiles.toString(), icon:'📁', sub:'total uploads', color:'#00C6FF' },
                    { label:'Words Indexed', value:fmt(totalWords), icon:'📝', sub:'across all files', color:'#7B2FBE' },
                    { label:'Vocab Richness', value:avgVocab+'%', icon:'🎯', sub:'avg uniqueness', color:'#00E676' },
                    { label:'Index Terms', value:fmt(indexSize), icon:'🔑', sub:'unique terms', color:'#FFD600' },
                  ].map(s => (
                    <div key={s.label} className="card p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{s.icon}</span>
                        <span className="text-[#7A9CC0] text-xs">{s.label}</span>
                      </div>
                      <p className="font-display font-bold text-2xl mb-1" style={{color:s.color}}>{s.value}</p>
                      <p className="text-[#7A9CC0] text-xs">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {files.length === 0 ? (
                  <div className="card p-12 text-center">
                    <div className="text-6xl mb-4">📤</div>
                    <h3 className="font-display font-bold text-xl text-white mb-2">No files indexed yet</h3>
                    <p className="text-[#7A9CC0] mb-6">Upload a .txt file to build your search index and get query analysis.</p>
                    <button onClick={()=>setTab('upload')} className="btn-primary px-6 py-3 rounded-xl text-white font-semibold"><span>Upload Your First File</span></button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-bold text-white">Recent Files</h2>
                      <button onClick={()=>setTab('indices')} className="text-[#00C6FF] text-sm hover:text-white transition-colors">View all →</button>
                    </div>
                    <div className="space-y-3">
                      {files.slice(0,3).map(f => (
                        <div key={f.id} className="card p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C6FF]/20 to-[#7B2FBE]/20 border border-[rgba(0,198,255,0.2)] flex items-center justify-center text-lg shrink-0">📄</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-display font-semibold text-white text-sm truncate">{f.name}</p>
                              <span className="badge text-xs shrink-0" style={{background:`${STATUS_COLOR[f.status]}20`,border:`1px solid ${STATUS_COLOR[f.status]}40`,color:STATUS_COLOR[f.status]}}>{f.status}</span>
                            </div>
                            <p className="text-[#7A9CC0] text-xs">{fmt(f.wordCount)} words · {fmt(f.uniqueWords)} unique · {f.size}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={()=>{handleViewDetail(f);setTab('indices')}} className="btn-outline px-3 py-1.5 rounded-lg text-xs font-semibold">View</button>
                            <button onClick={()=>handleDelete(f.id,f.name)} className="px-3 py-1.5 rounded-lg text-xs border border-[rgba(255,23,68,0.3)] text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] transition-all">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {files.length > 0 && (
                  <div className="card p-6">
                    <h3 className="font-display font-bold text-white mb-4">Top Keywords Across All Files</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Map(files.flatMap(f => f.topKeywords||[]).map((k:any) => [k.word,k])).values()).slice(0,20).map((k:any) => (
                        <button key={k.word} onClick={()=>{setSearchQ(k.word);setTab('search')}}
                          className="badge badge-primary hover:bg-[rgba(0,198,255,0.2)] transition-all text-sm px-3 py-1.5">
                          {k.word} <span className="ml-1 opacity-60">×{k.freq}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── UPLOAD ── */}
            {tab==='upload' && (
              <div className="space-y-6" style={{animation:'pageIn 0.3s ease both'}}>
                <div
                  onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={handleDrop}
                  className={`card p-12 text-center border-2 border-dashed transition-all duration-300 ${dragOver?'border-[#00C6FF] bg-[rgba(0,198,255,0.05)]':'border-[rgba(0,198,255,0.2)]'}`}>
                  <div className="text-6xl mb-4">{uploading?'⏳':'📤'}</div>
                  <h2 className="font-display font-bold text-2xl text-white mb-2">{uploading?'Indexing your file…':'Upload a .txt File'}</h2>
                  <p className="text-[#7A9CC0] mb-6">{uploading?'Building inverted index and analyzing queries…':'Drag & drop or click to upload. Max 5MB. Supports SQL logs, search queries, or any text.'}</p>
                  {!uploading && (
                    <label className="btn-primary px-8 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2">
                      <span>Choose File</span>
                      <input type="file" accept=".txt" onChange={handleFileInput} className="hidden" />
                    </label>
                  )}
                  {uploading && <div className="flex justify-center"><div className="w-8 h-8 border-2 border-[rgba(0,198,255,0.3)] border-t-[#00C6FF] rounded-full animate-spin"/></div>}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon:'🔍', title:'Inverted Index', desc:'BM25-ranked full-text search across all uploaded files with term frequency scoring.' },
                    { icon:'📊', title:'Query Analyzer', desc:'Detects slow SQL patterns, missing indexes, LIKE wildcards, N+1 queries, and more.' },
                    { icon:'🎯', title:'Keyword Extraction', desc:'Top 10 keywords, vocabulary richness, avg word length, unique term count.' },
                  ].map(f => (
                    <div key={f.title} className="card p-5">
                      <div className="text-3xl mb-3">{f.icon}</div>
                      <h3 className="font-display font-bold text-white mb-2">{f.title}</h3>
                      <p className="text-[#7A9CC0] text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="card p-6">
                  <h3 className="font-display font-bold text-white mb-3">Example File Formats</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="terminal rounded-xl">
                      <div className="terminal-header"><div className="terminal-dot bg-red-500"/><div className="terminal-dot bg-yellow-400"/><div className="terminal-dot bg-green-500"/><span className="text-[#7A9CC0] text-xs ml-2">sql_queries.txt</span></div>
                      <pre className="p-4 text-xs text-[#00E676] leading-relaxed">{`SELECT * FROM users
SELECT id FROM orders WHERE user_id = 123
SELECT * FROM products LIKE '%phone%'
UPDATE users SET name = 'John' WHERE id = 1
SELECT * FROM logs ORDER BY created_at`}</pre>
                    </div>
                    <div className="terminal rounded-xl">
                      <div className="terminal-header"><div className="terminal-dot bg-red-500"/><div className="terminal-dot bg-yellow-400"/><div className="terminal-dot bg-green-500"/><span className="text-[#7A9CC0] text-xs ml-2">search_log.txt</span></div>
                      <pre className="p-4 text-xs text-[#00E676] leading-relaxed">{`machine learning tutorials
how to optimize SQL queries
best distributed systems books
the a is are in the
next.js vs remix performance`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── MY FILES ── */}
            {tab==='indices' && (
              <div className="space-y-4" style={{animation:'pageIn 0.3s ease both'}}>
                {files.length === 0 ? (
                  <div className="card p-12 text-center">
                    <div className="text-5xl mb-4">📁</div>
                    <h3 className="font-display font-bold text-xl text-white mb-2">No files yet</h3>
                    <p className="text-[#7A9CC0] mb-6">Upload a .txt file to get started.</p>
                    <button onClick={()=>setTab('upload')} className="btn-primary px-6 py-3 rounded-xl text-white font-semibold"><span>Upload File</span></button>
                  </div>
                ) : files.map(f => (
                  <div key={f.id} className="card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C6FF]/20 to-[#7B2FBE]/20 border border-[rgba(0,198,255,0.2)] flex items-center justify-center text-xl">📄</div>
                        <div>
                          <h3 className="font-display font-bold text-white">{f.name}</h3>
                          <p className="text-[#7A9CC0] text-xs">{fmtDate(f.uploadedAt)}</p>
                        </div>
                      </div>
                      <span className="badge text-xs" style={{background:`${STATUS_COLOR[f.status]}20`,border:`1px solid ${STATUS_COLOR[f.status]}40`,color:STATUS_COLOR[f.status]}}>{f.status}</span>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                      {[['Words',fmt(f.wordCount)],['Unique',fmt(f.uniqueWords)],['Size',f.size],['Pages',f.pages],['Vocab',f.vocabRichness+'%'],['Avg Len',f.avgWordLength]].map(([l,v])=>(
                        <div key={l} className="text-center p-2 rounded-xl bg-[rgba(0,198,255,0.04)] border border-[rgba(0,198,255,0.06)]">
                          <p className="text-[#7A9CC0] text-xs mb-0.5">{l}</p>
                          <p className="font-display font-bold text-white text-sm">{v}</p>
                        </div>
                      ))}
                    </div>

                    {f.topKeywords?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[#7A9CC0] text-xs mb-2">Top Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {f.topKeywords.map((k:any) => (
                            <span key={k.word} className="badge badge-primary text-xs">{k.word} <span className="opacity-60 ml-1">×{k.freq}</span></span>
                          ))}
                        </div>
                      </div>
                    )}

                    {f.queryAnalysis && (
                      <div className="mb-4 p-4 rounded-xl bg-[rgba(0,198,255,0.04)] border border-[rgba(0,198,255,0.08)]">
                        <p className="text-[#7A9CC0] text-xs font-semibold mb-2 uppercase tracking-wider">Query Analysis</p>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {[['Total Queries',f.queryAnalysis.totalQueries],['Unique Patterns',f.queryAnalysis.uniquePatterns],['Avg Length',f.queryAnalysis.avgLength+'ch']].map(([l,v])=>(
                            <div key={l}><p className="text-[#7A9CC0] text-xs">{l}</p><p className="text-white font-semibold font-display">{v}</p></div>
                          ))}
                        </div>
                        {f.queryAnalysis.slowPatterns?.slice(0,3).map((p:any,i:number) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[rgba(0,0,0,0.3)] mb-2">
                            <span className="badge text-xs shrink-0" style={{background:`${IMPACT_COLOR[p.impact]}20`,border:`1px solid ${IMPACT_COLOR[p.impact]}40`,color:IMPACT_COLOR[p.impact]}}>{p.impact}</span>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-semibold">{p.pattern} <span className="text-[#7A9CC0] font-normal">×{p.count}</span></p>
                              <p className="text-[#7A9CC0] text-xs">{p.suggestion}</p>
                              <p className="text-[#00E676] text-xs font-mono mt-0.5">{p.fix}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <button onClick={()=>{handleViewDetail(f)}} className="btn-primary px-4 py-2 rounded-lg text-sm text-white font-semibold"><span>📊 Full Analysis</span></button>
                      <button onClick={()=>{setSearchQ('');setTab('search')}} className="btn-outline px-4 py-2 rounded-lg text-sm font-semibold">🔍 Search This</button>
                      <button onClick={()=>handleDelete(f.id,f.name)} className="px-4 py-2 rounded-lg text-sm border border-[rgba(255,23,68,0.3)] text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] transition-all font-semibold">🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── SEARCH ── */}
            {tab==='search' && (
              <div style={{animation:'pageIn 0.3s ease both'}}>
                <form onSubmit={handleSearch} className="mb-6">
                  <div className="search-bar rounded-xl flex items-center px-4 py-3 gap-3">
                    <svg className="w-5 h-5 text-[#00C6FF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
                    <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                      className="flex-1 bg-transparent text-[#E8F4FD] outline-none text-sm"
                      placeholder="Search across all indexed files using BM25…" />
                    {searchQ && <button type="button" onClick={()=>{setSearchQ('');setSearchResults([])}} className="text-[#7A9CC0] hover:text-white text-xl">×</button>}
                    <button type="submit" disabled={searching} className="btn-primary px-5 py-2 rounded-xl text-sm text-white font-semibold shrink-0 disabled:opacity-60">
                      <span>{searching?'…':'Search'}</span>
                    </button>
                  </div>
                </form>

                {files.length === 0 && (
                  <div className="text-center py-16 card p-10">
                    <div className="text-5xl mb-3">📤</div>
                    <p className="text-[#7A9CC0]">Upload files first to enable search.</p>
                    <button onClick={()=>setTab('upload')} className="mt-4 btn-primary px-5 py-2 rounded-xl text-white text-sm"><span>Upload File</span></button>
                  </div>
                )}

                {searching && (
                  <div className="space-y-3">
                    {[...Array(3)].map((_,i)=><div key={i} className="card p-5 space-y-2"><div className="shimmer h-4 rounded w-3/4"/><div className="shimmer h-3 rounded w-full"/><div className="shimmer h-3 rounded w-5/6"/></div>)}
                  </div>
                )}

                {!searching && searchResults.length > 0 && (
                  <div>
                    <p className="text-[#7A9CC0] text-xs mb-4">
                      <strong className="text-[#00C6FF]">{searchResults.length}</strong> results for "<strong className="text-white">{searchQ}</strong>" — {searchLatency}ms (BM25)
                    </p>
                    <div className="space-y-3">
                      {searchResults.map((r,i) => (
                        <div key={i} className="card p-5" style={{animation:`slideUpIn 0.3s ease ${i*0.05}s both`}}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📄</span>
                              <span className="font-display font-semibold text-[#00C6FF] text-sm">{r.fileName}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="badge badge-primary text-xs">Score: {r.score}</span>
                              <span className="text-[#7A9CC0] text-xs">{r.matchCount} terms matched</span>
                            </div>
                          </div>
                          <p className="text-[#7A9CC0] text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{__html: highlightText(r.excerpt, r.highlights)}} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!searching && searchResults.length === 0 && searchQ && files.length > 0 && (
                  <div className="text-center py-16 text-[#7A9CC0]">
                    <div className="text-5xl mb-3">😕</div>
                    <p>No results found for "<strong className="text-white">{searchQ}</strong>"</p>
                    <p className="text-sm mt-2">Try different keywords or check your indexed files.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {tab==='analytics' && (
              <div className="space-y-5" style={{animation:'pageIn 0.3s ease both'}}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    ['Files','📁',totalFiles.toString(),'uploaded'],
                    ['Words','📝',fmt(totalWords),'indexed'],
                    ['Vocab Richness','🎯',avgVocab+'%','avg uniqueness'],
                    ['Index Terms','🔑',fmt(indexSize),'unique terms'],
                  ].map(([l,icon,v,s])=>(
                    <div key={l} className="card p-5">
                      <div className="flex items-center gap-2 mb-2"><span className="text-xl">{icon}</span><span className="text-[#7A9CC0] text-xs">{l}</span></div>
                      <p className="font-display font-bold text-2xl text-white mb-1">{v}</p>
                      <p className="text-[#7A9CC0] text-xs">{s}</p>
                    </div>
                  ))}
                </div>

                {files.length === 0 ? (
                  <div className="card p-10 text-center"><p className="text-[#7A9CC0]">Upload files to see analytics.</p></div>
                ) : (
                  <>
                    <div className="card p-6">
                      <h3 className="font-display font-bold text-white mb-4">File Overview</h3>
                      <div className="space-y-3">
                        {files.map(f => (
                          <div key={f.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[rgba(0,198,255,0.03)] transition-colors">
                            <span className="text-lg">📄</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{f.name}</p>
                              <p className="text-[#7A9CC0] text-xs">{fmt(f.wordCount)} words · vocab richness {f.vocabRichness}%</p>
                            </div>
                            <div className="progress-bar w-32 h-2">
                              <div className="progress-fill h-full" style={{width:`${Math.min(100,f.vocabRichness)}%`}}/>
                            </div>
                            <span className="text-[#7A9CC0] text-xs w-10 text-right">{f.vocabRichness}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {files.some(f=>f.queryAnalysis?.slowPatterns?.length) && (
                      <div className="card p-6">
                        <h3 className="font-display font-bold text-white mb-4">⚡ Query Optimization Issues Found</h3>
                        <div className="space-y-3">
                          {files.flatMap(f=>(f.queryAnalysis?.slowPatterns||[]).map((p:any)=>({...p,file:f.name}))).slice(0,8).map((p:any,i:number)=>(
                            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[rgba(0,198,255,0.05)]">
                              <span className="badge text-xs shrink-0 mt-0.5" style={{background:`${IMPACT_COLOR[p.impact]}20`,border:`1px solid ${IMPACT_COLOR[p.impact]}40`,color:IMPACT_COLOR[p.impact]}}>{p.impact}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-white text-sm font-semibold">{p.pattern}</p>
                                  <span className="text-[#7A9CC0] text-xs">in {p.file}</span>
                                  <span className="badge badge-primary text-xs">×{p.count}</span>
                                </div>
                                <p className="text-[#7A9CC0] text-xs mb-1">{p.suggestion}</p>
                                <p className="text-[#00E676] text-xs font-mono">Fix: {p.fix}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── SETTINGS ── */}
            {tab==='settings' && (
              <div className="space-y-5" style={{animation:'pageIn 0.3s ease both'}}>
                <div className="card p-6">
                  <h2 className="font-display font-bold text-white mb-5">Profile</h2>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center text-white text-2xl font-bold font-display">{user?.name?.[0]?.toUpperCase()||'U'}</div>
                    <div>
                      <p className="font-display font-bold text-white text-lg">{user?.name||'User'}</p>
                      <p className="text-[#7A9CC0] text-sm">{user?.email||'user@example.com'}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {['Name','Email'].map(f=>(
                      <div key={f}>
                        <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">{f}</label>
                        <input type={f==='Email'?'email':'text'} defaultValue={f==='Name'?user?.name:user?.email} className="input-field w-full px-4 py-3 rounded-xl text-sm"/>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>toast.success('Profile updated!')} className="mt-4 btn-primary px-5 py-2.5 rounded-xl text-white font-semibold text-sm"><span>Save Profile</span></button>
                </div>

                <div className="card p-6">
                  <h2 className="font-display font-bold text-white mb-5">Email Configuration</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Resend API Key</label>
                      <input type="password" value={settings.resendApiKey} onChange={e=>setSettings(p=>({...p,resendApiKey:e.target.value}))} className="input-field w-full px-4 py-3 rounded-xl text-sm font-mono" placeholder="re_xxxxxxxxxxxx"/>
                      <p className="text-[#7A9CC0] text-xs mt-1">From <a href="https://resend.com/api-keys" target="_blank" className="text-[#00C6FF]">resend.com/api-keys</a></p>
                    </div>
                    <div>
                      <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">Admin Gmail (receives notifications)</label>
                      <input type="email" value={settings.adminEmail} onChange={e=>setSettings(p=>({...p,adminEmail:e.target.value}))} className="input-field w-full px-4 py-3 rounded-xl text-sm" placeholder="your@gmail.com"/>
                    </div>
                    <div>
                      <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">From Name</label>
                      <input type="text" value={settings.fromName} onChange={e=>setSettings(p=>({...p,fromName:e.target.value}))} className="input-field w-full px-4 py-3 rounded-xl text-sm"/>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="font-display font-bold text-white mb-4">Notifications</h2>
                  {[['crawlAlerts','Index completion alerts','Get notified when a file finishes indexing'],['weeklyDigest','Weekly digest','Summary of search activity every Monday']].map(([k,l,d])=>(
                    <div key={k} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[rgba(0,198,255,0.03)] transition-colors mb-2">
                      <button onClick={()=>setSettings(p=>({...p,[k]:!p[k as keyof typeof p]}))}
                        className={`relative w-10 h-5 rounded-full transition-all duration-300 shrink-0 ${settings[k as keyof typeof settings]?'bg-[#00C6FF]':'bg-[rgba(122,156,192,0.3)]'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${settings[k as keyof typeof settings]?'left-5':'left-0.5'}`}/>
                      </button>
                      <div><p className="text-white text-sm font-medium">{l}</p><p className="text-[#7A9CC0] text-xs">{d}</p></div>
                    </div>
                  ))}
                </div>

                <div className="card p-6">
                  <h2 className="font-display font-bold text-white mb-4">BM25 Ranking Parameters</h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[['alpha','BM25 Weight (α)','0.7'],['bm25K1','k1 (term saturation)','1.5'],['bm25B','b (length norm)','0.75']].map(([k,l,def])=>(
                      <div key={k}>
                        <label className="block text-[#7A9CC0] text-xs font-medium mb-1.5">{l}</label>
                        <input type="number" step="0.05" value={settings[k as keyof typeof settings]} onChange={e=>setSettings(p=>({...p,[k]:e.target.value}))} className="input-field w-full px-4 py-3 rounded-xl text-sm font-mono"/>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleSaveSettings} className="btn-primary px-8 py-3 rounded-xl text-white font-semibold">
                    <span>{settingsSaved?'✓ Saved!':'💾 Save All Settings'}</span>
                  </button>
                  <button onClick={()=>toast.error('Use the delete buttons in My Files tab.')} className="px-6 py-3 rounded-xl border border-[rgba(255,23,68,0.3)] text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] transition-all font-semibold text-sm">
                    🗑️ Clear All Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Full Analysis Modal */}
      {expandedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{animation:'fadeIn 0.2s ease both'}}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={()=>setExpandedFile(null)}/>
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto glass rounded-2xl border border-[rgba(0,198,255,0.2)] shadow-2xl" style={{animation:'scaleIn 0.22s ease both'}}>
            <div className="sticky top-0 glass flex items-center justify-between px-6 py-4 border-b border-[rgba(0,198,255,0.1)]">
              <div>
                <h2 className="font-display font-bold text-white text-lg">{expandedFile.name}</h2>
                <p className="text-[#7A9CC0] text-xs">{fmtDate(expandedFile.uploadedAt)}</p>
              </div>
              <button onClick={()=>setExpandedFile(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-[#7A9CC0] hover:text-white transition-all text-lg">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[['Words',fmt(expandedFile.wordCount)],['Unique Words',fmt(expandedFile.uniqueWords)],['Size',expandedFile.size||((expandedFile.sizeBytes||0)>1024?(Math.round((expandedFile.sizeBytes||0)/1024))+'KB':'<1KB')],['Vocab Richness',(expandedFile.vocabRichness||0)+'%'],['Avg Word Len',(expandedFile.avgWordLength||0)],['Pages',expandedFile.pages||Math.max(1,Math.round((expandedFile.wordCount||0)/500))]].map(([l,v])=>(
                  <div key={l} className="text-center p-3 rounded-xl bg-[rgba(0,198,255,0.04)] border border-[rgba(0,198,255,0.06)]">
                    <p className="text-[#7A9CC0] text-xs mb-1">{l}</p>
                    <p className="font-display font-bold text-white text-sm">{v}</p>
                  </div>
                ))}
              </div>

              {/* Top Keywords */}
              {expandedFile.topKeywords?.length > 0 && (
                <div>
                  <p className="text-[#7A9CC0] text-xs font-semibold uppercase tracking-wider mb-3">Top 10 Keywords</p>
                  <div className="space-y-2">
                    {expandedFile.topKeywords.map((k:any,i:number) => (
                      <div key={k.word} className="flex items-center gap-3">
                        <span className="text-[#7A9CC0] text-xs w-5 font-mono">{i+1}</span>
                        <span className="text-white text-sm flex-1">{k.word}</span>
                        <div className="progress-bar w-24 h-1.5">
                          <div className="progress-fill h-full" style={{width:`${Math.min(100,Math.round(k.freq/(expandedFile.topKeywords[0]?.freq||1)*100))}%`}}/>
                        </div>
                        <span className="text-[#7A9CC0] text-xs w-8 text-right font-mono">{k.freq}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Query Analysis */}
              {expandedFile.queryAnalysis && (
                <div>
                  <p className="text-[#7A9CC0] text-xs font-semibold uppercase tracking-wider mb-3">Query Analysis</p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[['Total Queries',expandedFile.queryAnalysis.totalQueries],['Unique Patterns',expandedFile.queryAnalysis.uniquePatterns],['Duplicates',expandedFile.queryAnalysis.duplicates?.length||0]].map(([l,v])=>(
                      <div key={l} className="text-center p-3 rounded-xl bg-[rgba(123,47,190,0.08)] border border-[rgba(123,47,190,0.15)]">
                        <p className="text-[#7A9CC0] text-xs mb-1">{l}</p>
                        <p className="font-display font-bold text-white text-lg">{v}</p>
                      </div>
                    ))}
                  </div>

                  {expandedFile.queryAnalysis.slowPatterns?.map((p:any,i:number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(0,0,0,0.2)] mb-2 border border-[rgba(0,198,255,0.05)]">
                      <span className="badge text-xs shrink-0" style={{background:`${IMPACT_COLOR[p.impact]}20`,border:`1px solid ${IMPACT_COLOR[p.impact]}40`,color:IMPACT_COLOR[p.impact]}}>{p.impact}</span>
                      <div>
                        <p className="text-white text-sm font-semibold">{p.pattern} <span className="text-[#7A9CC0] font-normal text-xs">×{p.count}</span></p>
                        <p className="text-[#7A9CC0] text-xs">{p.suggestion}</p>
                        <p className="text-[#00E676] text-xs font-mono mt-0.5">→ {p.fix}</p>
                        {p.example && <p className="text-[#7A9CC0] text-xs font-mono mt-1 opacity-70 truncate">e.g. {p.example.substring(0,80)}</p>}
                      </div>
                    </div>
                  ))}

                  {expandedFile.queryAnalysis.duplicates?.length > 0 && (
                    <div className="p-3 rounded-xl bg-[rgba(255,214,0,0.05)] border border-[rgba(255,214,0,0.15)]">
                      <p className="text-[#FFD600] text-xs font-semibold mb-2">💡 Caching Opportunities (Duplicate Patterns)</p>
                      {expandedFile.queryAnalysis.duplicates.slice(0,5).map((d:string,i:number) => (
                        <p key={i} className="text-[#7A9CC0] text-xs font-mono">{d}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={()=>{setSearchQ(expandedFile.topKeywords?.[0]?.word||'');setTab('search');setExpandedFile(null)}}
                  className="btn-primary px-5 py-2.5 rounded-xl text-white text-sm font-semibold"><span>🔍 Search This File</span></button>
                <button onClick={()=>{handleDelete(expandedFile.id,expandedFile.name);setExpandedFile(null)}}
                  className="px-5 py-2.5 rounded-xl text-sm border border-[rgba(255,23,68,0.3)] text-[#FF1744] hover:bg-[rgba(255,23,68,0.08)] transition-all font-semibold">🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
