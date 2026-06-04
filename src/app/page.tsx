'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const TYPING = ['SELECT * FROM users WHERE active = 1','LIKE \'%machine learning%\'','find cheap flights to New York','UPDATE orders SET status = ?','machine learning optimization tips']

const FEATURES = [
  {icon:'🔍',t:'BM25 Full-Text Search',d:'Real inverted index with BM25 scoring. Search across all uploaded files with millisecond latency and highlighted excerpts.',c:'from-[#00C6FF] to-[#0080FF]'},
  {icon:'⚡',t:'SQL Pattern Detection',d:'10 detection rules: SELECT *, missing WHERE, leading LIKE %, N+1 queries, OR vs IN, ORDER BY without LIMIT, and more.',c:'from-[#FF6B35] to-[#FF1744]'},
  {icon:'📊',t:'Real Query Analytics',d:'Live KPI cards, category breakdown, top keywords, vocabulary richness, and query length statistics from your actual files.',c:'from-[#7B2FBE] to-[#A855F7]'},
  {icon:'🎯',t:'Caching Opportunities',d:'Automatically detect duplicate and near-duplicate query patterns. Get exact counts and suggested Redis TTL strategies.',c:'from-[#00E676] to-[#00C6FF]'},
  {icon:'📈',t:'Performance Insights',d:'HIGH/MEDIUM/LOW severity scoring for every slow pattern. Each issue shows a concrete fix with example SQL.',c:'from-[#FFD600] to-[#FF6B35]'},
  {icon:'💾',t:'Persistent File History',d:'All uploaded files and analyses stored in session. Re-open any file\'s full report, delete when done.',c:'from-[#A855F7] to-[#7B2FBE]'},
]

export default function Home() {
  const [q, setQ] = useState('')
  const [typingText, setTypingText] = useState('')
  const [tIdx, setTIdx] = useState(0)
  const [del, setDel] = useState(false)
  const [demo, setDemo] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [statsVis, setStatsVis] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const phrase = TYPING[tIdx]
    const speed = del?35:70
    const t = setTimeout(()=>{
      if(!del&&typingText.length<phrase.length) setTypingText(phrase.slice(0,typingText.length+1))
      else if(del&&typingText.length>0) setTypingText(typingText.slice(0,-1))
      else if(!del) setTimeout(()=>setDel(true),2400)
      else{setDel(false);setTIdx((tIdx+1)%TYPING.length)}
    },speed)
    return ()=>clearTimeout(t)
  },[typingText,del,tIdx])

  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{if(e.isIntersecting)setStatsVis(true)},{threshold:0.3})
    if(statsRef.current) obs.observe(statsRef.current)
    return ()=>obs.disconnect()
  },[])

  const doSearch = async(e: React.FormEvent)=>{
    e.preventDefault()
    if(!q.trim()) return
    setSearching(true)
    try{
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setDemo(data.results||[])
    }catch{}
    setSearching(false)
  }

  return (
    <div style={{minHeight:'100vh'}}>
      {/* NAV */}
      <nav className="nav" style={{position:'fixed',top:0,left:0,right:0,zIndex:50}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
            <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
            </div>
            <span style={{fontFamily:'Syne',fontWeight:700,fontSize:18,color:'white'}}>Smart<span className="gtext-b">Query</span></span>
          </Link>
          <div style={{display:'flex',alignItems:'center',gap:24}}>
            {[['Features','/#features'],['How It Works','/#how'],['Search','/search'],['Docs','/docs'],['Contact','/contact']].map(([l,h])=>(
              <Link key={l} href={h} className="nl" style={{textDecoration:'none'}}>{l}</Link>
            ))}
          </div>
          <div style={{display:'flex',gap:12}}>
            <Link href="/auth/login" className="btn-o" style={{padding:'8px 18px',borderRadius:8,textDecoration:'none',fontSize:14}}>Sign In</Link>
            <Link href="/auth/signup" className="btn-p" style={{padding:'8px 18px',borderRadius:8,textDecoration:'none',fontSize:14}}><span>Get Started</span></Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'100px 24px 60px',textAlign:'center',position:'relative'}}>
        <div style={{position:'absolute',top:'25%',left:'20%',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,198,255,0.12),transparent)',animation:'float 9s ease-in-out infinite',pointerEvents:'none'}} />
        <div style={{position:'absolute',bottom:'30%',right:'20%',width:220,height:220,borderRadius:'50%',background:'radial-gradient(circle,rgba(123,47,190,0.1),transparent)',animation:'float 12s ease-in-out infinite 2s',pointerEvents:'none'}} />
        <div style={{maxWidth:900,position:'relative',zIndex:1}}>
          <div className="badge bp" style={{marginBottom:24,fontSize:12}} >
            <span style={{width:6,height:6,borderRadius:'50%',background:'#00E676',display:'inline-block',marginRight:6,animation:'pulse 2s infinite'}} />
            Real BM25 search · SQL pattern detection · 10 optimization rules
          </div>
          <h1 style={{fontFamily:'Syne',fontWeight:800,fontSize:'clamp(40px,7vw,80px)',lineHeight:1.1,color:'white',marginBottom:20}}>
            Analyze Queries.<br/><span className="gtext">Fix Performance.</span>
          </h1>
          <p style={{color:'#7A9CC0',fontSize:20,maxWidth:600,margin:'0 auto 40px',lineHeight:1.7}}>
            Upload any query log. Get real SQL optimization advice, BM25-powered search, duplicate detection, and actionable insights — instantly.
          </p>
          <div style={{display:'flex',gap:16,justifyContent:'center',marginBottom:56}}>
            <Link href="/auth/signup" className="btn-p" style={{padding:'16px 36px',borderRadius:12,fontSize:17,textDecoration:'none'}}><span>🚀 Start Analyzing Free</span></Link>
            <Link href="/search" className="btn-o" style={{padding:'16px 36px',borderRadius:12,fontSize:17,textDecoration:'none'}}>🔍 Try Live Search</Link>
          </div>
          {/* Live search demo */}
          <div style={{maxWidth:680,margin:'0 auto'}}>
            <form onSubmit={doSearch} style={{position:'relative'}}>
              <div className="sbar" style={{borderRadius:16,display:'flex',alignItems:'center',padding:'14px 20px',gap:12}}>
                <svg style={{width:18,height:18,color:'#00C6FF',flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder={typingText+'|'}
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#E8F4FD',fontFamily:"'JetBrains Mono',monospace",fontSize:14,minWidth:0}} />
                {q&&<button type="button" onClick={()=>{setQ('');setDemo([])}} style={{color:'#7A9CC0',border:'none',background:'none',fontSize:20,lineHeight:1}}>×</button>}
                <button type="submit" disabled={searching} className="btn-p" style={{padding:'8px 20px',borderRadius:10,fontSize:13,flexShrink:0,opacity:searching?0.6:1}}>
                  <span>{searching?'…':'Search'}</span>
                </button>
              </div>
            </form>
            {demo.length>0&&(
              <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
                {demo.map((r,i)=>(
                  <div key={i} className="card" style={{padding:'14px 18px',textAlign:'left',animation:`slideUp 0.3s ease ${i*0.06}s both`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <span style={{color:'#00C6FF',fontFamily:'Syne',fontWeight:600,fontSize:14}}>{r.fileName}</span>
                      <span className="badge bp" style={{fontSize:11}}>BM25: {r.score}</span>
                    </div>
                    <p style={{color:'#7A9CC0',fontSize:12,lineHeight:1.6}} dangerouslySetInnerHTML={{__html:r.excerpt.substring(0,160)}} />
                  </div>
                ))}
                <p style={{color:'#7A9CC0',fontSize:12,textAlign:'center'}}>Upload files first to get real search results</p>
              </div>
            )}
            {!demo.length&&!searching&&<p style={{color:'#7A9CC0',fontSize:12,marginTop:10}}>Search indexes are built from your uploaded .txt files</p>}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{padding:'0 24px 80px'}} ref={statsRef}>
        <div style={{maxWidth:900,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}}>
          {[['10+','Detection Rules'],['BM25','Ranking Engine'],['<50ms','Search Latency'],['0','External APIs']].map(([v,l])=>(
            <div key={l} className="card" style={{padding:'24px 16px',textAlign:'center',transition:'all 0.7s',opacity:statsVis?1:0,transform:statsVis?'none':'translateY(16px)'}}>
              <div style={{fontFamily:'Syne',fontWeight:800,fontSize:32,marginBottom:6,background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{v}</div>
              <div style={{color:'#7A9CC0',fontSize:13}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" style={{padding:'60px 24px 80px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div className="badge bp" style={{marginBottom:16}}>How It Works</div>
            <h2 style={{fontFamily:'Syne',fontWeight:700,fontSize:'clamp(28px,4vw,48px)',color:'white',marginBottom:12}}>Three Steps to Faster Queries</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
            {[{s:'01',icon:'📤',t:'Upload',d:'Drag & drop any .txt file with SQL queries, search logs, or API calls. Up to 10MB — thousands of queries at once.'},
              {s:'02',icon:'🧠',t:'Analyze',d:'Real-time: inverted index built, 10 SQL rules applied, duplicates found, BM25 scored, categories assigned.'},
              {s:'03',icon:'⚡',t:'Optimize',d:'View each slow pattern, click the fix, search across files instantly. Every insight is backed by real data from your file.'}
            ].map(step=>(
              <div key={step.s} className="card" style={{padding:32,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,right:0,fontFamily:'Syne',fontWeight:800,fontSize:80,color:'rgba(255,255,255,0.03)',lineHeight:1}}>{step.s}</div>
                <div style={{fontSize:36,marginBottom:14}}>{step.icon}</div>
                <div className="badge bp" style={{marginBottom:12,fontSize:11}}>Step {step.s}</div>
                <h3 style={{fontFamily:'Syne',fontWeight:700,fontSize:20,color:'white',marginBottom:10}}>{step.t}</h3>
                <p style={{color:'#7A9CC0',fontSize:14,lineHeight:1.7}}>{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{padding:'60px 24px 80px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <div className="badge bp" style={{marginBottom:16}}>Features</div>
            <h2 style={{fontFamily:'Syne',fontWeight:700,fontSize:'clamp(28px,4vw,48px)',color:'white',marginBottom:12}}>Real Functionality. Real Results.</h2>
            <p style={{color:'#7A9CC0',fontSize:17,maxWidth:500,margin:'0 auto'}}>Every feature processes your actual uploaded data. Zero mockups.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
            {FEATURES.map(f=>(
              <div key={f.t} className="card" style={{padding:24,position:'relative',overflow:'hidden'}}>
                <div style={{width:48,height:48,borderRadius:12,background:`linear-gradient(135deg,${f.c.includes('to')? f.c.split('to-')[1].replace('[','').replace(']',''):f.c} 0%, #050B18 100%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:14,border:'1px solid rgba(0,198,255,0.2)'}}>
                  {f.icon}
                </div>
                <h3 style={{fontFamily:'Syne',fontWeight:700,fontSize:16,color:'white',marginBottom:8}}>{f.t}</h3>
                <p style={{color:'#7A9CC0',fontSize:13,lineHeight:1.7}}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'60px 24px 100px'}}>
        <div style={{maxWidth:800,margin:'0 auto'}}>
          <div className="card" style={{padding:64,textAlign:'center',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(0,198,255,0.04),rgba(123,47,190,0.04))'}} />
            <div style={{position:'relative',zIndex:1}}>
              <h2 style={{fontFamily:'Syne',fontWeight:800,fontSize:'clamp(28px,4vw,52px)',color:'white',marginBottom:14}}>
                Ready to Optimize?<br/><span className="gtext">Upload Your First File.</span>
              </h2>
              <p style={{color:'#7A9CC0',fontSize:17,marginBottom:36}}>No credit card. No setup. Just upload and get insights.</p>
              <div style={{display:'flex',gap:16,justifyContent:'center'}}>
                <Link href="/auth/signup" className="btn-p" style={{padding:'16px 36px',borderRadius:12,fontSize:16,textDecoration:'none'}}><span>🚀 Get Started Free</span></Link>
                <Link href="/docs" className="btn-o" style={{padding:'16px 36px',borderRadius:12,fontSize:16,textDecoration:'none'}}>Read the Docs</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid rgba(0,198,255,0.1)',padding:'40px 24px'}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
          <span style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:16}}>Smart<span className="gtext-b">Query</span></span>
          <div style={{display:'flex',gap:24}}>
            {[['Search','/search'],['Contact','/contact'],['Privacy','/privacy'],['Terms','/terms'],['Docs','/docs']].map(([l,h])=>(
              <Link key={l} href={h} style={{color:'#7A9CC0',textDecoration:'none',fontSize:13,transition:'color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.color='#00C6FF')} onMouseOut={e=>(e.currentTarget.style.color='#7A9CC0')}>{l}</Link>
            ))}
          </div>
          <p style={{color:'#7A9CC0',fontSize:13}}>© 2025 SmartQuery Optimizer</p>
        </div>
      </footer>
    </div>
  )
}
