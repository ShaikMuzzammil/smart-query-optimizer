import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
    openaiClient = new OpenAI({ apiKey, timeout: 30_000, maxRetries: 2 });
  }
  return openaiClient;
}

export const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
