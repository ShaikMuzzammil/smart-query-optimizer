'use client';

import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { Bell, UploadCloud, Search, Sparkles, Settings as SettingsIcon, Trophy, CheckCheck } from 'lucide-react';
import { fetcher, patchJSON } from '../../lib/fetcher';
import { timeAgo, cn } from '../../lib/utils';
import { NotificationItem } from '../../types';

const ICONS: Record<string, any> = {
  upload: UploadCloud,
  search: Search,
  ai: Sparkles,
  system: SettingsIcon,
  achievement: Trophy,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, mutate } = useSWR<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications', fetcher, {
    refreshInterval: 15000,
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  async function markAllRead() {
    await patchJSON('/api/notifications', { markAllRead: true });
    mutate();
  }

  async function markRead(id: string) {
    await patchJSON('/api/notifications', { id });
    mutate();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-elevated transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 card-base shadow-elevated z-50 animate-fade-in max-h-[28rem] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-display font-semibold text-sm text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-primary-light hover:underline">
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ink-faint">No notifications yet.</div>
            ) : (
              notifications.map((n) => {
                const Icon = ICONS[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className={cn(
                      'w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border/60 hover:bg-elevated/60 transition-colors',
                      !n.read && 'bg-primary/5'
                    )}
                  >
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', !n.read ? 'bg-primary/15 text-primary-light' : 'bg-elevated text-ink-faint')}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs text-ink-faint mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5 ml-auto" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
