'use client';
// components/AppShell.tsx
import React, { useEffect } from 'react';
import { useApp } from '../lib/AppContext';
import HomeSection from './sections/HomeSection';
import OverviewSection from './sections/OverviewSection';
import UploadSection from './sections/UploadSection';
import FilesSection from './sections/FilesSection';
import SearchSection from './sections/SearchSection';
import AnalyticsSection from './sections/AnalyticsSection';
import SettingsSection from './sections/SettingsSection';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '⌂', section: 'MAIN' },
  { id: 'overview', label: 'Overview', icon: '◈', section: 'MAIN' },
  { id: 'upload', label: 'Upload', icon: '↑', section: 'MAIN' },
  { id: 'files', label: 'My Files', icon: '▦', section: 'MANAGE' },
  { id: 'search', label: 'Search', icon: '⌕', section: 'MANAGE' },
  { id: 'analytics', label: 'Analytics', icon: '◉', section: 'ANALYZE' },
  { id: 'settings', label: 'Settings', icon: '⚙', section: 'SYSTEM' },
];

const SECTION_TITLES: Record<string, string> = {
  home: 'SmartQuery Optimizer',
  overview: 'Dashboard Overview',
  upload: 'File Upload & Analysis',
  files: 'File Manager',
  search: 'Advanced Search',
  analytics: 'Analytics & Insights',
  settings: 'Settings & Preferences',
};

export default function AppShell() {
  const { state, dispatch, addNotification, navigate } = useApp();
  const { activeSection, files, totalQueries, notifications, isLoading, loadingMessage } = state;

  // Keyboard shortcuts
  useEffect(() => {
    if (!state.settings.keyboardShortcuts) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const map: Record<string, string> = {
          '1': 'home', '2': 'overview', '3': 'upload',
          '4': 'files', '5': 'search', '6': 'analytics', '7': 'settings',
        };
        if (map[e.key]) { e.preventDefault(); navigate(map[e.key]); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.settings.keyboardShortcuts, navigate]);

  const handleSignOut = () => {
    dispatch({ type: 'CLEAR_SESSION' });
    try { sessionStorage.clear(); } catch {}
    addNotification('info', 'Session Cleared', 'All files and search history have been reset.');
  };

  const navGroups = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof NAV_ITEMS>);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection />;
      case 'upload': return <UploadSection />;
      case 'files': return <FilesSection />;
      case 'search': return <SearchSection />;
      case 'analytics': return <AnalyticsSection />;
      case 'settings': return <SettingsSection />;
      default: return <HomeSection />;
    }
  };

  return (
    <div id="app-root">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">SQ</div>
          <div>
            <div className="logo-text">SmartQuery</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginTop: 1 }}>v3.0 OPTIMIZER</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {Object.entries(navGroups).map(([section, items]) => (
            <div key={section}>
              <div className="nav-section-label">{section}</div>
              {items.map(item => {
                const badge = item.id === 'files' ? files.length : item.id === 'search' ? totalQueries : null;
                return (
                  <div
                    key={item.id}
                    className={`nav-item${activeSection === item.id ? ' active' : ''}`}
                    onClick={() => navigate(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {badge !== null && badge > 0 && (
                      <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Session Files */}
        {files.length > 0 && (
          <div className="sidebar-files">
            <div className="sidebar-files-title">
              <span>●</span> SESSION FILES
            </div>
            {files.slice(0, 8).map(file => (
              <div key={file.id} className="session-file-item">
                <div className="session-file-dot" />
                <span className="session-file-name" title={file.name}>{file.name}</span>
                {file.queryCount > 0 && (
                  <span className="session-file-count">{file.queryCount}</span>
                )}
              </div>
            ))}
            {files.length > 8 && (
              <div style={{ fontSize: 10, color: 'var(--text3)', padding: '4px 6px' }}>
                +{files.length - 8} more files
              </div>
            )}
          </div>
        )}

        {/* Sign Out */}
        <div className="sidebar-bottom">
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 8, padding: '0 2px' }}>
            {files.length} file{files.length !== 1 ? 's' : ''} · {totalQueries} quer{totalQueries !== 1 ? 'ies' : 'y'}
          </div>
          <button className="btn-signout" onClick={handleSignOut}>
            <span>⏻</span>
            <span>Sign Out</span>
          </button>
          {state.settings.keyboardShortcuts && (
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 6, fontFamily: 'JetBrains Mono' }}>
              Ctrl+1–7 to navigate
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-title" style={{ fontFamily: 'Syne', fontWeight: 700 }}>
            {SECTION_TITLES[activeSection] || 'SmartQuery'}
          </div>
          <div className="topbar-status">
            <div className={`status-dot${isLoading ? ' loading' : ''}`} />
            {isLoading ? (
              <span>{loadingMessage || 'Processing…'}</span>
            ) : (
              <span>
                {files.length > 0
                  ? `${files.length} file${files.length !== 1 ? 's' : ''} indexed`
                  : 'No files indexed'}
              </span>
            )}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('upload')}
            style={{ marginLeft: 8 }}
          >
            <span>↑</span> Upload
          </button>
        </header>

        {/* Section content */}
        <div className="section-content">
          {renderSection()}
        </div>
      </main>

      {/* Notifications */}
      <div className="notifications-wrap">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`notification notif-${n.type}`}
            onClick={() => dispatch({ type: 'REMOVE_NOTIFICATION', id: n.id })}
          >
            <span className="notif-icon">
              {n.type === 'success' ? '✓' : n.type === 'error' ? '✕' : n.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            <div>
              <div className="notif-title">{n.title}</div>
              <div className="notif-msg">{n.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
