'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}
function improvColor(p: number) { return p>=70?'#00E676':p>=40?'#00C6FF':'#7B2FBE' }

export default function HistoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/history?page=${page}&limit=12`)
      .then(r => r.json())
      .then(d => { if (d.success) { setItems(d.data.items); setTotal(d.data.total); setPages(d.data.pages) } else setError(d.error||'Failed') })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [page])

  const del = async (id: string) => {
    await fetch(`/api/history?id=${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i._id !== id))
    setTotal(t => t - 1)
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight:'100vh', paddingTop:90, paddingBottom:80 }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 20px' }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:40, flexWrap:'wrap', gap:16 }}>
            <div>
              <span style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(0,198,255,0.08)', border:'1px solid rgba(0,198,255,0.2)', borderRadius:100, padding:'4px 14px', fontSize:11, color:'#00C6FF', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>History</span>
              <h1 style={{ fontSize:'clamp(1.8rem,4vw,2.5rem)', fontFamily:'Syne,sans-serif', fontWeight:800, marginBottom:4 }}>
                Optimization <span className="gtext">History</span>
              </h1>
              <p style={{ color:'#7A9CC0', fontSize:14 }}>{total} optimization{total!==1?'s':''} recorded</p>
            </div>
            <Link href="/optimizer" className="btn-p" style={{ padding:'10px 24px', borderRadius:10, fontSize:14, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
              <span>+ New Optimization</span>
            </Link>
          </div>

          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
              {[...Array(6)].map((_,i) => (
                <div key={i} className="card shimmer" style={{ height:160, borderRadius:14 }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'#7A9CC0' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
              <p style={{ marginBottom:20 }}>{error}</p>
              {!process.env.MONGODB_URI && <p style={{ fontSize:12 }}>MONGODB_URI not configured — history requires a database connection.</p>}
            </div>
          ) : items.length===0 ? (
            <div style={{ textAlign:'center', padding:'80px 0' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📭</div>
              <h3 style={{ fontFamily:'Syne,sans-serif', fontWeight:700, marginBottom:8 }}>No history yet</h3>
              <p style={{ color:'#7A9CC0', marginBottom:24 }}>Optimize a query to see it here.</p>
              <Link href="/optimizer" className="btn-p" style={{ padding:'12px 32px', borderRadius:10, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
                <span>Launch Optimizer</span>
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                {items.map((item:any) => (
                  <div key={item._id} className="card" style={{ padding:20, position:'relative' }}>
                    <button onClick={()=>del(item._id)} title="Delete" style={{ position:'absolute', top:12, right:12, background:'none', border:'none', color:'#445566', cursor:'pointer', fontSize:14, opacity:0, transition:'opacity 0.2s' }}
                      onMouseEnter={e=>(e.currentTarget.style.opacity='1',e.currentTarget.style.color='#FF1744')}
                      onMouseLeave={e=>(e.currentTarget.style.opacity='0')}>✕</button>
                    <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                      <span className="badge bp" style={{ fontSize:10 }}>{item.dbType}</span>
                      <span className="badge bp" style={{ fontSize:10, background:'rgba(123,47,190,0.12)', borderColor:'rgba(123,47,190,0.3)', color:'#7B2FBE' }}>{item.optimizationGoal}</span>
                    </div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#7A9CC0', background:'rgba(10,15,30,0.8)', borderRadius:8, padding:'8px 10px', marginBottom:12, overflow:'hidden', maxHeight:60, lineHeight:1.6 }}>
                      {(item.originalQuery||'').replace(/\s+/g,' ').slice(0,140)}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.3rem', color:improvColor(item.metrics?.estimatedImprovement||0) }}>
                        +{item.metrics?.estimatedImprovement||0}%
                      </span>
                      <span style={{ fontSize:11, color:'#445566' }}>{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {pages>1 && (
                <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:32 }}>
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                    className="btn-o" style={{ padding:'8px 16px', borderRadius:8, fontSize:13, cursor:'pointer', opacity:page===1?0.4:1 }}>←</button>
                  {[...Array(Math.min(pages,7))].map((_,i) => (
                    <button key={i} onClick={()=>setPage(i+1)}
                      style={{ width:36, height:36, borderRadius:8, border:`1px solid ${page===i+1?'rgba(0,198,255,0.4)':'rgba(255,255,255,0.06)'}`, background:page===i+1?'rgba(0,198,255,0.12)':'transparent', color:page===i+1?'#00C6FF':'#7A9CC0', fontSize:13, cursor:'pointer' }}>
                      {i+1}
                    </button>
                  ))}
                  <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}
                    className="btn-o" style={{ padding:'8px 16px', borderRadius:8, fontSize:13, cursor:'pointer', opacity:page===pages?0.4:1 }}>→</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
