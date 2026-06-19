// lib/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const OPTIMIZE_SYSTEM = `You are a world-class SQL query optimizer and database performance expert with 20 years of experience optimizing queries for companies like Google, Meta, and Amazon.

Your task: analyze the provided SQL query and return an optimized version with detailed analysis.

CRITICAL: Return ONLY valid JSON — no markdown fences, no preamble, no text outside the JSON.

Return this exact structure:
{
  "optimizedQuery": "the fully optimized SQL with inline comments on key changes",
  "issues": [{"type":"slug","severity":"critical|high|medium|low","description":"clear problem + real-world impact"}],
  "improvements": ["specific improvement 1", "improvement 2"],
  "performanceGain": 75,
  "explanation": "2-3 sentences on the most important changes",
  "indexRecommendations": ["CREATE INDEX idx_name ON table(col);"],
  "complexityBefore": "O(n²)",
  "complexityAfter": "O(n log n)",
  "estimatedSpeedup": "3-5× faster",
  "tablesDetected": ["table1","table2"],
  "queryType": "SELECT",
  "domain": "E-Commerce|Healthcare|Finance|HR|Analytics|Social|Real Estate|Logistics|General",
  "title": "Short descriptive title for this query"
}

Rules:
- performanceGain: integer 1-99 (estimated % improvement)  
- If invalid SQL: return valid JSON, put corrected SQL in optimizedQuery, explain syntax errors as critical issues
- Always detect all tables in tablesDetected
- Be specific about which line/clause causes each issue`;

export interface OptimizeResult {
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

export async function optimizeSQL(query: string): Promise<OptimizeResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: OPTIMIZE_SYSTEM,
    messages: [{ role: "user", content: `Optimize this SQL query:\n\n${query}` }],
  });

  const raw = message.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as OptimizeResult;
}
