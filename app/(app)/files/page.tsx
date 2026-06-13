'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { Search, UploadCloud, Inbox } from 'lucide-react';
import { fetcher, patchJSON } from '../../../lib/fetcher';
import { ClientFile } from '../../../types';
import FileCard from '../../../components/files/FileCard';
import GuideTip from '../../../components/ui/GuideTip';

export default function FilesPage() {
  const [query, setQuery] = useState('');
  const { data, mutate, isLoading } = useSWR<{ files: ClientFile[] }>('/api/files', fetcher, { refreshInterval: 20000 });

  const files = data?.files || [];
  const filtered = query.trim() ? files.filter((f) => f.fileName.toLowerCase().includes(query.toLowerCase())) : files;

  async function togglePin(file: ClientFile) {
    await patchJSON(`/api/files/${file.id}`, { pinned: !file.pinned });
    mutate();
  }

  async function deleteFile(file: ClientFile) {
    if (!window.confirm(`Delete "${file.fileName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/files/${file.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('File deleted.');
      mutate();
    } else {
      toast.error('Failed to delete file.');
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">My Files</h2>
          <GuideTip title="Managing files">
            Pin important files to keep them top-of-mind, delete files you no longer need, and click any file to see
            its full NLP analysis, AI summary, and version history.
          </GuideTip>
        </div>
        <Link href="/upload" className="btn-primary text-sm">
          <UploadCloud className="w-4 h-4" /> Upload
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by file name…"
          className="input-field pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card-base p-5 h-24 skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-base p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-elevated flex items-center justify-center mx-auto mb-3 text-ink-faint">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-sm text-ink-muted">{query ? 'No files match your search.' : 'No files yet. Upload your first document to get started.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((file) => (
            <FileCard key={file.id} file={file} onTogglePin={togglePin} onDelete={deleteFile} />
          ))}
        </div>
      )}
    </div>
  );
}
