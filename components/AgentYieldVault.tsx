'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Agent Yield Vault — Discover Aave/Morpho pools where agent salaries can earn yield
 *
 * Read-only by design (for now): we display the pools, APYs, and TVLs returned
 * by Trails GetEarnPools, plus a one-click link to deposit via the Trails widget.
 *
 * We don't broadcast deposit/approve transactions from this component because:
 *   (a) it would require @bankr/cli + viem (new deps), and
 *   (b) sending a deposit-on-behalf-of-agent flow needs UX guardrails we can
 *       add later (confirmation, gas estimates, agent allowlist).
 *
 * The Trails widget URL handles the approve+deposit step in the user's wallet,
 * which is the same trust boundary used by FundBankrWalletButton.
 */

const TRAILS_KEY_SESSION = 'clawharbor_trails_key';
const TRAILS_WIDGET = 'https://demo.trails.build/';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EarnPool {
  protocol: string;
  chainId: number;
  apy: number;
  tvl: number;
  token: { symbol: string; address: string; decimals?: number };
  depositAddress: string;
  name?: string;
  isActive: boolean;
}

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  10: 'Optimism',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum',
};

const PROTOCOL_COLORS: Record<string, string> = {
  'aave-v3': '#B6509E',
  'aave': '#B6509E',
  'morpho': '#2470FF',
  'compound': '#00D395',
};

// ─── Modal ───────────────────────────────────────────────────────────────────

export function AgentYieldVaultModal({
  onClose,
  theme = {},
}: {
  onClose: () => void;
  theme?: { text?: string; textDim?: string; border?: string };
}) {
  const textColor = theme.text || '#e2e8f0';
  const dimColor = theme.textDim || '#64748b';
  const borderColor = theme.border || '#1e293b';

  const [trailsKey, setTrailsKey] = useState('');
  const [trailsKeyInput, setTrailsKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [pools, setPools] = useState<EarnPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedChain, setSelectedChain] = useState<'all' | 8453 | 137>('all');
  const [tokenFilter, setTokenFilter] = useState<string>('USDC');

  useEffect(() => {
    const saved = sessionStorage.getItem(TRAILS_KEY_SESSION);
    if (saved) setTrailsKey(saved);
  }, []);

  const saveKey = useCallback(() => {
    if (!trailsKeyInput.trim()) return;
    sessionStorage.setItem(TRAILS_KEY_SESSION, trailsKeyInput);
    setTrailsKey(trailsKeyInput);
    setShowKeyInput(false);
    setTrailsKeyInput('');
  }, [trailsKeyInput]);

  const fetchPools = useCallback(async () => {
    if (!trailsKey) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payroll/trails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'earn-pools',
          trailsApiKey: trailsKey,
          chainIds: [8453, 137],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to fetch pools');
      setPools(data.pools || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pools');
    } finally {
      setLoading(false);
    }
  }, [trailsKey]);

  // Auto-fetch on first mount when key present
  useEffect(() => {
    if (trailsKey && pools.length === 0 && !loading) {
      fetchPools();
    }
  }, [trailsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredPools = pools.filter(p => {
    if (selectedChain !== 'all' && p.chainId !== selectedChain) return false;
    if (tokenFilter && p.token?.symbol !== tokenFilter) return false;
    return true;
  });

  const buildDepositWidgetUrl = (pool: EarnPool): string => {
    // Open the Trails widget with the pool's underlying token preselected.
    // The user's wallet completes the approve + deposit via the widget UI.
    const params = new URLSearchParams({
      mode: 'swap',
      toChainId: String(pool.chainId),
      toToken: pool.token.address,
      apiKey: trailsKey,
      theme: 'dark',
    });
    return `${TRAILS_WIDGET}?${params.toString()}`;
  };

  const formatTvl = (tvl: number): string => {
    if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
    if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
    if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(1)}K`;
    return `$${tvl.toFixed(0)}`;
  };

  const formatApy = (apy: number): string => `${(apy * 100).toFixed(2)}%`;

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
        border: '2px solid #eab308',
        borderRadius: 16,
        width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 0 40px rgba(234,179,8,0.15)',
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(234,179,8,0.1)',
          borderBottom: '2px solid rgba(234,179,8,0.3)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💎</span>
            <span style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9, color: '#eab308',
            }}>
              Yield Vaults
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: dimColor, cursor: 'pointer', fontSize: 18,
          }}>✕</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ fontFamily: 'monospace', fontSize: 12, color: dimColor, lineHeight: 1.5 }}>
            Discover active yield pools (Aave, Morpho) where your agent salaries can earn passive APY.
            Pool data via Trails <code style={{ color: '#eab308' }}>GetEarnPools</code>.
          </div>

          {/* Trails key */}
          {!trailsKey ? (
            <div style={{
              background: 'rgba(234,179,8,0.08)',
              border: '1px solid rgba(234,179,8,0.3)',
              borderRadius: 8, padding: '12px 14px',
            }}>
              {showKeyInput ? (
                <div>
                  <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#eab308', marginBottom: 8 }}>
                    Enter Trails API Key
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="password"
                      value={trailsKeyInput}
                      onChange={e => setTrailsKeyInput(e.target.value)}
                      placeholder="Sequence access key..."
                      onKeyDown={e => e.key === 'Enter' && saveKey()}
                      style={{
                        flex: 1, background: 'rgba(0,0,0,0.4)',
                        border: `1px solid #eab308`,
                        borderRadius: 6, padding: '8px 10px',
                        color: textColor, fontFamily: 'monospace', fontSize: 12, outline: 'none',
                      }}
                    />
                    <button onClick={saveKey} disabled={!trailsKeyInput.trim()}
                      style={{
                        background: trailsKeyInput.trim() ? 'rgba(234,179,8,0.2)' : 'transparent',
                        border: `1px solid ${trailsKeyInput.trim() ? '#eab308' : borderColor}`,
                        color: trailsKeyInput.trim() ? '#eab308' : dimColor,
                        borderRadius: 6, padding: '8px 12px',
                        cursor: trailsKeyInput.trim() ? 'pointer' : 'not-allowed',
                        fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                      }}>Save</button>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor, marginTop: 6 }}>
                    🔒 Session only. Get key at{' '}
                    <a href="https://sequence.build" target="_blank" rel="noopener noreferrer"
                      style={{ color: '#eab308' }}>sequence.build</a>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowKeyInput(true)} style={{
                  background: 'transparent', border: `1px solid #eab308`,
                  color: '#eab308', borderRadius: 6, padding: '8px 14px',
                  cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: 7,
                  width: '100%',
                }}>
                  🔑 Enter Trails Key to Discover Pools
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  {label('Chain')}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {([
                      { v: 'all', t: 'All' },
                      { v: 8453, t: 'Base' },
                      { v: 137, t: 'Polygon' },
                    ] as const).map(opt => (
                      <button key={String(opt.v)} onClick={() => setSelectedChain(opt.v as any)}
                        style={{
                          background: selectedChain === opt.v ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${selectedChain === opt.v ? '#eab308' : borderColor}`,
                          color: selectedChain === opt.v ? '#eab308' : textColor,
                          borderRadius: 4, padding: '5px 10px',
                          cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                        }}>{opt.t}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {label('Token')}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {['USDC', 'USDT', 'ETH', 'WETH'].map(sym => (
                      <button key={sym} onClick={() => setTokenFilter(tokenFilter === sym ? '' : sym)}
                        style={{
                          background: tokenFilter === sym ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${tokenFilter === sym ? '#22c55e' : borderColor}`,
                          color: tokenFilter === sym ? '#22c55e' : textColor,
                          borderRadius: 4, padding: '5px 10px',
                          cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                        }}>{sym}</button>
                    ))}
                  </div>
                </div>
                <button onClick={fetchPools} disabled={loading}
                  style={{
                    background: 'rgba(167,139,250,0.15)',
                    border: '1px solid #a78bfa', color: '#a78bfa',
                    borderRadius: 6, padding: '8px 12px',
                    cursor: loading ? 'wait' : 'pointer',
                    fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                    opacity: loading ? 0.6 : 1,
                  }}>
                  {loading ? '⏳' : '🔄'} Refresh
                </button>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 6, padding: '10px 14px',
                  fontFamily: 'monospace', fontSize: 11, color: '#fca5a5',
                }}>❌ {error}</div>
              )}

              {/* Pool list */}
              {loading && pools.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: dimColor, fontFamily: 'monospace', fontSize: 12 }}>
                  ⏳ Loading pools…
                </div>
              ) : filteredPools.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: dimColor, fontFamily: 'monospace', fontSize: 12 }}>
                  No pools match the current filter.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredPools.slice(0, 12).map((pool, i) => {
                    const protocolColor = PROTOCOL_COLORS[pool.protocol?.toLowerCase()] || '#a78bfa';
                    return (
                      <div key={`${pool.depositAddress}-${i}`}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${borderColor}`,
                          borderRadius: 8, padding: '12px 14px',
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                        {/* Protocol badge */}
                        <div style={{
                          background: `${protocolColor}22`,
                          border: `1px solid ${protocolColor}`,
                          borderRadius: 4, padding: '4px 8px',
                          fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                          color: protocolColor,
                          minWidth: 70, textAlign: 'center',
                          textTransform: 'uppercase',
                        }}>
                          {pool.protocol}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 13, color: textColor, fontWeight: 600, marginBottom: 2 }}>
                            {pool.token?.symbol} on {CHAIN_NAMES[pool.chainId] || `chain ${pool.chainId}`}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 10, color: dimColor }}>
                            TVL {formatTvl(pool.tvl || 0)}
                          </div>
                        </div>

                        {/* APY */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 16, color: '#22c55e', fontWeight: 700 }}>
                            {formatApy(pool.apy || 0)}
                          </div>
                          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: dimColor }}>
                            APY
                          </div>
                        </div>

                        {/* Deposit link */}
                        <a href={buildDepositWidgetUrl(pool)} target="_blank" rel="noopener noreferrer"
                          style={{
                            background: 'rgba(34,197,94,0.15)',
                            border: '1px solid #22c55e', color: '#22c55e',
                            borderRadius: 4, padding: '6px 10px',
                            fontFamily: '"Press Start 2P", monospace', fontSize: 6,
                            textDecoration: 'none',
                          }}>
                          Deposit ↗
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer note */}
              <div style={{
                fontFamily: 'monospace', fontSize: 10, color: dimColor,
                borderTop: `1px solid ${borderColor}`, paddingTop: 10, lineHeight: 1.5,
              }}>
                💡 Deposits open the Trails widget — you sign approve + supply from your own wallet.
                APY values from the underlying protocol; subject to change.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Trigger button ──────────────────────────────────────────────────────────

export function AgentYieldVaultButton({
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
          background: 'rgba(234,179,8,0.15)',
          border: '2px solid rgba(234,179,8,0.5)',
          color: '#fde68a', borderRadius: 8, padding: '6px 12px',
          cursor: 'pointer',
          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(234,179,8,0.3)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(234,179,8,0.15)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        💎 Yield Vaults
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <AgentYieldVaultModal onClose={() => setOpen(false)} theme={theme} />,
        document.body,
      )}
    </>
  );
}
