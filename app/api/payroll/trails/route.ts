export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * Trails Cross-Chain Payroll Proxy
 *
 * POST /api/payroll/trails
 *
 * Four actions in one route, selected by `action` field:
 *
 * 1. action: "get-wallet"
 *    Body: { bankrApiKey }
 *    -> Proxies api.bankr.bot/agent/me to fetch the EVM wallet address.
 *       MUST be server-side because Bankr does not send CORS headers,
 *       so a direct browser fetch fails with "Failed to fetch".
 *
 * 2. action: "quote"
 *    Body: { trailsApiKey, ownerAddress, originChainId, originTokenAddress,
 *            originTokenAmount, destinationChainId, destinationTokenAddress,
 *            destinationToAddress, slippageTolerance }
 *    -> Returns the Trails intent + depositTransaction (no commitment yet)
 *
 * 3. action: "execute"
 *    Body: { trailsApiKey, intent, bankrApiKey, agentName, amount, token }
 *    -> Commits the intent, sends the depositTransaction via Bankr's prompt API,
 *       then notifies Trails (ExecuteIntent) and polls WaitIntentReceipt.
 *
 * 4. action: "earn-pools"
 *    Body: { trailsApiKey, chainIds }
 *    -> Read-only: discovers active yield pools (Aave, Morpho) for display.
 *
 * SECURITY: API keys (Trails + Bankr) are received per-request and used only
 * for that request. They are NEVER stored server-side. This mirrors the same
 * pattern used in /api/payroll/bankr/route.ts.
 */

const TRAILS_API = 'https://trails-api.sequence.app/rpc/Trails';
const BANKR_API = 'https://api.bankr.bot/agent';

// ─── Trails RPC helper ───────────────────────────────────────────────────────

async function callTrails(method: string, apiKey: string, body: any): Promise<any> {
  const res = await fetch(`${TRAILS_API}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Key': apiKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Trails ${method} failed (${res.status}): ${errText}`);
  }
  return res.json();
}

// ─── Bankr job poller (same shape as /api/payroll/bankr) ─────────────────────

async function pollBankrJob(jobId: string, apiKey: string): Promise<string> {
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

// ─── Wait for Trails intent to settle ────────────────────────────────────────

async function waitForIntent(intentId: string, apiKey: string, maxAttempts = 60): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const r = await callTrails('WaitIntentReceipt', apiKey, { intentId });
    if (r.done) return r.intentReceipt;
    await new Promise(res => setTimeout(res, 3000));
  }
  throw new Error('Trails intent did not settle in time');
}

// ─── Action handlers ─────────────────────────────────────────────────────────

async function handleGetWallet(body: any) {
  const { bankrApiKey } = body;
  if (!bankrApiKey) {
    return NextResponse.json({ error: 'Missing bankrApiKey' }, { status: 400 });
  }
  if (!bankrApiKey.startsWith('bk_')) {
    return NextResponse.json({ error: 'Invalid Bankr API key format' }, { status: 400 });
  }

  const res = await fetch(`${BANKR_API}/me`, {
    headers: { 'X-API-Key': bankrApiKey },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return NextResponse.json(
      { error: `Bankr returned ${res.status}: ${errText || 'unauthorized?'}` },
      { status: res.status === 401 || res.status === 403 ? res.status : 502 },
    );
  }
  const data = await res.json();
  const evmWallet = (data.wallets || []).find((w: any) => w.chain === 'evm');
  if (!evmWallet?.address) {
    return NextResponse.json({ error: 'No EVM wallet found in Bankr account' }, { status: 404 });
  }
  return NextResponse.json({ success: true, address: evmWallet.address });
}

async function handleQuote(body: any) {
  const {
    trailsApiKey,
    ownerAddress,
    originChainId,
    originTokenAddress,
    originTokenAmount,
    destinationChainId,
    destinationTokenAddress,
    destinationToAddress,
    slippageTolerance = 0.005,
  } = body;

  if (!trailsApiKey || !ownerAddress || !originChainId || !destinationChainId) {
    return NextResponse.json({ error: 'Missing required quote parameters' }, { status: 400 });
  }

  const quoteBody: any = {
    ownerAddress,
    originChainId,
    originTokenAddress,
    originTokenAmount,
    destinationChainId,
    destinationTokenAddress,
    destinationTokenAmount: '0',
    tradeType: 'EXACT_INPUT',
    options: { slippageTolerance },
  };
  if (destinationToAddress) {
    quoteBody.destinationToAddress = destinationToAddress;
  }

  const result = await callTrails('QuoteIntent', trailsApiKey, quoteBody);
  return NextResponse.json({
    success: true,
    intent: result.intent,
    quote: result.intent?.quote,
    depositTransaction: result.intent?.depositTransaction,
  });
}

async function handleExecute(body: any) {
  const {
    trailsApiKey,
    intent,
    bankrApiKey,
    agentName,
    amount,
    token,
  } = body;

  if (!trailsApiKey || !intent || !bankrApiKey) {
    return NextResponse.json({ error: 'Missing trailsApiKey, intent, or bankrApiKey' }, { status: 400 });
  }
  if (!bankrApiKey.startsWith('bk_')) {
    return NextResponse.json({ error: 'Invalid Bankr API key format' }, { status: 400 });
  }

  // Step 1: Commit the intent with Trails
  const commit = await callTrails('CommitIntent', trailsApiKey, { intent });
  const intentId = commit.intentId;
  if (!intentId) throw new Error('Trails did not return intentId');

  // Step 2: Submit the deposit transaction via Bankr's natural-language prompt API.
  //
  // We use the prompt API (not the @bankr/cli submit() function) because:
  //   (a) it's already a working pattern in this codebase (see /api/payroll/bankr),
  //   (b) it requires no extra npm dependencies, and
  //   (c) Bankr internally handles signing + broadcasting.
  //
  // The prompt instructs Bankr to send the exact raw transaction returned by Trails.
  const dt = intent.depositTransaction;
  const valueDesc = dt.value && dt.value !== '0' ? ` with value ${dt.value} wei` : '';
  const prompt =
    `Send an on-chain transaction on chainId ${dt.chainId} ` +
    `to contract address ${dt.to}${valueDesc} with calldata ${dt.data}. ` +
    `This is a Trails cross-chain swap deposit for agent payroll (${agentName}, ${amount} ${token}).`;

  const submitRes = await fetch(`${BANKR_API}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': bankrApiKey },
    body: JSON.stringify({ prompt }),
  });
  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Bankr submit error ${submitRes.status}: ${err}`);
  }
  const { jobId } = await submitRes.json();
  if (!jobId) throw new Error('No jobId from Bankr');
  const txHash = await pollBankrJob(jobId, bankrApiKey);
  if (!txHash) throw new Error('Bankr did not return a transaction hash');

  // Step 3: Notify Trails the deposit is mined
  await callTrails('ExecuteIntent', trailsApiKey, {
    intentId,
    depositTransactionHash: txHash,
  });

  // Step 4: Poll until the cross-chain intent settles
  const receipt = await waitForIntent(intentId, trailsApiKey);

  return NextResponse.json({
    success: true,
    intentId,
    depositTxHash: txHash,
    basescanUrl: txHash ? `https://basescan.org/tx/${txHash}` : undefined,
    intentStatus: receipt?.status,
    receipt,
    agentName,
    amount,
    token,
  });
}

async function handleEarnPools(body: any) {
  const { trailsApiKey, chainIds } = body;
  if (!trailsApiKey) {
    return NextResponse.json({ error: 'Missing trailsApiKey' }, { status: 400 });
  }
  const result = await callTrails('GetEarnPools', trailsApiKey, {
    chainIds: chainIds && chainIds.length > 0 ? chainIds : [8453, 137], // default Base + Polygon
  });
  // Filter to active pools only, sorted by APY desc
  const pools = (result.pools || [])
    .filter((p: any) => p.isActive)
    .sort((a: any, b: any) => (b.apy || 0) - (a.apy || 0));
  return NextResponse.json({ success: true, pools });
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'get-wallet') return await handleGetWallet(body);
    if (action === 'quote') return await handleQuote(body);
    if (action === 'execute') return await handleExecute(body);
    if (action === 'earn-pools') return await handleEarnPools(body);

    return NextResponse.json(
      { error: `Unknown action: ${action}. Expected 'get-wallet', 'quote', 'execute', or 'earn-pools'.` },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('Trails proxy error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Trails request failed' },
      { status: 500 },
    );
  }
}
