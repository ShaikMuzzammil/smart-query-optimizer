// ============================================================
// Smart Query Optimizer — Global TypeScript Types
// ============================================================

export type DbType =
  | 'postgresql'
  | 'mysql'
  | 'sqlserver'
  | 'mongodb'
  | 'sqlite'
  | 'oracle'
  | 'cockroachdb'
  | 'supabase';

export type OptimizationGoal = 'speed' | 'cost' | 'readability' | 'balanced';

export type WizardStep = 1 | 2 | 3;

// ─── Optimizer ─────────────────────────────────────────────

export interface OptimizeRequest {
  query: string;
  dbType: DbType;
  dbVersion?: string;
  schema?: string;
  optimizationGoal: OptimizationGoal;
  naturalLanguage?: string;
  options: {
    temperature: number;
    includeExplain: boolean;
    includeIndexes: boolean;
  };
}

export interface IndexSuggestion {
  sql: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

export interface OptimizationMetrics {
  estimatedImprovement: number;
  beforeCost: number;
  afterCost: number;
  estimatedExecMs: number;
  rowsAffected?: number;
  indexesUsed?: string[];
}

export interface OptimizeResult {
  originalQuery: string;
  optimizedQuery: string;
  explanation: string;
  indexSuggestions: IndexSuggestion[];
  metrics: OptimizationMetrics;
  explainAnalysis?: string;
  queryComplexity?: 'simple' | 'moderate' | 'complex' | 'very_complex';
  warnings?: string[];
  sessionId: string;
  createdAt: string;
}

export interface OptimizeResponse {
  success: boolean;
  data?: OptimizeResult;
  error?: string;
  rateLimitRemaining?: number;
}

// ─── Wizard State ──────────────────────────────────────────

export interface WizardState {
  step: WizardStep;
  formData: Partial<OptimizeRequest>;
  result: OptimizeResult | null;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
}

// ─── History ───────────────────────────────────────────────

export interface HistoryItem {
  _id: string;
  originalQuery: string;
  optimizedQuery: string;
  dbType: DbType;
  optimizationGoal: OptimizationGoal;
  metrics: OptimizationMetrics;
  createdAt: string;
  sessionId: string;
}

export interface HistoryResponse {
  success: boolean;
  data?: {
    items: HistoryItem[];
    total: number;
    page: number;
    pages: number;
    perPage: number;
  };
  error?: string;
}

// ─── Contact ───────────────────────────────────────────────

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  category: 'general' | 'bug' | 'feature' | 'billing' | 'enterprise';
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ─── Examples ──────────────────────────────────────────────

export interface QueryExample {
  id: string;
  title: string;
  description: string;
  category: 'performance' | 'joins' | 'aggregation' | 'subquery' | 'indexing' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  dbType: DbType;
  badge: string;
  query: string;
  schema?: string;
  optimizationGoal: OptimizationGoal;
  expectedImprovement: number;
  tags: string[];
}

// ─── UI Components ─────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  isNew?: boolean;
}

export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlight?: string;
  color?: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
  rating: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number | 'Custom';
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  badge?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

// ─── API Health ────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: 'connected' | 'disconnected' | 'error';
    ai: 'available' | 'unavailable';
    email: 'available' | 'unavailable';
  };
}
