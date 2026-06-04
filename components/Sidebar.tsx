'use client';

import { useApp } from '../lib/store';
import { Trash2, FileText, ChevronRight, HardDrive } from 'lucide-react';

export function Sidebar() {
  const { state, deleteFile, navigateTo, dispatch } = useApp();
  const { files, selectedFile } = state;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    return `${(bytes / 1024).toFixed(1)}KB`;
  };

  return (
    <aside
      className="hidden lg:flex flex-col w-60 border-r overflow-y-auto flex-shrink-0"
      style={{
        background: 'rgba(8,12,20,0.8)',
        borderColor: 'rgba(30,58,95,0.5)',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(30,58,95,0.4)' }}>
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} />
          <span className="mono text-xs font-bold" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            SESSION FILES
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{files.length} indexed</span>
          {files.length > 0 && (
            <button
              onClick={() => navigateTo('upload')}
              className="text-xs" style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 px-3 py-3 space-y-1">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-8 h-8 mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No files yet</p>
            <button
              onClick={() => navigateTo('upload')}
              className="mt-3 text-xs"
              style={{ color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}
            >
              Upload first file →
            </button>
          </div>
        ) : (
          files.map(file => (
            <div
              key={file.id}
              className={`sidebar-item group ${selectedFile?.id === file.id ? 'active' : ''}`}
              onClick={() => {
                dispatch({ type: 'SELECT_FILE', payload: file });
                navigateTo('files');
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: file.stats.issues.length > 0 ? '#f43f5e' : '#06b6d4' }} />
                <div className="min-w-0">
                  <div className="text-xs truncate" style={{ color: 'var(--text-primary)', maxWidth: '120px' }} title={file.name}>
                    {file.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                      {formatSize(file.size)}
                    </span>
                    {file.queryCount > 0 && (
                      <span className="badge badge-amber" style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem' }}>
                        {file.queryCount}q
                      </span>
                    )}
                    {file.stats.issues.length > 0 && (
                      <span className="badge badge-rose" style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem' }}>
                        {file.stats.issues.length}!
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 rounded"
                style={{ background: 'rgba(244,63,94,0.1)', border: 'none', cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); deleteFile(file.id); }}
                title="Delete file"
              >
                <Trash2 className="w-3 h-3" style={{ color: '#f43f5e' }} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer stats */}
      {files.length > 0 && (
        <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(30,58,95,0.4)' }}>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>TOTAL WORDS</span>
              <span className="mono text-xs" style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                {files.reduce((s,f)=>s+f.stats.wordCount,0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>ISSUES</span>
              <span className="mono text-xs" style={{ color: '#f43f5e', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                {files.reduce((s,f)=>s+f.stats.issues.length,0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>INDEX TERMS</span>
              <span className="mono text-xs" style={{ color: '#06b6d4', fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                {state.globalMetrics.indexTerms.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
