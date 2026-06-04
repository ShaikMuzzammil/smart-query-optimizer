'use client';

import { useEffect, useState } from 'react';
import { useApp } from '../lib/store';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Notification } from '../lib/engine';

interface Toast extends Notification {
  visible: boolean;
}

export function NotificationToasts() {
  const { state, dispatch } = useApp();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const latest = state.notifications[0];
    if (!latest || latest.read) return;

    setToasts(prev => {
      if (prev.find(t => t.id === latest.id)) return prev;
      return [{ ...latest, visible: true }, ...prev].slice(0, 4);
    });

    const timer = setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === latest.id ? { ...t, visible: false } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== latest.id));
      }, 300);
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: latest.id });
    }, 4000);

    return () => clearTimeout(timer);
  }, [state.notifications, dispatch]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: { border: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '#10b981' },
    error: { border: '#f43f5e', bg: 'rgba(244,63,94,0.12)', icon: '#f43f5e' },
    warning: { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '#f59e0b' },
    info: { border: '#06b6d4', bg: 'rgba(6,182,212,0.12)', icon: '#06b6d4' },
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" style={{ maxWidth: '360px', width: '90vw' }}>
      {toasts.map(toast => {
        const Icon = icons[toast.type];
        const color = colors[toast.type];
        return (
          <div
            key={toast.id}
            className="notification-toast flex items-start gap-3 p-4 rounded-xl"
            style={{
              background: '#0d1520',
              border: `1px solid ${color.border}40`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color.border}20`,
              opacity: toast.visible ? 1 : 0,
              transform: toast.visible ? 'translateX(0)' : 'translateX(110%)',
              transition: 'all 0.3s ease',
            }}
          >
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: color.icon }} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{toast.title}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{toast.message}</div>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="flex-shrink-0 p-0.5 rounded"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
