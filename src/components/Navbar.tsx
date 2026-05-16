'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Home',     href: '/',        section: '' },
  { label: 'Features', href: '/#features', section: 'features' },
  { label: 'How It Works', href: '/#how', section: 'how' },
  { label: 'Search',   href: '/search',  section: '' },
  { label: 'Docs',     href: '/docs',    section: '' },
  { label: 'Contact',  href: '/contact', section: '' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check login state
    const user = localStorage.getItem('sq_user')
    setLoggedIn(!!user)
  }, [pathname])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30)
      // Highlight active section
      const sections = ['features', 'how', 'crawler', 'testimonials']
      let current = ''
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el && window.scrollY >= el.offsetTop - 120) current = id
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('sq_user')
    document.cookie = 'sq_token=; Max-Age=0; path=/'
    setLoggedIn(false)
    router.push('/')
  }

  const isActive = (link: typeof NAV_LINKS[0]) => {
    if (link.section && activeSection === link.section) return true
    if (!link.section && pathname === link.href) return true
    if (link.href !== '/' && !link.section && pathname.startsWith(link.href)) return true
    return false
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'navbar shadow-lg shadow-black/30' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center shadow-lg shadow-[#00C6FF]/30 group-hover:shadow-[#00C6FF]/60 transition-all duration-300 group-hover:scale-110">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5"/>
                <line x1="10" y1="10" x2="14" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="6.5" cy="6.5" r="2" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight">
              Smart<span className="gradient-text-blue">Query</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <Link key={link.label} href={link.href}
                className={`nav-link ${isActive(link) ? 'active' : ''}`}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {loggedIn ? (
              <>
                <Link href="/dashboard"
                  className="px-4 py-2 text-sm font-semibold text-[#00C6FF] border border-[rgba(0,198,255,0.3)] rounded-lg hover:bg-[rgba(0,198,255,0.08)] transition-all duration-200">
                  Dashboard
                </Link>
                <button onClick={handleLogout}
                  className="px-4 py-2 text-sm font-semibold text-[#7A9CC0] hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login"
                  className="px-4 py-2 text-sm font-semibold text-[#00C6FF] border border-[rgba(0,198,255,0.3)] rounded-lg hover:bg-[rgba(0,198,255,0.08)] transition-all duration-200">
                  Sign In
                </Link>
                <Link href="/auth/signup"
                  className="btn-primary px-5 py-2 rounded-lg text-sm text-white">
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button className="md:hidden p-2 rounded-lg text-[#7A9CC0] hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            <div className="w-5 flex flex-col gap-1.5">
              <span className={`h-0.5 bg-current rounded transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`h-0.5 bg-current rounded transition-all duration-200 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`h-0.5 bg-current rounded transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="absolute inset-0 bg-[#050B18]/96 backdrop-blur-xl" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3 px-8">
            {NAV_LINKS.map((link, i) => (
              <Link key={link.label} href={link.href}
                className={`text-2xl font-display font-semibold transition-all duration-200 py-2 ${isActive(link) ? 'text-[#00C6FF]' : 'text-white/80 hover:text-[#00C6FF]'}`}
                style={{ animation: `slideUpIn 0.3s ease ${i * 0.05}s both` }}>
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 mt-8 w-full max-w-xs" style={{ animation: 'slideUpIn 0.3s ease 0.3s both' }}>
              {loggedIn ? (
                <>
                  <Link href="/dashboard" className="text-center py-3 border border-[rgba(0,198,255,0.3)] rounded-xl text-[#00C6FF] font-semibold">Dashboard</Link>
                  <button onClick={handleLogout} className="text-center py-3 border border-[rgba(122,156,192,0.2)] rounded-xl text-[#7A9CC0] font-semibold">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-center py-3 border border-[rgba(0,198,255,0.3)] rounded-xl text-[#00C6FF] font-semibold">Sign In</Link>
                  <Link href="/auth/signup" className="btn-primary text-center py-3 rounded-xl text-white font-semibold"><span>Get Started Free</span></Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
