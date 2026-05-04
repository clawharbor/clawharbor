'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Agent } from './types';

/**
 * Agent Payroll — Pay your AI agents in crypto on Base (or cross-chain via Trails)
 *
 * Three payment methods:
 * 1. Bankr — user inputs their own Bankr API key, stored in sessionStorage only.
 *            Request goes through /api/payroll/bankr; key is never persisted server-side.
 * 2. Wallet — user signs tx from their own wallet (MetaMask / Coinbase Wallet)
 * 3. Trails — pay from any token on any chain. Trails finds the optimal route
 *             (bridge + swap) and Bankr wallet broadcasts the deposit tx. Final
 *             token lands at the agent's wallet on Base.
 *
 * Supported tokens (Base): USDC, ETH, BNKR, HARBOR
 */

const BANKR_API = 'https://api.bankr.bot/agent';
const SESSION_KEY = 'clawharbor_bankr_key';
const TRAILS_KEY_SESSION = 'clawharbor_trails_key';

// ─── Token Config ─────────────────────────────────────────────────────────────

export const PAYROLL_TOKENS = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    decimals: 6,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    color: '#2775CA',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    decimals: 18,
    address: 'native',
    color: '#627EEA',
  },
  {
    symbol: 'BNKR',
    name: 'Bankr Token',
    icon: 'https://bankr.bot/bankr-symbol-full-color-rgb.svg',
    decimals: 18,
    address: '0x22aF33FE49fD1Fa80c7149773dDe5890D3c76F3b',
    color: '#F97316',
  },
  {
    symbol: 'HARBOR',
    name: 'Harbor Token',
    icon: 'https://cdn.dexscreener.com/cms/images/VGxBfMsGJrQJEkLg?width=64&height=64&fit=crop&quality=95&format=auto',
    decimals: 18,
    address: '0x4972e029F2E1831D205b20D05833CC771FEB2BA3',
    color: '#22c55e',
  },
] as const;

// ─── Trails source-chain presets ─────────────────────────────────────────────
// Where the user has funds NOW. Trails handles the route to Base automatically.

const TRAILS_SOURCE_CHAINS = [
  { id: 137, name: 'Polygon', usdc: '0x3c499c542cef5e3811e1192ce70d8cC03d5c3359', color: '#8247E5' },
  { id: 42161, name: 'Arbitrum', usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', color: '#28A0F0' },
  { id: 10, name: 'Optimism', usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', color: '#FF0420' },
  { id: 1, name: 'Ethereum', usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', color: '#627EEA' },
] as const;

export type PayrollToken = typeof PAYROLL_TOKENS[number];
export type TrailsSourceChain = typeof TRAILS_SOURCE_CHAINS[number];
export type PaymentMethod = 'bankr' | 'wallet' | 'trails';

export interface PayrollResult {
  success: boolean;
  txHash?: string;
  basescanUrl?: string;
  error?: string;
  method: PaymentMethod;
  agent: string;
  amount: string;
  token: string;
  intentId?: string;
  intentStatus?: string;
}

// ─── Bankr via Server Proxy ───────────────────────────────────────────────────
// API key sent per-request to our server proxy, never stored server-side

async function payViaBankr(
  apiKey: string,
  toAddress: string,
  amount: string,
  token: PayrollToken,
  agentName: string
): Promise<PayrollResult> {
  const prompt = token.symbol === 'ETH'
    ? `Send ${amount} ETH to ${toAddress} on Base. Payroll for AI agent ${agentName}.`
    : `Send ${amount} ${token.symbol} (contract: ${token.address}) to ${toAddress} on Base. Payroll for AI agent ${agentName}.`;

  const res = await fetch('/api/payroll/bankr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, prompt, agentName, amount, token: token.symbol }),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || 'Payment failed');

  return {
    success: true,
    txHash: data.txHash,
    basescanUrl: data.txHash ? `https://basescan.org/tx/${data.txHash}` : undefined,
    method: 'bankr',
    agent: agentName,
    amount,
    token: token.symbol,
  };
}

// ─── Trails via Server Proxy ─────────────────────────────────────────────────
// Two-step: quote (preview), then execute (commit + deposit + wait).
// Trails key is in sessionStorage. Bankr key is needed too because Bankr's wallet
// is the one signing the deposit transaction Trails returns.

interface TrailsQuote {
  intent: any;
  quote: { toAmount?: string; estimatedDuration?: number; [k: string]: any };
  depositTransaction: { to: string; chainId: number; data: string; value?: string };
}

async function quoteTrails(args: {
  trailsApiKey: string;
  bankrWallet: string;
  sourceChainId: number;
  sourceTokenAddress: string;
  sourceAmount: string;
  destinationToAddress: string;
  destinationTokenAddress: string;
}): Promise<TrailsQuote> {
  const res = await fetch('/api/payroll/trails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'quote',
      trailsApiKey: args.trailsApiKey,
      ownerAddress: args.bankrWallet,
      originChainId: args.sourceChainId,
      originTokenAddress: args.sourceTokenAddress,
      originTokenAmount: args.sourceAmount,
      destinationChainId: 8453, // Base
      destinationTokenAddress: args.destinationTokenAddress,
      destinationToAddress: args.destinationToAddress,
      slippageTolerance: 0.005,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || 'Quote failed');
  return { intent: data.intent, quote: data.quote, depositTransaction: data.depositTransaction };
}

async function executeTrails(args: {
  trailsApiKey: string;
  bankrApiKey: string;
  intent: any;
  agentName: string;
  amount: string;
  token: PayrollToken;
}): Promise<PayrollResult> {
  const res = await fetch('/api/payroll/trails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'execute',
      trailsApiKey: args.trailsApiKey,
      bankrApiKey: args.bankrApiKey,
      intent: args.intent,
      agentName: args.agentName,
      amount: args.amount,
      token: args.token.symbol,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || 'Trails execution failed');
  return {
    success: true,
    txHash: data.depositTxHash,
    basescanUrl: data.basescanUrl,
    method: 'trails',
    agent: args.agentName,
    amount: args.amount,
    token: args.token.symbol,
    intentId: data.intentId,
    intentStatus: data.intentStatus,
  };
}

// Look up the Bankr wallet address from the user's Bankr API key.
async function fetchBankrWallet(bankrApiKey: string): Promise<string> {
  const res = await fetch(`${BANKR_API}/me`, { headers: { 'X-API-Key': bankrApiKey } });
  if (!res.ok) throw new Error(`Bankr returned ${res.status}`);
  const data = await res.json();
  const evm = (data.wallets || []).find((w: any) => w.chain === 'evm');
  if (!evm?.address) throw new Error('No EVM wallet in Bankr account');
  return evm.address;
}

// ─── Wallet Direct (window.ethereum) ─────────────────────────────────────────

async function payViaWallet(
  toAddress: string,
  amount: string,
  token: PayrollToken,
  agentName: string
): Promise<PayrollResult> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No wallet detected. Install MetaMask or Coinbase Wallet.');

  const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
  const from = accounts[0];

  // Switch to Base
  try {
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
  } catch (e: any) {
    if (e.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x2105',
          chainName: 'Base',
          nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org'],
        }],
      });
    } else throw e;
  }

  let txHash: string;

  if (token.symbol === 'ETH') {
    const valueHex = '0x' + BigInt(Math.round(parseFloat(amount) * 1e18)).toString(16);
    txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: toAddress, value: valueHex }],
    });
  } else {
    const amountBigInt = BigInt(Math.round(parseFloat(amount) * Math.pow(10, token.decimals)));
    const amountHex = amountBigInt.toString(16).padStart(64, '0');
    const toHex = toAddress.slice(2).padStart(64, '0');
    const data = `0xa9059cbb${toHex}${amountHex}`;
    txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: token.address, data }],
    });
  }

  return {
    success: true,
    txHash,
    basescanUrl: `https://basescan.org/tx/${txHash}`,
    method: 'wallet',
    agent: agentName,
    amount,
    token: token.symbol,
  };
}

// ─── Pay Agent Modal ──────────────────────────────────────────────────────────

export function PayAgentModal({
  agents,
  onClose,
  theme = {},
}: {
  agents: Agent[];
  onClose: () => void;
  theme?: { text?: string; textDim?: string; bgSecondary?: string; border?: string };
}) {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(agents[0]);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<PayrollToken>(PAYROLL_TOKENS[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [bankrKey, setBankrKey] = useState('');
  const [bankrKeyInput, setBankrKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'quoted'>('idle');
  const [result, setResult] = useState<PayrollResult | null>(null);

  // ── Trails-specific state ──
  const [trailsKey, setTrailsKey] = useState('');
  const [trailsKeyInput, setTrailsKeyInput] = useState('');
  const [showTrailsKeyInput, setShowTrailsKeyInput] = useState(false);
  const [sourceChain, setSourceChain] = useState<TrailsSourceChain>(TRAILS_SOURCE_CHAINS[0]);
  const [pendingQuote, setPendingQuote] = useState<TrailsQuote | null>(null);

  const textColor = theme.text || '#e2e8f0';
  const dimColor = theme.textDim || '#64748b';
  const borderColor = theme.border || '#1e293b';

  // Load API keys from sessionStorage on mount
  useEffect(() => {
    const savedBankr = sessionStorage.getItem(SESSION_KEY);
    if (savedBankr) setBankrKey(savedBankr);
    const savedTrails = sessionStorage.getItem(TRAILS_KEY_SESSION);
    if (savedTrails) setTrailsKey(savedTrails);
  }, []);

  const saveBankrKey = useCallback(() => {
    if (!bankrKeyInput.startsWith('bk_')) return;
    sessionStorage.setItem(SESSION_KEY, bankrKeyInput);
    setBankrKey(bankrKeyInput);
    setShowKeyInput(false);
  }, [bankrKeyInput]);

  const clearBankrKey = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setBankrKey('');
    setBankrKeyInput('');
  }, []);

  const saveTrailsKey = useCallback(() => {
    if (!trailsKeyInput.trim()) return;
    sessionStorage.setItem(TRAILS_KEY_SESSION, trailsKeyInput);
    setTrailsKey(trailsKeyInput);
    setShowTrailsKeyInput(false);
    setTrailsKeyInput('');
  }, [trailsKeyInput]);

  const clearTrailsKey = useCallback(() => {
    sessionStorage.removeItem(TRAILS_KEY_SESSION);
    setTrailsKey('');
  }, []);

  const isAddressValid = toAddress.startsWith('0x') && toAddress.length === 42;
  const isAmountValid = parseFloat(amount) > 0;

  // Validation per method
  const isBankrReady = paymentMethod !== 'bankr' || bankrKey.length > 0;
  const isTrailsReady = paymentMethod !== 'trails' || (trailsKey.length > 0 && bankrKey.length > 0);
  const isValid = isAddressValid && isAmountValid && isBankrReady && isTrailsReady;

  // ── Trails: get quote (preview before commit) ──
  const handleQuote = useCallback(async () => {
    if (!isValid) return;
    setStatus('loading');
    try {
      const bankrWallet = await fetchBankrWallet(bankrKey);
      // Convert UI amount -> base units for the SOURCE token (USDC is 6 decimals)
      const sourceDecimals = 6; // we currently only support USDC sources
      const sourceAmount = BigInt(
        Math.round(parseFloat(amount) * Math.pow(10, sourceDecimals)),
      ).toString();

      const quote = await quoteTrails({
        trailsApiKey: trailsKey,
        bankrWallet,
        sourceChainId: sourceChain.id,
        sourceTokenAddress: sourceChain.usdc,
        sourceAmount,
        destinationToAddress: toAddress,
        destinationTokenAddress: selectedToken.symbol === 'ETH'
          ? '0x0000000000000000000000000000000000000000'
          : selectedToken.address,
      });
      setPendingQuote(quote);
      setStatus('quoted');
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Quote failed',
        method: 'trails',
        agent: selectedAgent.name,
        amount,
        token: selectedToken.symbol,
      });
      setStatus('error');
    }
  }, [isValid, bankrKey, trailsKey, sourceChain, amount, toAddress, selectedToken, selectedAgent]);

  // ── Trails: confirm and execute the quoted intent ──
  const handleExecuteQuote = useCallback(async () => {
    if (!pendingQuote) return;
    setStatus('loading');
    try {
      const res = await executeTrails({
        trailsApiKey: trailsKey,
        bankrApiKey: bankrKey,
        intent: pendingQuote.intent,
        agentName: selectedAgent.name,
        amount,
        token: selectedToken,
      });
      setResult(res);
      setStatus('success');
      setPendingQuote(null);
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Trails execution failed',
        method: 'trails',
        agent: selectedAgent.name,
        amount,
        token: selectedToken.symbol,
      });
      setStatus('error');
    }
  }, [pendingQuote, trailsKey, bankrKey, selectedAgent, amount, selectedToken]);

  const handlePay = useCallback(async () => {
    if (!isValid) return;
    // For Trails, we go through the quote step first.
    if (paymentMethod === 'trails') return handleQuote();

    setStatus('loading');
    try {
      let res: PayrollResult;
      if (paymentMethod === 'bankr') {
        res = await payViaBankr(bankrKey, toAddress, amount, selectedToken, selectedAgent.name);
      } else {
        res = await payViaWallet(toAddress, amount, selectedToken, selectedAgent.name);
      }
      setResult(res);
      setStatus(res.success ? 'success' : 'error');
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Payment failed',
        method: paymentMethod,
        agent: selectedAgent.name,
        amount,
        token: selectedToken.symbol,
      });
      setStatus('error');
    }
  }, [isValid, paymentMethod, bankrKey, toAddress, amount, selectedToken, selectedAgent, handleQuote]);

  const reset = () => {
    setStatus('idle'); setResult(null); setAmount(''); setToAddress('');
    setPendingQuote(null);
  };

  const label = (text: string) => (
    <label style={{
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 7, color: dimColor,
      display: 'block', marginBottom: 6,
    }}>{text}</label>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#0a0e1a',
        border: '2px solid #22c55e',
        borderRadius: 16,
        width: '100%', maxWidth: 500,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 0 40px rgba(34,197,94,0.15)',
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(34,197,94,0.1)',
          borderBottom: '2px solid rgba(34,197,94,0.3)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky' as const, top: 0, zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💰</span>
            <span style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9, color: '#22c55e',
            }}>
              Pay Agent
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: dimColor, cursor: 'pointer', fontSize: 18,
          }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>

          {/* ── Success ── */}
          {status === 'success' && result && (
            <div style={{ textAlign: 'center' as const, padding: '10px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 10, color: '#22c55e', marginBottom: 8,
              }}>
                {result.method === 'trails' ? 'Cross-Chain Sent!' : 'Payment Sent!'}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, color: textColor, marginBottom: 16 }}>
                {result.amount} {result.token} → {result.agent}
              </div>
              {result.intentId && (
                <div style={{
                  fontFamily: 'monospace', fontSize: 9, color: '#a78bfa',
                  background: 'rgba(167,139,250,0.1)',
                  border: '1px solid rgba(167,139,250,0.3)',
                  borderRadius: 6, padding: '8px 12px', marginBottom: 8,
                }}>
                  Intent: {result.intentId.slice(0, 12)}…  Status: {result.intentStatus || 'completed'}
                </div>
              )}
              {result.txHash && (
                <div style={{
                  fontFamily: 'monospace', fontSize: 9, color: '#a78bfa',
                  wordBreak: 'break-all' as const,
                  background: 'rgba(167,139,250,0.1)',
                  border: '1px solid rgba(167,139,250,0.3)',
                  borderRadius: 6, padding: '10px 12px', marginBottom: 16,
                }}>
                  {result.txHash}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' as const }}>
                {result.basescanUrl && (
                  <a href={result.basescanUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      background: 'rgba(34,197,94,0.15)',
                      border: '1px solid #22c55e', color: '#22c55e',
                      borderRadius: 6, padding: '8px 14px',
                      fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                      textDecoration: 'none', display: 'inline-block',
                    }}>
                    🔍 View on Basescan
                  </a>
                )}
                <button onClick={reset} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${borderColor}`, color: dimColor,
                  borderRadius: 6, padding: '8px 14px',
                  fontFamily: '"Press Start 2P", monospace', fontSize: 7, cursor: 'pointer',
                }}>Pay Again</button>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {status === 'error' && result && (
            <div style={{ textAlign: 'center' as const, padding: '10px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
              <div style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 9, color: '#ef4444', marginBottom: 12,
              }}>Payment Failed</div>
              <div style={{
                fontFamily: 'monospace', fontSize: 12, color: dimColor,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6, padding: '8px 12px', marginBottom: 16,
              }}>{result.error}</div>
              <button onClick={reset} style={{
                background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444',
                color: '#ef4444', borderRadius: 6, padding: '8px 14px',
                fontFamily: '"Press Start 2P", monospace', fontSize: 7, cursor: 'pointer',
              }}>Try Again</button>
            </div>
          )}

          {/* ── Trails: Quote review screen ── */}
          {status === 'quoted' && pendingQuote && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                fontFamily: '"Press Start 2P", monospace', fontSize: 9, color: '#a78bfa',
                textAlign: 'center', marginBottom: 4,
              }}>
                🌉 Review Cross-Chain Route
              </div>
              <div style={{
                background: 'rgba(167,139,250,0.08)',
                border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: 8, padding: '14px',
                fontFamily: 'monospace', fontSize: 12, color: textColor,
                lineHeight: 1.7,
              }}>
                <div>From: <span style={{ color: '#a78bfa' }}>{amount} USDC on {sourceChain.name}</span></div>
                <div>To: <span style={{ color: '#22c55e' }}>{selectedAgent.emoji} {selectedAgent.name}</span></div>
                <div>Receives: <span style={{ color: selectedToken.color }}>≈ {pendingQuote.quote?.toAmount || '?'} {selectedToken.symbol} on Base</span></div>
                {pendingQuote.quote?.estimatedDuration && (
                  <div>ETA: <span style={{ color: dimColor }}>{Math.ceil(pendingQuote.quote.estimatedDuration / 60)} min</span></div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setStatus('idle'); setPendingQuote(null); }} style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${borderColor}`, color: dimColor,
                  borderRadius: 8, padding: '12px',
                  fontFamily: '"Press Start 2P", monospace', fontSize: 8, cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={handleExecuteQuote} style={{
                  flex: 2,
                  background: 'rgba(167,139,250,0.2)',
                  border: '2px solid #a78bfa', color: '#a78bfa',
                  borderRadius: 8, padding: '12px',
                  fontFamily: '"Press Start 2P", monospace', fontSize: 8, cursor: 'pointer',
                  fontWeight: 700,
                }}>✓ Confirm & Send</button>
              </div>
            </div>
          )}

          {/* ── Form ── */}
          {(status === 'idle' || status === 'loading') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Agent selector */}
              <div>
                {label('Select Agent')}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {agents.map(agent => (
                    <button key={agent.id} onClick={() => setSelectedAgent(agent)} style={{
                      background: selectedAgent.id === agent.id ? `${agent.color}33` : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${selectedAgent.id === agent.id ? agent.color : borderColor}`,
                      color: textColor, borderRadius: 8, padding: '6px 10px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'all 0.2s',
                    }}>
                      <span style={{ fontSize: 14 }}>{agent.emoji}</span>
                      <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6 }}>{agent.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet address */}
              <div>
                {label('Wallet Address (0x...)')}
                <input
                  type="text"
                  value={toAddress}
                  onChange={e => setToAddress(e.target.value)}
                  placeholder="0x..."
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${toAddress && !isAddressValid ? '#ef4444' : borderColor}`,
                    borderRadius: 6, padding: '10px 12px',
                    color: textColor, fontFamily: 'monospace', fontSize: 12,
                    outline: 'none', boxSizing: 'border-box' as const,
                  }}
                />
              </div>

              {/* Token + Amount */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  {label('Token')}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {PAYROLL_TOKENS.map(token => (
                      <button key={token.symbol} onClick={() => setSelectedToken(token)} style={{
                        background: selectedToken.symbol === token.symbol ? `${token.color}22` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedToken.symbol === token.symbol ? token.color : borderColor}`,
                        color: selectedToken.symbol === token.symbol ? token.color : dimColor,
                        borderRadius: 6, padding: '6px 10px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                        transition: 'all 0.15s', textAlign: 'left' as const,
                      }}>
                        <img src={token.icon} alt={token.symbol} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' as const }} />
                        <span>{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  {label('Amount')}
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.4)',
                      border: `1px solid ${borderColor}`,
                      borderRadius: 6, padding: '10px 12px',
                      color: textColor, fontFamily: 'monospace', fontSize: 18,
                      outline: 'none', boxSizing: 'border-box' as const,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' as const }}>
                    {['1', '5', '10', '100'].map(v => (
                      <button key={v} onClick={() => setAmount(v)} style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${borderColor}`, color: dimColor,
                        borderRadius: 4, padding: '2px 8px',
                        cursor: 'pointer', fontFamily: 'monospace', fontSize: 11,
                      }}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div>
                {label('Pay Via')}
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Wallet option */}
                  <button onClick={() => setPaymentMethod('wallet')} style={{
                    flex: 1,
                    background: paymentMethod === 'wallet' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${paymentMethod === 'wallet' ? '#6366f1' : borderColor}`,
                    color: textColor, borderRadius: 8, padding: '10px 8px',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>🦊</div>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace', fontSize: 7, marginBottom: 3,
                      color: paymentMethod === 'wallet' ? '#818cf8' : textColor,
                    }}>Your Wallet</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor }}>
                      MetaMask / Coinbase
                    </div>
                  </button>

                  {/* Bankr option */}
                  <button onClick={() => setPaymentMethod('bankr')} style={{
                    flex: 1,
                    background: paymentMethod === 'bankr' ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${paymentMethod === 'bankr' ? '#F97316' : borderColor}`,
                    color: textColor, borderRadius: 8, padding: '10px 8px',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                      <img src="https://bankr.bot/bankr-symbol-full-color-rgb.svg" alt="Bankr" style={{ height: 24, width: 'auto' }} />
                    </div>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace', fontSize: 7, marginBottom: 3,
                      color: paymentMethod === 'bankr' ? '#F97316' : textColor,
                    }}>Bankr</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor }}>
                      Use Bankr wallet
                    </div>
                  </button>

                  {/* Trails option */}
                  <button onClick={() => setPaymentMethod('trails')} style={{
                    flex: 1,
                    background: paymentMethod === 'trails' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${paymentMethod === 'trails' ? '#a78bfa' : borderColor}`,
                    color: textColor, borderRadius: 8, padding: '10px 8px',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>🌉</div>
                    <div style={{
                      fontFamily: '"Press Start 2P", monospace', fontSize: 7, marginBottom: 3,
                      color: paymentMethod === 'trails' ? '#c4b5fd' : textColor,
                    }}>Trails</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor }}>
                      Cross-chain
                    </div>
                  </button>
                </div>
              </div>

              {/* Bankr API key input */}
              {(paymentMethod === 'bankr' || paymentMethod === 'trails') && (
                <div style={{
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  borderRadius: 8, padding: '12px 14px',
                }}>
                  {bankrKey ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#22c55e', marginBottom: 3 }}>
                          ✅ Bankr Key Set
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor }}>
                          {bankrKey.slice(0, 8)}•••••••••• (session only)
                        </div>
                      </div>
                      <button onClick={clearBankrKey} style={{
                        background: 'transparent', border: `1px solid ${borderColor}`,
                        color: dimColor, borderRadius: 4, padding: '3px 8px',
                        cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
                      }}>Clear</button>
                    </div>
                  ) : showKeyInput ? (
                    <div>
                      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#F97316', marginBottom: 8 }}>
                        Enter Bankr API Key
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="password"
                          value={bankrKeyInput}
                          onChange={e => setBankrKeyInput(e.target.value)}
                          placeholder="bk_..."
                          onKeyDown={e => e.key === 'Enter' && saveBankrKey()}
                          style={{
                            flex: 1, background: 'rgba(0,0,0,0.4)',
                            border: `1px solid ${bankrKeyInput && !bankrKeyInput.startsWith('bk_') ? '#ef4444' : '#F97316'}`,
                            borderRadius: 6, padding: '8px 10px',
                            color: textColor, fontFamily: 'monospace', fontSize: 12,
                            outline: 'none',
                          }}
                        />
                        <button onClick={saveBankrKey}
                          disabled={!bankrKeyInput.startsWith('bk_')}
                          style={{
                            background: bankrKeyInput.startsWith('bk_') ? 'rgba(249,115,22,0.2)' : 'transparent',
                            border: `1px solid ${bankrKeyInput.startsWith('bk_') ? '#F97316' : borderColor}`,
                            color: bankrKeyInput.startsWith('bk_') ? '#F97316' : dimColor,
                            borderRadius: 6, padding: '8px 12px',
                            cursor: bankrKeyInput.startsWith('bk_') ? 'pointer' : 'not-allowed',
                            fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                          }}>Save</button>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor, marginTop: 6 }}>
                        🔒 Stored in browser session only. Never sent to our server. Get your key at{' '}
                        <a href="https://bankr.bot/api" target="_blank" rel="noopener noreferrer"
                          style={{ color: '#F97316' }}>bankr.bot/api</a>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowKeyInput(true)} style={{
                      background: 'transparent', border: `1px solid #F97316`,
                      color: '#F97316', borderRadius: 6, padding: '8px 14px',
                      cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                      width: '100%',
                    }}>
                      🔑 Enter Bankr API Key
                    </button>
                  )}
                </div>
              )}

              {/* ── Trails-specific: API key + source chain ── */}
              {paymentMethod === 'trails' && (
                <>
                  {/* Trails API key */}
                  <div style={{
                    background: 'rgba(167,139,250,0.08)',
                    border: '1px solid rgba(167,139,250,0.3)',
                    borderRadius: 8, padding: '12px 14px',
                  }}>
                    {trailsKey ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#22c55e', marginBottom: 3 }}>
                            ✅ Trails Key Set
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor }}>
                            {trailsKey.slice(0, 6)}•••••• (session only)
                          </div>
                        </div>
                        <button onClick={clearTrailsKey} style={{
                          background: 'transparent', border: `1px solid ${borderColor}`,
                          color: dimColor, borderRadius: 4, padding: '3px 8px',
                          cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
                        }}>Clear</button>
                      </div>
                    ) : showTrailsKeyInput ? (
                      <div>
                        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#a78bfa', marginBottom: 8 }}>
                          Enter Trails API Key
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            type="password"
                            value={trailsKeyInput}
                            onChange={e => setTrailsKeyInput(e.target.value)}
                            placeholder="Sequence access key..."
                            onKeyDown={e => e.key === 'Enter' && saveTrailsKey()}
                            style={{
                              flex: 1, background: 'rgba(0,0,0,0.4)',
                              border: `1px solid #a78bfa`,
                              borderRadius: 6, padding: '8px 10px',
                              color: textColor, fontFamily: 'monospace', fontSize: 12,
                              outline: 'none',
                            }}
                          />
                          <button onClick={saveTrailsKey} disabled={!trailsKeyInput.trim()}
                            style={{
                              background: trailsKeyInput.trim() ? 'rgba(167,139,250,0.2)' : 'transparent',
                              border: `1px solid ${trailsKeyInput.trim() ? '#a78bfa' : borderColor}`,
                              color: trailsKeyInput.trim() ? '#a78bfa' : dimColor,
                              borderRadius: 6, padding: '8px 12px',
                              cursor: trailsKeyInput.trim() ? 'pointer' : 'not-allowed',
                              fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                            }}>Save</button>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor, marginTop: 6 }}>
                          🔒 Session only. Get key at{' '}
                          <a href="https://sequence.build" target="_blank" rel="noopener noreferrer"
                            style={{ color: '#a78bfa' }}>sequence.build</a>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowTrailsKeyInput(true)} style={{
                        background: 'transparent', border: `1px solid #a78bfa`,
                        color: '#a78bfa', borderRadius: 6, padding: '8px 14px',
                        cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                        width: '100%',
                      }}>
                        🔑 Enter Trails API Key
                      </button>
                    )}
                  </div>

                  {/* Source chain selector */}
                  <div>
                    {label('Pay From (Source Chain — USDC)')}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                      {TRAILS_SOURCE_CHAINS.map(c => (
                        <button key={c.id} onClick={() => setSourceChain(c)} style={{
                          flex: 1, minWidth: 100,
                          background: sourceChain.id === c.id ? `${c.color}22` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${sourceChain.id === c.id ? c.color : borderColor}`,
                          color: sourceChain.id === c.id ? c.color : textColor,
                          borderRadius: 6, padding: '6px 10px',
                          cursor: 'pointer',
                          fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                        }}>{c.name}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Summary */}
              {isValid && (
                <div style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 8, padding: '10px 14px',
                  fontFamily: 'monospace', fontSize: 12, color: textColor,
                }}>
                  Send{' '}
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>{amount} {selectedToken.symbol}</span>
                  {' '}to{' '}
                  <span style={{ color: '#a78bfa' }}>{selectedAgent.emoji} {selectedAgent.name}</span>
                  {' '}via{' '}
                  <span style={{ color: dimColor }}>
                    {paymentMethod === 'bankr' ? 'Bankr' :
                     paymentMethod === 'trails' ? `Trails (${sourceChain.name} → Base)` :
                     '🦊 Wallet'}
                  </span>
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={!isValid || status === 'loading'}
                style={{
                  background: isValid ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${isValid ? '#22c55e' : borderColor}`,
                  color: isValid ? '#22c55e' : dimColor,
                  borderRadius: 8, padding: '14px',
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 9, cursor: isValid ? 'pointer' : 'not-allowed',
                  width: '100%', transition: 'all 0.2s',
                  opacity: status === 'loading' ? 0.7 : 1,
                }}
              >
                {status === 'loading'
                  ? (paymentMethod === 'trails' ? '⏳ Quoting Route...' : '⏳ Sending...')
                  : (paymentMethod === 'trails' ? `🌉 Quote Route` : `💸 Pay ${selectedAgent.name}`)}
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pay Agent Button ─────────────────────────────────────────────────────────

export function PayAgentButton({
  agents,
  theme = {},
}: {
  agents: Agent[];
  theme?: { text?: string; border?: string };
}) {
  const [open, setOpen] = useState(false);
  if (agents.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'rgba(34,197,94,0.15)',
          border: '2px solid rgba(34,197,94,0.5)',
          color: '#86efac', borderRadius: 8, padding: '6px 12px',
          cursor: 'pointer',
          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(34,197,94,0.3)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(34,197,94,0.15)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        💰 Pay Agent
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <PayAgentModal
          agents={agents}
          onClose={() => setOpen(false)}
          theme={theme}
        />,
        document.body
      )}
    </>
  );
}
