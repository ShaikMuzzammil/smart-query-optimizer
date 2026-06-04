'use client'
import Link from 'next/link'

const LINKS = {
  Product:  [{ label:'Web Search', href:'/search' }, { label:'Dashboard', href:'/dashboard' }, { label:'API Docs', href:'/docs#api' }, { label:'Documentation', href:'/docs' }],
  Company:  [{ label:'About', href:'/#about' }, { label:'Contact', href:'/contact' }, { label:'Changelog', href:'/docs#changelog' }],
  Legal:    [{ label:'Privacy Policy', href:'/privacy' }, { label:'Terms of Service', href:'/terms' }],
}

export default function Footer() {
  return (
    <footer className="relative border-t border-[rgba(0,198,255,0.1)] mt-20">
      <div className="absolute inset-0 bg-gradient-to-t from-[#020810] to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C6FF] to-[#7B2FBE] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5"/><line x1="10" y1="10" x2="14" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <span className="font-display font-bold text-lg text-white">Smart<span className="gradient-text-blue">Query</span></span>
            </Link>
            <p className="text-[#7A9CC0] text-sm leading-relaxed">Production-grade distributed web search engine. Crawl, index, and query any corner of the web.</p>
          </div>
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-display font-semibold text-white text-sm mb-4 tracking-wide">{section}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[#7A9CC0] text-sm hover:text-[#00C6FF] transition-colors duration-200">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="section-divider mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#7A9CC0] text-sm">© 2025 SmartQuery Optimizer. All rights reserved.</p>
          <p className="text-[#7A9CC0] text-xs">Built with Next.js · Tailwind · Resend · PostgreSQL</p>
        </div>
      </div>
    </footer>
  )
}
