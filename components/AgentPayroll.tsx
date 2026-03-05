'use client';

import React, { useState, useCallback } from 'react';
import type { Agent } from './types';

/**
 * Agent Payroll — Pay your AI agents in crypto on Base
 *
 * Two payment methods:
 * 1. Bankr API — uses your Bankr wallet, no user wallet needed
 * 2. WalletConnect — user signs tx from their own wallet (more "onchain native")
 *
 * Supported tokens: USDC, ETH, BNKR, HARBOR (0x4972e029F2E1831D205b20D05833CC771FEB2BA3)
 */

// ─── Token Config ─────────────────────────────────────────────────────────────

export const PAYROLL_TOKENS = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '💵',
    decimals: 6,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    color: '#2775CA',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '⟠',
    decimals: 18,
    address: 'native',
    color: '#627EEA',
  },
  {
    symbol: 'BNKR',
    name: 'Bankr Token',
    icon: '🏦',
    decimals: 18,
    address: '0x22aF33FE49fD1Fa80c7149773dDe5890D3c76F3b', // BNKR on Base
    color: '#F97316',
  },
  {
    symbol: 'HARBOR',
    name: 'Harbor Token',
    icon: '⚓',
    decimals: 18,
    address: '0x4972e029F2E1831D205b20D05833CC771FEB2BA3',
    color: '#22c55e',
  },
] as const;

export type PayrollToken = typeof PAYROLL_TOKENS[number];

export type PaymentMethod = 'bankr' | 'walletconnect';

export interface PayrollResult {
  success: boolean;
  txHash?: string;
  basescanUrl?: string;
  error?: string;
  method: PaymentMethod;
  agent: string;
  amount: string;
  token: string;
}

// ─── Bankr Payment ────────────────────────────────────────────────────────────

async function payViaBankr(
  toAddress: string,
  amount: string,
  token: PayrollToken,
  agentName: string
): Promise<PayrollResult> {
  const prompt =
    token.symbol === 'ETH'
      ? `Send ${amount} ETH to ${toAddress} on Base. This is payroll for my AI agent ${agentName}.`
      : `Send ${amount} ${token.symbol} to ${toAddress} on Base. Token address: ${token.address}. This is payroll for my AI agent ${agentName}.`;

  const res = await fetch('/api/payroll/bankr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, agentName, amount, token: token.symbol, toAddress }),
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    return { success: false, error: data.error || 'Bankr payment failed', method: 'bankr', agent: agentName, amount, token: token.symbol };
  }

  const txHash = data.txHash;
  return {
    success: true,
    txHash,
    basescanUrl: txHash ? `https://basescan.org/tx/${txHash}` : undefined,
    method: 'bankr',
    agent: agentName,
    amount,
    token: token.symbol,
  };
}

// ─── WalletConnect Payment (via window.ethereum) ─────────────────────────────

async function payViaWallet(
  toAddress: string,
  amount: string,
  token: PayrollToken
): Promise<PayrollResult> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No wallet detected. Install MetaMask or Coinbase Wallet.');

  // Request account access
  const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
  const from = accounts[0];

  // Switch to Base (chainId 8453 = 0x2105)
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }],
    });
  } catch (switchError: any) {
    // Add Base if not present
    if (switchError.code === 4902) {
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
    } else {
      throw switchError;
    }
  }

  let txHash: string;

  if (token.symbol === 'ETH') {
    // Native ETH transfer
    const valueHex = '0x' + BigInt(Math.round(parseFloat(amount) * 1e18)).toString(16);
    txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: toAddress, value: valueHex }],
    });
  } else {
    // ERC-20 transfer
    const decimals = token.decimals;
    const amountBigInt = BigInt(Math.round(parseFloat(amount) * Math.pow(10, decimals)));
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
    method: 'walletconnect',
    agent: '',
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('walletconnect');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<PayrollResult | null>(null);

  const textColor = theme.text || '#e2e8f0';
  const dimColor = theme.textDim || '#64748b';
  const borderColor = theme.border || '#1e293b';
  const bgColor = theme.bgSecondary || '#0f172a';

  const isValid = toAddress.startsWith('0x') && toAddress.length === 42 && parseFloat(amount) > 0;

  const handlePay = useCallback(async () => {
    if (!isValid) return;
    setStatus('loading');

    try {
      let res: PayrollResult;

      if (paymentMethod === 'bankr') {
        res = await payViaBankr(toAddress, amount, selectedToken, selectedAgent.name);
      } else {
        res = await payViaWallet(toAddress, amount, selectedToken);
        res.agent = selectedAgent.name;
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
  }, [isValid, paymentMethod, toAddress, amount, selectedToken, selectedAgent]);

  const reset = () => { setStatus('idle'); setResult(null); setAmount(''); setToAddress(''); };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#0a0e1a',
        border: '2px solid #22c55e',
        borderRadius: 16,
        width: '100%', maxWidth: 480,
        boxShadow: '0 0 40px rgba(34,197,94,0.15)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(34,197,94,0.1)',
          borderBottom: '2px solid rgba(34,197,94,0.3)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💰</span>
            <span style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9, color: '#22c55e',
              textTransform: 'uppercase' as const,
            }}>
              Pay Agent
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: dimColor,
            cursor: 'pointer', fontSize: 16, padding: '0 4px',
          }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Success state */}
          {status === 'success' && result && (
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 10, color: '#22c55e', marginBottom: 8,
              }}>
                Payment Sent!
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: textColor, marginBottom: 16 }}>
                {result.amount} {result.token} → {result.agent}
              </div>
              {result.txHash && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: dimColor, marginBottom: 6 }}>
                    TX Hash
                  </div>
                  <div style={{
                    fontFamily: 'monospace', fontSize: 9, color: '#a78bfa',
                    wordBreak: 'break-all' as const,
                    background: 'rgba(167,139,250,0.1)',
                    border: '1px solid rgba(167,139,250,0.3)',
                    borderRadius: 6, padding: '8px 10px',
                  }}>
                    {result.txHash}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {result.basescanUrl && (
                  <a
                    href={result.basescanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'rgba(34,197,94,0.15)',
                      border: '1px solid #22c55e',
                      color: '#22c55e',
                      borderRadius: 6, padding: '8px 14px',
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: 7, cursor: 'pointer',
                      textDecoration: 'none', display: 'inline-block',
                    }}
                  >
                    🔍 View on Basescan
                  </a>
                )}
                <button onClick={reset} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${borderColor}`,
                  color: dimColor, borderRadius: 6, padding: '8px 14px',
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 7, cursor: 'pointer',
                }}>
                  Pay Again
                </button>
              </div>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && result && (
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
              <div style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 9, color: '#ef4444', marginBottom: 12,
              }}>
                Payment Failed
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: 12, color: dimColor,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6, padding: '8px 12px', marginBottom: 16,
              }}>
                {result.error}
              </div>
              <button onClick={reset} style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid #ef4444',
                color: '#ef4444', borderRadius: 6, padding: '8px 14px',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 7, cursor: 'pointer',
              }}>
                Try Again
              </button>
            </div>
          )}

          {/* Form */}
          {(status === 'idle' || status === 'loading') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Agent selector */}
              <div>
                <label style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 7, color: dimColor,
                  display: 'block', marginBottom: 6,
                }}>
                  Select Agent
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      style={{
                        background: selectedAgent.id === agent.id
                          ? `${agent.color}33` : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${selectedAgent.id === agent.id ? agent.color : borderColor}`,
                        color: textColor, borderRadius: 8, padding: '6px 10px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{agent.emoji}</span>
                      <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6 }}>
                        {agent.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet address */}
              <div>
                <label style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 7, color: dimColor,
                  display: 'block', marginBottom: 6,
                }}>
                  Wallet Address (0x...)
                </label>
                <input
                  type="text"
                  value={toAddress}
                  onChange={e => setToAddress(e.target.value)}
                  placeholder="0x..."
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${toAddress && !toAddress.startsWith('0x') ? '#ef4444' : borderColor}`,
                    borderRadius: 6, padding: '10px 12px',
                    color: textColor, fontFamily: 'monospace', fontSize: 12,
                    outline: 'none', boxSizing: 'border-box' as const,
                  }}
                />
              </div>

              {/* Token + Amount row */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 7, color: dimColor,
                    display: 'block', marginBottom: 6,
                  }}>
                    Token
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {PAYROLL_TOKENS.map(token => (
                      <button
                        key={token.symbol}
                        onClick={() => setSelectedToken(token)}
                        style={{
                          background: selectedToken.symbol === token.symbol
                            ? `${token.color}22` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${selectedToken.symbol === token.symbol ? token.color : borderColor}`,
                          color: selectedToken.symbol === token.symbol ? token.color : dimColor,
                          borderRadius: 6, padding: '6px 10px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                          transition: 'all 0.15s',
                          textAlign: 'left' as const,
                        }}
                      >
                        <span>{token.icon}</span>
                        <span>{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 7, color: dimColor,
                    display: 'block', marginBottom: 6,
                  }}>
                    Amount
                  </label>
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
                      color: textColor, fontFamily: 'monospace', fontSize: 16,
                      outline: 'none', boxSizing: 'border-box' as const,
                    }}
                  />
                  {/* Quick amounts */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' as const }}>
                    {['1', '5', '10', '100'].map(v => (
                      <button
                        key={v}
                        onClick={() => setAmount(v)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${borderColor}`,
                          color: dimColor, borderRadius: 4,
                          padding: '2px 6px', cursor: 'pointer',
                          fontFamily: 'monospace', fontSize: 10,
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 7, color: dimColor,
                  display: 'block', marginBottom: 6,
                }}>
                  Pay Via
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'walletconnect' as PaymentMethod, icon: '🦊', label: 'Your Wallet', sub: 'MetaMask / Coinbase', isEmoji: true },
                    { id: 'bankr' as PaymentMethod, icon: 'https://bankr.bot/bankr-symbol-full-color-rgb.svg', label: 'Bankr', sub: 'Use Bankr balance', isEmoji: false },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      style={{
                        flex: 1,
                        background: paymentMethod === m.id
                          ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `2px solid ${paymentMethod === m.id ? '#6366f1' : borderColor}`,
                        color: textColor, borderRadius: 8, padding: '10px 8px',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {m.isEmoji
                          ? <span>{m.icon}</span>
                          : <img src={m.icon} alt="Bankr" style={{ height: 24, width: 'auto' }} />
                        }
                      </div>
                      <div style={{
                        fontFamily: '"Press Start 2P", monospace',
                        fontSize: 7, marginBottom: 3,
                        color: paymentMethod === m.id ? '#818cf8' : textColor,
                      }}>
                        {m.label}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor }}>
                        {m.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {isValid && (
                <div style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 8, padding: '10px 14px',
                  fontFamily: 'monospace', fontSize: 12, color: textColor,
                }}>
                  Send <span style={{ color: '#22c55e', fontWeight: 700 }}>{amount} {selectedToken.icon} {selectedToken.symbol}</span> to <span style={{ color: '#a78bfa' }}>{selectedAgent.emoji} {selectedAgent.name}</span>
                  <span style={{ color: dimColor }}> via {paymentMethod === 'bankr'
                    ? <><img src="https://bankr.bot/bankr-symbol-full-color-rgb.svg" alt="Bankr" style={{ height: 12, width: 'auto', verticalAlign: 'middle', marginRight: 3 }} />Bankr</>
                    : '🦊 Wallet'}</span>
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
                  borderRadius: 8, padding: '12px',
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 9, cursor: isValid ? 'pointer' : 'not-allowed',
                  width: '100%', transition: 'all 0.2s',
                  opacity: status === 'loading' ? 0.7 : 1,
                }}
              >
                {status === 'loading'
                  ? '⏳ Sending...'
                  : `💸 Pay ${selectedAgent.name}`}
              </button>

              {paymentMethod === 'bankr' && (
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor, textAlign: 'center' as const }}>
                  Requires BANKR_API_KEY with read-write access
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pay Button (trigger) ─────────────────────────────────────────────────────

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
          color: '#86efac',
          borderRadius: 8, padding: '6px 12px',
          cursor: 'pointer',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
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

      {open && (
        <PayAgentModal
          agents={agents}
          onClose={() => setOpen(false)}
          theme={theme}
        />
      )}
    </>
  );
}
