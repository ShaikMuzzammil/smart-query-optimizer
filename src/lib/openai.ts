import OpenAI from 'openai';
let client: OpenAI | null = null;
export function getAI() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45_000, maxRetries: 2 });
  }
  return client;
}
export const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
