'use client';
// components/sections/FilesSection.tsx
import React, { useState, useMemo } from 'react';
import { useApp } from '../../lib/AppContext';
import { formatBytes } from '../../lib/analyzer';
import type { FileData } from '../../lib/types';

type SortKey = 'name' | 'size' | 'words' | 'issues' | 'date' | 'readability' | 'sentiment';

function FileModal({ file, onClose }: { file: FileData; onClose: () => void }) {
  const [tab, setTab] = useState<'overview' | 'words' | 'issues' | 'content' | 'bigrams'>('overview');
  const { dispatch, addNotification } = useApp();

  const handleDelete = () => {
    dispatch({ type: 'DELETE_FILE', id: file.id });
    addNotification('info', 'File Removed', `"${file.name}" removed from index.`);
    onClose();
  };

  const exportAnalysis = () => {
    const data = {
      file: file.name,
      size: formatBytes(file.size),
      uploadedAt: new Date(file.uploadedAt).toISOString(),
      analysis: {
        wordCount: file.analysis.wordCount,
        uniqueWordCount: file.analysis.uniqueWordCount,
        lineCount: file.analysis.lineCount,
        charCount: file.analysis.charCount,
        sentenceCount: file.analysis.sentenceCount,
        paragraphCount: file.analysis.paragraphCount,
        lexicalDensity: file.analysis.lexicalDensity,
        readability: file.analysis.readability,
        sentiment: file.analysis.sentiment,
        topWords: file.analysis.topWords,
        topBigrams: file.analysis.topBigrams,
        issues: file.analysis.issues,
        mostUnusualWord: file.analysis.mostUnusualWord,
        longestWord: file.analysis.longestWord,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${file.name}-analysis.json`; a.click();
    URL.revokeObjectURL(url);
    addNotification('success', 'Exported', `Analysis for "${file.name}" downloaded.`);
  };

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'words', label: 'Word Frequency' },
    { id: 'issues', label: `Issues (${file.analysis.issues.length})` },
    { id: 'bigrams', label: 'Bigrams' },
    { id: 'content', label: 'Content' },
  ];

  const readColor = file.analysis.readability.score >= 60 ? 'var(--accent)' : file.analysis.readability.score >= 40 ? 'var(--accent4)' : 'var(--danger)';
  const sentColor = file.analysis.sentiment.score >= 15 ? 'var(--accent)' : file.analysis.sentiment.score <= -15 ? 'var(--danger)' : 'var(--text2)';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 900 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{file.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
              <span className="badge badge-neutral">{formatBytes(file.size)}</span>
              <span className="badge badge-info">{file.analysis.wordCount.toLocaleString()} words</span>
              {file.tags.map(t => <span key={t} className={`badge ${t === 'critical' ? 'badge-danger' : t === 'positive' ? 'badge-success' : t === 'large' ? 'badge-purple' : 'badge-neutral'}`}>{t}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={exportAnalysis}><span>↓</span> Export JSON</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}><span>✕</span> Delete</button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="modal-tabs">
          {TABS.map(t => (
            <div key={t.id} className={`modal-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id as any)}>
              {t.label}
            </div>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'overview' && (
            <div>
              <div className="grid-4" style={{ marginBottom: 16 }}>
                {[
                  { k: 'Words', v: file.analysis.wordCount.toLocaleString() },
                  { k: 'Unique Words', v: file.analysis.uniqueWordCount.toLocaleString() },
                  { k: 'Lines', v: file.analysis.lineCount.toLocaleString() },
                  { k: 'Characters', v: file.analysis.charCount.toLocaleString() },
                  { k: 'Sentences', v: file.analysis.sentenceCount.toLocaleString() },
                  { k: 'Paragraphs', v: file.analysis.paragraphCount.toLocaleString() },
                  { k: 'URLs', v: file.analysis.urlCount },
                  { k: 'Numbers', v: file.analysis.numberCount },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '10px 14px', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 20, fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>{s.k}</div>
                  </div>
                ))}
              </div>

              <div className="grid-2">
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>READABILITY</div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '14px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, color: readColor }}>{file.analysis.readability.score}</span>
                      <span style={{ fontSize: 13, color: readColor }}>/ 100 · {file.analysis.readability.level}</span>
                    </div>
                    <div className="progress-wrap" style={{ marginBottom: 12 }}>
                      <div className="progress-bar" style={{ width: `${file.analysis.readability.score}%`, background: `linear-gradient(90deg, ${readColor}, ${readColor}88)` }} />
                    </div>
                    {[
                      { k: 'Avg Words/Sentence', v: file.analysis.readability.avgWordsPerSentence },
                      { k: 'Avg Chars/Word', v: file.analysis.readability.avgCharsPerWord },
                      { k: 'Lexical Density', v: file.analysis.lexicalDensity + '%' },
                      { k: 'Avg Words/Line', v: file.analysis.avgWordsPerLine },
                    ].map((s, i) => (
                      <div key={i} className="stat-row">
                        <span className="stat-key">{s.k}</span>
                        <span className="stat-val" style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--accent2)' }}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>SENTIMENT</div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '14px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 18, fontFamily: 'Syne', fontWeight: 800, color: sentColor }}>{file.analysis.sentiment.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>score: {file.analysis.sentiment.score > 0 ? '+' : ''}{file.analysis.sentiment.score}</span>
                    </div>
                    {[
                      { k: 'Positive Words', v: file.analysis.sentiment.positiveCount, c: 'var(--accent)' },
                      { k: 'Negative Words', v: file.analysis.sentiment.negativeCount, c: 'var(--danger)' },
                    ].map((s, i) => (
                      <div key={i} className="stat-row">
                        <span className="stat-key">{s.k}</span>
                        <span className="stat-val" style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: s.c }}>{s.v}</span>
                      </div>
                    ))}
                    {file.analysis.sentiment.positiveWords.length > 0 && (
                      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono', lineHeight: 1.8 }}>
                        <span style={{ color: 'var(--accent)' }}>+ </span>{file.analysis.sentiment.positiveWords.join(', ')}<br />
                        {file.analysis.sentiment.negativeWords.length > 0 && <><span style={{ color: 'var(--danger)' }}>− </span>{file.analysis.sentiment.negativeWords.join(', ')}</>}
                      </div>
                    )}
                    {file.analysis.mostUnusualWord && (
                      <div className="stat-row" style={{ marginTop: 8 }}>
                        <span className="stat-key">Most Unusual Word</span>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--accent3)', fontWeight: 600 }}>{file.analysis.mostUnusualWord}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'words' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, fontFamily: 'JetBrains Mono' }}>
                {file.analysis.topWords.length} unique content terms (stopwords {file.analysis.topWords.length > 0 ? 'filtered' : 'not applicable'})
              </div>
              {file.analysis.topWords.map((w, i) => (
                <div key={i} className="word-bar-wrap" style={{ marginBottom: 8 }}>
                  <div style={{ width: 24, fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', textAlign: 'right', marginRight: 4 }}>#{i + 1}</div>
                  <div className="word-bar-label" style={{ width: 120 }}>{w.word}</div>
                  <div className="word-bar-track">
                    <div className="word-bar-fill" style={{ width: `${(w.count / file.analysis.topWords[0].count) * 100}%` }} />
                  </div>
                  <div className="word-bar-count" style={{ width: 60 }}>{w.count}</div>
                  <div style={{ width: 40, fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', textAlign: 'right' }}>{w.percentage}%</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'issues' && (
            <div>
              {file.analysis.issues.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon" style={{ fontSize: 36 }}>✓</div>
                  <div className="empty-title" style={{ fontSize: 16 }}>No Issues Detected</div>
                  <div className="empty-desc">This file passed all 25 pattern checks.</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                    {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
                      const count = file.analysis.issues.filter(i => i.severity === sev).length;
                      if (count === 0) return null;
                      return (
                        <span key={sev} className={`badge badge-${sev === 'critical' || sev === 'high' ? 'danger' : sev === 'medium' ? 'warning' : 'info'}`}>
                          {count} {sev}
                        </span>
                      );
                    })}
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Severity</th><th>Pattern</th><th>Occurrences</th><th>Lines</th></tr></thead>
                      <tbody>
                        {file.analysis.issues.map((issue, i) => (
                          <tr key={i}>
                            <td>
                              <span className={`badge badge-${issue.severity === 'critical' || issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'info'}`}>
                                {issue.severity}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--text)' }}>"{issue.keyword}"</td>
                            <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)', fontWeight: 600 }}>{issue.count}</td>
                            <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text3)' }}>
                              {issue.lineNumbers.slice(0, 5).join(', ')}{issue.lineNumbers.length > 5 ? ` +${issue.lineNumbers.length - 5}` : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'bigrams' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, fontFamily: 'JetBrains Mono' }}>Most frequent two-word phrases (stopwords excluded)</div>
              {file.analysis.topBigrams.length === 0 ? (
                <div className="empty-state"><div className="empty-desc">Not enough content for bigrams</div></div>
              ) : (
                file.analysis.topBigrams.map((b, i) => (
                  <div key={i} className="word-bar-wrap" style={{ marginBottom: 8 }}>
                    <div style={{ width: 24, fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', textAlign: 'right', marginRight: 4 }}>#{i + 1}</div>
                    <div style={{ width: 200, fontSize: 12, color: 'var(--text)', fontFamily: 'JetBrains Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{b.phrase}"</div>
                    <div className="word-bar-track">
                      <div className="word-bar-fill" style={{ width: `${(b.count / file.analysis.topBigrams[0].count) * 100}%`, background: 'linear-gradient(90deg, var(--accent3), var(--accent2))' }} />
                    </div>
                    <div className="word-bar-count">{b.count}×</div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'content' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontFamily: 'JetBrains Mono' }}>
                Showing first 3000 characters of {file.analysis.charCount.toLocaleString()} total
              </div>
              <div className="code" style={{ maxHeight: 360, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {file.content.slice(0, 3000)}{file.content.length > 3000 ? '\n\n[… truncated for display]' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FilesSection() {
  const { state, dispatch, addNotification, navigate } = useApp();
  const { files } = state;
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [filterText, setFilterText] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sortedFiles = useMemo(() => {
    let filtered = files.filter(f => f.name.toLowerCase().includes(filterText.toLowerCase()));
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(f => f.analysis.issues.some(i => i.severity === selectedSeverity));
    }
    return [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'name') diff = a.name.localeCompare(b.name);
      else if (sortKey === 'size') diff = a.size - b.size;
      else if (sortKey === 'words') diff = a.analysis.wordCount - b.analysis.wordCount;
      else if (sortKey === 'issues') diff = a.analysis.issues.reduce((s, i) => s + i.count, 0) - b.analysis.issues.reduce((s, i) => s + i.count, 0);
      else if (sortKey === 'date') diff = a.uploadedAt - b.uploadedAt;
      else if (sortKey === 'readability') diff = a.analysis.readability.score - b.analysis.readability.score;
      else if (sortKey === 'sentiment') diff = a.analysis.sentiment.score - b.analysis.sentiment.score;
      return sortAsc ? diff : -diff;
    });
  }, [files, sortKey, sortAsc, filterText, selectedSeverity]);

  const deleteAll = () => {
    files.forEach(f => dispatch({ type: 'DELETE_FILE', id: f.id }));
    addNotification('info', 'All Files Removed', 'Session cleared.');
  };

  const exportAll = () => {
    const data = files.map(f => ({
      name: f.name, size: formatBytes(f.size), words: f.analysis.wordCount,
      uniqueWords: f.analysis.uniqueWordCount, lines: f.analysis.lineCount,
      readability: f.analysis.readability.score, readabilityLevel: f.analysis.readability.level,
      sentiment: f.analysis.sentiment.label, sentimentScore: f.analysis.sentiment.score,
      issues: f.analysis.issues.length, topWords: f.analysis.topWords.slice(0, 5).map(w => w.word),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'smartquery-all-files.json'; a.click();
    URL.revokeObjectURL(url);
    addNotification('success', 'Exported', `${files.length} file analyses exported.`);
  };

  const SortTh = ({ k, label }: { k: SortKey; label: string }) => (
    <th onClick={() => handleSort(k)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label} {sortKey === k ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  if (files.length === 0) {
    return (
      <div>
        <div className="section-header">
          <div>
            <div className="section-title"><span className="section-icon">▦</span> My Files</div>
            <div className="section-subtitle">Manage and analyze all indexed files</div>
          </div>
        </div>
        <div className="empty-state card">
          <div className="empty-icon">▦</div>
          <div className="empty-title">No Files Indexed</div>
          <div className="empty-desc">Upload .txt files to see them here with full analysis and management tools.</div>
          <button className="btn btn-primary" onClick={() => navigate('upload')}><span>↑</span> Upload Files</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {selectedFile && <FileModal file={selectedFile} onClose={() => setSelectedFile(null)} />}

      <div className="section-header">
        <div>
          <div className="section-title"><span className="section-icon">▦</span> My Files</div>
          <div className="section-subtitle">{files.length} file{files.length !== 1 ? 's' : ''} indexed — click any row for detailed analysis</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportAll}><span>↓</span> Export All</button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('upload')}><span>↑</span> Add Files</button>
          <button className="btn btn-danger btn-sm" onClick={deleteAll}><span>✕</span> Clear All</button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14 }}>⌕</span>
          <input className="input" value={filterText} onChange={e => setFilterText(e.target.value)} placeholder="Filter by file name…" style={{ paddingLeft: 34 }} />
        </div>
        <select className="input" style={{ width: 160 }} value={selectedSeverity} onChange={e => setSelectedSeverity(e.target.value)}>
          <option value="all">All Issues</option>
          <option value="critical">Critical Issues</option>
          <option value="high">High Issues</option>
          <option value="medium">Medium Issues</option>
          <option value="low">Low Issues</option>
        </select>
        <span className="badge badge-neutral">{sortedFiles.length} of {files.length}</span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <SortTh k="name" label="File Name" />
              <SortTh k="size" label="Size" />
              <SortTh k="words" label="Words" />
              <SortTh k="readability" label="Readability" />
              <SortTh k="sentiment" label="Sentiment" />
              <SortTh k="issues" label="Issues" />
              <SortTh k="date" label="Uploaded" />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles.map((file, idx) => {
              const issueCount = file.analysis.issues.reduce((s, i) => s + i.count, 0);
              const readColor = file.analysis.readability.score >= 60 ? 'var(--accent)' : file.analysis.readability.score >= 40 ? 'var(--accent4)' : 'var(--danger)';
              const sentColor = file.analysis.sentiment.score >= 15 ? 'var(--accent)' : file.analysis.sentiment.score <= -15 ? 'var(--danger)' : 'var(--text2)';
              return (
                <tr key={file.id} style={{ cursor: 'pointer', animationDelay: `${idx * 0.03}s` }} onClick={() => setSelectedFile(file)}>
                  <td style={{ maxWidth: 180 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--text)' }} title={file.name}>{file.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{file.analysis.uniqueWordCount.toLocaleString()} unique terms</div>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text2)' }}>{formatBytes(file.size)}</td>
                  <td style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>{file.analysis.wordCount.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `conic-gradient(${readColor} ${file.analysis.readability.score * 3.6}deg, rgba(255,255,255,0.06) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'JetBrains Mono', color: readColor, fontWeight: 700 }}>
                          {file.analysis.readability.score}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: readColor }}>{file.analysis.readability.level}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: sentColor, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                      {file.analysis.sentiment.score > 0 ? '+' : ''}{file.analysis.sentiment.score}
                    </span>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{file.analysis.sentiment.label.split(' ').slice(-1)[0]}</div>
                  </td>
                  <td>
                    <span className={`badge ${issueCount === 0 ? 'badge-success' : issueCount < 5 ? 'badge-warning' : 'badge-danger'}`}>
                      {issueCount}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>
                    {new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedFile(file)} style={{ fontSize: 11 }}>Analyze</button>
                      <button className="btn btn-danger btn-sm" style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={() => { dispatch({ type: 'DELETE_FILE', id: file.id }); addNotification('info', 'Deleted', `"${file.name}" removed.`); }}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
