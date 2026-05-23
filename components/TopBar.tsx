'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store';
import {
  LayoutDashboard, Upload, FolderOpen, Search, BarChart2,
  Settings, LogOut, Bell, Menu, X, Database
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'files', label: 'My Files', icon: FolderOpen },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function TopBar() {
  const { state, dispatch, navigateTo } = useApp();
  const { activeSection, notifications, files } = state;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  const handleSignOut = () => {
    dispatch({ type: 'CLEAR_ALL' });
    navigateTo('home');
  };

  return (
    <>
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ background: 'rgba(8,12,20,0.95)', borderColor: 'rgba(30,58,95,0.6)', backdropFilter: 'blur(12px)' }}
      >
        {/* Logo */}
        <button
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2 group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)' }}>
              <Database className="w-4 h-4" style={{ color: '#f59e0b' }} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="display font-bold text-sm" style={{ color: '#f59e0b', fontFamily: 'var(--font-display)' }}>
              SmartQuery
            </span>
            <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
              OPTIMIZER v2.0
            </span>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`nav-link flex items-center gap-1.5 ${activeSection === item.id ? 'active' : ''}`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="mono text-xs" style={{ color: '#10b981', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
              {files.length} files
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg transition-all"
              style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(30,58,95,0.5)' }}
            >
              <Bell className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: '#f43f5e', color: 'white', fontSize: '0.55rem', fontFamily: 'var(--font-mono)' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50"
                style={{ background: '#0d1520', border: '1px solid rgba(30,58,95,0.8)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(30,58,95,0.6)' }}>
                  <span className="mono text-xs font-bold" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>NOTIFICATIONS</span>
                  <button
                    onClick={() => dispatch({ type: 'CLEAR_NOTIFICATIONS' })}
                    className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear all
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        className="px-4 py-3 border-b flex gap-3 items-start"
                        style={{ borderColor: 'rgba(30,58,95,0.3)', background: n.read ? 'transparent' : 'rgba(245,158,11,0.03)' }}
                        onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id })}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.type === 'success' ? 'bg-emerald-400' :
                          n.type === 'error' ? 'bg-rose-400' :
                          n.type === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'
                        }`} />
                        <div>
                          <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</div>
                          <div className="mono text-xs mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                            {n.timestamp instanceof Date ? n.timestamp.toLocaleTimeString() : new Date(n.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
            style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', cursor: 'pointer' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(30,58,95,0.5)', cursor: 'pointer' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} /> : <Menu className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden" style={{ background: 'rgba(8,12,20,0.98)', borderBottom: '1px solid rgba(30,58,95,0.6)' }}>
          <nav className="flex flex-col p-4 gap-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { navigateTo(item.id); setMobileOpen(false); }}
                  className={`nav-link flex items-center gap-2 text-left ${activeSection === item.id ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
