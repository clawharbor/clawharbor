'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Agent } from './types';

/**
 * Agent Burnout System
 *
 * Agents that work too long accumulate "burnout" (0–100).
 * Visual effects: desaturated colors, eye bags, coffee addiction, flames.
 * Recovery happens automatically when agent goes idle.
 */

export type BurnoutLevel = 'fresh' | 'tired' | 'drained' | 'burnout' | 'crispy';

export interface AgentBurnout {
  agentId: string;
  level: number;
  stage: BurnoutLevel;
  workingStreak: number;
  coffeeCount: number;
  lastRecoveryAt: number;
}

const BURNOUT_THRESHOLDS: Record<BurnoutLevel, number> = {
  fresh: 0,
  tired: 25,
  drained: 50,
  burnout: 75,
  crispy: 90,
};

export const STAGE_LABELS: Record<BurnoutLevel, string> = {
  fresh: '✨ Fresh',
  tired: '😑 Tired',
  drained: '😮‍💨 Drained',
  burnout: '🔥 Burnout',
  crispy: '💀 Crispy',
};

const STAGE_COLORS: Record<BurnoutLevel, string> = {
  fresh: '#22c55e',
  tired: '#eab308',
  drained: '#f97316',
  burnout: '#ef4444',
  crispy: '#7f1d1d',
};

export const BURNOUT_THOUGHTS: Record<BurnoutLevel, string[]> = {
  fresh: ['Ready to ship! 🚀', "Let's do this!", 'Full power mode ⚡'],
  tired: ['Could use a coffee...', 'Almost lunchtime?', 'My keyboard is heavy today'],
  drained: ['Send help ☕', 'What day is it?', 'I used to be normal'],
  burnout: ['Is this the real life?', 'My eyes are burning', 'ctrl+z my whole life'],
  crispy: ['...', 'system.exe has stopped', 'I am become debug, destroyer of PRs'],
};

function getBurnoutStage(level: number): BurnoutLevel {
  if (level >= BURNOUT_THRESHOLDS.crispy) return 'crispy';
  if (level >= BURNOUT_THRESHOLDS.burnout) return 'burnout';
  if (level >= BURNOUT_THRESHOLDS.drained) return 'drained';
  if (level >= BURNOUT_THRESHOLDS.tired) return 'tired';
  return 'fresh';
}

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

/** Stable float 0–1 derived from agentId string, avoids Math.random() in render */
function stableFloat(agentId: string): number {
  let hash = 0;
  for (let i = 0; i < agentId.length; i++) {
    hash = ((hash * 31) + agentId.charCodeAt(i)) >>> 0;
  }
  return (hash % 100) / 100;
}

// ─── Burnout Visual Overlay ───────────────────────────────────────────────────

export function BurnoutOverlay({
  burnout,
  size = 1,
}: {
  burnout: AgentBurnout;
  size?: number;
}) {
  const s = 4 * size;
  const { stage, level, coffeeCount, agentId } = burnout;

  if (stage === 'fresh') return null;

  const desaturation = Math.min(level, 80);
  const animDuration = (1.5 + stableFloat(agentId) * 0.8).toFixed(2);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Desaturation overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(100,100,100,${desaturation / 200})`,
          mixBlendMode: 'saturation' as React.CSSProperties['mixBlendMode'],
          borderRadius: 4,
        }}
      />

      {/* Eye bags — tired+ */}
      {(stage === 'tired' || stage === 'drained' || stage === 'burnout' || stage === 'crispy') && (
        <>
          <div
            style={{
              position: 'absolute',
              top: s * 3.8,
              left: s * 2,
              width: s * 0.8,
              height: s * 0.25,
              background: 'rgba(139,69,19,0.4)',
              borderRadius: s * 0.15,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: s * 3.8,
              left: s * 5.2,
              width: s * 0.8,
              height: s * 0.25,
              background: 'rgba(139,69,19,0.4)',
              borderRadius: s * 0.15,
            }}
          />
        </>
      )}

      {/* Floating coffee — drained+ */}
      {coffeeCount > 0 && (stage === 'drained' || stage === 'burnout' || stage === 'crispy') && (
        <div
          style={{
            position: 'absolute',
            top: -s * 2,
            right: -s,
            fontSize: s * 2.5,
            animation: `burnoutCoffeeFloat ${animDuration}s ease-in-out infinite`,
            opacity: 0.85,
          }}
        >
          ☕
          {coffeeCount > 1 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                background: '#ef4444',
                color: '#fff',
                fontSize: s * 1.2,
                borderRadius: '50%',
                width: s * 1.8,
                height: s * 1.8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {coffeeCount}
            </span>
          )}
        </div>
      )}

      {/* Flames — crispy */}
      {stage === 'crispy' && (
        <>
          <div
            style={{
              position: 'absolute',
              top: -s * 3,
              left: s * 2,
              fontSize: s * 2.5,
              animation: 'burnoutFlame 0.6s ease-in-out infinite',
            }}
          >
            🔥
          </div>
          <div
            style={{
              position: 'absolute',
              top: -s * 2,
              left: s * 5,
              fontSize: s * 2,
              animation: 'burnoutFlame 0.8s ease-in-out infinite reverse',
            }}
          >
            🔥
          </div>
        </>
      )}

      {/* Smoke — burnout */}
      {stage === 'burnout' && (
        <div
          style={{
            position: 'absolute',
            top: -s * 2.5,
            left: s * 3,
            fontSize: s * 2,
            animation: 'burnoutSmoke 2s ease-in-out infinite',
            opacity: 0.7,
          }}
        >
          💨
        </div>
      )}

      <style>{`
        @keyframes burnoutCoffeeFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-${s * 1.5}px) rotate(5deg); }
        }
        @keyframes burnoutFlame {
          0%, 100% { transform: scale(1) rotate(-5deg); }
          50% { transform: scale(1.2) rotate(5deg); }
        }
        @keyframes burnoutSmoke {
          0% { transform: translateY(0) scale(1); opacity: 0.7; }
          100% { transform: translateY(-${s * 4}px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Burnout Badge ────────────────────────────────────────────────────────────

export function BurnoutBadge({
  burnout,
  size = 1,
}: {
  burnout: AgentBurnout;
  size?: number;
}) {
  if (burnout.stage === 'fresh') return null;
  const color = STAGE_COLORS[burnout.stage];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        background: `${color}22`,
        border: `1px solid ${color}66`,
        borderRadius: 4 * size,
        padding: `${1 * size}px ${4 * size}px`,
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 6 * size,
        color,
      }}
    >
      {STAGE_LABELS[burnout.stage]}
    </div>
  );
}

// ─── Burnout Panel ────────────────────────────────────────────────────────────

export function BurnoutPanel({
  burnouts,
  agents,
  onGiveBreak,
  theme = {},
}: {
  burnouts: Map<string, AgentBurnout>;
  agents: Agent[];
  onGiveBreak: (agentId: string) => void;
  theme?: { text?: string; textDim?: string; bgSecondary?: string; border?: string };
}) {
  const textColor = theme.text || '#e2e8f0';
  const dimColor = theme.textDim || '#64748b';
  const borderColor = theme.border || '#1e293b';

  const agentsWithBurnout = agents
    .map((a) => ({ agent: a, burnout: burnouts.get(a.id) }))
    .filter(({ burnout }) => burnout && burnout.stage !== 'fresh')
    .sort((a, b) => (b.burnout?.level ?? 0) - (a.burnout?.level ?? 0));

  if (agentsWithBurnout.length === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(127,29,29,0.15)',
        border: '2px solid rgba(239,68,68,0.3)',
        borderRadius: 12,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12 }}>🔥</span>
        <span
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: '#fca5a5',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Burnout Alert
        </span>
      </div>

      {agentsWithBurnout.map(({ agent, burnout }) => {
        if (!burnout) return null;
        const color = STAGE_COLORS[burnout.stage];
        return (
          <div
            key={agent.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              background: `${color}11`,
              borderLeft: `2px solid ${color}`,
              borderRadius: 4,
            }}
          >
            <span style={{ fontSize: 16 }}>{agent.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 7,
                    color: textColor,
                  }}
                >
                  {agent.name}
                </span>
                <span
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 6,
                    color,
                  }}
                >
                  {STAGE_LABELS[burnout.stage]}
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${burnout.level}%`,
                    background: color,
                    borderRadius: 2,
                    transition: 'width 0.5s ease',
                    boxShadow: `0 0 6px ${color}`,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontFamily: 'monospace',
                  fontSize: 8,
                  color: dimColor,
                }}
              >
                {burnout.workingStreak} ticks • {burnout.coffeeCount} ☕
              </div>
            </div>
            <button
              onClick={() => onGiveBreak(agent.id)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: `1px solid ${borderColor}`,
                color: textColor,
                borderRadius: 4,
                padding: '3px 6px',
                fontSize: 8,
                cursor: 'pointer',
                fontFamily: '"Press Start 2P", monospace',
                whiteSpace: 'nowrap',
              }}
            >
              💤 Rest
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── useBurnout Hook ──────────────────────────────────────────────────────────

export function useBurnout(agents: Agent[]) {
  const [burnouts, setBurnouts] = useState<Map<string, AgentBurnout>>(new Map());
  const [burnoutThoughts, setBurnoutThoughts] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const tick = () => {
      setBurnouts((prev) => {
        const next = new Map(prev);
        agents.forEach((agent) => {
          const current: AgentBurnout = next.get(agent.id) ?? {
            agentId: agent.id,
            level: 0,
            stage: 'fresh',
            workingStreak: 0,
            coffeeCount: 0,
            lastRecoveryAt: Date.now(),
          };

          let { level: newLevel, workingStreak: newStreak, coffeeCount: newCoffee } = current;

          if (agent.status === 'working') {
            const increment = agent.mood === 'stressed' ? 4 : 2;
            newLevel = Math.min(100, newLevel + increment);
            newStreak += 1;
            // Deterministic coffee acquisition — no Math.random()
            if (newLevel > 50 && ((newStreak * 7 + agent.id.charCodeAt(0)) % 10) < 3) {
              newCoffee = Math.min(newCoffee + 1, 9);
            }
          } else {
            const recovery = newLevel > 75 ? 3 : newLevel > 50 ? 5 : 8;
            newLevel = Math.max(0, newLevel - recovery);
            newStreak = 0;
          }

          next.set(agent.id, {
            ...current,
            level: newLevel,
            stage: getBurnoutStage(newLevel),
            workingStreak: newStreak,
            coffeeCount: newCoffee,
          });
        });
        return next;
      });
    };

    const interval = setInterval(tick, 60000);
    const first = setTimeout(tick, 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(first);
    };
  }, [agents]);

  useEffect(() => {
    const updateThoughts = () => {
      setBurnoutThoughts((prev) => {
        const next = new Map(prev);
        burnouts.forEach((burnout, agentId) => {
          if (burnout.stage !== 'fresh') {
            const thoughts = BURNOUT_THOUGHTS[burnout.stage];
            next.set(agentId, pickRandom(thoughts, Date.now() + agentId.charCodeAt(0)));
          }
        });
        return next;
      });
    };
    const interval = setInterval(updateThoughts, 30000);
    updateThoughts();
    return () => clearInterval(interval);
  }, [burnouts]);

  const giveBreak = useCallback((agentId: string) => {
    setBurnouts((prev) => {
      const next = new Map(prev);
      const current = next.get(agentId);
      if (current) {
        const newLevel = Math.max(0, current.level - 30);
        next.set(agentId, {
          ...current,
          level: newLevel,
          workingStreak: 0,
          stage: getBurnoutStage(newLevel),
          lastRecoveryAt: Date.now(),
        });
      }
      return next;
    });
  }, []);

  return { burnouts, burnoutThoughts, giveBreak };
}
