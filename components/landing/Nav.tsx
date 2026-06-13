'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import Logo from '../ui/Logo';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#ai', label: 'AI Optimizer' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#guide', label: 'Guide' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-base/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-ink-muted hover:text-ink transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary">
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <button className="md:hidden text-ink" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3 animate-slide-up">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="block text-sm font-medium text-ink-muted hover:text-ink py-1" onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Link href="/login" className="btn-secondary flex-1 justify-center">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary flex-1 justify-center">
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
