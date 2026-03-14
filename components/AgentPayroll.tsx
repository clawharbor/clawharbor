'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Agent } from './types';

/**
 * Agent Payroll — Pay your AI agents in crypto on Base
 *
 * Two payment methods:
 * 1. Bankr — user inputs their own Bankr API key, stored in sessionStorage only.
 *            Request goes DIRECTLY from browser to Bankr API — never through our server.
 * 2. Wallet — user signs tx from their own wallet (MetaMask / Coinbase Wallet)
 *
 * Supported tokens: USDC, ETH, BNKR, HARBOR
 */

const BANKR_API = 'https://api.bankr.bot/agent';
const SESSION_KEY = 'clawharbor_bankr_key';

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

export type PayrollToken = typeof PAYROLL_TOKENS[number];
export type PaymentMethod = 'bankr' | 'wallet';

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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<PayrollResult | null>(null);

  const textColor = theme.text || '#e2e8f0';
  const dimColor = theme.textDim || '#64748b';
  const borderColor = theme.border || '#1e293b';

  // Load API key from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setBankrKey(saved);
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

  const isAddressValid = toAddress.startsWith('0x') && toAddress.length === 42;
  const isAmountValid = parseFloat(amount) > 0;
  const isBankrReady = paymentMethod === 'wallet' || bankrKey.length > 0;
  const isValid = isAddressValid && isAmountValid && isBankrReady;

  const handlePay = useCallback(async () => {
    if (!isValid) return;
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
  }, [isValid, paymentMethod, bankrKey, toAddress, amount, selectedToken, selectedAgent]);

  const reset = () => { setStatus('idle'); setResult(null); setAmount(''); setToAddress(''); };

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
              }}>Payment Sent!</div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, color: textColor, marginBottom: 16 }}>
                {result.amount} {result.token} → {result.agent}
              </div>
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
                </div>
              </div>

              {/* Bankr API key input */}
              {paymentMethod === 'bankr' && (
                <div style={{
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  borderRadius: 8, padding: '12px 14px',
                }}>
                  {bankrKey ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#22c55e', marginBottom: 3 }}>
                          ✅ API Key Set
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
                      🔑 Enter API Key
                    </button>
                  )}
                </div>
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
                    {paymentMethod === 'bankr' ? 'Bankr' : '🦊 Wallet'}
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
                {status === 'loading' ? '⏳ Sending...' : `💸 Pay ${selectedAgent.name}`}
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
