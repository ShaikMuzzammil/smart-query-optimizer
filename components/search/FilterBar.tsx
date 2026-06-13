'use client';

import { SlidersHorizontal, X } from 'lucide-react';

export interface SearchFilters {
  sentiment?: 'positive' | 'negative' | 'neutral' | '';
  fileType?: string;
  minWordCount?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface FilterBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  open: boolean;
  onToggle: () => void;
}

const activeFilterCount = (f: SearchFilters) =>
  Object.values(f).filter((v) => v !== undefined && v !== '' && v !== null).length;

export default function FilterBar({ filters, onChange, open, onToggle }: FilterBarProps) {
  const count = activeFilterCount(filters);

  return (
    <div>
      <button onClick={onToggle} className="btn-secondary text-sm">
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filters
        {count > 0 && <span className="badge bg-primary/15 text-primary-light">{count}</span>}
      </button>

      {open && (
        <div className="card-base p-4 sm:p-5 mt-3 animate-slide-up">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Sentiment</label>
              <select
                value={filters.sentiment || ''}
                onChange={(e) => onChange({ ...filters, sentiment: e.target.value as any })}
                className="input-field"
              >
                <option value="">Any</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">File type</label>
              <select
                value={filters.fileType || ''}
                onChange={(e) => onChange({ ...filters, fileType: e.target.value })}
                className="input-field"
              >
                <option value="">Any</option>
                <option value="txt">.txt</option>
                <option value="md">.md</option>
                <option value="pdf">.pdf</option>
                <option value="docx">.docx</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Min. word count</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={filters.minWordCount ?? ''}
                onChange={(e) => onChange({ ...filters, minWordCount: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Uploaded after</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
                className="input-field"
              />
            </div>
          </div>

          {count > 0 && (
            <button onClick={() => onChange({})} className="flex items-center gap-1 text-xs text-ink-faint hover:text-danger mt-3">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
