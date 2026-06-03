'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, ChevronRight, Github, Terminal } from 'lucide-react';

const NAV_LINKS = [
  { href: '/',          label: 'Home' },
  { href: '/optimizer', label: 'Optimizer', badge: 'AI' },
  { href: '/examples',  label: 'Examples' },
  { href: '/history',   label: 'History' },
  { href: '/about',     label: 'About' },
  { href: '/contact',   label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobile]   = useState(false);
  const pathname                  = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobile(false); }, [pathname]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'navbar-glass shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'bg-transparent'
        }`}
      >
        <div className="container-max">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group focus-ring rounded-md">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0080ff] flex items-center justify-center">
                  <Zap size={16} className="text-black" fill="black" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0080ff] blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
              </div>
              <span className="font-display font-bold text-lg tracking-wider">
                <span className="text-gradient-cyber">Smart</span><span className="text-white"> Query</span><span className="text-gradient-cyber ml-0.5"> Optimizer</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(link => {
                const isActive = pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 focus-ring
                      ${isActive
                        ? 'text-[#00d4ff] bg-[rgba(0,212,255,0.08)]'
                        : 'text-[#8899bb] hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {link.label}
                    {link.badge && (
                      <span className="badge badge-cyan text-[9px] py-0.5 px-1.5 leading-none">
                        {link.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#00d4ff] to-[#0080ff] rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* CTA + Mobile toggle */}
            <div className="flex items-center gap-3">
              <Link
                href="/optimizer"
                className="hidden md:flex items-center gap-2 btn-primary py-2 px-5 text-xs"
              >
                <Terminal size={14} />
                Launch Optimizer
                <ChevronRight size={14} />
              </Link>

              <button
                onClick={() => setMobile(v => !v)}
                aria-label="Toggle menu"
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[rgba(0,212,255,0.15)] text-[#8899bb] hover:text-white hover:border-[rgba(0,212,255,0.4)] transition-all focus-ring"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mobileOpen ? 'close' : 'open'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0,   opacity: 1 }}
                    exit={{   rotate:  90,  opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{   opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-16 left-0 right-0 z-40 navbar-glass border-b border-[rgba(0,212,255,0.1)] shadow-xl"
          >
            <div className="container-max py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link, i) => {
                const isActive = pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0   }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all
                        ${isActive
                          ? 'bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border border-[rgba(0,212,255,0.2)]'
                          : 'text-[#8899bb] hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {link.label}
                        {link.badge && (
                          <span className="badge badge-cyan text-[9px]">{link.badge}</span>
                        )}
                      </div>
                      <ChevronRight size={14} className="opacity-50" />
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0  }}
                transition={{ delay: 0.3 }}
                className="pt-2 mt-2 border-t border-[rgba(0,212,255,0.08)]"
              >
                <Link href="/optimizer" className="btn-primary w-full justify-center">
                  <Terminal size={14} />
                  Launch Optimizer
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
