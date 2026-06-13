'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Loader2, RotateCcw, Save, User, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { fetcher, patchJSON, postJSON } from '../../../lib/fetcher';
import { UserSettings } from '../../../types';
import { DEMO_USER_ID } from '../../../lib/constants';
import GuideTip from '../../../components/ui/GuideTip';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data, mutate } = useSWR<{ settings: UserSettings }>('/api/user/settings', fetcher);
  const [local, setLocal] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const isDemo = (session?.user as any)?.id === DEMO_USER_ID;

  useEffect(() => {
    if (data?.settings) setLocal(data.settings);
  }, [data]);

  async function save() {
    if (!local) return;
    setSaving(true);
    try {
      await patchJSON('/api/user/settings', local);
      toast.success('Settings saved.');
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function resetSession() {
    if (!window.confirm('This will permanently delete all your files, search history, and notifications. Your account stays active. Continue?')) return;
    setResetting(true);
    try {
      await postJSON('/api/user/reset', {});
      toast.success('Session reset. Your workspace is now empty.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset session.');
    } finally {
      setResetting(false);
    }
  }

  if (!local) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-4">
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">Settings</h2>
        <GuideTip title="Settings">
          Search preferences control how the query optimizer and ranking engine behave. Changes apply to your next
          search. The demo account's settings are fixed so the experience stays consistent for everyone.
        </GuideTip>
      </div>

      {/* Account */}
      <div className="card-base p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-ink">Account</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-muted">Name</span>
            <span className="text-ink">{session?.user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Email</span>
            <span className="text-ink font-mono text-xs">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Plan</span>
            <span className="badge bg-elevated text-ink-muted border border-border uppercase">{(session?.user as any)?.plan || 'free'}</span>
          </div>
        </div>
      </div>

      {/* Search preferences */}
      <div className="card-base p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="w-4 h-4 text-accent" />
          <h3 className="font-display font-semibold text-ink">Search preferences</h3>
        </div>

        <div className="space-y-4">
          <ToggleRow
            label="Remove stopwords"
            description="Ignore common words (the, and, of, etc.) when indexing and searching."
            checked={local.stopwordsEnabled}
            onChange={(v) => setLocal({ ...local, stopwordsEnabled: v })}
            disabled={isDemo}
          />
          <ToggleRow
            label="Case-sensitive search"
            description="Match the exact capitalization of your search terms."
            checked={local.caseSensitiveSearch}
            onChange={(v) => setLocal({ ...local, caseSensitiveSearch: v })}
            disabled={isDemo}
          />
          <ToggleRow
            label="Fuzzy matching"
            description="Allow the optimizer to correct typos using Levenshtein distance against your vocabulary."
            checked={local.fuzzySearch}
            onChange={(v) => setLocal({ ...local, fuzzySearch: v })}
            disabled={isDemo}
          />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">Default result count</p>
              <p className="text-xs text-ink-muted mt-0.5">Number of results returned per search by default.</p>
            </div>
            <select
              value={local.defaultResultCount}
              onChange={(e) => setLocal({ ...local, defaultResultCount: parseInt(e.target.value, 10) })}
              disabled={isDemo}
              className="input-field w-24"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={save} disabled={saving || isDemo} className="btn-primary text-sm mt-5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save preferences
        </button>
        {isDemo && <p className="text-xs text-ink-faint mt-2">Settings are read-only on the demo account.</p>}
      </div>

      {/* Danger zone */}
      <div className="card-base p-5 sm:p-6 border-danger/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-danger" />
          <h3 className="font-display font-semibold text-ink">Danger zone</h3>
        </div>
        <p className="text-sm text-ink-muted mb-4">
          Reset your session to permanently delete all files, search history, and notifications. Your account and
          login will remain active.
        </p>
        <button onClick={resetSession} disabled={resetting} className="btn-secondary text-sm hover:border-danger hover:text-danger">
          {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
          Reset session
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label, description, checked, onChange, disabled,
}: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-muted mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-border'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
