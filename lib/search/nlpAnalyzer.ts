import Sentiment from 'sentiment';
import nlp from 'compromise';
import { tokenize, tokenizeMeaningful, computeReadability } from './textProcessing';
import { extractKeywords } from './invertedIndex';
import { IFileAnalysis } from '../db/models/FileDoc';

const sentimentAnalyzer = new Sentiment();

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const URL_RE = /https?:\/\/[^\s)]+/;
const TODO_RE = /\b(TODO|FIXME|XXX|HACK)\b/;

export function analyzeSentiment(text: string): IFileAnalysis['sentiment'] {
  const result = sentimentAnalyzer.analyze(text);
  let label: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (result.comparative > 0.05) label = 'positive';
  else if (result.comparative < -0.05) label = 'negative';
  return {
    score: result.score,
    comparative: Math.round(result.comparative * 1000) / 1000,
    label,
  };
}

export function extractEntities(text: string): { text: string; type: string }[] {
  try {
    const doc = nlp(text.slice(0, 50000)); // cap for performance
    const entities: { text: string; type: string }[] = [];

    const people = doc.people().out('array') as string[];
    const places = doc.places().out('array') as string[];
    const orgs = doc.organizations().out('array') as string[];
    const dates = doc.match('#Date+').out('array') as string[];
    const money = doc.money().out('array') as string[];

    const seen = new Set<string>();
    const pushAll = (arr: string[], type: string) => {
      for (const item of arr) {
        const trimmed = item.trim();
        const key = `${type}:${trimmed.toLowerCase()}`;
        if (trimmed.length > 1 && !seen.has(key)) {
          seen.add(key);
          entities.push({ text: trimmed, type });
        }
      }
    };

    pushAll(people, 'PERSON');
    pushAll(places, 'PLACE');
    pushAll(orgs, 'ORG');
    pushAll(dates, 'DATE');
    pushAll(money, 'MONEY');

    return entities.slice(0, 40);
  } catch (err) {
    console.error('[nlp] entity extraction failed', err);
    return [];
  }
}

/**
 * Runs 15 deterministic issue-detection rules against a document. Mirrors
 * the pattern-detection approach used in the original SQL Query Optimizer,
 * adapted for unstructured document content.
 */
export function detectIssues(text: string, wordCount: number, sentiment: IFileAnalysis['sentiment']): string[] {
  const issues: string[] = [];
  const words = tokenize(text);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // 1. Very short document
  if (wordCount < 50) issues.push('Document is very short (under 50 words) - analysis confidence may be low.');

  // 2. Very long document
  if (wordCount > 20000) issues.push('Document is very large (20,000+ words) - consider splitting for faster indexing.');

  // 3. No sentence-ending punctuation
  if (sentences.length <= 1 && wordCount > 30) issues.push('No sentence-ending punctuation detected - text may be unstructured.');

  // 4. Long average sentence length
  if (sentences.length > 0) {
    const avgSentenceLen = wordCount / sentences.length;
    if (avgSentenceLen > 35) issues.push(`Average sentence length is high (${Math.round(avgSentenceLen)} words) - may reduce readability.`);
  }

  // 5. Negative sentiment
  if (sentiment.label === 'negative' && sentiment.comparative < -0.15) {
    issues.push('Strongly negative sentiment detected throughout the document.');
  }

  // 6. Contains email address (PII)
  if (EMAIL_RE.test(text)) issues.push('Contains an email address - review before sharing publicly (PII).');

  // 7. Contains phone number (PII)
  if (PHONE_RE.test(text)) issues.push('Contains what looks like a phone number - review before sharing publicly (PII).');

  // 8. Contains URLs
  if (URL_RE.test(text)) issues.push('Contains external links - verify they are still valid.');

  // 9. TODO / FIXME markers
  if (TODO_RE.test(text)) issues.push('Contains TODO/FIXME/HACK markers - document may be a draft.');

  // 10. Excessive single-word repetition
  const freq = new Map<string, number>();
  for (const w of tokenizeMeaningful(text, true)) freq.set(w, (freq.get(w) || 0) + 1);
  const meaningfulTotal = tokenizeMeaningful(text, true).length || 1;
  for (const [word, count] of freq.entries()) {
    if (count / meaningfulTotal > 0.08 && count > 5) {
      issues.push(`The term "${word}" is repeated very frequently (${count}x) - may indicate keyword stuffing.`);
      break;
    }
  }

  // 11. ALL CAPS shouting
  const capsWords = words.filter((w) => w.length > 3 && w === w.toUpperCase());
  if (capsWords.length / (words.length || 1) > 0.05 && capsWords.length > 5) {
    issues.push('Excessive use of ALL CAPS detected.');
  }

  // 12. Lorem ipsum / placeholder text
  if (/lorem ipsum/i.test(text)) issues.push('Contains placeholder ("lorem ipsum") text.');

  // 13. No paragraphs (single block of text)
  if (!text.includes('\n\n') && wordCount > 200) {
    issues.push('No paragraph breaks detected - consider formatting for readability.');
  }

  // 14. Numeric-heavy content
  const numericTokens = words.filter((w) => /^\d+$/.test(w));
  if (numericTokens.length / (words.length || 1) > 0.25 && words.length > 20) {
    issues.push('Document is numeric-heavy - may be a data export rather than prose.');
  }

  // 15. Duplicate consecutive sentences
  for (let i = 1; i < sentences.length; i++) {
    if (sentences[i].trim().length > 10 && sentences[i].trim() === sentences[i - 1].trim()) {
      issues.push('Duplicate consecutive sentences detected.');
      break;
    }
  }

  return issues;
}

/**
 * Runs the full NLP analysis pipeline on a document's text content.
 */
export function analyzeDocument(content: string, corpusTokenSets: string[][] = []): IFileAnalysis {
  const tokens = tokenizeMeaningful(content, true);
  const sentiment = analyzeSentiment(content);
  const readability = computeReadability(content);
  const entities = extractEntities(content);
  const keywords = extractKeywords(tokens, corpusTokenSets.length ? corpusTokenSets : [tokens], 12);
  const wordCount = tokenize(content).length;
  const issues = detectIssues(content, wordCount, sentiment);

  return {
    keywords,
    entities,
    sentiment,
    readability,
    issues,
  };
}
