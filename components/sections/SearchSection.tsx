'use client';

import { useState, useCallback, useRef } from 'react';
import { useApp } from '../../lib/store';
import { searchFiles, SEARCH_FILTERS, SearchResult } from '../../lib/engine';
import {
  Search, Filter, X, FileText, ChevronDown, ChevronUp,
  Clock, Eye, Zap, Upload
} from 'lucide-react';

function SnippetHighlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{text}</span>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="search-highlight">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </span>
  );
}

function ResultCard({ result, query, onViewFile }: {
  result: SearchResult; query: string; onViewFile: (r: SearchResult) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const f = result.file;

  return (
    <div className="glass-card glass-card-hover p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-4 h-4 flex-shrink-0"
            style={{ color: f.stats.issues.length > 0 ? '#f43f5e' : '#06b6d4' }} />
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</div>
            <div className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
              {f.size < 1024 ? `${f.size}B` : `${(f.size/1024).toFixed(1)}KB`} · {f.stats.wordCount.toLocaleString()} words
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="badge badge-amber">{result.matchCount} match{result.matchCount !== 1 ? 'es' : ''}</span>
          {f.stats.issues.length > 0 && <span className="badge badge-rose">{f.stats.issues.length} issues</span>}
          <span className="badge badge-cyan">score: {result.relevanceScore}</span>
        </div>
      </div>

      {/* Snippets */}
      <div className="space-y-2 mb-3">
        {result.snippets.slice(0, expanded ? result.snippets.length : 2).map((s, i) => (
          <div key={i} className="p-2.5 rounded-lg"
            style={{ background: 'rgba(8,12,20,0.6)', border: '1px solid rgba(30,58,95,0.4)', lineHeight: '1.6' }}>
            <span className="mono text-xs mr-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
              [{i+1}]
            </span>
            <SnippetHighlight text={s} query={query} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewFile(result)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}
        >
          <Eye className="w-3 h-3" /> View Analysis
        </button>
        {result.snippets.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs btn-ghost"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> {result.snippets.length - 2} more snippets</>}
          </button>
        )}
      </div>
    </div>
  );
}

export function SearchSection() {
  const { state, dispatch, navigateTo } = useApp();
  const { files, settings, searchHistory } = state;

  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([settings.defaultFilter]);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [viewingFile, setViewingFile] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(() => {
    if (!query.trim()) return;
    if (files.length === 0) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'warning', title: 'No Files', message: 'Upload files before searching.' } });
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      const res = searchFiles(files, query, activeFilters, settings.snippetLength);
      setResults(res);
      setIsSearching(false);

      // Update global query count
      dispatch({ type: 'INCREMENT_QUERIES' });

      // Update per-file query counts
      res.forEach(r => dispatch({ type: 'INCREMENT_FILE_QUERY', payload: r.file.id }));

      // Add to history
      dispatch({
        type: 'ADD_SEARCH_HISTORY',
        payload: { query, timestamp: new Date(), resultCount: res.length, filters: activeFilters },
      });

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: res.length > 0 ? 'success' : 'info',
          title: 'Search Complete',
          message: res.length > 0 ? `Found ${res.length} matching file${res.length !== 1 ? 's' : ''}` : 'No matches found.',
        },
      });
    }, 100);
  }, [query, files, activeFilters, settings.snippetLength, dispatch]);

  const toggleFilter = (id: string) => {
    setActiveFilters(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch();
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    inputRef.current?.focus();
  };

  const exampleQueries = [
    'error', 'function', 'import', 'failed', 'success',
    'warning', 'TODO', 'fix', 'update', 'null',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="section-subtitle mb-1">Full-Text Search</div>
        <h1 className="section-title">Search</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Search across all {files.length} indexed file{files.length !== 1 ? 's' : ''} with 20 advanced filters.
          {state.totalQueries > 0 && <span style={{ color: '#f59e0b' }}> {state.totalQueries} total queries run.</span>}
        </p>
      </div>

      {/* Search bar */}
      <div className="glass-card p-6">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter search query… (Enter to search)"
              className="input-field pl-10 pr-10"
            />
            {query && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 rounded-lg border transition-all ${showFilters ? 'border-amber-400/50' : 'border-slate-600/50'}`}
            style={{
              background: showFilters ? 'rgba(245,158,11,0.1)' : 'rgba(30,58,95,0.3)',
              color: showFilters ? '#f59e0b' : 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', whiteSpace: 'nowrap'
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilters.length > 0 && (
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                style={{ background: '#f59e0b', color: '#080c14', fontWeight: 'bold', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                {activeFilters.length}
              </span>
            )}
          </button>
          <button
            onClick={doSearch}
            disabled={!query.trim() || isSearching}
            className="btn-primary flex items-center gap-2"
            style={{ opacity: !query.trim() ? 0.5 : 1 }}
          >
            {isSearching ? <Zap className="w-4 h-4 animate-pulse" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilters.map(id => {
              const f = SEARCH_FILTERS.find(f => f.id === id);
              if (!f) return null;
              return (
                <div key={id} className="filter-chip active">
                  {f.label}
                  <button onClick={() => toggleFilter(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            <button onClick={() => setActiveFilters([])} className="filter-chip"
              style={{ color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)' }}>
              Clear filters
            </button>
          </div>
        )}

        {/* Example queries */}
        {!query && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>Try:</span>
            {exampleQueries.map(eq => (
              <button key={eq} onClick={() => { setQuery(eq); }}
                className="filter-chip" style={{ fontFamily: 'var(--font-mono)' }}>
                {eq}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Search Filters <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>— 20 available</span>
            </h3>
            <button onClick={() => setActiveFilters([])} className="btn-ghost text-xs">Clear all</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SEARCH_FILTERS.map(f => (
              <div
                key={f.id}
                onClick={() => toggleFilter(f.id)}
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  activeFilters.includes(f.id) ? 'border-amber-400/40' : 'border-slate-700/50'
                }`}
                style={{
                  background: activeFilters.includes(f.id) ? 'rgba(245,158,11,0.07)' : 'rgba(13,21,32,0.5)',
                }}
              >
                <div className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{
                    borderColor: activeFilters.includes(f.id) ? '#f59e0b' : 'rgba(30,58,95,0.8)',
                    background: activeFilters.includes(f.id) ? '#f59e0b' : 'transparent',
                  }}>
                  {activeFilters.includes(f.id) && (
                    <svg viewBox="0 0 10 8" width="8" fill="none" stroke="#080c14" strokeWidth="1.5">
                      <path d="M1 4l3 3 5-6" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-xs mb-0.5" style={{ color: activeFilters.includes(f.id) ? '#f59e0b' : 'var(--text-primary)' }}>
                    {f.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No files warning */}
      {files.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No files indexed</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Upload .txt files to enable search.</p>
          <button onClick={() => navigateTo('upload')} className="btn-primary">Upload Files</button>
        </div>
      )}

      {/* Results */}
      {results !== null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Results
              </h3>
              <span className="badge badge-amber">{results.length} file{results.length !== 1 ? 's' : ''}</span>
              <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                for &ldquo;{query}&rdquo;
              </span>
            </div>
            <button onClick={() => setResults(null)} className="btn-ghost text-xs">Clear</button>
          </div>

          {results.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Search className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>No matches found</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Try different keywords or change filters.</p>
            </div>
          ) : (
            results.map(r => (
              <ResultCard
                key={r.file.id}
                result={r}
                query={query}
                onViewFile={r => {
                  dispatch({ type: 'SELECT_FILE', payload: r.file });
                  navigateTo('files');
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && results === null && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Recent Searches
            </h3>
          </div>
          <div className="space-y-2">
            {searchHistory.slice(0, 10).map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
                style={{ background: 'rgba(13,21,32,0.5)', border: '1px solid rgba(30,58,95,0.3)' }}
                onClick={() => { setQuery(h.query); }}
              >
                <div className="flex items-center gap-3">
                  <Search className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  <span className="mono text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    &ldquo;{h.query}&rdquo;
                  </span>
                  {h.filters.length > 0 && (
                    <div className="flex gap-1">
                      {h.filters.slice(0, 2).map(fid => (
                        <span key={fid} className="filter-chip" style={{ fontSize: '0.55rem', padding: '0.1rem 0.4rem' }}>
                          {SEARCH_FILTERS.find(f => f.id === fid)?.label || fid}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-amber">{h.resultCount} hits</span>
                  <span className="mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
                    {h.timestamp instanceof Date
                      ? h.timestamp.toLocaleTimeString()
                      : new Date(h.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
