import { env } from '../env';
import { logger } from '../logger';

export interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function aiEnabled(): boolean {
  const k = (env.AI_API_KEY || '').trim();
  return k.length > 0 && !k.includes('replace_me');
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Call an OpenAI-compatible chat endpoint (Groq by default, or Ollama/OpenRouter).
 * Returns null on ANY failure so callers can fall back to deterministic text.
 */
export async function aiChat(
  messages: ChatMsg[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string | null> {
  if (!aiEnabled()) return null;
  const url = `${env.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`;
  const body = {
    model: env.AI_MODEL,
    messages,
    temperature: opts.temperature ?? 0.6,
    max_tokens: opts.maxTokens ?? 600,
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.AI_API_KEY}`,
          },
          body: JSON.stringify(body),
        },
        20000
      );
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        logger.warn(`AI HTTP ${res.status}: ${text.slice(0, 200)}`);
      } else {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch (err) {
      logger.warn(`AI call failed (attempt ${attempt}): ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 500 * attempt));
  }
  return null;
}

export { aiEnabled };
