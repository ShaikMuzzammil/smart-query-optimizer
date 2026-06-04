'use client';
// components/sections/UploadSection.tsx
import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../lib/AppContext';
import { analyzeFile, generateId, formatBytes } from '../../lib/analyzer';
import type { FileData } from '../../lib/types';

interface UploadResult {
  file: FileData;
  status: 'success' | 'error';
  error?: string;
}

function ReadabilityGauge({ score, level }: { score: number; level: string }) {
  const color = score >= 60 ? 'var(--accent)' : score >= 40 ? 'var(--accent4)' : 'var(--danger)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontFamily: 'JetBrains Mono' }}>
        <span style={{ color: 'var(--text2)' }}>Readability Score</span>
        <span style={{ color }}>{score}/100 · {level}</span>
      </div>
      <div className="progress-wrap">
        <div className="progress-bar" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
      </div>
    </div>
  );
}

function SentimentBar({ pos, neg, total }: { pos: number; neg: number; total: number }) {
  const posW = total > 0 ? (pos / total) * 100 : 0;
  const negW = total > 0 ? (neg / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontFamily: 'JetBrains Mono' }}>
        <span style={{ color: 'var(--accent)' }}>+{pos} positive</span>
        <span style={{ color: 'var(--text3)' }}>Sentiment</span>
        <span style={{ color: 'var(--danger)' }}>{neg} negative</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.06)' }}>
        <div style={{ width: `${posW}%`, background: 'var(--accent)', transition: 'width 0.6s ease' }} />
        <div style={{ width: `${negW}%`, background: 'var(--danger)', marginLeft: 'auto', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export default function UploadSection() {
  const { state, dispatch, addNotification, navigate } = useApp();
  const { settings } = state;
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File): Promise<UploadResult> => {
    return new Promise((resolve) => {
      if (!file.name.endsWith('.txt') && !file.name.endsWith('.md') && !file.name.endsWith('.csv') && !file.name.endsWith('.log')) {
        resolve({ file: null as any, status: 'error', error: `"${file.name}" — only .txt, .md, .csv, .log files allowed` });
        return;
      }
      const maxBytes = settings.maxFileSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        resolve({ file: null as any, status: 'error', error: `"${file.name}" exceeds ${settings.maxFileSizeMB}MB limit (${formatBytes(file.size)})` });
        return;
      }
      if (file.size === 0) {
        resolve({ file: null as any, status: 'error', error: `"${file.name}" is empty` });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        const analysis = analyzeFile(content, settings.filterStopwords, settings.minWordLength);
        const tags: string[] = [];
        if (analysis.issues.some(i => i.severity === 'critical')) tags.push('critical');
        if (analysis.sentiment.score >= 25) tags.push('positive');
        if (analysis.sentiment.score <= -25) tags.push('negative');
        if (analysis.readability.score >= 70) tags.push('easy-read');
        if (analysis.wordCount > 5000) tags.push('large');
        const fileData: FileData = { id: generateId(), name: file.name, size: file.size, content, uploadedAt: Date.now(), queryCount: 0, analysis, tags };
        resolve({ file: fileData, status: 'success' });
      };
      reader.onerror = () => resolve({ file: null as any, status: 'error', error: `Failed to read "${file.name}"` });
      reader.readAsText(file);
    });
  }, [settings]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    setIsProcessing(true);
    dispatch({ type: 'SET_LOADING', isLoading: true, message: `Analyzing ${fileArr.length} file${fileArr.length > 1 ? 's' : ''}…` });
    const newResults: UploadResult[] = [];
    for (const file of fileArr) {
      const result = await processFile(file);
      if (result.status === 'success' && result.file) {
        // Check duplicate
        const exists = state.files.some(f => f.name === result.file.name && f.size === result.file.size);
        if (exists) {
          newResults.push({ file: result.file, status: 'error', error: `"${result.file.name}" already indexed` });
        } else {
          dispatch({ type: 'ADD_FILE', file: result.file });
          newResults.push(result);
        }
      } else {
        newResults.push(result);
      }
    }
    setResults(prev => [...newResults, ...prev]);
    if (newResults.length > 0) setSelectedResult(newResults[0]);
    const successCount = newResults.filter(r => r.status === 'success').length;
    const errCount = newResults.filter(r => r.status === 'error').length;
    if (successCount > 0) addNotification('success', 'Files Indexed', `${successCount} file${successCount > 1 ? 's' : ''} analyzed successfully.`);
    if (errCount > 0) addNotification('warning', 'Upload Issues', `${errCount} file${errCount > 1 ? 's' : ''} could not be processed.`);
    setIsProcessing(false);
    dispatch({ type: 'SET_LOADING', isLoading: false });
  }, [processFile, state.files, dispatch, addNotification]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const sel = selectedResult?.file;

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title"><span className="section-icon">↑</span> Upload & Analyze</div>
          <div className="section-subtitle">Upload .txt, .md, .csv, .log files for instant deep analysis</div>
        </div>
        {results.filter(r => r.status === 'success').length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('files')}>
            <span>▦</span> View Files
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone${isDragging ? ' drag-over' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{ marginBottom: 24 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.log"
          style={{ display: 'none' }}
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        {isProcessing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div className="spinner spinner-lg" />
            <div style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono', fontSize: 14 }}>Processing files…</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.6, animation: 'float 3s ease-in-out infinite' }}>⬆</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>
              {isDragging ? 'Drop files here' : 'Drag & Drop Files'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              or click to browse — .txt, .md, .csv, .log · max {settings.maxFileSizeMB}MB each · multiple files supported
            </div>
            <button className="btn btn-primary" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              <span>↑</span> Browse Files
            </button>
          </>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
              Analysis Results
            </h3>
            <span className="badge badge-info">{results.length} file{results.length !== 1 ? 's' : ''}</span>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setResults([]); setSelectedResult(null); }}>
              Clear History
            </button>
          </div>

          {/* File tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => r.status === 'success' && setSelectedResult(r)}
                className={`btn btn-sm ${selectedResult === r ? 'btn-primary' : r.status === 'error' ? 'btn-danger' : 'btn-ghost'}`}
                style={{ flexShrink: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {r.status === 'error' ? '✕ ' : '✓ '}
                {r.status === 'success' ? r.file.name : (r.error?.split('"')[1] || 'Error')}
              </button>
            ))}
          </div>

          {/* Error messages */}
          {results.filter(r => r.status === 'error').map((r, i) => (
            <div key={i} style={{ background: 'rgba(255,68,85,0.08)', border: '1px solid rgba(255,68,85,0.2)', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 8, fontSize: 12.5, color: 'var(--danger)', fontFamily: 'JetBrains Mono' }}>
              ✕ {r.error}
            </div>
          ))}

          {/* Detailed analysis for selected file */}
          {sel && (
            <div style={{ animation: 'fadeUp 0.3s ease' }}>
              {/* Header */}
              <div className="card" style={{ padding: '18px 22px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>{sel.name}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge badge-neutral">{formatBytes(sel.size)}</span>
                      <span className="badge badge-info">Uploaded {new Date(sel.uploadedAt).toLocaleTimeString()}</span>
                      {sel.tags.map(t => <span key={t} className={`badge ${t === 'critical' ? 'badge-danger' : t === 'positive' ? 'badge-success' : t === 'negative' ? 'badge-danger' : 'badge-purple'}`}>{t}</span>)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('search')}>
                      <span>⌕</span> Search This File
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate('files')}>
                      <span>▦</span> File Manager
                    </button>
                  </div>
                </div>
              </div>

              {/* Core stats grid */}
              <div className="grid-4" style={{ marginBottom: 16 }}>
                {[
                  { label: 'Words', value: sel.analysis.wordCount.toLocaleString() },
                  { label: 'Unique Words', value: sel.analysis.uniqueWordCount.toLocaleString() },
                  { label: 'Lines', value: sel.analysis.lineCount.toLocaleString() },
                  { label: 'Characters', value: sel.analysis.charCount.toLocaleString() },
                  { label: 'Sentences', value: sel.analysis.sentenceCount.toLocaleString() },
                  { label: 'Paragraphs', value: sel.analysis.paragraphCount.toLocaleString() },
                  { label: 'URLs Found', value: sel.analysis.urlCount },
                  { label: 'Numbers Found', value: sel.analysis.numberCount },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Readability + Sentiment */}
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>READABILITY ANALYSIS</div>
                  <ReadabilityGauge score={sel.analysis.readability.score} level={sel.analysis.readability.level} />
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { k: 'Avg Words/Sentence', v: sel.analysis.readability.avgWordsPerSentence },
                      { k: 'Avg Chars/Word', v: sel.analysis.readability.avgCharsPerWord },
                      { k: 'Lexical Density', v: sel.analysis.lexicalDensity + '%' },
                      { k: 'Avg Words/Line', v: sel.analysis.avgWordsPerLine },
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 3 }}>{s.k}</div>
                        <div style={{ fontSize: 16, fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent2)' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>SENTIMENT ANALYSIS</div>
                  <SentimentBar pos={sel.analysis.sentiment.positiveCount} neg={sel.analysis.sentiment.negativeCount} total={sel.analysis.wordCount} />
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, background: 'rgba(0,255,157,0.06)', border: '1px solid rgba(0,255,157,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 4 }}>OVERALL</div>
                      <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: sel.analysis.sentiment.score >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                        {sel.analysis.sentiment.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'JetBrains Mono' }}>score: {sel.analysis.sentiment.score > 0 ? '+' : ''}{sel.analysis.sentiment.score}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {sel.analysis.sentiment.positiveWords.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontFamily: 'JetBrains Mono' }}>
                        <span style={{ color: 'var(--accent)' }}>+ </span>
                        {sel.analysis.sentiment.positiveWords.join(', ')}
                      </div>
                    )}
                    {sel.analysis.sentiment.negativeWords.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>
                        <span style={{ color: 'var(--danger)' }}>− </span>
                        {sel.analysis.sentiment.negativeWords.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Top words + Issues */}
              <div className="grid-2" style={{ marginBottom: 16 }}>
                {/* Top words */}
                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>TOP 10 WORDS</div>
                  {sel.analysis.topWords.slice(0, 10).map((w, i) => (
                    <div key={i} className="word-bar-wrap">
                      <div className="word-bar-label">{w.word}</div>
                      <div className="word-bar-track">
                        <div className="word-bar-fill" style={{ width: `${w.count / sel.analysis.topWords[0].count * 100}%` }} />
                      </div>
                      <div className="word-bar-count">{w.count}</div>
                    </div>
                  ))}
                  {sel.analysis.topBigrams.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 6 }}>TOP BIGRAMS</div>
                      {sel.analysis.topBigrams.slice(0, 4).map((b, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: 'var(--text2)', fontFamily: 'JetBrains Mono' }}>
                          <span>"{b.phrase}"</span><span style={{ color: 'var(--accent3)' }}>{b.count}×</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Issues */}
                <div className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em' }}>DETECTED ISSUES</div>
                    <span className={`badge ${sel.analysis.issues.length > 0 ? 'badge-danger' : 'badge-success'}`}>
                      {sel.analysis.issues.length > 0 ? sel.analysis.issues.length + ' patterns' : 'Clean'}
                    </span>
                  </div>
                  {sel.analysis.issues.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)', fontSize: 12 }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                      No issues detected
                    </div>
                  ) : (
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {sel.analysis.issues.map((issue, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span className={`badge badge-${issue.severity === 'critical' ? 'danger' : issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'info'}`} style={{ fontSize: 9, minWidth: 52, justifyContent: 'center' }}>
                            {issue.severity}
                          </span>
                          <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>"{issue.keyword}"</span>
                          <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'JetBrains Mono' }}>{issue.count}×</span>
                          {issue.lineNumbers.length > 0 && (
                            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>L{issue.lineNumbers.slice(0, 3).join(',')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Unusual word */}
                  {sel.analysis.mostUnusualWord && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
                      {[
                        { label: 'Most Unusual', val: sel.analysis.mostUnusualWord, color: 'var(--accent3)' },
                        { label: 'Longest Word', val: sel.analysis.longestWord, color: 'var(--accent2)' },
                      ].map((s, i) => (
                        <div key={i} style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '8px 10px' }}>
                          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 3 }}>{s.label}</div>
                          <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono', color: s.color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Content Preview */}
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  CONTENT PREVIEW <span style={{ color: 'var(--text3)', fontWeight: 400 }}>— first 800 characters</span>
                </div>
                <div className="code" style={{ maxHeight: 140, overflowY: 'auto' }}>
                  {sel.content.slice(0, 800)}{sel.content.length > 800 ? '…' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
