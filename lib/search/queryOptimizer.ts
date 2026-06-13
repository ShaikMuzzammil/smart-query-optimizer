import { tokenize, levenshtein, STOPWORDS } from './textProcessing';
import { SYNONYM_DICT, COMMON_CORRECTIONS } from './synonyms';
import { generateJSON, isAiConfigured } from '../ai/gemini';

export interface OptimizedQuery {
  originalQuery: string;
  correctedQuery: string;
  expandedTerms: string[];
  synonymsUsed: string[];
  rankingStrategy: string;
  didYouMean: boolean;
  aiAssisted: boolean;
}

/**
 * Finds the closest vocabulary term within edit distance <= 2 (fuzzy match).
 */
function fuzzyCorrect(term: string, vocabulary: string[]): string | null {
  if (term.length < 3) return null;
  let best: string | null = null;
  let bestDist = 3;
  for (const candidate of vocabulary) {
    if (Math.abs(candidate.length - term.length) > 2) continue;
    const dist = levenshtein(term, candidate);
    if (dist < bestDist && dist <= 2 && dist > 0) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best;
}

/**
 * Core query optimizer pipeline:
 *  1. Tokenizes the raw query.
 *  2. Spell-corrects unknown terms via a static dictionary + fuzzy (Levenshtein) match
 *     against the user's own document vocabulary.
 *  3. Expands abbreviations / synonyms via a static dictionary.
 *  4. If GEMINI_API_KEY is configured, asks Gemini to suggest additional
 *     semantically related expansion terms (merged with the static results).
 *
 * Designed to degrade gracefully to steps 1-3 with zero external calls when
 * no AI key is present.
 */
export async function optimizeQuery(rawQuery: string, vocabulary: string[]): Promise<OptimizedQuery> {
  const tokens = tokenize(rawQuery);
  const vocabSet = new Set(vocabulary);
  const correctedTokens: string[] = [];
  const synonymsUsed: string[] = [];
  let didYouMean = false;

  for (const token of tokens) {
    let corrected = token;

    if (COMMON_CORRECTIONS[token]) {
      corrected = COMMON_CORRECTIONS[token];
      didYouMean = true;
    } else if (!STOPWORDS.has(token) && vocabSet.size > 0 && !vocabSet.has(token)) {
      const fuzzy = fuzzyCorrect(token, vocabulary);
      if (fuzzy) {
        corrected = fuzzy;
        didYouMean = true;
      }
    }
    correctedTokens.push(corrected);
  }

  const correctedQuery = correctedTokens.join(' ');

  // Static synonym / abbreviation expansion
  const expandedSet = new Set<string>(correctedTokens);
  for (const token of correctedTokens) {
    const syns = SYNONYM_DICT[token];
    if (syns) {
      for (const syn of syns) {
        for (const part of tokenize(syn)) {
          if (!expandedSet.has(part)) {
            expandedSet.add(part);
            synonymsUsed.push(`${token} → ${part}`);
          }
        }
      }
    }
  }

  let aiAssisted = false;

  if (isAiConfigured() && correctedQuery.trim().length > 0) {
    const aiResult = await generateJSON<{ expansions: string[]; rewritten?: string }>(
      `You are a search query optimizer for a document search engine. Given the user's search query: "${correctedQuery}"\n\n` +
        `Return a JSON object with:\n` +
        `- "expansions": an array of up to 5 additional single-word or short-phrase search terms that are semantically related and would help find relevant documents (synonyms, related concepts, broader/narrower terms). Do not repeat words already in the query.\n` +
        `- "rewritten": a short, clearer rephrasing of the query if the original is vague or ambiguous, otherwise the same query.`
    );

    if (aiResult?.expansions?.length) {
      for (const exp of aiResult.expansions) {
        for (const part of tokenize(exp)) {
          if (!expandedSet.has(part) && !STOPWORDS.has(part)) {
            expandedSet.add(part);
          }
        }
      }
      aiAssisted = true;
    }
  }

  return {
    originalQuery: rawQuery,
    correctedQuery,
    expandedTerms: Array.from(expandedSet),
    synonymsUsed,
    rankingStrategy: `BM25 (k1=1.5, b=0.75) + recency boost (0.2) + personalization (0.1)${aiAssisted ? ' + AI query expansion (Gemini)' : ''}`,
    didYouMean,
    aiAssisted,
  };
}
