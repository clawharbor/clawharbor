'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Fund Bankr Wallet — On-Ramp via Trails Widget
 *
 * Lets the operator (the human running clawharbor) top up their Bankr agent
 * wallet from any token on any chain. We don't broadcast anything ourselves —
 * we just point the user at the Trails widget with the right query params and
 * they sign from their own wallet.
 *
 * Flow:
 *   1. User pastes their Bankr API key (or we read it from sessionStorage,
 *      same key clawharbor_bankr_key already used by AgentPayroll).
 *   2. We call api.bankr.bot/agent/me to fetch the EVM wallet address.
 *   3. We build the Trails widget URL with toAddress + toChainId + toToken.
 *   4. User opens the URL, picks a source token, signs the swap.
 *   5. Funds arrive in the Bankr wallet (default: USDC on Base).
 *
 * No on-chain code runs in this component. It is purely a URL builder.
 */

const SESSION_KEY = 'clawharbor_bankr_key';
const TRAILS_KEY_SESSION = 'clawharbor_trails_key';
const TRAILS_WIDGET = 'https://demo.trails.build/';

// ─── Destination presets ─────────────────────────────────────────────────────
// USDC and ETH on Base + Polygon — the most common fund-up targets.

const DESTINATION_PRESETS = [
  {
    label: 'USDC on Base',
    chainId: 8453,
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    color: '#2775CA',
    icon: '💵',
  },
  {
    label: 'ETH on Base',
    chainId: 8453,
    token: '0x0000000000000000000000000000000000000000',
    color: '#627EEA',
    icon: '⟠',
  },
  {
    label: 'USDC on Polygon',
    chainId: 137,
    token: '0x3c499c542cef5e3811e1192ce70d8cC03d5c3359',
    color: '#8247E5',
    icon: '💵',
  },
] as const;

type DestinationPreset = typeof DESTINATION_PRESETS[number];

// ─── Bankr wallet fetcher (via server proxy) ─────────────────────────────────
// Bankr API does not send CORS headers, so a direct browser fetch fails with
// "Failed to fetch". We route through /api/payroll/trails (action: get-wallet).

async function fetchBankrWallet(apiKey: string): Promise<string> {
  const res = await fetch('/api/payroll/trails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get-wallet', bankrApiKey: apiKey }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || `Wallet lookup failed (${res.status})`);
  }
  if (!data.address) throw new Error('No EVM wallet found in Bankr account');
  return data.address;
}

// ─── URL builder ─────────────────────────────────────────────────────────────

function buildTrailsFundingUrl(
  toAddress: string,
  preset: DestinationPreset,
  trailsApiKey: string,
): string {
  const params = new URLSearchParams({
    mode: 'swap',
    toAddress,
    toChainId: String(preset.chainId),
    toToken: preset.token,
    apiKey: trailsApiKey,
    theme: 'dark',
  });
  return `${TRAILS_WIDGET}?${params.toString()}`;
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function FundBankrWalletModal({
  onClose,
  theme = {},
}: {
  onClose: () => void;
  theme?: { text?: string; textDim?: string; border?: string };
}) {
  const textColor = theme.text || '#e2e8f0';
  const dimColor = theme.textDim || '#64748b';
  const borderColor = theme.border || '#1e293b';

  const [bankrKey, setBankrKey] = useState('');
  const [bankrKeyInput, setBankrKeyInput] = useState('');
  const [trailsKey, setTrailsKey] = useState('');
  const [trailsKeyInput, setTrailsKeyInput] = useState('');
  const [showBankrInput, setShowBankrInput] = useState(false);
  const [showTrailsInput, setShowTrailsInput] = useState(false);

  const [walletAddress, setWalletAddress] = useState('');
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [walletError, setWalletError] = useState('');

  const [selectedPreset, setSelectedPreset] = useState<DestinationPreset>(DESTINATION_PRESETS[0]);
  const [copied, setCopied] = useState(false);

  // Hydrate keys from sessionStorage on mount
  useEffect(() => {
    const savedBankr = sessionStorage.getItem(SESSION_KEY);
    if (savedBankr) setBankrKey(savedBankr);
    const savedTrails = sessionStorage.getItem(TRAILS_KEY_SESSION);
    if (savedTrails) setTrailsKey(savedTrails);
  }, []);

  // Auto-fetch wallet whenever bankrKey is set
  useEffect(() => {
    if (!bankrKey) {
      setWalletAddress('');
      return;
    }
    setLoadingWallet(true);
    setWalletError('');
    fetchBankrWallet(bankrKey)
      .then(addr => setWalletAddress(addr))
      .catch(err => setWalletError(err.message || 'Failed to fetch wallet'))
      .finally(() => setLoadingWallet(false));
  }, [bankrKey]);

  const saveBankrKey = useCallback(() => {
    if (!bankrKeyInput.startsWith('bk_')) return;
    sessionStorage.setItem(SESSION_KEY, bankrKeyInput);
    setBankrKey(bankrKeyInput);
    setShowBankrInput(false);
    setBankrKeyInput('');
  }, [bankrKeyInput]);

  const saveTrailsKey = useCallback(() => {
    if (!trailsKeyInput.trim()) return;
    sessionStorage.setItem(TRAILS_KEY_SESSION, trailsKeyInput);
    setTrailsKey(trailsKeyInput);
    setShowTrailsInput(false);
    setTrailsKeyInput('');
  }, [trailsKeyInput]);

  const fundingUrl = walletAddress && trailsKey
    ? buildTrailsFundingUrl(walletAddress, selectedPreset, trailsKey)
    : '';

  const copyUrl = useCallback(async () => {
    if (!fundingUrl) return;
    try {
      await navigator.clipboard.writeText(fundingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available — user can still click the link */
    }
  }, [fundingUrl]);

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
        border: '2px solid #a78bfa',
        borderRadius: 16,
        width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 0 40px rgba(167,139,250,0.15)',
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(167,139,250,0.1)',
          borderBottom: '2px solid rgba(167,139,250,0.3)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🌉</span>
            <span style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9, color: '#a78bfa',
            }}>
              Fund Bankr Wallet
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: dimColor, cursor: 'pointer', fontSize: 18,
          }}>✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Intro */}
          <div style={{
            fontFamily: 'monospace', fontSize: 12, color: dimColor,
            lineHeight: 1.5,
          }}>
            Top up your Bankr agent wallet from any token on any chain.
            Trails finds the optimal route — bridges, swaps, multi-hop — and
            you sign from your own wallet.
          </div>

          {/* ── Bankr key ── */}
          <div>
            {label('1. Bankr API Key')}
            {bankrKey ? (
              <div style={{
                background: 'rgba(249,115,22,0.08)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#22c55e', marginBottom: 3 }}>
                    ✅ Connected
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor }}>
                    {bankrKey.slice(0, 8)}•••••• (session only)
                  </div>
                </div>
                <button onClick={() => {
                  sessionStorage.removeItem(SESSION_KEY);
                  setBankrKey('');
                  setWalletAddress('');
                }} style={{
                  background: 'transparent', border: `1px solid ${borderColor}`,
                  color: dimColor, borderRadius: 4, padding: '3px 8px',
                  cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
                }}>Clear</button>
              </div>
            ) : showBankrInput ? (
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
                    color: textColor, fontFamily: 'monospace', fontSize: 12, outline: 'none',
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
            ) : (
              <button onClick={() => setShowBankrInput(true)} style={{
                background: 'transparent', border: `1px solid #F97316`,
                color: '#F97316', borderRadius: 6, padding: '8px 14px',
                cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                width: '100%',
              }}>
                🔑 Enter Bankr Key
              </button>
            )}
          </div>

          {/* ── Wallet readout ── */}
          {bankrKey && (
            <div>
              {label('Detected Wallet (destination)')}
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: `1px solid ${borderColor}`,
                borderRadius: 6, padding: '10px 12px',
                fontFamily: 'monospace', fontSize: 11, color: textColor,
                wordBreak: 'break-all',
              }}>
                {loadingWallet ? '⏳ Fetching...' :
                 walletError ? <span style={{ color: '#ef4444' }}>❌ {walletError}</span> :
                 walletAddress || '—'}
              </div>
            </div>
          )}

          {/* ── Trails key ── */}
          <div>
            {label('2. Trails API Key')}
            {trailsKey ? (
              <div style={{
                background: 'rgba(167,139,250,0.08)',
                border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#22c55e', marginBottom: 3 }}>
                    ✅ Set
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor }}>
                    {trailsKey.slice(0, 6)}•••••• (session only)
                  </div>
                </div>
                <button onClick={() => {
                  sessionStorage.removeItem(TRAILS_KEY_SESSION);
                  setTrailsKey('');
                }} style={{
                  background: 'transparent', border: `1px solid ${borderColor}`,
                  color: dimColor, borderRadius: 4, padding: '3px 8px',
                  cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
                }}>Clear</button>
              </div>
            ) : showTrailsInput ? (
              <div>
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
                      color: textColor, fontFamily: 'monospace', fontSize: 12, outline: 'none',
                    }}
                  />
                  <button onClick={saveTrailsKey}
                    disabled={!trailsKeyInput.trim()}
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
                  🔒 Stored in browser session only. Get your key at{' '}
                  <a href="https://sequence.build" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#a78bfa' }}>sequence.build</a>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowTrailsInput(true)} style={{
                background: 'transparent', border: `1px solid #a78bfa`,
                color: '#a78bfa', borderRadius: 6, padding: '8px 14px',
                cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                width: '100%',
              }}>
                🔑 Enter Trails Key
              </button>
            )}
          </div>

          {/* ── Destination preset ── */}
          {bankrKey && trailsKey && walletAddress && (
            <div>
              {label('3. Destination Token')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DESTINATION_PRESETS.map(preset => (
                  <button key={preset.label} onClick={() => setSelectedPreset(preset)}
                    style={{
                      background: selectedPreset.label === preset.label ? `${preset.color}22` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedPreset.label === preset.label ? preset.color : borderColor}`,
                      color: selectedPreset.label === preset.label ? preset.color : textColor,
                      borderRadius: 6, padding: '8px 12px',
                      cursor: 'pointer',
                      fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                      display: 'flex', alignItems: 'center', gap: 8,
                      textAlign: 'left',
                    }}>
                    <span style={{ fontSize: 14 }}>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Final URL + open button ── */}
          {fundingUrl && (
            <div style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 8, padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#22c55e' }}>
                ✓ Ready — open the Trails widget
              </div>
              <a href={fundingUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  background: '#22c55e', color: '#0a0e1a',
                  borderRadius: 6, padding: '10px 14px',
                  fontFamily: '"Press Start 2P", monospace', fontSize: 8,
                  textDecoration: 'none', textAlign: 'center', fontWeight: 700,
                }}>
                🚀 Open Trails Widget
              </a>
              <button onClick={copyUrl} style={{
                background: 'transparent', border: `1px solid ${borderColor}`,
                color: dimColor, borderRadius: 6, padding: '6px 10px',
                cursor: 'pointer', fontFamily: 'monospace', fontSize: 11,
              }}>
                {copied ? '✓ Copied' : '📋 Copy URL'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Trigger button ──────────────────────────────────────────────────────────

export function FundBankrWalletButton({
  theme = {},
}: {
  theme?: { text?: string; border?: string };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'rgba(167,139,250,0.15)',
          border: '2px solid rgba(167,139,250,0.5)',
          color: '#c4b5fd', borderRadius: 8, padding: '6px 12px',
          cursor: 'pointer',
          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(167,139,250,0.3)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(167,139,250,0.15)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        🌉 Fund Wallet
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <FundBankrWalletModal onClose={() => setOpen(false)} theme={theme} />,
        document.body,
      )}
    </>
  );
}
