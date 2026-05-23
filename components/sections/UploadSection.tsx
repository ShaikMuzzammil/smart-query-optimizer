'use client';

import { useCallback, useRef, useState } from 'react';
import { useApp } from '@/lib/store';
import { Upload, FileText, CheckCircle, AlertTriangle, X, Plus, Zap } from 'lucide-react';
import { analyzeFile, AnalyzedFile } from '@/lib/engine';

interface PreviewResult {
  file: File;
  analyzed: AnalyzedFile;
}

export function UploadSection() {
  const { addFile, state, navigateTo } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previews, setPreviews] = useState<PreviewResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.size > state.settings.maxFileSize) return null;
    if (file.size === 0) return null;
    const content = await file.text();
    return { file, analyzed: analyzeFile(content, file.name, file.size) };
  }, [state.settings.maxFileSize]);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter(f => f.type === 'text/plain' || f.name.endsWith('.txt'));
    if (!files.length) return;

    setIsProcessing(true);
    const results: PreviewResult[] = [];
    for (const f of files) {
      const r = await processFile(f);
      if (r) results.push(r);
    }
    setPreviews(prev => [...prev, ...results]);
    setIsProcessing(false);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const confirmUpload = useCallback(async (preview: PreviewResult) => {
    await addFile(preview.file);
    setPreviews(prev => prev.filter(p => p.file !== preview.file));
  }, [addFile]);

  const confirmAll = useCallback(async () => {
    for (const p of previews) {
      await addFile(p.file);
    }
    setPreviews([]);
    navigateTo('files');
  }, [previews, addFile, navigateTo]);

  const formatSize = (bytes: number) => bytes < 1024 ? `${bytes}B` : `${(bytes/1024).toFixed(1)}KB`;

  const getSentimentColor = (s: string) => s === 'positive' ? '#10b981' : s === 'negative' ? '#f43f5e' : '#94a3b8';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="section-subtitle mb-1">Index New Documents</div>
        <h1 className="section-title">Upload Files</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Upload .txt files for instant deep analysis. Max {state.settings.maxFileSize / 1024 / 1024}MB per file.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone p-12 text-center transition-all cursor-pointer ${isDragging ? 'dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <Zap className="w-8 h-8 animate-pulse" style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <div className="font-bold text-lg mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Analyzing...
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Building index and extracting insights</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${isDragging ? 'scale-110' : ''}`}
              style={{ background: isDragging ? 'rgba(245,158,11,0.15)' : 'rgba(30,58,95,0.3)', border: `2px dashed ${isDragging ? '#f59e0b' : 'rgba(30,58,95,0.6)'}` }}>
              <Upload className="w-10 h-10" style={{ color: isDragging ? '#f59e0b' : 'var(--text-muted)' }} />
            </div>
            <div>
              <div className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: isDragging ? '#f59e0b' : 'var(--text-primary)' }}>
                {isDragging ? 'Drop to analyze' : 'Drop .txt files here'}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                or <span style={{ color: '#f59e0b', fontWeight: '600' }}>browse files</span>
              </div>
              <div className="mono text-xs mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                .txt only · max {state.settings.maxFileSize/1024/1024}MB · multiple files supported
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Analysis Preview ({previews.length} file{previews.length !== 1 ? 's' : ''})
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setPreviews([])} className="btn-ghost flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Clear All
              </button>
              <button onClick={confirmAll} className="btn-primary flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Index All Files
              </button>
            </div>
          </div>

          {previews.map((p, i) => {
            const a = p.analyzed;
            return (
              <div key={i} className="glass-card p-6">
                {/* File header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)' }}>
                      <FileText className="w-5 h-5" style={{ color: '#06b6d4' }} />
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{a.name}</div>
                      <div className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                        {formatSize(a.size)} · uploaded just now
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPreviews(prev => prev.filter((_, j) => j !== i))} className="btn-ghost">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => confirmUpload(p)} className="btn-primary flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Index
                    </button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Words', value: a.stats.wordCount.toLocaleString(), color: '#06b6d4' },
                    { label: 'Lines', value: a.stats.lineCount.toLocaleString(), color: '#8b5cf6' },
                    { label: 'Characters', value: a.stats.charCount.toLocaleString(), color: '#f59e0b' },
                    { label: 'Sentences', value: a.stats.sentenceCount.toLocaleString(), color: '#10b981' },
                    { label: 'Unique Words', value: a.stats.uniqueWordCount.toLocaleString(), color: '#f97316' },
                    { label: 'Issues Found', value: a.stats.issues.length, color: a.stats.issues.length > 0 ? '#f43f5e' : '#10b981' },
                    { label: 'Paragraphs', value: a.stats.paragraphCount, color: '#8b5cf6' },
                    { label: 'Lexical Density', value: `${a.stats.lexicalDensity.toFixed(1)}%`, color: '#06b6d4' },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-lg text-center"
                      style={{ background: 'rgba(13,21,32,0.6)', border: '1px solid rgba(30,58,95,0.4)' }}>
                      <div className="mono text-lg font-bold" style={{ color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Two column: top words + analysis */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top words */}
                  <div>
                    <div className="text-xs font-semibold mb-3"
                      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Top 10 Words
                    </div>
                    <div className="space-y-2">
                      {a.stats.topWords.slice(0, 10).map((w, wi) => {
                        const max = a.stats.topWords[0]?.count || 1;
                        return (
                          <div key={w.word} className="flex items-center gap-2">
                            <span className="mono text-xs w-4 text-right"
                              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>{wi+1}</span>
                            <span className="mono text-xs w-24 truncate"
                              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{w.word}</span>
                            <div className="flex-1 progress-bar">
                              <div className="word-freq-bar" style={{ width: `${(w.count/max)*100}%` }} />
                            </div>
                            <span className="mono text-xs"
                              style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', width: '28px', textAlign: 'right' }}>{w.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Analysis details */}
                  <div className="space-y-4">
                    {/* Readability */}
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(13,21,32,0.6)', border: '1px solid rgba(30,58,95,0.4)' }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Readability</div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="mono text-2xl font-bold" style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>{a.stats.readability.fleschKincaid.toFixed(0)}</span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Flesch-Kincaid</span>
                      </div>
                      <div className="text-xs" style={{ color: '#06b6d4' }}>{a.stats.readability.grade}</div>
                      <div className="mono text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                        ~{a.stats.readability.avgWordsPerSentence.toFixed(1)} words/sentence
                      </div>
                    </div>

                    {/* Sentiment */}
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(13,21,32,0.6)', border: '1px solid rgba(30,58,95,0.4)' }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sentiment</div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm" style={{ color: getSentimentColor(a.stats.sentiment.overall) }}>
                          {a.stats.sentiment.overall.toUpperCase()}
                        </span>
                        <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                          score: {a.stats.sentiment.score.toFixed(2)}
                        </span>
                      </div>
                      <div className="sentiment-track">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.abs(a.stats.sentiment.score) * 100}%`,
                            background: a.stats.sentiment.overall === 'positive' ? '#10b981' : a.stats.sentiment.overall === 'negative' ? '#f43f5e' : '#94a3b8',
                            marginLeft: a.stats.sentiment.score < 0 ? 'auto' : '0',
                          }} />
                      </div>
                      <div className="flex justify-between mono text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
                        <span style={{ color: '#10b981' }}>+{a.stats.sentiment.positive} pos</span>
                        <span style={{ color: '#f43f5e' }}>-{a.stats.sentiment.negative} neg</span>
                      </div>
                    </div>

                    {/* Special words */}
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(13,21,32,0.6)', border: '1px solid rgba(30,58,95,0.4)' }}>
                      <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Word Insights</div>
                      <div className="space-y-1.5">
                        {[
                          { label: 'Longest', val: a.stats.longestWord, color: '#8b5cf6' },
                          { label: 'Unusual', val: a.stats.mostUnusualWord, color: '#f97316' },
                          { label: 'Type-Token', val: `${(a.stats.typeTokenRatio*100).toFixed(1)}%`, color: '#06b6d4' },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between">
                            <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>{row.label}</span>
                            <span className="mono text-xs" style={{ color: row.color, fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{row.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Issues preview */}
                {a.stats.issues.length > 0 && (
                  <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4" style={{ color: '#f43f5e' }} />
                      <span className="text-sm font-semibold" style={{ color: '#f43f5e' }}>
                        {a.stats.issues.length} High-Impact Issues Detected
                      </span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {a.stats.issues.slice(0, 8).map((issue, ii) => (
                        <div key={ii} className="mono text-xs flex items-center gap-2"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                          <span className="badge badge-rose" style={{ padding: '0.1rem 0.4rem', fontSize: '0.55rem' }}>{issue.keyword}</span>
                          <span style={{ color: 'var(--text-muted)' }}>line {issue.line}:{issue.col}</span>
                          <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{issue.context}</span>
                        </div>
                      ))}
                      {a.stats.issues.length > 8 && (
                        <div className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                          + {a.stats.issues.length - 8} more issues...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content preview */}
                <div className="mt-4">
                  <div className="text-xs font-semibold mb-2"
                    style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Content Preview (first 300 chars)
                  </div>
                  <div className="p-3 rounded-lg mono text-xs leading-relaxed"
                    style={{ background: 'rgba(13,21,32,0.8)', border: '1px solid rgba(30,58,95,0.4)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', whiteSpace: 'pre-wrap', maxHeight: '80px', overflow: 'hidden' }}>
                    {a.content.slice(0, 300)}{a.content.length > 300 ? '...' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Already indexed files quick reference */}
      {state.files.length > 0 && previews.length === 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Currently Indexed ({state.files.length} file{state.files.length !== 1 ? 's' : ''})
            </h3>
            <button onClick={() => navigateTo('files')} className="btn-ghost text-xs">View All →</button>
          </div>
          <div className="space-y-2">
            {state.files.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'rgba(13,21,32,0.5)', border: '1px solid rgba(30,58,95,0.3)' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                    {f.stats.wordCount.toLocaleString()} words
                  </span>
                  {f.stats.issues.length > 0 && <span className="badge badge-rose">{f.stats.issues.length}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


