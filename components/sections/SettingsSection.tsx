'use client';
// components/sections/SettingsSection.tsx
import React, { useState } from 'react';
import { useApp } from '../../lib/AppContext';
import { formatBytes } from '../../lib/analyzer';
import type { AppSettings } from '../../lib/types';

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: () => void; label: string; desc?: string }) {
  return (
    <div className="toggle-wrap" style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div>
        <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500, marginBottom: desc ? 2 : 0 }}>{label}</div>
        {desc && <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{desc}</div>}
      </div>
      <div className={`toggle ${on ? 'on' : ''}`} onClick={onChange} role="switch" aria-checked={on}>
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '18px 22px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="section-icon" style={{ width: 30, height: 30, fontSize: 14 }}>{icon}</div>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

export default function SettingsSection() {
  const { state, dispatch, addNotification, navigate } = useApp();
  const { settings, files, searchHistory, totalQueries } = state;
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const update = (patch: Partial<AppSettings>) => dispatch({ type: 'UPDATE_SETTINGS', settings: patch });

  const exportSession = () => {
    const data = {
      exported: new Date().toISOString(),
      version: '3.0',
      metrics: {
        totalFiles: files.length,
        totalWords: files.reduce((s, f) => s + f.analysis.wordCount, 0),
        totalQueries,
        totalSearchHistory: searchHistory.length,
      },
      settings,
      files: files.map(f => ({
        name: f.name, size: formatBytes(f.size), uploadedAt: new Date(f.uploadedAt).toISOString(),
        queryCount: f.queryCount, tags: f.tags,
        analysis: {
          wordCount: f.analysis.wordCount, uniqueWordCount: f.analysis.uniqueWordCount,
          lineCount: f.analysis.lineCount, charCount: f.analysis.charCount,
          sentenceCount: f.analysis.sentenceCount, lexicalDensity: f.analysis.lexicalDensity,
          readability: f.analysis.readability, sentiment: f.analysis.sentiment,
          issueCount: f.analysis.issues.length, issueTotal: f.analysis.issues.reduce((s, i) => s + i.count, 0),
          topWords: f.analysis.topWords.slice(0, 10),
        },
      })),
      searchHistory: searchHistory.slice(0, 50),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `smartquery-session-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    addNotification('success', 'Session Exported', 'Full session data downloaded as JSON.');
  };

  const exportCSV = () => {
    const headers = ['Name', 'Size', 'Words', 'Unique Words', 'Lines', 'Chars', 'Sentences', 'Readability Score', 'Readability Level', 'Sentiment', 'Sentiment Score', 'Issues', 'Lexical Density', 'Queries'];
    const rows = files.map(f => [
      f.name, formatBytes(f.size), f.analysis.wordCount, f.analysis.uniqueWordCount,
      f.analysis.lineCount, f.analysis.charCount, f.analysis.sentenceCount,
      f.analysis.readability.score, f.analysis.readability.level,
      f.analysis.sentiment.label, f.analysis.sentiment.score,
      f.analysis.issues.reduce((s, i) => s + i.count, 0),
      f.analysis.lexicalDensity + '%', f.queryCount,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `smartquery-files-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    addNotification('success', 'CSV Exported', `${files.length} files exported as CSV.`);
  };

  const clearSession = () => {
    dispatch({ type: 'CLEAR_SESSION' });
    try { sessionStorage.clear(); } catch {}
    setShowConfirmClear(false);
    addNotification('info', 'Session Cleared', 'All files and history have been reset.');
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title"><span className="section-icon">⚙</span> Settings</div>
          <div className="section-subtitle">Customize analysis behavior, search defaults, and session management</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        {/* Left column */}
        <div>
          {/* Analysis settings */}
          <Section title="Analysis Options" icon="◈">
            <Toggle on={settings.filterStopwords} onChange={() => update({ filterStopwords: !settings.filterStopwords })} label="Filter Stopwords" desc="Exclude common words (the, a, is…) from index terms and word frequency" />
            <Toggle on={settings.showReadability} onChange={() => update({ showReadability: !settings.showReadability })} label="Show Readability Scores" desc="Compute Flesch-Kincaid readability for each uploaded file" />
            <Toggle on={settings.showSentiment} onChange={() => update({ showSentiment: !settings.showSentiment })} label="Show Sentiment Analysis" desc="Detect positive/negative language patterns" />
            <Toggle on={settings.showBigrams} onChange={() => update({ showBigrams: !settings.showBigrams })} label="Show Bigrams" desc="Extract frequent two-word phrases from files" />
            <div style={{ paddingTop: 12 }}>
              <label className="label">Minimum Word Length</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input className="input" type="range" min={1} max={6} value={settings.minWordLength} onChange={e => update({ minWordLength: Number(e.target.value) })} style={{ flex: 1, accentColor: 'var(--accent)' }} />
                <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)', fontSize: 14, fontWeight: 700, width: 24, textAlign: 'center' }}>{settings.minWordLength}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Minimum character length for words to be indexed</div>
            </div>
          </Section>

          {/* Search settings */}
          <Section title="Search Defaults" icon="⌕">
            <Toggle on={settings.caseSensitiveSearch} onChange={() => update({ caseSensitiveSearch: !settings.caseSensitiveSearch })} label="Case Sensitive by Default" desc="New searches will match exact letter case" />
            <Toggle on={settings.autoSearch} onChange={() => update({ autoSearch: !settings.autoSearch })} label="Auto-Search as You Type" desc="Run search automatically while typing (400ms debounce)" />
          </Section>

          {/* UI settings */}
          <Section title="Interface" icon="◉">
            <Toggle on={settings.animationsEnabled} onChange={() => update({ animationsEnabled: !settings.animationsEnabled })} label="Enable Animations" desc="Fade-in transitions, hover effects, and particle canvas" />
            <Toggle on={settings.notificationsEnabled} onChange={() => update({ notificationsEnabled: !settings.notificationsEnabled })} label="Enable Notifications" desc="Show toast notifications for uploads, searches, and errors" />
            <Toggle on={settings.compactMode} onChange={() => update({ compactMode: !settings.compactMode })} label="Compact Mode" desc="Reduce padding and spacing throughout the interface" />
            <Toggle on={settings.keyboardShortcuts} onChange={() => update({ keyboardShortcuts: !settings.keyboardShortcuts })} label="Keyboard Shortcuts" desc="Ctrl+1–7 to navigate between sections" />
          </Section>
        </div>

        {/* Right column */}
        <div>
          {/* File limits */}
          <Section title="File Limits" icon="▦">
            <div style={{ marginBottom: 14 }}>
              <label className="label">Max File Size</label>
              <select className="input" value={settings.maxFileSizeMB} onChange={e => update({ maxFileSizeMB: Number(e.target.value) })}>
                <option value={1}>1 MB</option>
                <option value={5}>5 MB</option>
                <option value={10}>10 MB</option>
                <option value={25}>25 MB</option>
                <option value={50}>50 MB</option>
              </select>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Maximum size per uploaded file. Current: {settings.maxFileSizeMB}MB</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="label">Accent Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['#00ff9d', '#00c8ff', '#a78bfa', '#f59e0b', '#ff6b9d', '#4ecdc4'].map(c => (
                  <div key={c} onClick={() => update({ accentColor: c })} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: settings.accentColor === c ? `3px solid white` : '3px solid transparent', transition: 'border 0.2s', boxShadow: settings.accentColor === c ? `0 0 10px ${c}` : 'none' }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>Visual accent color (applied on next load)</div>
            </div>
          </Section>

          {/* Export */}
          <Section title="Export Data" icon="↓">
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.6 }}>
              Export your session data in multiple formats. Includes all file analyses, search history, and metrics.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <button className="btn btn-secondary" onClick={exportSession} disabled={files.length === 0}>
                <span>↓</span> Export JSON
              </button>
              <button className="btn btn-secondary" onClick={exportCSV} disabled={files.length === 0}>
                <span>↓</span> Export CSV
              </button>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text3)', fontFamily: 'JetBrains Mono', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '10px 12px' }}>
              <div>Session: {files.length} files · {totalQueries} queries</div>
              <div style={{ marginTop: 2 }}>Storage: sessionStorage (clears on tab close)</div>
              <div style={{ marginTop: 2 }}>Total size: {formatBytes(files.reduce((s, f) => s + f.size, 0))}</div>
            </div>
          </Section>

          {/* Session management */}
          <Section title="Session Management" icon="⏻">
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
              All data is stored in sessionStorage — it persists while your tab is open but clears when you close it. Clearing the session removes all indexed files, search history, and analytics.
            </div>

            {showConfirmClear ? (
              <div style={{ background: 'rgba(255,68,85,0.08)', border: '1px solid rgba(255,68,85,0.2)', borderRadius: 8, padding: '16px' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--danger)', marginBottom: 8 }}>⚠ Confirm Clear Session</div>
                <div style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 14 }}>
                  This will permanently remove all {files.length} indexed files and {searchHistory.length} search history entries. This cannot be undone.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-danger" onClick={clearSession}><span>✕</span> Yes, Clear Everything</button>
                  <button className="btn btn-ghost" onClick={() => setShowConfirmClear(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-danger" onClick={() => setShowConfirmClear(true)} disabled={files.length === 0 && searchHistory.length === 0}>
                  <span>✕</span> Clear Session
                </button>
                <button className="btn btn-ghost" onClick={() => navigate('home')}>
                  <span>⌂</span> Back to Home
                </button>
              </div>
            )}
          </Section>

          {/* Keyboard shortcuts reference */}
          {settings.keyboardShortcuts && (
            <Section title="Keyboard Shortcuts" icon="⌨">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[['Ctrl+1', 'Home'], ['Ctrl+2', 'Overview'], ['Ctrl+3', 'Upload'], ['Ctrl+4', 'My Files'], ['Ctrl+5', 'Search'], ['Ctrl+6', 'Analytics'], ['Ctrl+7', 'Settings']].map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{key}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* App info footer */}
      <div className="card" style={{ padding: '14px 22px', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>
            SmartQuery Optimizer v3.0 · Next.js 14 · Zero external dependencies · 100% client-side · sessionStorage persistence
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-success">✓ Vercel Ready</span>
            <span className="badge badge-info">BM25 Search</span>
            <span className="badge badge-purple">Zero CSS Deps</span>
          </div>
        </div>
      </div>
    </div>
  );
}
