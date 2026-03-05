export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * Bankr Payroll Proxy
 *
 * POST /api/payroll/bankr
 * Body: { apiKey, prompt, agentName, amount, token }
 *
 * Forwards to Bankr using apiKey from request body.
 * apiKey is NEVER stored — used only for this request then discarded.
 */

const BANKR_API = 'https://api.bankr.bot/agent';

async function pollJob(jobId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(`${BANKR_API}/job/${jobId}`, {
      headers: { 'X-API-Key': apiKey },
    });
    const job = await res.json();
    if (job.status === 'completed') {
      const text: string = job.response || '';
      const match = text.match(/0x[a-fA-F0-9]{64}/);
      return match ? match[0] : '';
    }
    if (job.status === 'failed') throw new Error(job.error || 'Bankr job failed');
  }
  throw new Error('Bankr job timed out');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, prompt, agentName, amount, token } = body;

    if (!apiKey || !prompt) {
      return NextResponse.json({ error: 'Missing apiKey or prompt' }, { status: 400 });
    }

    if (!apiKey.startsWith('bk_')) {
      return NextResponse.json({ error: 'Invalid Bankr API key format' }, { status: 400 });
    }

    // Forward to Bankr — key used here only, never stored
    const submitRes = await fetch(`${BANKR_API}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      throw new Error(`Bankr error ${submitRes.status}: ${err}`);
    }

    const { jobId } = await submitRes.json();
    if (!jobId) throw new Error('No jobId from Bankr');

    const txHash = await pollJob(jobId, apiKey);

    return NextResponse.json({
      success: true,
      txHash,
      basescanUrl: txHash ? `https://basescan.org/tx/${txHash}` : undefined,
      agentName,
      amount,
      token,
    });

  } catch (error: any) {
    console.error('Payroll error:', error.message);
    return NextResponse.json({ error: error.message || 'Payment failed' }, { status: 500 });
  }
}
