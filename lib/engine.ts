'use client';

// ============================================================
// TYPES
// ============================================================
export interface WordFreq { word: string; count: number; }
export interface Issue { keyword: string; line: number; col: number; context: string; }
export interface ReadabilityScore { avgWordsPerSentence: number; avgCharsPerWord: number; fleschKincaid: number; grade: string; }
export interface SentimentScore { positive: number; negative: number; neutral: number; overall: 'positive' | 'negative' | 'neutral'; score: number; }
export interface FileStats {
  wordCount: number;
  lineCount: number;
  charCount: number;
  charCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerLine: number;
  uniqueWordCount: number;
  topWords: WordFreq[];
  issues: Issue[];
  readability: ReadabilityScore;
  sentiment: SentimentScore;
  mostUnusualWord: string;
  longestWord: string;
  shortestWord: string;
  lexicalDensity: number;
  typeTokenRatio: number;
}
export interface AnalyzedFile {
  id: string;
  name: string;
  size: number;
  content: string;
  stats: FileStats;
  uploadedAt: Date;
  queryCount: number;
  wordFreqMap: Record<string, number>;
  preview: string;
}
export interface SearchFilter {
  id: string;
  label: string;
  description: string;
  apply: (content: string, query: string) => boolean;
}
export interface SearchResult {
  file: AnalyzedFile;
  matchCount: number;
  snippets: string[];
  matchPositions: number[];
  relevanceScore: number;
}
export interface SearchHistory {
  query: string;
  timestamp: Date;
  resultCount: number;
  filters: string[];
}
export interface AppSettings {
  stopwordsEnabled: boolean;
  caseSensitive: boolean;
  realtimeSearch: boolean;
  maxFileSize: number;
  theme: 'dark' | 'darker' | 'midnight';
  highlightColor: string;
  snippetLength: number;
  showLineNumbers: boolean;
  autoAnalyze: boolean;
  defaultFilter: string;
  exportFormat: 'json' | 'csv' | 'txt';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// ============================================================
// CONSTANTS
// ============================================================
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','be','been','being','have',
  'has','had','do','does','did','will','would','could','should','may',
  'might','shall','can','this','that','these','those','i','you','he',
  'she','it','we','they','me','him','her','us','them','my','your','his',
  'its','our','their','what','which','who','when','where','why','how',
  'all','each','every','both','few','more','most','other','some','such',
  'no','not','only','same','so','than','too','very','just','about','up',
  'into','through','during','before','after','above','below','between',
]);

const POSITIVE_WORDS = new Set([
  'good','great','excellent','amazing','wonderful','fantastic','positive',
  'success','successful','perfect','best','outstanding','superb','brilliant',
  'effective','efficient','improve','improved','improvement','enhance',
  'optimal','optimized','fast','clean','clear','correct','valid','pass',
  'complete','completed','done','finished','ready','working','stable',
  'reliable','secure','safe','healthy','active','alive','available',
  'accurate','precise','helpful','useful','productive','innovative',
]);

const NEGATIVE_WORDS = new Set([
  'error','fail','failed','failure','bug','crash','broken','wrong',
  'bad','terrible','awful','horrible','critical','severe','fatal',
  'exception','warning','deprecated','obsolete','dead','down','off',
  'invalid','incorrect','malformed','corrupt','lost','missing','null',
  'undefined','timeout','slow','leak','vulnerable','insecure','unsafe',
  'problem','issue','defect','flaw','glitch','anomaly','abnormal',
]);

const HIGH_IMPACT_KEYWORDS = ['error','fail','exception','critical','bug','crash',
  'fatal','severe','broken','corrupt','vulnerability','exploit','attack',
  'breach','leak','overflow','injection','deprecated','warning','panic'];

// ============================================================
// ANALYSIS ENGINE
// ============================================================
export function analyzeFile(content: string, fileName: string, size: number): AnalyzedFile {
  const id = `file_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const lines = content.split('\n');
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  // Word frequency map
  const wordFreqMap: Record<string, number> = {};
  const words = content.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  words.forEach(w => { wordFreqMap[w] = (wordFreqMap[w] || 0) + 1; });

  const topWords: WordFreq[] = Object.entries(wordFreqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  const allWordsArr = Object.entries(wordFreqMap).sort((a,b)=>b[1]-a[1]);
  const top50 = allWordsArr.slice(0,50);
  const mostUnusualWord = top50.length ? top50[top50.length-1][0] : '';
  const allContentWords = words.filter(w=>w.length>2);
  const longestWord = [...allContentWords].sort((a,b)=>b.length-a.length)[0] || '';
  const shortestWord = [...allContentWords].filter(w=>w.length>2).sort((a,b)=>a.length-b.length)[0] || '';

  // Issues detection
  const issues: Issue[] = [];
  lines.forEach((line, lineIdx) => {
    HIGH_IMPACT_KEYWORDS.forEach(kw => {
      const regex = new RegExp(kw, 'gi');
      let match;
      while ((match = regex.exec(line)) !== null) {
        const start = Math.max(0, match.index - 30);
        const end = Math.min(line.length, match.index + kw.length + 30);
        issues.push({
          keyword: kw,
          line: lineIdx + 1,
          col: match.index + 1,
          context: '...' + line.slice(start, end) + '...',
        });
      }
    });
  });

  // Readability
  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgCharsPerWord = words.length > 0 ? words.reduce((s,w)=>s+w.length,0)/words.length : 0;
  const fleschKincaid = Math.max(0, Math.min(100, 206.835 - 1.015*avgWordsPerSentence - 84.6*avgCharsPerWord/5));
  let grade = 'College';
  if (fleschKincaid >= 90) grade = 'Very Easy (5th grade)';
  else if (fleschKincaid >= 80) grade = 'Easy (6th grade)';
  else if (fleschKincaid >= 70) grade = 'Fairly Easy (7th grade)';
  else if (fleschKincaid >= 60) grade = 'Standard (8th-9th)';
  else if (fleschKincaid >= 50) grade = 'Fairly Difficult (10th-12th)';
  else if (fleschKincaid >= 30) grade = 'Difficult (College)';
  else grade = 'Very Difficult (Professional)';

  // Sentiment
  let posCount = 0, negCount = 0;
  words.forEach(w => {
    if (POSITIVE_WORDS.has(w)) posCount++;
    if (NEGATIVE_WORDS.has(w)) negCount++;
  });
  const total = posCount + negCount || 1;
  const sentimentScore = (posCount - negCount) / total;
  const overall = sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral';

  const uniqueWordCount = Object.keys(wordFreqMap).length;
  const lexicalDensity = words.length > 0 ? (uniqueWordCount / words.length) * 100 : 0;

  const stats: FileStats = {
    wordCount: words.length,
    lineCount: lines.length,
    charCount: content.length,
    charCountNoSpaces: content.replace(/\s/g,'').length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    avgWordsPerLine: lines.length > 0 ? words.length / lines.length : 0,
    uniqueWordCount,
    topWords,
    issues,
    readability: { avgWordsPerSentence, avgCharsPerWord, fleschKincaid, grade },
    sentiment: { positive: posCount, negative: negCount, neutral: words.length-posCount-negCount, overall, score: sentimentScore },
    mostUnusualWord,
    longestWord,
    shortestWord,
    lexicalDensity,
    typeTokenRatio: uniqueWordCount / (words.length || 1),
  };

  return {
    id,
    name: fileName,
    size,
    content,
    stats,
    uploadedAt: new Date(),
    queryCount: 0,
    wordFreqMap,
    preview: content.slice(0, 500),
  };
}

// ============================================================
// SEARCH FILTERS (20 filters)
// ============================================================
export const SEARCH_FILTERS: SearchFilter[] = [
  {
    id: 'exact',
    label: 'Exact Match',
    description: 'Matches the exact phrase as typed',
    apply: (content, query) => content.includes(query),
  },
  {
    id: 'case-insensitive',
    label: 'Case Insensitive',
    description: 'Ignores uppercase/lowercase differences',
    apply: (content, query) => content.toLowerCase().includes(query.toLowerCase()),
  },
  {
    id: 'whole-word',
    label: 'Whole Word',
    description: 'Matches only complete words, not substrings',
    apply: (content, query) => new RegExp(`\\b${escapeRegex(query)}\\b`, 'i').test(content),
  },
  {
    id: 'starts-with',
    label: 'Starts With',
    description: 'Lines that start with the query',
    apply: (content, query) => content.split('\n').some(l => l.trim().toLowerCase().startsWith(query.toLowerCase())),
  },
  {
    id: 'ends-with',
    label: 'Ends With',
    description: 'Lines that end with the query',
    apply: (content, query) => content.split('\n').some(l => l.trim().toLowerCase().endsWith(query.toLowerCase())),
  },
  {
    id: 'regex',
    label: 'Regex Pattern',
    description: 'Use regular expressions for advanced matching',
    apply: (content, query) => { try { return new RegExp(query, 'i').test(content); } catch { return false; } },
  },
  {
    id: 'fuzzy',
    label: 'Fuzzy Match',
    description: 'Finds similar words (1-2 character difference)',
    apply: (content, query) => {
      const words = content.toLowerCase().split(/\s+/);
      return words.some(w => levenshtein(w, query.toLowerCase()) <= Math.max(1, Math.floor(query.length/4)));
    },
  },
  {
    id: 'contains-all',
    label: 'Contains All Words',
    description: 'File must contain every word in query',
    apply: (content, query) => query.split(/\s+/).every(w => content.toLowerCase().includes(w.toLowerCase())),
  },
  {
    id: 'contains-any',
    label: 'Contains Any Word',
    description: 'File must contain at least one word from query',
    apply: (content, query) => query.split(/\s+/).some(w => content.toLowerCase().includes(w.toLowerCase())),
  },
  {
    id: 'exclude',
    label: 'Exclude Term',
    description: 'Files that do NOT contain the query',
    apply: (content, query) => !content.toLowerCase().includes(query.toLowerCase()),
  },
  {
    id: 'near',
    label: 'Words Near Each Other',
    description: 'Query words appear within 10 words of each other',
    apply: (content, query) => {
      const qWords = query.toLowerCase().split(/\s+/);
      if (qWords.length < 2) return content.toLowerCase().includes(query.toLowerCase());
      const cWords = content.toLowerCase().split(/\s+/);
      const positions = qWords.map(qw => cWords.map((w,i)=>w.includes(qw)?i:-1).filter(i=>i>=0));
      return positions[0].some(p0 => positions.slice(1).every(pos => pos.some(p=>Math.abs(p-p0)<=10)));
    },
  },
  {
    id: 'high-frequency',
    label: 'High Frequency Words',
    description: 'Query word appears 5+ times in file',
    apply: (content, query) => (content.toLowerCase().split(query.toLowerCase()).length - 1) >= 5,
  },
  {
    id: 'issues-only',
    label: 'Issues Only',
    description: 'Only search in files with high-impact issues',
    apply: (_, query) => true, // handled by pre-filter in search logic
  },
  {
    id: 'numeric',
    label: 'Contains Numbers',
    description: 'Files containing numeric values matching query context',
    apply: (content, query) => {
      const nums = content.match(/\d+(\.\d+)?/g) || [];
      return nums.some(n => n.includes(query)) || content.toLowerCase().includes(query.toLowerCase());
    },
  },
  {
    id: 'url',
    label: 'URL / Link Match',
    description: 'Find files containing URLs or links',
    apply: (content, query) => {
      const urlRegex = /https?:\/\/[^\s]+/gi;
      const urls = content.match(urlRegex) || [];
      return urls.some(u => u.toLowerCase().includes(query.toLowerCase())) || content.toLowerCase().includes(query.toLowerCase());
    },
  },
  {
    id: 'email',
    label: 'Email Address',
    description: 'Find files containing email addresses',
    apply: (content, query) => {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = content.match(emailRegex) || [];
      return emails.some(e => e.toLowerCase().includes(query.toLowerCase())) || /\S+@\S+\.\S+/.test(content);
    },
  },
  {
    id: 'long-lines',
    label: 'Long Lines (80+ chars)',
    description: 'Files with lines exceeding 80 characters',
    apply: (content, query) => content.split('\n').some(l => l.length >= 80 && l.toLowerCase().includes(query.toLowerCase())),
  },
  {
    id: 'positive-sentiment',
    label: 'Positive Context',
    description: 'Query appears near positive words',
    apply: (content, query) => {
      const idx = content.toLowerCase().indexOf(query.toLowerCase());
      if (idx < 0) return false;
      const window = content.toLowerCase().slice(Math.max(0,idx-100), idx+100);
      return [...POSITIVE_WORDS].some(w => window.includes(w));
    },
  },
  {
    id: 'negative-sentiment',
    label: 'Negative/Error Context',
    description: 'Query appears near error/negative words',
    apply: (content, query) => {
      const idx = content.toLowerCase().indexOf(query.toLowerCase());
      if (idx < 0) return false;
      const window = content.toLowerCase().slice(Math.max(0,idx-100), idx+100);
      return [...NEGATIVE_WORDS].some(w => window.includes(w));
    },
  },
  {
    id: 'dense-occurrence',
    label: 'Dense Occurrence',
    description: 'Query appears multiple times close together',
    apply: (content, query) => {
      const lc = content.toLowerCase();
      const q = query.toLowerCase();
      let count = 0, pos = 0;
      while ((pos = lc.indexOf(q, pos)) !== -1) { count++; pos += q.length; }
      return count >= 3;
    },
  },
];

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({length:a.length+1},(_,i)=>Array.from({length:b.length+1},(_,j)=>i===0?j:j===0?i:0));
  for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) {
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  }
  return dp[a.length][b.length];
}

// ============================================================
// SEARCH ENGINE
// ============================================================
export function searchFiles(
  files: AnalyzedFile[],
  query: string,
  activeFilters: string[],
  snippetLength: number = 80
): SearchResult[] {
  if (!query.trim() || !files.length) return [];

  const results: SearchResult[] = [];
  const filtersToApply = activeFilters.length > 0
    ? SEARCH_FILTERS.filter(f => activeFilters.includes(f.id))
    : [SEARCH_FILTERS[1]]; // default: case-insensitive

  // issues-only pre-filter
  const issuesOnly = activeFilters.includes('issues-only');

  for (const file of files) {
    const targetFiles = issuesOnly && file.stats.issues.length === 0 ? null : file;
    if (!targetFiles) continue;

    const matches = filtersToApply.filter(f => f.id !== 'issues-only').every(f => f.apply(file.content, query));
    if (!matches) continue;

    // Count occurrences
    const lc = file.content.toLowerCase();
    const q = query.toLowerCase();
    let matchCount = 0, pos = 0;
    const matchPositions: number[] = [];
    while ((pos = lc.indexOf(q, pos)) !== -1) { matchCount++; matchPositions.push(pos); pos += q.length; }

    // Snippets (up to 3)
    const snippets: string[] = matchPositions.slice(0, 3).map(mp => {
      const start = Math.max(0, mp - Math.floor(snippetLength/2));
      const end = Math.min(file.content.length, mp + query.length + Math.floor(snippetLength/2));
      return (start > 0 ? '…' : '') + file.content.slice(start, end) + (end < file.content.length ? '…' : '');
    });

    const relevanceScore = matchCount + (file.stats.issues.length > 0 ? 5 : 0);

    results.push({ file, matchCount, snippets, matchPositions, relevanceScore });
  }

  return results.sort((a,b) => b.relevanceScore - a.relevanceScore);
}

// ============================================================
// GLOBAL METRICS
// ============================================================
export function computeGlobalMetrics(files: AnalyzedFile[], stopwordsEnabled: boolean) {
  const allIssues = files.reduce((s,f)=>s+f.stats.issues.length,0);
  const mergedFreq: Record<string,number> = {};
  files.forEach(f => {
    Object.entries(f.wordFreqMap).forEach(([w,c]) => {
      if (!stopwordsEnabled || !STOPWORDS.has(w)) {
        mergedFreq[w] = (mergedFreq[w]||0)+c;
      }
    });
  });
  const indexTerms = Object.keys(mergedFreq).length;
  const topGlobalWords: WordFreq[] = Object.entries(mergedFreq)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,15)
    .map(([word,count])=>({word,count}));
  return { totalIssues: allIssues, indexTerms, topGlobalWords, mergedFreq };
}

// ============================================================
// EXPORT
// ============================================================
export function exportSession(files: AnalyzedFile[], format: 'json'|'csv'|'txt'): string {
  if (format === 'json') {
    return JSON.stringify(files.map(f=>({
      name:f.name, size:f.size, uploadedAt:f.uploadedAt,
      wordCount:f.stats.wordCount, lineCount:f.stats.lineCount,
      issues:f.stats.issues.length, sentiment:f.stats.sentiment.overall,
      readability:f.stats.readability.grade, topWords:f.stats.topWords.slice(0,5),
    })),null,2);
  }
  if (format === 'csv') {
    const header = 'Name,Size(B),Words,Lines,Issues,Sentiment,Readability\n';
    const rows = files.map(f=>
      `${f.name},${f.size},${f.stats.wordCount},${f.stats.lineCount},${f.stats.issues.length},${f.stats.sentiment.overall},${f.stats.readability.grade}`
    ).join('\n');
    return header+rows;
  }
  return files.map(f=>`=== ${f.name} ===\nWords: ${f.stats.wordCount} | Lines: ${f.stats.lineCount} | Issues: ${f.stats.issues.length}\n`).join('\n');
}

export { STOPWORDS };
