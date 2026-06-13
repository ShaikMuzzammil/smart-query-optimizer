import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let client: GoogleGenerativeAI | null = null;
if (apiKey) {
  client = new GoogleGenerativeAI(apiKey);
}

export function isAiConfigured(): boolean {
  return !!client;
}

/**
 * Generic text generation call. Returns `null` if AI is not configured or
 * the call fails - callers must implement non-AI fallback logic.
 */
export async function generateText(prompt: string, opts?: { maxOutputTokens?: number; temperature?: number }): Promise<string | null> {
  if (!client) return null;
  try {
    const model = client.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        maxOutputTokens: opts?.maxOutputTokens ?? 512,
        temperature: opts?.temperature ?? 0.4,
      },
    });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('[gemini] generateText error', err);
    return null;
  }
}

/**
 * Requests a JSON object from Gemini and parses it. Strips markdown code
 * fences if present. Returns `null` on any failure.
 */
export async function generateJSON<T = any>(prompt: string, opts?: { maxOutputTokens?: number }): Promise<T | null> {
  const text = await generateText(
    `${prompt}\n\nRespond with ONLY valid JSON. No markdown, no code fences, no commentary.`,
    { maxOutputTokens: opts?.maxOutputTokens ?? 512, temperature: 0.2 }
  );
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('[gemini] JSON parse error', err, text);
    return null;
  }
}
