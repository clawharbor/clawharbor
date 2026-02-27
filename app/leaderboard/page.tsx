'use client';

import { useState, useEffect } from 'react';
import { useDemoMode } from '../../hooks/useDemoMode';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';
import Link from 'next/link';
import type { Agent } from '../../components/types';

export default function LeaderboardPage() {
  const { isDemoMode, getApiPath } = useDemoMode();
  const authenticatedFetch = useAuthenticatedFetch();
  const secureFetch = isDemoMode ? fetch : authenticatedFetch;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [timeframe, setTimeframe] = useState<'all-time' | 'weekly'>('all-time');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const res = await secureFetch(getApiPath('/api/office'));
        const data = await res.json();
        if (data.agents) {
          setAgents(data.agents.filter((a: Agent) => a.id !== '_owner'));
        }
      } catch (err) {
        console.error('Failed to fetch agents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sort agents by XP
  const sortedAgents = [...agents].sort((a, b) => b.xp - a.xp);

  // Medal emojis
  const getMedal = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      color: '#e2e8f0',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto 32px',
        textAlign: 'center',
      }}>
        <Link href="/" style={{
          display: 'inline-block',
          marginBottom: 24,
          color: '#94a3b8',
          textDecoration: 'none',
          fontSize: 14,
        }}>
          ← Back to Office
        </Link>
        
        <h1 style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 24,
          marginBottom: 12,
          color: '#fff',
          textShadow: '0 0 20px rgba(139,92,246,0.5)',
        }}>
          🏆 Agent Leaderboard
        </h1>
        
        <p style={{
          color: '#94a3b8',
          fontSize: 14,
          marginBottom: 24,
        }}>
          Top performers ranked by total XP earned
        </p>

        {/* Timeframe Toggle */}
        <div style={{
          display: 'inline-flex',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: 4,
          gap: 4,
        }}>
          <button
            onClick={() => setTimeframe('all-time')}
            style={{
              padding: '8px 16px',
              background: timeframe === 'all-time' ? '#8b5cf6' : 'transparent',
              border: 'none',
              borderRadius: 6,
              color: timeframe === 'all-time' ? '#fff' : '#94a3b8',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            style={{
              padding: '8px 16px',
              background: timeframe === 'weekly' ? '#8b5cf6' : 'transparent',
              border: 'none',
              borderRadius: 6,
              color: timeframe === 'weekly' ? '#fff' : '#94a3b8',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: '#64748b',
            fontSize: 14,
          }}>
            Loading leaderboard...
          </div>
        ) : sortedAgents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: '#64748b',
            fontSize: 14,
          }}>
            No agents found. Start working to see rankings!
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {sortedAgents.map((agent, idx) => {
              const isTopThree = idx < 3;
              return (
                <div
                  key={agent.id}
                  style={{
                    background: isTopThree 
                      ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))'
                      : '#1e293b',
                    border: isTopThree 
                      ? '2px solid rgba(139,92,246,0.5)' 
                      : '1px solid #334155',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all 0.2s',
                    boxShadow: isTopThree 
                      ? '0 4px 20px rgba(139,92,246,0.2)' 
                      : 'none',
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    minWidth: 50,
                    textAlign: 'center',
                    fontFamily: '"Press Start 2P", monospace',
                  }}>
                    {getMedal(idx)}
                  </div>

                  {/* Agent Info */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <span style={{ fontSize: 32 }}>{agent.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#fff',
                        marginBottom: 4,
                      }}>
                        {agent.name}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#94a3b8',
                      }}>
                        {agent.role}
                      </div>
                    </div>
                  </div>

                  {/* XP Stats */}
                  <div style={{
                    textAlign: 'right',
                  }}>
                    <div style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: '#8b5cf6',
                      fontFamily: '"Press Start 2P", monospace',
                      marginBottom: 4,
                    }}>
                      {agent.xp.toLocaleString()} XP
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: '#64748b',
                      fontFamily: '"Press Start 2P", monospace',
                    }}>
                      Level {agent.level}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Card */}
      <div style={{
        maxWidth: 800,
        margin: '40px auto 0',
        padding: 20,
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 14,
          color: '#94a3b8',
          marginBottom: 12,
        }}>
          Share your leaderboard
        </div>
        <button
          onClick={() => {
            // Simple share - could enhance with screenshot later
            const text = `My clawharbor Team Leaderboard:\n\n${sortedAgents.slice(0, 3).map((a, i) => 
              `${getMedal(i)} ${a.name} - ${a.xp.toLocaleString()} XP`
            ).join('\n')}\n\nTry it: clawharbor.work`;
            navigator.clipboard.writeText(text);
            alert('Leaderboard copied to clipboard!');
          }}
          style={{
            padding: '10px 20px',
            background: '#8b5cf6',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📋 Copy to Clipboard
        </button>
      </div>
    </div>
  );
}
