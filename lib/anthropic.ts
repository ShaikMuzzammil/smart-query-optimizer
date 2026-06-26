// lib/anthropic.ts — safe wrapper (Anthropic is optional; Gemini is primary)
import Anthropic from "@anthropic-ai/sdk";

// Only initialise if the key is actually configured — prevents crash on Vercel
// when ANTHROPIC_API_KEY is absent
export const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export class AiParseError extends Error {}

export interface OptimizeResult {
  isValidSql: boolean;
  optimizedQuery: string;
  issues: Array<{ type: string; severity: string; description: string }>;
  improvements: string[];
  performanceGain: number;
  explanation: string;
  indexRecommendations: string[];
  complexityBefore: string;
  complexityAfter: string;
  estimatedSpeedup: string;
  tablesDetected: string[];
  queryType: string;
  domain: string;
  title: string;
}

// Re-export a safe OPTIMIZE_SYSTEM so legacy imports don't break
export const OPTIMIZE_SYSTEM = "";
