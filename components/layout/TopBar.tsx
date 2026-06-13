'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your workspace at a glance' },
  '/upload': { title: 'Upload', subtitle: 'Add documents to your index' },
  '/files': { title: 'My Files', subtitle: 'Browse and manage indexed documents' },
  '/search': { title: 'Search', subtitle: 'Query your index with the AI optimizer' },
  '/analytics': { title: 'Analytics', subtitle: 'Trends across your workspace' },
  '/ai-insights': { title: 'AI Insights', subtitle: 'Summaries and Q&A powered by Gemini' },
  '/settings': { title: 'Settings', subtitle: 'Preferences and account management' },
};

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = TITLES[pathname || ''] || { title: 'SmartQuery Pro', subtitle: '' };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-base/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="md:hidden text-ink-muted hover:text-ink" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="font-display font-semibold text-ink leading-tight truncate">{meta.title}</h1>
          {meta.subtitle && <p className="text-xs text-ink-faint hidden sm:block">{meta.subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {pathname !== '/search' && (
          <button
            onClick={() => router.push('/search')}
            className="hidden sm:flex items-center gap-2 text-sm text-ink-muted hover:text-ink border border-border rounded-lg px-3 py-1.5 hover:border-ring transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Quick search
          </button>
        )}
        <NotificationBell />
      </div>
    </header>
  );
}
