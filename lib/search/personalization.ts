import { tokenizeMeaningful, stem } from './textProcessing';

/**
 * Builds a stemmed-term -> weight (0-1) map from a user's prior successful
 * searches (queries that returned results). Used by the BM25 ranker for
 * the personalized ranking term in the scoring formula.
 */
export function buildUserTermWeights(queryLogs: { query: string; resultCount: number }[]): Map<string, number> {
  const weights = new Map<string, number>();
  for (const log of queryLogs) {
    if (!log.resultCount) continue;
    const tokens = tokenizeMeaningful(log.query, true).map(stem);
    for (const t of tokens) {
      weights.set(t, Math.min((weights.get(t) || 0) + 0.08, 1));
    }
  }
  return weights;
}
