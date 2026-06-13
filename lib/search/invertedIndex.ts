import { tokenizeMeaningful, stem, tokenize } from './textProcessing';

export interface IndexedDocument {
  id: string;
  fileName: string;
  content: string;
  uploadDate: Date;
  pinned?: boolean;
}

export interface TermContribution {
  term: string;
  tf: number;
  idf: number;
  contribution: number;
}

export interface SearchResult {
  id: string;
  fileName: string;
  score: number;
  rawBm25: number;
  recencyBoost: number;
  personalBoost: number;
  termContributions: TermContribution[];
  snippet: string;
  matchedTerms: string[];
  uploadDate: Date;
}

const K1 = 1.5;
const B = 0.75;
const RECENCY_WEIGHT = 0.2;
const PERSONAL_WEIGHT = 0.1;

/**
 * In-memory inverted index with BM25 scoring, recency boosting, and
 * personalized term weighting. Built fresh per search request from the
 * user's document set (acceptable at this document-count scale and keeps
 * the deployment fully serverless / Vercel-friendly).
 */
export class InvertedIndex {
  private documents: Map<string, IndexedDocument> = new Map();
  /** stemmed term -> docId -> term frequency */
  private postings: Map<string, Map<string, number>> = new Map();
  private docLengths: Map<string, number> = new Map();
  private avgDocLength = 0;
  private N = 0;
  private newestTimestamp = 0;
  private oldestTimestamp = 0;

  constructor(documents: IndexedDocument[]) {
    this.build(documents);
  }

  private build(documents: IndexedDocument[]) {
    this.N = documents.length;
    if (this.N === 0) return;

    let totalLength = 0;
    let newest = -Infinity;
    let oldest = Infinity;

    for (const doc of documents) {
      this.documents.set(doc.id, doc);
      const tokens = tokenizeMeaningful(doc.content, true).map(stem);
      this.docLengths.set(doc.id, tokens.length);
      totalLength += tokens.length;

      const freq = new Map<string, number>();
      for (const t of tokens) {
        freq.set(t, (freq.get(t) || 0) + 1);
      }
      for (const [term, count] of freq.entries()) {
        if (!this.postings.has(term)) this.postings.set(term, new Map());
        this.postings.get(term)!.set(doc.id, count);
      }

      const ts = new Date(doc.uploadDate).getTime();
      if (ts > newest) newest = ts;
      if (ts < oldest) oldest = ts;
    }

    this.avgDocLength = totalLength / this.N;
    this.newestTimestamp = newest;
    this.oldestTimestamp = oldest;
  }

  /** Returns the full vocabulary (stemmed terms) - used for fuzzy "did you mean" suggestions. */
  vocabulary(): string[] {
    return Array.from(this.postings.keys());
  }

  /** Raw token vocabulary (unstemmed) sampled from document contents - used for autocomplete. */
  surfaceVocabulary(limit = 500): string[] {
    const seen = new Set<string>();
    for (const doc of this.documents.values()) {
      for (const t of tokenizeMeaningful(doc.content, true)) {
        seen.add(t);
        if (seen.size >= limit) return Array.from(seen);
      }
    }
    return Array.from(seen);
  }

  totalTerms(): number {
    return this.postings.size;
  }

  private idf(term: string): number {
    const n = this.postings.get(term)?.size || 0;
    if (n === 0) return 0;
    return Math.log((this.N - n + 0.5) / (n + 0.5) + 1);
  }

  private recencyFactor(doc: IndexedDocument): number {
    if (this.newestTimestamp === this.oldestTimestamp) return 0.5;
    const ts = new Date(doc.uploadDate).getTime();
    return (ts - this.oldestTimestamp) / (this.newestTimestamp - this.oldestTimestamp);
  }

  /**
   * Searches the index for the given (already expanded) query terms.
   * `userTermWeights` maps stemmed terms -> weight (0-1) derived from the
   * user's prior successful searches, for personalized ranking.
   */
  search(
    queryTerms: string[],
    options: { userTermWeights?: Map<string, number>; limit?: number } = {}
  ): SearchResult[] {
    if (this.N === 0 || queryTerms.length === 0) return [];

    const stemmedQuery = Array.from(new Set(queryTerms.map((t) => stem(t.toLowerCase()))));
    const userTermWeights = options.userTermWeights || new Map();
    const limit = options.limit ?? 50;

    const results: SearchResult[] = [];

    for (const [docId, doc] of this.documents.entries()) {
      const docLen = this.docLengths.get(docId) || 0;
      let rawBm25 = 0;
      const contributions: TermContribution[] = [];
      const matchedTerms: string[] = [];

      for (const term of stemmedQuery) {
        const postingMap = this.postings.get(term);
        const tf = postingMap?.get(docId) || 0;
        if (tf === 0) continue;

        const idf = this.idf(term);
        const denom = tf + K1 * (1 - B + B * (docLen / (this.avgDocLength || 1)));
        const termScore = idf * ((tf * (K1 + 1)) / (denom || 1));

        rawBm25 += termScore;
        matchedTerms.push(term);
        contributions.push({ term, tf, idf: Math.round(idf * 1000) / 1000, contribution: Math.round(termScore * 1000) / 1000 });
      }

      if (rawBm25 <= 0) continue;

      const recency = this.recencyFactor(doc);
      let personal = 0;
      for (const term of matchedTerms) {
        personal += userTermWeights.get(term) || 0;
      }
      personal = Math.min(personal, 1);

      const finalScore = rawBm25 * (1 + RECENCY_WEIGHT * recency) * (1 + PERSONAL_WEIGHT * personal);

      results.push({
        id: doc.id,
        fileName: doc.fileName,
        score: Math.round(finalScore * 1000) / 1000,
        rawBm25: Math.round(rawBm25 * 1000) / 1000,
        recencyBoost: Math.round(recency * 1000) / 1000,
        personalBoost: Math.round(personal * 1000) / 1000,
        termContributions: contributions.sort((a, b) => b.contribution - a.contribution),
        snippet: buildSnippet(doc.content, queryTerms),
        matchedTerms,
        uploadDate: doc.uploadDate,
      });
    }

    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    });

    return results.slice(0, limit);
  }
}

/**
 * Builds a highlighted snippet around the first match of any query term.
 */
export function buildSnippet(content: string, queryTerms: string[], radius = 110): string {
  if (!content) return '';
  const lower = content.toLowerCase();
  const stems = queryTerms.map((t) => t.toLowerCase());

  let matchIndex = -1;
  let matchLen = 0;
  for (const term of stems) {
    const idx = lower.indexOf(term);
    if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
      matchIndex = idx;
      matchLen = term.length;
    }
  }

  let snippetStart: number;
  let snippet: string;
  if (matchIndex === -1) {
    snippet = content.slice(0, radius * 2);
    snippetStart = 0;
  } else {
    snippetStart = Math.max(0, matchIndex - radius);
    snippet = content.slice(snippetStart, matchIndex + matchLen + radius);
  }

  // Highlight all query term occurrences within snippet
  let highlighted = escapeHtml(snippet);
  const uniqueTerms = Array.from(new Set(queryTerms.filter((t) => t.length > 1)));
  for (const term of uniqueTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark class="term-highlight">$1</mark>');
  }

  const prefix = snippetStart > 0 ? '… ' : '';
  const suffix = snippetStart + snippet.length < content.length ? ' …' : '';
  return prefix + highlighted + suffix;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Extracts top keywords for a single document using TF-IDF against the
 * rest of the user's corpus (or simple TF if corpus has only one doc).
 */
export function extractKeywords(
  targetTokens: string[],
  corpusTokenSets: string[][],
  topN = 10
): { term: string; score: number }[] {
  const tf = new Map<string, number>();
  for (const t of targetTokens) tf.set(t, (tf.get(t) || 0) + 1);

  const N = corpusTokenSets.length || 1;
  const scores: { term: string; score: number }[] = [];

  for (const [term, count] of tf.entries()) {
    if (term.length < 3) continue;
    const docsContaining = corpusTokenSets.filter((set) => set.includes(term)).length || 1;
    const idf = Math.log(N / docsContaining + 1) + 0.1;
    const score = (count / targetTokens.length) * idf;
    scores.push({ term, score: Math.round(score * 10000) / 10000 });
  }

  return scores.sort((a, b) => b.score - a.score).slice(0, topN);
}
