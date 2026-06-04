// lib/types.ts

export interface WordFreq {
  word: string;
  count: number;
  percentage: number;
}

export interface Bigram {
  phrase: string;
  count: number;
}

export interface Issue {
  keyword: string;
  count: number;
  positions: number[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  lineNumbers: number[];
}

export interface ReadabilityScore {
  score: number;
  level: 'Very Easy' | 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  avgWordsPerSentence: number;
  avgCharsPerWord: number;
  sentenceCount: number;
}

export interface SentimentScore {
  score: number;
  label: 'Very Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Very Negative';
  positiveCount: number;
  negativeCount: number;
  positiveWords: string[];
  negativeWords: string[];
}

export interface FileAnalysis {
  wordCount: number;
  uniqueWordCount: number;
  lineCount: number;
  charCount: number;
  charCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerLine: number;
  lexicalDensity: number;
  topWords: WordFreq[];
  topBigrams: Bigram[];
  issues: Issue[];
  readability: ReadabilityScore;
  sentiment: SentimentScore;
  mostUnusualWord: string;
  longestWord: string;
  shortestWord: string;
  urlCount: number;
  emailCount: number;
  numberCount: number;
}

export interface FileData {
  id: string;
  name: string;
  size: number;
  content: string;
  uploadedAt: number;
  queryCount: number;
  analysis: FileAnalysis;
  tags: string[];
}

export interface SearchFilter {
  caseSensitive: boolean;
  wholeWord: boolean;
  fuzzy: boolean;
  regex: boolean;
  proximitySearch: boolean;
  proximityDistance: number;
  bm25Scoring: boolean;
  urlOnly: boolean;
  emailOnly: boolean;
  numberOnly: boolean;
  highIssuesOnly: boolean;
  minWordCount: number;
  maxWordCount: number;
  searchInName: boolean;
  searchInContent: boolean;
  highlightAll: boolean;
  snippetLength: number;
  maxResults: number;
  sortBy: 'relevance' | 'name' | 'matches' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
}

export interface SearchMatch {
  start: number;
  end: number;
  snippet: string;
  lineNumber: number;
  score: number;
}

export interface SearchResult {
  file: FileData;
  matches: SearchMatch[];
  totalMatches: number;
  bm25Score: number;
  snippets: string[];
}

export interface SearchEntry {
  id: string;
  query: string;
  filters: SearchFilter;
  resultCount: number;
  timestamp: number;
  filesSearched: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  duration: number;
}

export interface AppSettings {
  filterStopwords: boolean;
  caseSensitiveSearch: boolean;
  minWordLength: number;
  theme: 'dark';
  accentColor: string;
  showReadability: boolean;
  showSentiment: boolean;
  showBigrams: boolean;
  autoSearch: boolean;
  maxFileSizeMB: number;
  exportFormat: 'json' | 'csv' | 'txt';
  notificationsEnabled: boolean;
  animationsEnabled: boolean;
  compactMode: boolean;
  keyboardShortcuts: boolean;
  defaultSearchFilters: Partial<SearchFilter>;
}

export interface AppState {
  files: FileData[];
  searchHistory: SearchEntry[];
  totalQueries: number;
  notifications: Notification[];
  settings: AppSettings;
  activeSection: string;
  isLoading: boolean;
  loadingMessage: string;
}

export type AppAction =
  | { type: 'ADD_FILE'; file: FileData }
  | { type: 'DELETE_FILE'; id: string }
  | { type: 'UPDATE_FILE_QUERY_COUNT'; id: string }
  | { type: 'ADD_SEARCH'; entry: SearchEntry }
  | { type: 'INCREMENT_QUERIES'; count?: number }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'REMOVE_NOTIFICATION'; id: string }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'SET_ACTIVE_SECTION'; section: string }
  | { type: 'SET_LOADING'; isLoading: boolean; message?: string }
  | { type: 'CLEAR_SESSION' }
  | { type: 'LOAD_STATE'; state: Partial<AppState> };
