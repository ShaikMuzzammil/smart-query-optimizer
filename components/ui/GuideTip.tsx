'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface GuideTipProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Small contextual "how to use this" popover. Used throughout the app
 * (search, upload, analytics, AI insights) to give first-time users
 * inline guidance without cluttering the UI.
 */
export default function GuideTip({ title, children, className }: GuideTipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={cn('relative inline-flex', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-ink-faint hover:text-primary hover:bg-elevated transition-colors"
        aria-label={`Help: ${title}`}
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-50 top-6 left-0 w-72 card-base shadow-elevated p-4 animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="font-display font-semibold text-sm text-ink">{title}</p>
            <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs text-ink-muted leading-relaxed">{children}</div>
        </div>
      )}
    </div>
  );
}
