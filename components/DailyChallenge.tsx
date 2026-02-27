'use client';

import { useState, useEffect } from 'react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  completed: boolean;
}

interface DailyChallengeProps {
  getApiPath: (path: string) => string;
  onCelebration?: () => void;
}

/**
 * Daily Challenge card - gives users a reason to come back every day.
 * Changes based on day-of-week for predictable variety.
 */
export function DailyChallenge({ getApiPath, onCelebration }: DailyChallengeProps) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  // Fetch today's challenge
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await fetch(getApiPath('/api/office/challenges'));
        const data = await res.json();
        setChallenge(data.challenge);
        setStreak(data.streak);
        setXp(data.xp);
      } catch (err) {
        console.error('Failed to fetch challenge:', err);
      }
    };

    fetchChallenge();
    const interval = setInterval(fetchChallenge, 5 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!challenge) {
    return null;
  }

  const progress = Math.min(100, (challenge.current / challenge.target) * 100);
  const progressColor = challenge.completed ? '#10b981' : '#8b5cf6';

  return (
    <div
      style={{
        background: challenge.completed
          ? 'rgba(16,185,129,0.08)'
          : 'rgba(139,92,246,0.08)',
        border: `1px solid ${challenge.completed ? 'rgba(16,185,129,0.25)' : 'rgba(139,92,246,0.25)'}`,
        borderRadius: 8,
        padding: '6px 10px',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: 14, flexShrink: 0 }}>{challenge.icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{
            fontSize: 7,
            fontFamily: '"Press Start 2P", monospace',
            color: challenge.completed ? '#10b981' : '#8b5cf6',
          }}>
            {challenge.completed ? '✓ DONE' : 'DAILY'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0' }}>
            {challenge.title}
          </span>
        </div>
        {/* Thin progress bar */}
        <div style={{
          background: '#1e293b',
          borderRadius: 3,
          height: 6,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress}%`,
            background: progressColor,
            transition: 'width 0.5s ease-out',
            borderRadius: 3,
          }} />
        </div>
      </div>

      <span style={{
        fontSize: 9,
        fontWeight: 700,
        color: '#94a3b8',
        fontFamily: '"Press Start 2P", monospace',
        flexShrink: 0,
      }}>
        {challenge.current}/{challenge.target}
      </span>

      {streak > 0 && (
        <span style={{ fontSize: 9, color: '#fbbf24', flexShrink: 0 }} title={`${streak} day streak`}>
          🔥{streak}
        </span>
      )}

      <span style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700, flexShrink: 0 }}>
        ⭐{xp}
      </span>

      {celebrating && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(16,185,129,0.9)',
          animation: 'fadeOut 2s forwards',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 24, animation: 'bounce 0.5s ease-out' }}>🎉</span>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
