export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { surplusChat, isSurplusConfigured } from '../../../../lib/surplus-llm';

/**
 * Surplus Intelligence Status & Test Endpoint
 *
 * GET  /api/office/surplus  — Returns whether Surplus is configured + the model in use
 * POST /api/office/surplus  — Sends a test ping to Surplus to verify the key works
 */

export async function GET(request: Request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const configured = isSurplusConfigured();
  const model = process.env.SURPLUS_MODEL?.trim() || 'claude-haiku-4-5-20251001';

  return NextResponse.json({ configured, model });
}

export async function POST(request: Request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  if (!isSurplusConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'SURPLUS_API_KEY is not set' },
      { status: 400 },
    );
  }

  try {
    const reply = await surplusChat(
      [{ role: 'user', content: 'Reply with exactly: pong' }],
      { max_tokens: 10 },
    );

    return NextResponse.json({ ok: true, reply: reply.trim() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
