export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * Payroll via Bankr Agent API
 *
 * POST /api/payroll/bankr
 * Body: { prompt, agentName, amount, token, toAddress }
 *
 * Uses Bankr's natural language prompt API to execute a transfer.
 * Bankr handles wallet, gas, and transaction signing.
 */

const BANKR_API_URL = 'https://api.bankr.bot/agent';

async function pollJob(jobId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(`${BANKR_API_URL}/job/${jobId}`, {
      headers: { 'X-API-Key': apiKey },
    });
    const job = await res.json();

    if (job.status === 'completed') {
      // Extract tx hash from response text
      const text: string = job.response || '';
      const match = text.match(/0x[a-fA-F0-9]{64}/);
      return match ? match[0] : '';
    }

    if (job.status === 'failed') {
      throw new Error(job.error || 'Bankr job failed');
    }
  }
  throw new Error('Bankr job timed out');
}

export async function POST(request: Request) {
  const apiKey = process.env.BANKR_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'BANKR_API_KEY not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { prompt, agentName, amount, token, toAddress } = body;

    if (!prompt || !toAddress || !amount || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Submit prompt to Bankr
    const submitRes = await fetch(`${BANKR_API_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      throw new Error(`Bankr submit error: ${submitRes.status} — ${err}`);
    }

    const { jobId } = await submitRes.json();
    if (!jobId) throw new Error('No jobId returned from Bankr');

    // Poll for result
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
    console.error('Bankr payroll error:', error);
    return NextResponse.json({ error: error.message || 'Payment failed' }, { status: 500 });
  }
}
