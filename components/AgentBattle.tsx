'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Agent } from './types';

/**
 * Agent vs Agent Battles
 *
 * Two agents "debate" a topic. Users vote for the winner.
 * Results tracked on a battle leaderboard — agents gain/lose XP.
 * Topics range from technical to silly. Highly engaging, shareable.
 *
 * Uses the Anthropic API to generate real debate arguments.
 */

export interface BattleArgument {
  agentId: string;
  agentName: string;
  argument: string;
  round: number;
  ts: number;
}

export interface Battle {
  id: string;
  topic: string;
  agent1: Agent;
  agent2: Agent;
  agent1Position: string; // e.g. "FOR"
  agent2Position: string; // e.g. "AGAINST"
  arguments: BattleArgument[];
  status: 'pending' | 'arguing' | 'voting' | 'finished';
  votes: { agent1: number; agent2: number };
  winner?: string;
  startedAt: number;
  finishedAt?: number;
}

export type BattleRecord = {
  agentId: string;
  wins: number;
  losses: number;
  totalVotes: number;
};

const BATTLE_TOPICS = [
  { topic: 'Tabs vs Spaces', pos1: 'TABS GANG', pos2: 'SPACES MASTER RACE' },
  { topic: 'Should we rewrite everything in Rust?', pos1: 'YES, OBVIOUSLY', pos2: 'PLEASE NO' },
  { topic: 'Is it ok to push directly to main?', pos1: 'YOLO MAIN', pos2: 'BRANCH OR BUST' },
  { topic: 'The best variable name for a counter', pos1: 'i is iconic', pos2: 'counter is readable' },
  { topic: 'Coffee vs Tea for developers', pos1: 'COFFEE SUPREMACY', pos2: 'TEA IS SUPERIOR' },
  { topic: 'Dark mode vs Light mode', pos1: 'DARK SIDE WINS', pos2: 'LIGHT MODE ENLIGHTENMENT' },
  { topic: 'Comments in code: helpful or clutter?', pos1: 'COMMENT EVERYTHING', pos2: 'CODE IS SELF-DOCUMENTING' },
  { topic: 'Should you test your own code?', pos1: 'ALWAYS TEST', pos2: 'TESTS ARE THE USERS\' JOB' },
  { topic: 'Single responsibility principle: overrated?', pos1: 'SRPS ARE SACRED', pos2: 'ONE GOD CLASS TO RULE THEM' },
  { topic: 'The ideal meeting duration', pos1: '5 MINUTES MAX', pos2: 'MEETINGS ARE WORK' },
];

function pickRandom<T>(arr: T[], seed?: number): T {
  const idx = seed !== undefined ? Math.abs(seed) % arr.length : Math.floor(Math.random() * arr.length);
  return arr[idx];
}

// === useBattle Hook ===
export function useBattle(agents: Agent[]) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [battleRecords, setBattleRecords] = useState<Map<string, BattleRecord>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const startBattle = useCallback(async (agent1: Agent, agent2: Agent) => {
    if (agents.length < 2) return;

    const topicData = pickRandom(BATTLE_TOPICS);

    const newBattle: Battle = {
      id: `battle-${Date.now()}`,
      topic: topicData.topic,
      agent1,
      agent2,
      agent1Position: topicData.pos1,
      agent2Position: topicData.pos2,
      arguments: [],
      status: 'arguing',
      votes: { agent1: 0, agent2: 0 },
      startedAt: Date.now(),
    };

    setBattle(newBattle);
    setHasVoted(false);
    setIsLoading(true);

    try {
      // Generate opening arguments via Anthropic API
      const response = await fetch('/api/demo/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicData.topic,
          agent1: { name: agent1.name, role: agent1.role, position: topicData.pos1 },
          agent2: { name: agent2.name, role: agent2.role, position: topicData.pos2 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Normalize agentIds from API (name-based) to actual agent IDs, and add ts
        const now = Date.now();
        const normalizedArgs: BattleArgument[] = (data.arguments || []).map(
          (arg: Omit<BattleArgument, 'ts'>, i: number) => ({
            ...arg,
            ts: now + i * 500,
            agentId: arg.agentName === agent1.name ? agent1.id : agent2.id,
          })
        );
        setBattle(prev => prev ? {
          ...prev,
          arguments: normalizedArgs,
          status: 'voting',
        } : null);
      } else {
        // Fallback: generate locally without API
        const fallback = generateFallbackArguments(newBattle);
        setBattle(prev => prev ? { ...prev, arguments: fallback, status: 'voting' } : null);
      }
    } catch {
      const fallback = generateFallbackArguments(newBattle);
      setBattle(prev => prev ? { ...prev, arguments: fallback, status: 'voting' } : null);
    } finally {
      setIsLoading(false);
    }
  }, [agents]);

  const vote = useCallback((votedForAgentId: string) => {
    if (hasVoted || !battle || battle.status !== 'voting') return;
    setHasVoted(true);

    setBattle(prev => {
      if (!prev) return null;
      const newVotes = {
        agent1: prev.votes.agent1 + (votedForAgentId === prev.agent1.id ? 1 : 0),
        agent2: prev.votes.agent2 + (votedForAgentId === prev.agent2.id ? 1 : 0),
      };
      const winner = newVotes.agent1 > newVotes.agent2
        ? prev.agent1.id
        : newVotes.agent2 > newVotes.agent1
          ? prev.agent2.id
          : 'draw';

      // Update records
      setBattleRecords(records => {
        const next = new Map(records);
        const updateRecord = (agentId: string, won: boolean) => {
          const r = next.get(agentId) ?? { agentId, wins: 0, losses: 0, totalVotes: 0 };
          next.set(agentId, {
            ...r,
            wins: r.wins + (won ? 1 : 0),
            losses: r.losses + (won ? 0 : 1),
            totalVotes: r.totalVotes + (agentId === votedForAgentId ? 1 : 0),
          });
        };
        updateRecord(prev.agent1.id, winner === prev.agent1.id);
        updateRecord(prev.agent2.id, winner === prev.agent2.id);
        return next;
      });

      return { ...prev, votes: newVotes, status: 'finished', winner, finishedAt: Date.now() };
    });
  }, [hasVoted, battle]);

  const dismissBattle = useCallback(() => {
    setBattle(null);
    setHasVoted(false);
  }, []);

  const randomBattle = useCallback(() => {
    if (agents.length < 2) return;
    const shuffled = [...agents].sort(() => Math.random() - 0.5);
    startBattle(shuffled[0], shuffled[1]);
  }, [agents, startBattle]);

  return { battle, battleRecords, isLoading, hasVoted, startBattle, vote, dismissBattle, randomBattle };
}

// Fallback argument generator (no API needed)
function generateFallbackArguments(battle: Battle): BattleArgument[] {
  const { agent1, agent2, topic, agent1Position, agent2Position } = battle;

  const openers: Record<string, string[]> = {
    [agent1.id]: [
      `Look, as a ${agent1.role}, I deal with this every day. ${agent1Position} is the only logical choice. The evidence is overwhelming.`,
      `I've processed thousands of tasks on this. ${agent1Position} saves time, reduces errors, and makes everyone happier. End of discussion.`,
      `${agent1.name} checking in with a hot take: ${agent1Position}. If you disagree, I'd love to see your benchmark data.`,
    ],
    [agent2.id]: [
      `Respectfully, ${agent2.name} disagrees. ${agent2Position} is objectively superior and I have citations.`,
      `As a ${agent2.role}, I've seen what ${agent1Position} does to a codebase. ${agent2Position} every time, no contest.`,
      `Classic ${agent1.name} take. ${agent2Position} is the answer. I have 47 data points to prove it.`,
    ],
  };

  const rebuttals: Record<string, string[]> = {
    [agent1.id]: [
      `${agent2.name}'s "data" is just vibes with a spreadsheet. ${agent1Position} has been proven in production. At scale.`,
      `I respect the effort but that argument has more holes than my last PR review. ${agent1Position} wins.`,
    ],
    [agent2.id]: [
      `${agent1.name} said "end of discussion" which means they know they're losing. ${agent2Position} stands.`,
      `Production is not a benchmark. I need reproducibility. ${agent2Position} delivers that. Every time.`,
    ],
  };

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  return [
    { agentId: agent1.id, agentName: agent1.name, argument: pick(openers[agent1.id]), round: 1, ts: Date.now() },
    { agentId: agent2.id, agentName: agent2.name, argument: pick(openers[agent2.id]), round: 1, ts: Date.now() + 500 },
    { agentId: agent1.id, agentName: agent1.name, argument: pick(rebuttals[agent1.id]), round: 2, ts: Date.now() + 1000 },
    { agentId: agent2.id, agentName: agent2.name, argument: pick(rebuttals[agent2.id]), round: 2, ts: Date.now() + 1500 },
  ];
}

// === BattleModal Component ===
export function BattleModal({
  battle,
  isLoading,
  hasVoted,
  onVote,
  onDismiss,
  theme = {},
}: {
  battle: Battle;
  isLoading: boolean;
  hasVoted: boolean;
  onVote: (agentId: string) => void;
  onDismiss: () => void;
  theme?: { text?: string; textDim?: string; bgSecondary?: string; border?: string };
}) {
  const textColor = theme.text || '#e2e8f0';
  const dimColor = theme.textDim || '#64748b';
  const borderColor = theme.border || '#1e293b';

  const [visibleArgs, setVisibleArgs] = useState(0);

  // Reveal arguments one by one
  useEffect(() => {
    if (battle.arguments.length === 0) return;
    setVisibleArgs(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    battle.arguments.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleArgs(i + 1), i * 800));
    });
    return () => timers.forEach(clearTimeout);
  }, [battle.arguments]);

  const totalVotes = battle.votes.agent1 + battle.votes.agent2;
  const agent1Pct = totalVotes > 0 ? Math.round((battle.votes.agent1 / totalVotes) * 100) : 50;
  const agent2Pct = 100 - agent1Pct;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
    }}>
      <div style={{
        background: '#0f172a',
        border: `2px solid ${borderColor}`,
        borderRadius: 16,
        padding: '20px 24px',
        maxWidth: 580,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚔️</span>
            <span style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 9,
              color: '#fbbf24',
              textTransform: 'uppercase',
            }}>Agent Battle</span>
          </div>
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: dimColor,
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
            }}
          >×</button>
        </div>

        {/* Topic */}
        <div style={{
          textAlign: 'center',
          padding: '10px 16px',
          background: 'rgba(251,191,36,0.1)',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 8,
        }}>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#fbbf24', marginBottom: 4 }}>
            TODAY'S TOPIC
          </div>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 10, color: textColor }}>
            {battle.topic}
          </div>
        </div>

        {/* Combatants */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
          {/* Agent 1 */}
          <div style={{
            background: `${battle.agent1.color}22`,
            border: `2px solid ${battle.agent1.color}55`,
            borderRadius: 8,
            padding: '8px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{battle.agent1.emoji}</div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: textColor }}>
              {battle.agent1.name}
            </div>
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 5,
              color: battle.agent1.color,
              marginTop: 3,
              lineHeight: 1.4,
            }}>
              {battle.agent1Position}
            </div>
          </div>

          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 12,
            color: '#ef4444',
            textShadow: '0 0 10px #ef4444',
          }}>VS</div>

          {/* Agent 2 */}
          <div style={{
            background: `${battle.agent2.color}22`,
            border: `2px solid ${battle.agent2.color}55`,
            borderRadius: 8,
            padding: '8px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{battle.agent2.emoji}</div>
            <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: textColor }}>
              {battle.agent2.name}
            </div>
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 5,
              color: battle.agent2.color,
              marginTop: 3,
              lineHeight: 1.4,
            }}>
              {battle.agent2Position}
            </div>
          </div>
        </div>

        {/* Arguments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isLoading && battle.arguments.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: dimColor,
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 7,
              animation: 'battleLoading 1s ease-in-out infinite',
            }}>
              ⚔️ Agents are warming up...
            </div>
          )}

          {battle.arguments.slice(0, visibleArgs).map((arg, i) => {
            const isAgent1 = arg.agentId === battle.agent1.id;
            const agent = isAgent1 ? battle.agent1 : battle.agent2;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  flexDirection: isAgent1 ? 'row' : 'row-reverse',
                  animation: 'battleArgIn 0.4s ease-out',
                }}
              >
                <div style={{
                  fontSize: 20,
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                  marginTop: 4,
                }}>{agent.emoji}</div>
                <div style={{
                  background: `${agent.color}15`,
                  border: `1px solid ${agent.color}44`,
                  borderRadius: isAgent1 ? '0 8px 8px 8px' : '8px 0 8px 8px',
                  padding: '8px 12px',
                  maxWidth: '80%',
                }}>
                  <div style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 5,
                    color: agent.color,
                    marginBottom: 4,
                  }}>{agent.name} • Round {arg.round}</div>
                  <div style={{
                    fontSize: 11,
                    color: textColor,
                    lineHeight: 1.5,
                    fontFamily: 'system-ui, sans-serif',
                  }}>{arg.argument}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Voting */}
        {battle.status === 'voting' && visibleArgs >= battle.arguments.length && !hasVoted && (
          <div style={{
            borderTop: `1px solid ${borderColor}`,
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            animation: 'battleArgIn 0.4s ease-out',
          }}>
            <div style={{
              textAlign: 'center',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 7,
              color: '#fbbf24',
            }}>Who won the debate? Cast your vote!</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[battle.agent1, battle.agent2].map(agent => (
                <button
                  key={agent.id}
                  onClick={() => onVote(agent.id)}
                  style={{
                    background: `${agent.color}22`,
                    border: `2px solid ${agent.color}`,
                    color: agent.color,
                    borderRadius: 8,
                    padding: '10px 8px',
                    cursor: 'pointer',
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 7,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${agent.color}44`)}
                  onMouseLeave={e => (e.currentTarget.style.background = `${agent.color}22`)}
                >
                  <span style={{ fontSize: 16 }}>{agent.emoji}</span>
                  {agent.name} wins
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {(battle.status === 'finished' || hasVoted) && (
          <div style={{
            borderTop: `1px solid ${borderColor}`,
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            animation: 'battleArgIn 0.4s ease-out',
          }}>
            {battle.winner && battle.winner !== 'draw' && (
              <div style={{
                textAlign: 'center',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 8,
                color: battle.winner === battle.agent1.id ? battle.agent1.color : battle.agent2.color,
              }}>
                🏆 {battle.winner === battle.agent1.id ? battle.agent1.name : battle.agent2.name} WINS!
              </div>
            )}
            {battle.winner === 'draw' && (
              <div style={{
                textAlign: 'center',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 8,
                color: '#fbbf24',
              }}>🤝 It's a draw!</div>
            )}

            {/* Vote bar */}
            <div>
              <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${agent1Pct}%`, background: battle.agent1.color, transition: 'width 0.5s ease' }} />
                <div style={{ width: `${agent2Pct}%`, background: battle.agent2.color, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: battle.agent1.color }}>
                  {battle.agent1.name}: {agent1Pct}%
                </span>
                <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: battle.agent2.color }}>
                  {battle.agent2.name}: {agent2Pct}%
                </span>
              </div>
            </div>

            <button
              onClick={onDismiss}
              style={{
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid #6366f1',
                color: '#818cf8',
                borderRadius: 6,
                padding: '8px',
                cursor: 'pointer',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 7,
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes battleArgIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes battleLoading {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// === Battle Trigger Button (shown in office) ===
export function BattleButton({
  agents,
  onStartBattle,
  theme = {},
}: {
  agents: Agent[];
  onStartBattle: () => void;
  theme?: { text?: string; border?: string };
}) {
  if (agents.length < 2) return null;
  const textColor = theme.text || '#e2e8f0';
  const borderColor = theme.border || '#1e293b';

  return (
    <button
      onClick={onStartBattle}
      style={{
        background: 'rgba(239, 68, 68, 0.15)',
        border: '2px solid rgba(239, 68, 68, 0.5)',
        color: '#fca5a5',
        borderRadius: 8,
        padding: '6px 12px',
        cursor: 'pointer',
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 7,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.3)';
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      ⚔️ Battle
    </button>
  );
}
