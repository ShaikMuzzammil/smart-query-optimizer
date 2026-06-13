export interface ClientFile {
  id: string;
  fileName: string;
  fileType: 'txt' | 'pdf' | 'docx' | 'md';
  wordCount: number;
  charCount: number;
  status: 'queued' | 'processing' | 'indexed' | 'failed';
  errorMessage?: string;
  analysis?: {
    keywords: { term: string; score: number }[];
    entities: { text: string; type: string }[];
    sentiment: { score: number; comparative: number; label: 'positive' | 'negative' | 'neutral' };
    readability: { fleschKincaid: number; colemanLiau: number; gradeLevel: string };
    issues: string[];
  };
  summary?: string;
  tags: string[];
  pinned: boolean;
  queryCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResultItem {
  id: string;
  fileName: string;
  score: number;
  rawBm25: number;
  recencyBoost: number;
  personalBoost: number;
  termContributions: { term: string; tf: number; idf: number; contribution: number }[];
  snippet: string;
  matchedTerms: string[];
  uploadDate: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  optimizer: {
    originalQuery: string;
    correctedQuery: string;
    expandedTerms: string[];
    synonymsUsed: string[];
    rankingStrategy: string;
    didYouMean: boolean;
    aiAssisted: boolean;
    estimatedResults: number;
  };
  durationMs: number;
}

export interface AnalyticsResponse {
  totals: {
    filesIndexed: number;
    totalQueries: number;
    indexTerms: number;
    highImpactIssues: number;
    avgReadabilityGrade: string;
  };
  queriesOverTime: { date: string; count: number }[];
  fileGrowth: { date: string; count: number }[];
  topTerms: { term: string; score: number }[];
  sentimentTrend: { date: string; positive: number; negative: number; neutral: number }[];
  recentQueries: { query: string; correctedQuery?: string; resultCount: number; createdAt: string }[];
  topFiles: { fileName: string; queryCount: number; id: string }[];
}

export interface NotificationItem {
  id: string;
  type: 'upload' | 'search' | 'ai' | 'system' | 'achievement';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  stopwordsEnabled: boolean;
  caseSensitiveSearch: boolean;
  defaultResultCount: number;
  fuzzySearch: boolean;
}
