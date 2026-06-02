// lib/analyzer.ts
import type { FileAnalysis, WordFreq, Bigram, Issue, ReadabilityScore, SentimentScore, SearchFilter, SearchResult, SearchMatch, FileData } from './types';

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','up','about','into','through','during','including','until','against',
  'among','throughout','despite','towards','upon','concerning','as','is','are',
  'was','were','be','been','being','have','has','had','do','does','did','will',
  'would','could','should','may','might','shall','can','need','dare','ought',
  'used','it','its','it\'s','i','me','my','myself','we','our','ours','ourselves',
  'you','your','yours','yourself','he','him','his','himself','she','her','hers',
  'herself','they','them','their','theirs','themselves','what','which','who',
  'whom','this','that','these','those','am','not','no','nor','so','yet','both',
  'either','neither','each','few','more','most','other','some','such','than',
  'too','very','just','because','if','while','although','though','since','after',
  'before','when','where','how','all','any','been','also','back','out','even',
  'now','well','only','same','then','here','there','s','t','re','ve','ll','d'
]);

const POSITIVE_WORDS = new Set([
  'good','great','excellent','amazing','wonderful','fantastic','outstanding',
  'perfect','best','success','successful','achieve','improvement','improved',
  'better','positive','enhance','enhanced','effective','efficient','fast','quick',
  'clean','clear','simple','easy','reliable','stable','secure','safe','valid',
  'complete','completed','pass','passed','approved','fixed','resolved','done',
  'working','works','correct','accurate','optimal','optimized','boost','boosted',
  'upgrade','upgraded','progress','advanced','innovative','productive','quality',
  'robust','powerful','smart','intelligent','automated','benefit','benefits',
  'profit','increase','increased','gain','gains','opportunity','ready','true',
  'yes','accept','accepted','active','alive','available','enabled','ok','okay'
]);

const NEGATIVE_WORDS = new Set([
  'error','errors','fail','fails','failed','failure','bug','bugs','crash',
  'crashes','crashed','exception','exceptions','problem','problems','issue',
  'issues','broken','break','breaking','deprecated','obsolete','slow','bad',
  'worst','terrible','awful','poor','invalid','incorrect','wrong','false',
  'undefined','null','none','missing','lost','dead','disabled','blocked',
  'denied','rejected','timeout','hung','frozen','corrupt','corrupted','leak',
  'leaking','overflow','underflow','panic','fatal','critical','severe','urgent',
  'warn','warning','warnings','alert','alerts','dangerous','insecure','vulnerable',
  'vulnerability','attack','hack','malicious','virus','breach','violation',
  'deprecated','removed','deleted','lost','missing','absent','unavailable',
  'unable','cannot','impossible','never','refuse','refused','abort','aborted',
  'cancel','cancelled','stop','stopped','halt','halted'
]);

const ISSUE_PATTERNS: { keyword: string; severity: Issue['severity'] }[] = [
  { keyword: 'fatal', severity: 'critical' },
  { keyword: 'critical', severity: 'critical' },
  { keyword: 'panic', severity: 'critical' },
  { keyword: 'crash', severity: 'critical' },
  { keyword: 'segfault', severity: 'critical' },
  { keyword: 'error', severity: 'high' },
  { keyword: 'exception', severity: 'high' },
  { keyword: 'fail', severity: 'high' },
  { keyword: 'failure', severity: 'high' },
  { keyword: 'bug', severity: 'high' },
  { keyword: 'broken', severity: 'high' },
  { keyword: 'corrupt', severity: 'high' },
  { keyword: 'warn', severity: 'medium' },
  { keyword: 'warning', severity: 'medium' },
  { keyword: 'deprecated', severity: 'medium' },
  { keyword: 'todo', severity: 'medium' },
  { keyword: 'fixme', severity: 'medium' },
  { keyword: 'hack', severity: 'medium' },
  { keyword: 'timeout', severity: 'medium' },
  { keyword: 'leak', severity: 'medium' },
  { keyword: 'overflow', severity: 'low' },
  { keyword: 'slow', severity: 'low' },
  { keyword: 'issue', severity: 'low' },
  { keyword: 'problem', severity: 'low' },
  { keyword: 'missing', severity: 'low' },
  { keyword: 'undefined', severity: 'low' },
  { keyword: 'null', severity: 'low' },
];

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 0);
}

function getWordFrequencies(tokens: string[], filterStopwords = true, minLen = 2): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    if (token.length < minLen) continue;
    if (filterStopwords && STOPWORDS.has(token)) continue;
    if (/^\d+$/.test(token)) continue;
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return freq;
}

function getBigrams(tokens: string[]): Map<string, number> {
  const bigrams = new Map<string, number>();
  const filtered = tokens.filter(t => !STOPWORDS.has(t) && t.length > 2);
  for (let i = 0; i < filtered.length - 1; i++) {
    const bigram = `${filtered[i]} ${filtered[i + 1]}`;
    bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
  }
  return bigrams;
}

function computeReadability(text: string, wordCount: number): ReadabilityScore {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const sentenceCount = Math.max(sentences.length, 1);
  const avgWordsPerSentence = wordCount / sentenceCount;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const totalChars = words.reduce((sum, w) => sum + w.replace(/[^a-z]/gi, '').length, 0);
  const avgCharsPerWord = words.length > 0 ? totalChars / words.length : 0;

  // Flesch-Kincaid inspired score (simplified)
  const score = Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence - 84.6 * (avgCharsPerWord / 5)));

  let level: ReadabilityScore['level'];
  if (score >= 80) level = 'Very Easy';
  else if (score >= 60) level = 'Easy';
  else if (score >= 40) level = 'Medium';
  else if (score >= 20) level = 'Hard';
  else level = 'Very Hard';

  return { score: Math.round(score), level, avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10, avgCharsPerWord: Math.round(avgCharsPerWord * 10) / 10, sentenceCount };
}

function computeSentiment(tokens: string[]): SentimentScore {
  const positiveWords: string[] = [];
  const negativeWords: string[] = [];

  for (const token of tokens) {
    if (POSITIVE_WORDS.has(token)) positiveWords.push(token);
    if (NEGATIVE_WORDS.has(token)) negativeWords.push(token);
  }

  const positiveCount = positiveWords.length;
  const negativeCount = negativeWords.length;
  const total = positiveCount + negativeCount;
  const score = total === 0 ? 0 : Math.round(((positiveCount - negativeCount) / total) * 100);

  let label: SentimentScore['label'];
  if (score >= 50) label = 'Very Positive';
  else if (score >= 15) label = 'Positive';
  else if (score >= -15) label = 'Neutral';
  else if (score >= -50) label = 'Negative';
  else label = 'Very Negative';

  const uniquePos = [...new Set(positiveWords)].slice(0, 8);
  const uniqueNeg = [...new Set(negativeWords)].slice(0, 8);

  return { score, label, positiveCount, negativeCount, positiveWords: uniquePos, negativeWords: uniqueNeg };
}

function detectIssues(content: string): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');

  for (const pattern of ISSUE_PATTERNS) {
    const regex = new RegExp(`\\b${pattern.keyword}\\b`, 'gi');
    const positions: number[] = [];
    const lineNumbers: number[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      positions.push(match.index);
    }

    for (let i = 0; i < lines.length; i++) {
      if (new RegExp(`\\b${pattern.keyword}\\b`, 'i').test(lines[i])) {
        lineNumbers.push(i + 1);
      }
    }

    if (positions.length > 0) {
      issues.push({ keyword: pattern.keyword, count: positions.length, positions, severity: pattern.severity, lineNumbers });
    }
  }

  return issues.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity] || b.count - a.count;
  });
}

function countUrls(text: string): number {
  return (text.match(/https?:\/\/[^\s]+/g) || []).length;
}

function countEmails(text: string): number {
  return (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).length;
}

function countNumbers(text: string): number {
  return (text.match(/\b\d+\.?\d*\b/g) || []).length;
}

export function analyzeFile(content: string, filterStopwords = true, minWordLen = 2): FileAnalysis {
  const tokens = tokenize(content);
  const wordCount = tokens.length;
  const lines = content.split('\n');
  const lineCount = lines.length;
  const charCount = content.length;
  const charCountNoSpaces = content.replace(/\s/g, '').length;

  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const sentenceCount = sentences.length;
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;
  const avgWordsPerLine = lineCount > 0 ? Math.round((wordCount / lineCount) * 10) / 10 : 0;

  const freqMap = getWordFrequencies(tokens, filterStopwords, minWordLen);
  const allFreqMap = getWordFrequencies(tokens, false, 1);
  const uniqueWordCount = freqMap.size;

  // Calculate lexical density (unique content words / total words)
  const contentWords = tokens.filter(t => !STOPWORDS.has(t) && t.length > 2).length;
  const lexicalDensity = wordCount > 0 ? Math.round((contentWords / wordCount) * 100) : 0;

  // Top 20 words
  const sortedWords = [...freqMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count, percentage: Math.round((count / wordCount) * 1000) / 10 }));

  // Top bigrams
  const bigramMap = getBigrams(tokens);
  const topBigrams: Bigram[] = [...bigramMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase, count]) => ({ phrase, count }));

  const issues = detectIssues(content);
  const readability = computeReadability(content, wordCount);
  const sentiment = computeSentiment(tokens);

  // Most unusual word (appears once, not in stopwords, len > 4)
  const uniqueOccurrences = [...freqMap.entries()].filter(([w, c]) => c === 1 && w.length > 4);
  const mostUnusualWord = uniqueOccurrences.length > 0 ? uniqueOccurrences[Math.floor(Math.random() * Math.min(uniqueOccurrences.length, 10))][0] : '';

  const allWords = tokens.filter(t => t.length > 0);
  const longestWord = allWords.reduce((a, b) => a.length > b.length ? a : b, '');
  const shortestWord = allWords.filter(w => w.length > 0).reduce((a, b) => a.length < b.length ? a : b, allWords[0] || '');

  return {
    wordCount,
    uniqueWordCount,
    lineCount,
    charCount,
    charCountNoSpaces,
    sentenceCount,
    paragraphCount,
    avgWordsPerLine,
    lexicalDensity,
    topWords: sortedWords,
    topBigrams,
    issues,
    readability,
    sentiment,
    mostUnusualWord,
    longestWord,
    shortestWord,
    urlCount: countUrls(content),
    emailCount: countEmails(content),
    numberCount: countNumbers(content),
  };
}

// BM25 Scoring
const K1 = 1.5;
const B = 0.75;

export function bm25Score(tf: number, idf: number, docLen: number, avgDocLen: number): number {
  const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * (docLen / Math.max(avgDocLen, 1))));
  return idf * norm;
}

export function computeIDF(filesCount: number, filesWithTerm: number): number {
  return Math.log((filesCount - filesWithTerm + 0.5) / (filesWithTerm + 0.5) + 1);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSnippet(content: string, matchIndex: number, snippetLen: number): string {
  const half = Math.floor(snippetLen / 2);
  const start = Math.max(0, matchIndex - half);
  const end = Math.min(content.length, matchIndex + half);
  let snippet = content.slice(start, end).replace(/\n/g, ' ');
  if (start > 0) snippet = '…' + snippet;
  if (end < content.length) snippet = snippet + '…';
  return snippet;
}

export function searchFiles(files: FileData[], query: string, filters: SearchFilter): SearchResult[] {
  if (!query.trim() || files.length === 0) return [];

  const results: SearchResult[] = [];
  const avgDocLen = files.reduce((s, f) => s + f.analysis.wordCount, 0) / files.length;

  let regexFlags = filters.caseSensitive ? 'g' : 'gi';
  let pattern: string;

  if (filters.regex) {
    try { pattern = query; new RegExp(query, regexFlags); }
    catch { pattern = escapeRegex(query); }
  } else if (filters.wholeWord) {
    pattern = `\\b${escapeRegex(query)}\\b`;
  } else if (filters.fuzzy) {
    // Simple fuzzy: allow one character difference by building alternatives
    const chars = query.split('');
    const alts = chars.map((_, i) => chars.slice(0, i).join('') + '.' + chars.slice(i + 1).join(''));
    pattern = `(${escapeRegex(query)}|${alts.map(escapeRegex).join('|')})`;
  } else {
    pattern = escapeRegex(query);
  }

  for (const file of files) {
    if (filters.highIssuesOnly && file.analysis.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0) continue;
    if (file.analysis.wordCount < filters.minWordCount) continue;
    if (filters.maxWordCount > 0 && file.analysis.wordCount > filters.maxWordCount) continue;

    let searchContent = '';
    if (filters.searchInContent) searchContent += file.content;
    if (filters.searchInName) searchContent += '\n' + file.name;

    if (filters.urlOnly) {
      const urls = (file.content.match(/https?:\/\/[^\s]+/g) || []).join('\n');
      searchContent = urls;
    }
    if (filters.emailOnly) {
      const emails = (file.content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).join('\n');
      searchContent = emails;
    }
    if (filters.numberOnly) {
      const nums = (file.content.match(/\b\d+\.?\d*\b/g) || []).join('\n');
      searchContent = nums;
    }

    const regex = new RegExp(pattern, regexFlags);
    const matches: SearchMatch[] = [];
    let match;
    let lineContent = searchContent;
    const lineMap: number[] = [];
    let lineNum = 1;
    for (let i = 0; i < lineContent.length; i++) {
      lineMap[i] = lineNum;
      if (lineContent[i] === '\n') lineNum++;
    }

    while ((match = regex.exec(searchContent)) !== null && matches.length < filters.maxResults * 3) {
      const snippet = buildSnippet(searchContent, match.index, filters.snippetLength);
      const tokenCount = query.toLowerCase().split(/\s+/).reduce((c, t) => c + (searchContent.toLowerCase().split(t).length - 1), 0);
      const docLen = file.analysis.wordCount;
      const idf = computeIDF(files.length, files.filter(f => new RegExp(pattern, 'i').test(f.content)).length);
      const score = bm25Score(Math.max(tokenCount, 1), idf, docLen, avgDocLen);

      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        snippet,
        lineNumber: lineMap[match.index] || 1,
        score,
      });

      if (match.index === regex.lastIndex) regex.lastIndex++;
    }

    if (matches.length === 0) continue;

    const bm25 = matches.reduce((s, m) => s + m.score, 0) / matches.length;
    const snippets = [...new Set(matches.slice(0, 5).map(m => m.snippet))];

    results.push({ file, matches, totalMatches: matches.length, bm25Score: bm25, snippets });
  }

  results.sort((a, b) => {
    if (filters.sortBy === 'relevance') return b.bm25Score - a.bm25Score;
    if (filters.sortBy === 'matches') return b.totalMatches - a.totalMatches;
    if (filters.sortBy === 'name') return a.file.name.localeCompare(b.file.name);
    if (filters.sortBy === 'date') return b.file.uploadedAt - a.file.uploadedAt;
    if (filters.sortBy === 'size') return b.file.size - a.file.size;
    return b.bm25Score - a.bm25Score;
  });

  if (filters.sortOrder === 'asc') results.reverse();
  return results.slice(0, filters.maxResults);
}

export function highlightText(text: string, query: string, caseSensitive = false): string {
  if (!query.trim()) return text;
  try {
    const flags = caseSensitive ? 'g' : 'gi';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, flags), '<mark>$&</mark>');
  } catch {
    return text;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
