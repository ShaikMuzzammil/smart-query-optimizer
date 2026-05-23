'use client';

import { useState } from 'react';
import { useApp } from '../../lib/store';
import { AnalyzedFile } from '../../lib/engine';
import {
  FileText, Trash2, Eye, AlertTriangle, TrendingUp, Search,
  X, ChevronDown, ChevronUp, Upload, BookOpen
} from 'lucide-react';

function FileAnalysisModal({ file, onClose }: { file: AnalyzedFile; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'words' | 'issues' | 'content'>('overview');

  const getSColor = (s: string) => s === 'positive' ? '#10b981' : s === 'negative' ? '#f43f5e' : '#94a3b8';

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '860px' }}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b" style={{ borderColor: 'rgba(30,58,95,0.6)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)' }}>
              <FileText className="w-5 h-5" style={{ color: '#06b6d4' }} />
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {file.name}
              </h2>
              <div className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                {(file.size / 1024).toFixed(1)}KB · {file.stats.wordCount.toLocaleString()} words · indexed {
                  file.uploadedAt instanceof Date
                    ? file.uploadedAt.toLocaleString()
                    : new Date(file.uploadedAt).toLocaleString()
                }
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all"
            style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(30,58,95,0.5)', cursor: 'pointer' }}>
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6" style={{ borderColor: 'rgba(30,58,95,0.4)' }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'words', label: 'Word Analysis' },
            { id: 'issues', label: `Issues (${file.stats.issues.length})` },
            { id: 'content', label: 'Content' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className="px-4 py-3 text-sm border-b-2 transition-all"
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.05em',
                borderColor: tab === t.id ? '#f59e0b' : 'transparent',
                color: tab === t.id ? '#f59e0b' : 'var(--text-muted)',
                background: 'none', cursor: 'pointer', marginBottom: '-1px',
              }}
            >
              {t.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Core stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Words', val: file.stats.wordCount.toLocaleString(), c: '#06b6d4' },
                  { label: 'Lines', val: file.stats.lineCount.toLocaleString(), c: '#8b5cf6' },
                  { label: 'Characters', val: file.stats.charCount.toLocaleString(), c: '#f59e0b' },
                  { label: 'Sentences', val: file.stats.sentenceCount.toLocaleString(), c: '#10b981' },
                  { label: 'Paragraphs', val: file.stats.paragraphCount, c: '#f97316' },
                  { label: 'Unique Words', val: file.stats.uniqueWordCount.toLocaleString(), c: '#06b6d4' },
                  { label: 'Avg Words/Line', val: file.stats.avgWordsPerLine.toFixed(1), c: '#8b5cf6' },
                  { label: 'Lexical Density', val: `${file.stats.lexicalDensity.toFixed(1)}%`, c: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-lg text-center"
                    style={{ background: 'rgba(13,21,32,0.7)', border: '1px solid rgba(30,58,95,0.4)' }}>
                    <div className="mono text-xl font-bold" style={{ color: s.c, fontFamily: 'var(--font-mono)' }}>{s.val}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Readability + Sentiment */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(13,21,32,0.7)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>READABILITY</div>
                  <div className="mono text-3xl font-bold mb-1" style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                    {file.stats.readability.fleschKincaid.toFixed(0)}
                  </div>
                  <div className="text-sm font-medium mb-2" style={{ color: '#06b6d4' }}>{file.stats.readability.grade}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between mono text-xs" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Avg words/sentence</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{file.stats.readability.avgWordsPerSentence.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between mono text-xs" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Avg chars/word</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{file.stats.readability.avgCharsPerWord.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ background: 'rgba(13,21,32,0.7)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>SENTIMENT</div>
                  <div className="font-bold text-xl mb-2" style={{ color: getSColor(file.stats.sentiment.overall) }}>
                    {file.stats.sentiment.overall.toUpperCase()}
                  </div>
                  <div className="sentiment-track mb-2">
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      width: `${Math.min(100, Math.abs(file.stats.sentiment.score) * 100)}%`,
                      background: getSColor(file.stats.sentiment.overall),
                    }} />
                  </div>
                  <div className="flex justify-between mono text-xs" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
                    <span style={{ color: '#10b981' }}>+{file.stats.sentiment.positive} positive</span>
                    <span style={{ color: '#f43f5e' }}>-{file.stats.sentiment.negative} negative</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ background: 'rgba(13,21,32,0.7)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>WORD INSIGHTS</div>
                  <div className="space-y-2">
                    {[
                      { label: 'Longest word', val: file.stats.longestWord || '—', c: '#8b5cf6' },
                      { label: 'Shortest word', val: file.stats.shortestWord || '—', c: '#06b6d4' },
                      { label: 'Most unusual', val: file.stats.mostUnusualWord || '—', c: '#f97316' },
                      { label: 'Type-token ratio', val: `${(file.stats.typeTokenRatio*100).toFixed(1)}%`, c: '#f59e0b' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between">
                        <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{row.label}</span>
                        <span className="mono text-xs font-medium" style={{ color: row.c, fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'words' && (
            <div>
              <div className="text-xs font-semibold mb-4"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                TOP 20 MOST FREQUENT WORDS
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Word</th>
                    <th>Count</th>
                    <th>Frequency</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {file.stats.topWords.slice(0, 20).map((w, i) => {
                    const max = file.stats.topWords[0]?.count || 1;
                    return (
                      <tr key={w.word}>
                        <td className="mono" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{i+1}</td>
                        <td className="mono font-medium" style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>{w.word}</td>
                        <td className="mono" style={{ fontFamily: 'var(--font-mono)' }}>{w.count}</td>
                        <td style={{ width: '200px' }}>
                          <div className="progress-bar">
                            <div className="word-freq-bar" style={{ width: `${(w.count/max)*100}%` }} />
                          </div>
                        </td>
                        <td className="mono text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {((w.count/file.stats.wordCount)*100).toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'issues' && (
            <div>
              {file.stats.issues.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <TrendingUp className="w-6 h-6" style={{ color: '#10b981' }} />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No high-impact issues detected.</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>This file looks clean!</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg"
                    style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                    <AlertTriangle className="w-4 h-4" style={{ color: '#f43f5e' }} />
                    <span className="text-sm font-semibold" style={{ color: '#f43f5e' }}>
                      {file.stats.issues.length} issues found
                    </span>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Keyword</th>
                        <th>Line</th>
                        <th>Col</th>
                        <th>Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {file.stats.issues.map((issue, i) => (
                        <tr key={i}>
                          <td><span className="badge badge-rose">{issue.keyword}</span></td>
                          <td className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{issue.line}</td>
                          <td className="mono" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{issue.col}</td>
                          <td className="mono text-xs" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                            <span className="truncate block" title={issue.context}>{issue.context}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'content' && (
            <div>
              <div className="text-xs font-semibold mb-3"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                FULL CONTENT PREVIEW
              </div>
              <div className="p-4 rounded-xl mono text-xs leading-relaxed"
                style={{
                  background: 'rgba(8,12,20,0.8)', border: '1px solid rgba(30,58,95,0.4)',
                  color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                  whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', lineHeight: '1.7'
                }}>
                {file.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FilesSection() {
  const { state, deleteFile, dispatch, navigateTo } = useApp();
  const { files } = state;
  const [selectedModal, setSelectedModal] = useState<AnalyzedFile | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'words' | 'issues' | 'date'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = [...files].sort((a, b) => {
    let va: number | string = 0, vb: number | string = 0;
    if (sortBy === 'name') { va = a.name; vb = b.name; }
    else if (sortBy === 'size') { va = a.size; vb = b.size; }
    else if (sortBy === 'words') { va = a.stats.wordCount; vb = b.stats.wordCount; }
    else if (sortBy === 'issues') { va = a.stats.issues.length; vb = b.stats.issues.length; }
    else if (sortBy === 'date') { va = new Date(a.uploadedAt).getTime(); vb = new Date(b.uploadedAt).getTime(); }
    if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null;

  const getSColor = (s: string) => s === 'positive' ? '#10b981' : s === 'negative' ? '#f43f5e' : '#94a3b8';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="section-subtitle mb-1">Document Library</div>
          <h1 className="section-title">My Files</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {files.length} file{files.length !== 1 ? 's' : ''} indexed · click to view full analysis
          </p>
        </div>
        <button onClick={() => navigateTo('upload')} className="btn-primary flex items-center gap-1.5">
          <Upload className="w-4 h-4" /> Upload More
        </button>
      </div>

      {files.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            No files indexed
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Upload .txt files to start analyzing.</p>
          <button onClick={() => navigateTo('upload')} className="btn-primary">Upload Files</button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {/* Table header */}
          <div className="grid gap-4 px-5 py-3 border-b" style={{ borderColor: 'rgba(30,58,95,0.5)', gridTemplateColumns: '2fr 80px 80px 80px 100px 120px 140px' }}>
            {[
              { label: 'File Name', col: 'name' as const },
              { label: 'Size', col: 'size' as const },
              { label: 'Words', col: 'words' as const },
              { label: 'Issues', col: 'issues' as const },
              { label: 'Sentiment', col: undefined },
              { label: 'Readability', col: undefined },
              { label: 'Actions', col: undefined },
            ].map(({ label, col }) => (
              <div
                key={label}
                className="mono text-xs flex items-center gap-1"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.08em', cursor: col ? 'pointer' : 'default' }}
                onClick={() => col && toggleSort(col)}
              >
                {label.toUpperCase()}
                {col && <SortIcon col={col} />}
              </div>
            ))}
          </div>

          {/* Rows */}
          {sorted.map(file => (
            <div
              key={file.id}
              className="grid gap-4 px-5 py-4 border-b transition-all hover:bg-amber-400/3 group"
              style={{ borderColor: 'rgba(30,58,95,0.3)', gridTemplateColumns: '2fr 80px 80px 80px 100px 120px 140px', alignItems: 'center' }}
            >
              {/* Name */}
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 flex-shrink-0"
                  style={{ color: file.stats.issues.length > 0 ? '#f43f5e' : '#06b6d4' }} />
                <div className="min-w-0">
                  <div className="text-sm truncate font-medium" style={{ color: 'var(--text-primary)' }} title={file.name}>
                    {file.name}
                  </div>
                  <div className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
                    {file.queryCount > 0 && `${file.queryCount} searches · `}
                    {file.uploadedAt instanceof Date
                      ? file.uploadedAt.toLocaleDateString()
                      : new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Size */}
              <div className="mono text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                {file.size < 1024 ? `${file.size}B` : `${(file.size/1024).toFixed(1)}KB`}
              </div>

              {/* Words */}
              <div className="mono text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                {file.stats.wordCount.toLocaleString()}
              </div>

              {/* Issues */}
              <div>
                {file.stats.issues.length > 0
                  ? <span className="badge badge-rose">{file.stats.issues.length}</span>
                  : <span className="mono text-xs" style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>clean</span>
                }
              </div>

              {/* Sentiment */}
              <div>
                <span className="badge" style={{
                  background: `${getSColor(file.stats.sentiment.overall)}15`,
                  color: getSColor(file.stats.sentiment.overall),
                  border: `1px solid ${getSColor(file.stats.sentiment.overall)}30`,
                  fontSize: '0.6rem'
                }}>
                  {file.stats.sentiment.overall}
                </span>
              </div>

              {/* Readability */}
              <div className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                {file.stats.readability.fleschKincaid.toFixed(0)} · {file.stats.readability.grade.split(' ')[0]}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedModal(file)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}
                >
                  <Eye className="w-3 h-3" /> View
                </button>
                <button
                  onClick={() => { dispatch({ type: 'SELECT_FILE', payload: file }); navigateTo('search'); }}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}
                >
                  <Search className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deleteFile(file.id)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', cursor: 'pointer' }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedModal && <FileAnalysisModal file={selectedModal} onClose={() => setSelectedModal(null)} />}
    </div>
  );
}
