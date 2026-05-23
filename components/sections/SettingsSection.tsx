'use client';

import { useApp } from '../../lib/store';
import {
  Trash2, Download, ToggleLeft, Search, FileText,
  Bell, Volume2, Eye, Database, Sliders, RefreshCw
} from 'lucide-react';

function SettingRow({
  icon: Icon, title, description, children, danger = false,
}: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b"
      style={{ borderColor: 'rgba(30,58,95,0.3)' }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: danger ? 'rgba(244,63,94,0.1)' : 'rgba(30,58,95,0.4)',
            border: `1px solid ${danger ? 'rgba(244,63,94,0.3)' : 'rgba(30,58,95,0.6)'}`,
          }}>
          <Icon className="w-4 h-4" style={{ color: danger ? '#f43f5e' : 'var(--text-secondary)' }} />
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: danger ? '#f43f5e' : 'var(--text-primary)' }}>{title}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</div>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={onToggle} />
  );
}

export function SettingsSection() {
  const { state, dispatch, doExport, navigateTo } = useApp();
  const { settings, files, totalQueries, searchHistory } = state;

  const update = (patch: Partial<typeof settings>) =>
    dispatch({ type: 'UPDATE_SETTINGS', payload: patch });

  const handleClearAll = () => {
    if (window.confirm('Clear all indexed files, metrics, and search history? This cannot be undone.')) {
      dispatch({ type: 'CLEAR_ALL' });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'info', title: 'Session Cleared', message: 'All data has been reset.' } });
    }
  };

  const sessionSize = JSON.stringify(state.files).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="section-subtitle mb-1">Configuration</div>
        <h1 className="section-title">Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Customize analysis behaviour, search defaults, and session management.
        </p>
      </div>

      {/* Session overview card */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4" style={{ color: '#06b6d4' }} />
          <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Current Session
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Files Indexed', val: files.length, c: '#06b6d4' },
            { label: 'Total Queries', val: totalQueries, c: '#f59e0b' },
            { label: 'Search History', val: searchHistory.length, c: '#8b5cf6' },
            { label: 'Session Data', val: `${(sessionSize/1024).toFixed(1)}KB`, c: '#10b981' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-lg"
              style={{ background: 'rgba(13,21,32,0.6)', border: '1px solid rgba(30,58,95,0.4)' }}>
              <div className="mono text-xl font-bold" style={{ color: s.c, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4" style={{ color: '#f59e0b' }} />
          <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Analysis Settings
          </h3>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Controls how files are indexed and metrics are computed.</p>

        <SettingRow icon={ToggleLeft} title="Filter Stopwords" description="Exclude common words (a, the, and, etc.) from Index Terms count and Analytics charts.">
          <Toggle on={settings.stopwordsEnabled} onToggle={() => update({ stopwordsEnabled: !settings.stopwordsEnabled })} />
        </SettingRow>

        <SettingRow icon={Eye} title="Show Line Numbers" description="Display line numbers in file content previews and issue locations.">
          <Toggle on={settings.showLineNumbers} onToggle={() => update({ showLineNumbers: !settings.showLineNumbers })} />
        </SettingRow>

        <SettingRow icon={RefreshCw} title="Auto-Analyze on Upload" description="Immediately run full analysis when a file is dropped. Disable to defer analysis.">
          <Toggle on={settings.autoAnalyze} onToggle={() => update({ autoAnalyze: !settings.autoAnalyze })} />
        </SettingRow>

        <SettingRow icon={FileText} title="Maximum File Size" description="Files larger than this limit will be rejected. Prevents slow parsing of very large documents.">
          <select
            value={settings.maxFileSize}
            onChange={e => update({ maxFileSize: Number(e.target.value) })}
            className="input-field"
            style={{ width: '140px' }}
          >
            <option value={1048576}>1 MB</option>
            <option value={2097152}>2 MB</option>
            <option value={5242880}>5 MB</option>
            <option value={10485760}>10 MB</option>
          </select>
        </SettingRow>
      </div>

      {/* Search Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4" style={{ color: '#06b6d4' }} />
          <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Search Settings
          </h3>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Control how search behaves and how results are displayed.</p>

        <SettingRow icon={Search} title="Case-Sensitive Search" description="When enabled, 'Error' and 'error' are treated as different terms.">
          <Toggle on={settings.caseSensitive} onToggle={() => update({ caseSensitive: !settings.caseSensitive })} />
        </SettingRow>

        <SettingRow icon={RefreshCw} title="Real-Time Search" description="Trigger search as you type (debounced). Disable for manual search-on-Enter only.">
          <Toggle on={settings.realtimeSearch} onToggle={() => update({ realtimeSearch: !settings.realtimeSearch })} />
        </SettingRow>

        <SettingRow icon={Eye} title="Default Search Filter" description="Which filter is pre-selected when you open the Search section.">
          <select
            value={settings.defaultFilter}
            onChange={e => update({ defaultFilter: e.target.value })}
            className="input-field"
            style={{ width: '180px' }}
          >
            <option value="case-insensitive">Case Insensitive</option>
            <option value="exact">Exact Match</option>
            <option value="whole-word">Whole Word</option>
            <option value="fuzzy">Fuzzy Match</option>
            <option value="contains-all">Contains All Words</option>
            <option value="regex">Regex Pattern</option>
          </select>
        </SettingRow>

        <SettingRow icon={Sliders} title="Snippet Length (chars)" description="How many characters of context appear around each match in search results.">
          <select
            value={settings.snippetLength}
            onChange={e => update({ snippetLength: Number(e.target.value) })}
            className="input-field"
            style={{ width: '120px' }}
          >
            <option value={60}>60 chars</option>
            <option value={120}>120 chars</option>
            <option value={200}>200 chars</option>
            <option value={400}>400 chars</option>
          </select>
        </SettingRow>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4" style={{ color: '#8b5cf6' }} />
          <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Notifications
          </h3>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Toast alerts for uploads, searches, exports, and errors.</p>

        <SettingRow icon={Bell} title="Enable Notifications" description="Show toast alerts for file uploads, search results, errors, and actions.">
          <Toggle on={settings.notificationsEnabled} onToggle={() => update({ notificationsEnabled: !settings.notificationsEnabled })} />
        </SettingRow>

        <SettingRow icon={Volume2} title="Sound Alerts" description="Play a subtle chime on important events (upload complete, error detected). Requires notifications.">
          <Toggle on={settings.soundEnabled} onToggle={() => update({ soundEnabled: !settings.soundEnabled })} />
        </SettingRow>
      </div>

      {/* Export Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4" style={{ color: '#10b981' }} />
          <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Export
          </h3>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Download your session data for external use or record-keeping.</p>

        <SettingRow icon={FileText} title="Export Format" description="Choose the file format when exporting session data.">
          <select
            value={settings.exportFormat}
            onChange={e => update({ exportFormat: e.target.value as any })}
            className="input-field"
            style={{ width: '120px' }}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="txt">Plain Text</option>
          </select>
        </SettingRow>

        <div className="pt-4">
          <button
            onClick={doExport}
            disabled={files.length === 0}
            className="btn-secondary flex items-center gap-2"
            style={{ opacity: files.length === 0 ? 0.5 : 1 }}
          >
            <Download className="w-4 h-4" />
            Export Session as {settings.exportFormat.toUpperCase()}
          </button>
          {files.length === 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Upload files first to enable export.
            </p>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6" style={{ border: '1px solid rgba(244,63,94,0.25)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4" style={{ color: '#f43f5e' }} />
          <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: '#f43f5e' }}>
            Danger Zone
          </h3>
        </div>
        <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
          Irreversible actions. Proceed with caution.
        </p>

        <SettingRow
          icon={Trash2}
          title="Clear All Files"
          description="Remove all indexed files, reset metrics, and clear search history. Settings are preserved."
          danger
        >
          <button
            onClick={handleClearAll}
            disabled={files.length === 0 && totalQueries === 0}
            className="btn-danger flex items-center gap-1.5"
            style={{ opacity: files.length === 0 && totalQueries === 0 ? 0.4 : 1 }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Session
          </button>
        </SettingRow>

        <SettingRow
          icon={RefreshCw}
          title="Reset All Settings"
          description="Restore all settings to their factory defaults. Files are not affected."
          danger
        >
          <button
            onClick={() => {
              dispatch({
                type: 'UPDATE_SETTINGS', payload: {
                  stopwordsEnabled: false, caseSensitive: false, realtimeSearch: false,
                  maxFileSize: 5242880, snippetLength: 120, showLineNumbers: true,
                  autoAnalyze: true, defaultFilter: 'case-insensitive',
                  exportFormat: 'json', notificationsEnabled: true, soundEnabled: false,
                }
              });
              dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'info', title: 'Settings Reset', message: 'All settings restored to defaults.' } });
            }}
            className="btn-danger flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
        </SettingRow>
      </div>

      {/* About */}
      <div className="glass-card p-6">
        <h3 className="font-bold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          About SmartQuery Optimizer
        </h3>
        <div className="space-y-1.5">
          {[
            ['Version', 'v2.0.0'],
            ['Build', 'Next.js 14 + TypeScript'],
            ['Storage', 'sessionStorage (tab-scoped, no server)'],
            ['Privacy', '100% client-side — no data ever leaves your browser'],
            ['Search Filters', '20 advanced filters available'],
            ['Analysis Metrics', '15+ per-file metrics computed on upload'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1">
              <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{k}</span>
              <span className="mono text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
