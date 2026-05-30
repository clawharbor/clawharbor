/**
 * Surplus Intelligence LLM Client
 *
 * OpenAI-compatible client for https://www.surplusintelligence.ai
 * Used as an alternative/fallback LLM provider throughout clawharbor.
 *
 * Environment variables:
 *   SURPLUS_API_KEY  — required, your Surplus Intelligence API key
 *   SURPLUS_MODEL    — optional, defaults to "claude-haiku-4-5-20251001"
 *
 * Usage:
 *   import { surplusChat } from '../../../lib/surplus-llm';
 *   const text = await surplusChat([{ role: 'user', content: 'Hello' }]);
 */

export interface SurplusMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SurplusOptions {
  /** Override the model for this call only. */
  model?: string;
  /** Max tokens to generate. Defaults to 1000. */
  max_tokens?: number;
  /** Timeout in milliseconds. Defaults to 30_000. */
  timeoutMs?: number;
}

const SURPLUS_BASE_URL = 'https://api.surplusintelligence.ai';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const DEFAULT_MAX_TOKENS = 1000;
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Returns true when a Surplus API key is configured.
 * Use this to skip Surplus calls when unconfigured rather than erroring.
 */
export function isSurplusConfigured(): boolean {
  return typeof process.env.SURPLUS_API_KEY === 'string' &&
    process.env.SURPLUS_API_KEY.trim().length > 0;
}

/**
 * Send a chat completion request to Surplus Intelligence.
 *
 * Returns the assistant's text on success.
 * Throws an Error on network failure or non-2xx response.
 */
export async function surplusChat(
  messages: SurplusMessage[],
  options: SurplusOptions = {},
): Promise<string> {
  const apiKey = process.env.SURPLUS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'SURPLUS_API_KEY is not set. Add it to your .env.local file.',
    );
  }

  const model =
    options.model ??
    (process.env.SURPLUS_MODEL?.trim() || DEFAULT_MODEL);
  const max_tokens = options.max_tokens ?? DEFAULT_MAX_TOKENS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${SURPLUS_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, max_tokens, messages }),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Surplus Intelligence request failed: ${message}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      // ignore
    }
    throw new Error(
      `Surplus Intelligence API error ${response.status}: ${detail}`,
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('Surplus Intelligence returned invalid JSON');
  }

  // OpenAI-compatible response shape:
  // { choices: [{ message: { content: string } }] }
  const text =
    (data as any)?.choices?.[0]?.message?.content;

  if (typeof text !== 'string') {
    throw new Error(
      'Surplus Intelligence response missing choices[0].message.content',
    );
  }

  return text;
}
