'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, Loader2, Sparkles, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { postJSON } from '../../../lib/fetcher';
import { useDebounce } from '../../../hooks/useDebounce';
import { SearchResponse } from '../../../types';
import OptimizerPanel from '../../../components/search/OptimizerPanel';
import ResultCard from '../../../components/search/ResultCard';
import FilterBar, { SearchFilters } from '../../../components/search/FilterBar';
import GuideTip from '../../../components/ui/GuideTip';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');

  const [preview, setPreview] = useState<SearchResponse['optimizer'] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 450);

  // Live "did you mean" preview while typing (before submit)
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 3 || hasSearched) {
      if (!hasSearched) setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    postJSON('/api/search/optimize', { query: debouncedQuery })
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, hasSearched]);

  const runSearch = useCallback(
    async (q: string, f: SearchFilters = filters) => {
      if (!q.trim()) return;
      setLoading(true);
      setHasSearched(true);
      try {
        const cleanFilters: any = {};
        if (f.sentiment) cleanFilters.sentiment = f.sentiment;
        if (f.fileType) cleanFilters.fileType = f.fileType;
        if (f.minWordCount) cleanFilters.minWordCount = f.minWordCount;
        if (f.dateFrom) cleanFilters.dateFrom = f.dateFrom;

        const data: SearchResponse = await postJSON('/api/search', { query: q, limit: 20, filters: cleanFilters });
        setResponse(data);
        setPreview(null);
      } catch (err: any) {
        toast.error(err.message || 'Search failed.');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    if (initialQuery.trim()) {
      runSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  function acceptCorrection(corrected: string) {
    setQuery(corrected);
    runSearch(corrected);
  }

  const sortedResults = useMemo(() => {
    if (!response) return [];
    const results = [...response.results];
    if (sortBy === 'date') {
      results.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    }
    return results;
  }, [response, sortBy]);

  const maxScore = response?.results.length ? Math.max(...response.results.map((r) => r.score)) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg font-semibold text-ink">Search your documents</h2>
        <GuideTip title="Searching">
          Type a question, phrase, or keywords — even with typos. As you type, you'll see a live "Did you mean?"
          preview. Press Enter or click Search to run the full BM25-ranked search with the query optimizer.
        </GuideTip>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (hasSearched) setHasSearched(false);
          }}
          placeholder='Try "eror handeling" or "refund policy"…'
          className="input-field !pl-11 !pr-28 !py-3.5 text-base"
        />
        <button type="submit" disabled={loading || !query.trim()} className="btn-primary absolute right-2 top-1/2 -translate-y-1/2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
          Search
        </button>
      </form>

      {/* Live preview before search */}
      {!hasSearched && preview && query.trim().length >= 3 && (
        <div className="flex items-center gap-2 text-sm text-ink-muted animate-fade-in px-1">
          <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
          {preview.didYouMean && preview.correctedQuery !== preview.originalQuery.toLowerCase() ? (
            <span>
              Did you mean{' '}
              <button type="button" onClick={() => acceptCorrection(preview.correctedQuery)} className="text-accent font-medium hover:underline">
                "{preview.correctedQuery}"
              </button>
              ? Press Enter to search with the optimizer.
            </span>
          ) : (
            <span>The optimizer will expand this to {preview.expandedTerms.length} term{preview.expandedTerms.length !== 1 ? 's' : ''} when you search.</span>
          )}
          {previewLoading && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
        </div>
      )}

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} open={filtersOpen} onToggle={() => setFiltersOpen((o) => !o)} />

      {/* Results */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card-base p-5 h-32 skeleton" />)}
        </div>
      )}

      {!loading && response && (
        <div className="space-y-4">
          <OptimizerPanel optimizer={response.optimizer} onAcceptCorrection={acceptCorrection} />

          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              {response.results.length} result{response.results.length !== 1 ? 's' : ''} in {response.durationMs}ms
            </p>
            {response.results.length > 1 && (
              <button
                onClick={() => setSortBy((s) => (s === 'relevance' ? 'date' : 'relevance'))}
                className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort: {sortBy === 'relevance' ? 'Relevance' : 'Newest first'}
              </button>
            )}
          </div>

          {sortedResults.length === 0 ? (
            <div className="card-base p-10 text-center">
              <p className="text-sm text-ink-muted">
                No documents matched "{response.optimizer.correctedQuery}". Try different terms, fewer filters, or upload more documents.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedResults.map((result) => (
                <ResultCard key={result.id} result={result} maxScore={maxScore} />
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !response && !hasSearched && (
        <div className="card-base p-10 text-center">
          <SearchIcon className="w-8 h-8 text-ink-faint mx-auto mb-3" />
          <p className="text-sm text-ink-muted">Search across all of your indexed documents using BM25 ranking and the AI query optimizer.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {['error handling', 'refund policy', 'performance', 'onboarding'].map((s) => (
              <button key={s} onClick={() => { setQuery(s); runSearch(s); }} className="badge bg-elevated text-ink-muted border border-border hover:border-primary transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
