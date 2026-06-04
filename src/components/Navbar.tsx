'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label:'Home',      href:'/' },
  { label:'Optimizer', href:'/optimizer', badge:'AI' },
  { label:'Examples',  href:'/examples' },
  { label:'History',   href:'/history' },
  { label:'About',     href:'/about' },
  { label:'Contact',   href:'/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)
  const pathname                = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <nav className="nav" style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', transition:'all 0.3s', boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none' }}>
        {/* Logo */}
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#00C6FF,#7B2FBE)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="5.5" cy="5.5" r="4.5" stroke="white" strokeWidth="1.5"/>
              <path d="M9 9L13 13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M5.5 3v5M3 5.5h5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:16, letterSpacing:'-0.01em' }}>
            <span style={{ background:'linear-gradient(135deg,#00C6FF,#7B2FBE)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Smart</span>
            <span style={{ color:'#E8F4FD' }}>Query</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display:'flex', alignItems:'center', gap:2, position:'absolute', left:'50%', transform:'translateX(-50%)' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={`nl ${isActive(n.href)?'active':''}`}
              style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, textDecoration:'none', transition:'all 0.2s' }}>
              {n.label}
              {n.badge && <span style={{ padding:'1px 6px', borderRadius:100, fontSize:9, fontWeight:700, background:'rgba(0,198,255,0.15)', border:'1px solid rgba(0,198,255,0.3)', color:'#00C6FF', letterSpacing:'0.06em' }}>{n.badge}</span>}
            </Link>
          ))}
        </div>

        {/* CTA + mobile toggle */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/optimizer" className="btn-p" style={{ padding:'8px 18px', borderRadius:8, fontSize:13, textDecoration:'none', display:'none' }} id="nav-cta">
            <span>Launch →</span>
          </Link>
          <button onClick={()=>setOpen(v=>!v)}
            style={{ width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,198,255,0.08)', border:'1px solid rgba(0,198,255,0.2)', borderRadius:8, color:'#00C6FF', cursor:'pointer', fontSize:18 }}>
            {open ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div style={{ position:'fixed', top:64, left:0, right:0, zIndex:999, background:'rgba(5,11,24,0.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(0,198,255,0.1)', padding:'12px 20px 20px' }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, marginBottom:4, textDecoration:'none', background:isActive(n.href)?'rgba(0,198,255,0.1)':'transparent', color:isActive(n.href)?'#00C6FF':'#7A9CC0', fontWeight:600, fontSize:14, border:`1px solid ${isActive(n.href)?'rgba(0,198,255,0.2)':'transparent'}`, transition:'all 0.2s' }}>
              <span>{n.label}</span>
              {n.badge && <span style={{ padding:'1px 6px', borderRadius:100, fontSize:9, fontWeight:700, background:'rgba(0,198,255,0.15)', color:'#00C6FF' }}>{n.badge}</span>}
            </Link>
          ))}
          <Link href="/optimizer" className="btn-p" style={{ display:'flex', alignItems:'center', justifyContent:'center', marginTop:8, padding:'12px', borderRadius:10, fontSize:14, fontWeight:700, textDecoration:'none', gap:8 }}>
            <span>🚀 Launch Optimizer</span>
          </Link>
        </div>
      )}

      <style>{`
        @media(min-width:640px){#nav-cta{display:inline-flex!important}}
        @media(max-width:768px){nav>div:nth-child(2){display:none!important}}
      `}</style>
    </>
  )
}
