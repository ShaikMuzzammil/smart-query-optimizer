'use client';
// components/sections/SearchSection.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../../lib/AppContext';
import { searchFiles, generateId, highlightText } from '../../lib/analyzer';
import type { SearchFilter, SearchResult } from '../../lib/types';

const DEFAULT_FILTERS: SearchFilter = {
  caseSensitive: false,
  wholeWord: false,
  fuzzy: false,
  regex: false,
  proximitySearch: false,
  proximityDistance: 5,
  bm25Scoring: true,
  urlOnly: false,
  emailOnly: false,
  numberOnly: false,
  highIssuesOnly: false,
  minWordCount: 0,
  maxWordCount: 0,
  searchInName: true,
  searchInContent: true,
  highlightAll: true,
  snippetLength: 120,
  maxResults: 20,
  sortBy: 'relevance',
  sortOrder: 'desc',
};

const FILTER_GROUPS = [
  {
    label: 'MATCH TYPE',
    filters: [
      { key: 'caseSensitive', label: 'Case Sensitive', desc: 'Match exact letter case' },
      { key: 'wholeWord', label: 'Whole Word Only', desc: 'Match complete words, not substrings' },
      { key: 'fuzzy', label: 'Fuzzy Match', desc: 'Allow one character difference' },
      { key: 'regex', label: 'Regex Mode', desc: 'Use regular expressions' },
    ],
  },
  {
    label: 'CONTENT FILTER',
    filters: [
      { key: 'urlOnly', label: 'URLs Only', desc: 'Search within URLs in text' },
      { key: 'emailOnly', label: 'Emails Only', desc: 'Search within email addresses' },
      { key: 'numberOnly', label: 'Numbers Only', desc: 'Search within numeric values' },
      { key: 'highIssuesOnly', label: 'High Issues Only', desc: 'Files with critical/high issues' },
    ],
  },
  {
    label: 'SCOPE',
    filters: [
      { key: 'searchInContent', label: 'Search Content', desc: 'Search in file body text' },
      { key: 'searchInName', label: 'Search Filename', desc: 'Search in file names' },
      { key: 'bm25Scoring', label: 'BM25 Scoring', desc: 'Relevance-based ranking algorithm' },
      { key: 'highlightAll', label: 'Highlight Matches', desc: 'Mark all occurrences in snippets' },
    ],
  },
];

export default function SearchSection() {
  const { state, dispatch, addNotification, navigate } = useApp();
  const { files, settings } = state;
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter>({ ...DEFAULT_FILTERS, caseSensitive: settings.caseSensitiveSearch });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback((q: string, f: SearchFilter) => {
    if (!q.trim()) { setResults([]); setHasSearched(false); return; }
    if (files.length === 0) { addNotification('warning', 'No Files', 'Upload files first to search.'); return; }
    setIsSearching(true);
    setTimeout(() => {
      const res = searchFiles(files, q, f);
      setResults(res);
      setHasSearched(true);
      setIsSearching(false);
      // Log search
      const matchedFileIds = res.map(r => r.file.id);
      matchedFileIds.forEach(id => dispatch({ type: 'UPDATE_FILE_QUERY_COUNT', id }));
      dispatch({
        type: 'ADD_SEARCH',
        entry: { id: generateId(), query: q, filters: f, resultCount: res.length, timestamp: Date.now(), filesSearched: files.length },
      });
    }, 100);
  }, [files, dispatch, addNotification]);

  // Auto-search on query change
  useEffect(() => {
    if (!settings.autoSearch || !query.trim()) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, filters), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, filters, settings.autoSearch, doSearch]);

  const handleSearch = () => doSearch(query, filters);

  const toggleFilter = (key: keyof SearchFilter) => {
    setFilters(prev => {
      const next = { ...prev, [key]: !prev[key as keyof SearchFilter] };
      // Mutually exclusive
      if (key === 'fuzzy' && next.fuzzy) next.regex = false;
      if (key === 'regex' && next.regex) next.fuzzy = false;
      if (key === 'urlOnly' && next.urlOnly) { next.emailOnly = false; next.numberOnly = false; }
      if (key === 'emailOnly' && next.emailOnly) { next.urlOnly = false; next.numberOnly = false; }
      if (key === 'numberOnly' && next.numberOnly) { next.urlOnly = false; next.emailOnly = false; }
      return next;
    });
  };

  const clearSearch = () => { setQuery(''); setResults([]); setHasSearched(false); inputRef.current?.focus(); };

  const EXAMPLE_QUERIES = ['error', 'function', 'the', 'import', 'warning: .*', 'https?://', 'TODO', 'null', 'failed', 'success'];

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title"><span className="section-icon">⌕</span> Advanced Search</div>
          <div className="section-subtitle">BM25 relevance scoring · 20+ filters · regex · fuzzy matching</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {files.length === 0 && <button className="btn btn-secondary btn-sm" onClick={() => navigate('upload')}><span>↑</span> Upload Files</button>}
          <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(!showFilters)}>{showFilters ? 'Hide' : 'Show'} Filters</button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 16 }}>⌕</span>
            <input
              ref={inputRef}
              className="input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={files.length === 0 ? 'Upload files first…' : 'Search across all indexed files… (Enter or auto-search)'}
              disabled={files.length === 0}
              style={{ paddingLeft: 42, paddingRight: query ? 40 : 14, fontSize: 14, height: 44 }}
            />
            {query && (
              <button onClick={clearSearch} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', fontSize: 16, cursor: 'pointer', padding: 4 }}>✕</button>
            )}
          </div>
          <button className="btn btn-primary" onClick={handleSearch} disabled={!query.trim() || files.length === 0} style={{ height: 44, minWidth: 100 }}>
            {isSearching ? <><span className="spinner" /> Searching</> : <><span>⌕</span> Search</>}
          </button>
        </div>

        {/* Example queries */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>Try:</span>
          {EXAMPLE_QUERIES.map(q => (
            <button key={q} className="tag" style={{ cursor: 'pointer', fontSize: 11 }} onClick={() => { setQuery(q); doSearch(q, filters); }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 20, animation: 'fadeUp 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SEARCH FILTERS
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ ...DEFAULT_FILTERS, caseSensitive: settings.caseSensitiveSearch })} style={{ fontSize: 11 }}>
              Reset Filters
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {FILTER_GROUPS.map(group => (
              <div key={group.label}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', letterSpacing: '0.1em', marginBottom: 8 }}>{group.label}</div>
                {group.filters.map(f => {
                  const isActive = !!filters[f.key as keyof SearchFilter];
                  return (
                    <div key={f.key}
                      className={`filter-pill${isActive ? ' active' : ''}`}
                      style={{ marginBottom: 4 }}
                      onClick={() => toggleFilter(f.key as keyof SearchFilter)}>
                      <div className="filter-check" style={{ borderColor: isActive ? 'var(--accent)' : 'var(--text3)', color: 'var(--accent)' }}>
                        {isActive && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)' }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: isActive ? 'var(--accent)' : 'var(--text)', fontWeight: 500 }}>{f.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{f.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sort + limit controls */}
          <div style={{ display: 'flex', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label className="label">Sort By</label>
              <select className="input" value={filters.sortBy} onChange={e => setFilters(p => ({ ...p, sortBy: e.target.value as any }))}>
                <option value="relevance">BM25 Relevance</option>
                <option value="matches">Match Count</option>
                <option value="name">File Name</option>
                <option value="date">Upload Date</option>
                <option value="size">File Size</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="label">Order</label>
              <select className="input" value={filters.sortOrder} onChange={e => setFilters(p => ({ ...p, sortOrder: e.target.value as any }))}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="label">Max Results</label>
              <select className="input" value={filters.maxResults} onChange={e => setFilters(p => ({ ...p, maxResults: Number(e.target.value) }))}>
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
                <option value={50}>50 results</option>
                <option value={100}>100 results</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="label">Min Words</label>
              <input className="input" type="number" min={0} value={filters.minWordCount} onChange={e => setFilters(p => ({ ...p, minWordCount: Number(e.target.value) }))} placeholder="0 = any" />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label className="label">Snippet Length</label>
              <select className="input" value={filters.snippetLength} onChange={e => setFilters(p => ({ ...p, snippetLength: Number(e.target.value) }))}>
                <option value={80}>80 chars</option>
                <option value={120}>120 chars</option>
                <option value={200}>200 chars</option>
                <option value={300}>300 chars</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active filters display */}
      {hasSearched && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>Active:</span>
          {Object.entries(filters).filter(([k, v]) => typeof v === 'boolean' && v && !['searchInContent', 'bm25Scoring', 'highlightAll'].includes(k)).map(([k]) => (
            <span key={k} className="badge badge-info" style={{ cursor: 'pointer' }} onClick={() => toggleFilter(k as keyof SearchFilter)}>
              {k.replace(/([A-Z])/g, ' $1').trim()} ✕
            </span>
          ))}
        </div>
      )}

      {/* Results */}
      {files.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">⌕</div>
          <div className="empty-title">No Files to Search</div>
          <div className="empty-desc">Upload .txt files first to enable full-text search with BM25 ranking.</div>
          <button className="btn btn-primary" onClick={() => navigate('upload')}><span>↑</span> Upload Files</button>
        </div>
      )}

      {files.length > 0 && hasSearched && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
              Search Results
            </h3>
            <span className={`badge ${results.length > 0 ? 'badge-success' : 'badge-neutral'}`}>
              {results.length} file{results.length !== 1 ? 's' : ''} matched
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>
              "{query}" · {files.length} file{files.length !== 1 ? 's' : ''} searched
            </span>
          </div>

          {results.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon" style={{ fontSize: 36 }}>⌕</div>
              <div className="empty-title" style={{ fontSize: 16 }}>No Matches Found</div>
              <div className="empty-desc">Try different keywords, disable filters, or enable fuzzy matching.</div>
            </div>
          ) : (
            results.map((result, idx) => {
              const isExpanded = expandedResult === result.file.id;
              const issueCount = result.file.analysis.issues.reduce((s, i) => s + i.count, 0);
              return (
                <div key={result.file.id} className="search-result" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{result.file.name}</span>
                        <span className="badge badge-success">{result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''}</span>
                        {filters.bm25Scoring && (
                          <span className="badge badge-purple">BM25: {result.bm25Score.toFixed(2)}</span>
                        )}
                        {issueCount > 0 && <span className="badge badge-danger">{issueCount} issues</span>}
                        <span className="badge badge-neutral" style={{ fontSize: 10 }}>{result.file.analysis.wordCount.toLocaleString()} words</span>
                      </div>

                      {/* Snippets */}
                      {result.snippets.map((snip, si) => (
                        <div key={si} className="snippet" style={{ marginBottom: 5 }}
                          dangerouslySetInnerHTML={{ __html: filters.highlightAll ? highlightText(snip, query, filters.caseSensitive) : snip }} />
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setExpandedResult(isExpanded ? null : result.file.id)}>
                        {isExpanded ? 'Collapse ↑' : 'Expand ↓'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', animation: 'fadeUp 0.2s ease' }}>
                      <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 6, textTransform: 'uppercase' }}>MATCH LOCATIONS (first 10)</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {result.matches.slice(0, 10).map((m, i) => (
                              <span key={i} className="badge badge-info" style={{ fontSize: 10 }}>L{m.lineNumber}</span>
                            ))}
                            {result.matches.length > 10 && <span className="badge badge-neutral" style={{ fontSize: 10 }}>+{result.matches.length - 10} more</span>}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 6, textTransform: 'uppercase' }}>FILE STATS</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)', fontFamily: 'JetBrains Mono' }}>
                            <span>{result.file.analysis.lineCount} lines</span>
                            <span>·</span>
                            <span>{result.file.analysis.readability.level}</span>
                            <span>·</span>
                            <span style={{ color: result.file.analysis.sentiment.score >= 0 ? 'var(--accent)' : 'var(--danger)' }}>{result.file.analysis.sentiment.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Context snippets */}
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginBottom: 6, textTransform: 'uppercase' }}>ADDITIONAL CONTEXT</div>
                      {result.matches.slice(0, 5).map((m, i) => (
                        <div key={i} className="snippet" style={{ marginBottom: 5 }}
                          dangerouslySetInnerHTML={{ __html: `<span style="color:var(--text3);margin-right:8px">L${m.lineNumber}</span>${filters.highlightAll ? highlightText(m.snippet, query, filters.caseSensitive) : m.snippet}` }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {!hasSearched && files.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 12 }}>⌕</div>
          <div style={{ fontFamily: 'Syne', fontSize: 16, color: 'var(--text2)', marginBottom: 6 }}>Ready to Search</div>
          <div style={{ fontSize: 13 }}>{files.length} file{files.length !== 1 ? 's' : ''} indexed · type a query above {settings.autoSearch ? '(auto-search enabled)' : 'and press Enter'}</div>
        </div>
      )}
    </div>
  );
}
