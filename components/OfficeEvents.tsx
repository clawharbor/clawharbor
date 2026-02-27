'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Agent } from './types';

/**
 * Random Office Events — ambient events that make the office feel alive.
 * Like "The Sims" event popups: funny, shareable, personality-driven.
 * Events appear as a ticker/toast at the top of the office floor.
 */

export interface OfficeEvent {
  id: string;
  icon: string;
  text: string;
  category: 'social' | 'funny' | 'milestone' | 'chaos' | 'wholesome';
  timestamp: number;
}

// Event templates — {agent} and {agent2} replaced with real agent names
const EVENT_TEMPLATES: { icon: string; text: string; category: OfficeEvent['category']; needsTwo?: boolean }[] = [
  // Social events
  { icon: '💬', text: '{agent} started a heated debate about tabs vs spaces', category: 'social' },
  { icon: '🤝', text: '{agent} and {agent2} are pair programming', category: 'social', needsTwo: true },
  { icon: '☕', text: '{agent} is making coffee for everyone', category: 'social' },
  { icon: '🎵', text: '{agent} is blasting lo-fi beats in the work room', category: 'social' },
  { icon: '💬', text: '{agent} and {agent2} are whispering at the water cooler', category: 'social', needsTwo: true },
  { icon: '📱', text: '{agent} is showing {agent2} a meme', category: 'social', needsTwo: true },
  { icon: '🎲', text: '{agent} challenged {agent2} to a code golf match', category: 'social', needsTwo: true },

  // Funny events
  { icon: '🐟', text: 'Someone microwaved fish in the break room', category: 'funny' },
  { icon: '😴', text: '{agent} fell asleep at the keyboard... zzz', category: 'funny' },
  { icon: '🪑', text: '{agent} is spinning in the office chair again', category: 'funny' },
  { icon: '🖨️', text: 'The printer jammed. {agent} is negotiating with it.', category: 'funny' },
  { icon: '🐛', text: '{agent} found a bug and named it Gerald', category: 'funny' },
  { icon: '🧃', text: '{agent} stole {agent2}\'s juice box from the fridge', category: 'funny', needsTwo: true },
  { icon: '🎮', text: '{agent} snuck in a game of Snake during standup', category: 'funny' },
  { icon: '📎', text: '"It looks like you\'re writing code. Need help?" — {agent}', category: 'funny' },
  { icon: '🍕', text: '{agent} ordered pizza for the office. Pineapple debate ensues.', category: 'funny' },
  { icon: '🔊', text: '{agent} forgot to mute and everyone heard their cat', category: 'funny' },
  { icon: '💾', text: '{agent} saved the file 47 times... just to be sure', category: 'funny' },
  { icon: '🌙', text: '{agent} wrote "// TODO: fix later" at 3 AM', category: 'funny' },
  { icon: '🎧', text: '{agent} has been listening to the same song on loop for 3 hours', category: 'funny' },

  // Milestone events
  { icon: '✨', text: '{agent}\'s code compiled on the first try!', category: 'milestone' },
  { icon: '🏆', text: '{agent} closed 10 issues today — new record!', category: 'milestone' },
  { icon: '🎯', text: '{agent} hit a 7-day commit streak 🔥', category: 'milestone' },
  { icon: '⚡', text: '{agent} deployed to production with zero errors', category: 'milestone' },
  { icon: '📈', text: '{agent} broke their personal best for tasks completed', category: 'milestone' },
  { icon: '🥇', text: '{agent} earned the "First to Respond" badge', category: 'milestone' },

  // Chaos events
  { icon: '🔥', text: 'A wild bug appeared in production! {agent} is on it.', category: 'chaos' },
  { icon: '⚠️', text: '{agent} pushed to main without tests. {agent2} is panicking.', category: 'chaos', needsTwo: true },
  { icon: '💥', text: 'npm install just broke everything. Classic.', category: 'chaos' },
  { icon: '🌪️', text: 'Merge conflict tornado! {agent} and {agent2} are resolving.', category: 'chaos', needsTwo: true },
  { icon: '🚨', text: 'Dependencies are 47 versions behind. {agent} is brave enough to update.', category: 'chaos' },
  { icon: '☢️', text: '{agent} accidentally deleted the .env file', category: 'chaos' },

  // Wholesome events
  { icon: '🌱', text: '{agent} watered the office plant', category: 'wholesome' },
  { icon: '⭐', text: '{agent} left a nice code review for {agent2}', category: 'wholesome', needsTwo: true },
  { icon: '🎂', text: 'It\'s {agent}\'s work anniversary! 🎉', category: 'wholesome' },
  { icon: '🤗', text: '{agent} helped {agent2} debug a tricky issue', category: 'wholesome', needsTwo: true },
  { icon: '📝', text: '{agent} wrote documentation without being asked', category: 'wholesome' },
  { icon: '🧡', text: '{agent} thanked {agent2} for the great PR review', category: 'wholesome', needsTwo: true },
  { icon: '🌈', text: 'The office vibes are immaculate today', category: 'wholesome' },
  { icon: '🎁', text: '{agent} shared a useful snippet with the team', category: 'wholesome' },
];

// Deterministic-ish pick using timestamp + index for variety
function pickRandom<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function generateEvent(agents: Agent[], seed: number): OfficeEvent | null {
  if (agents.length === 0) return null;

  // Pick a template
  const available = agents.length >= 2
    ? EVENT_TEMPLATES
    : EVENT_TEMPLATES.filter(t => !t.needsTwo);

  const template = pickRandom(available, seed);

  // Pick agents
  const agent1 = pickRandom(agents, seed * 31);
  let agent2 = agent1;
  if (template.needsTwo && agents.length >= 2) {
    const others = agents.filter(a => a.id !== agent1.id);
    agent2 = pickRandom(others, seed * 37);
  }

  const text = template.text
    .replace('{agent}', agent1.name)
    .replace('{agent2}', agent2.name);

  return {
    id: `evt-${seed}-${Date.now()}`,
    icon: template.icon,
    text,
    category: template.category,
    timestamp: Date.now(),
  };
}

// Category colors for the left accent
const CATEGORY_COLORS: Record<OfficeEvent['category'], string> = {
  social: '#6366f1',    // indigo
  funny: '#f59e0b',     // amber
  milestone: '#10b981', // emerald
  chaos: '#ef4444',     // red
  wholesome: '#ec4899', // pink
};

const CATEGORY_BG: Record<OfficeEvent['category'], string> = {
  social: 'rgba(99,102,241,0.08)',
  funny: 'rgba(245,158,11,0.08)',
  milestone: 'rgba(16,185,129,0.08)',
  chaos: 'rgba(239,68,68,0.08)',
  wholesome: 'rgba(236,72,153,0.08)',
};

interface OfficeEventsProps {
  agents: Agent[];
  /** Interval between events in ms (default: 45000 = 45s) */
  intervalMs?: number;
  /** Max events shown in the log (default: 3) */
  maxVisible?: number;
  /** Theme-aware colors */
  theme?: {
    text?: string;
    textDim?: string;
    bgSecondary?: string;
    border?: string;
  };
}

export function OfficeEvents({
  agents,
  intervalMs = 45000,
  maxVisible = 3,
  theme = {},
}: OfficeEventsProps) {
  const [events, setEvents] = useState<OfficeEvent[]>([]);
  const [entering, setEntering] = useState<string | null>(null);
  const [exiting, setExiting] = useState<string | null>(null);
  const seedRef = useRef(Math.floor(Math.random() * 10000));
  const agentsRef = useRef(agents);
  const startedRef = useRef(false);
  const textColor = theme.text || '#e2e8f0';
  const dimColor = theme.textDim || '#64748b';

  // Keep agents ref fresh without restarting timers
  useEffect(() => { agentsRef.current = agents; }, [agents]);

  // Generate events periodically — stable effect that doesn't depend on agent reference
  useEffect(() => {
    if (agents.length === 0 || startedRef.current) return;
    startedRef.current = true;

    const addEvent = () => {
      const currentAgents = agentsRef.current;
      if (currentAgents.length === 0) return;
      seedRef.current++;
      const evt = generateEvent(currentAgents, seedRef.current);
      if (evt) {
        setEntering(evt.id);
        setEvents(prev => {
          const updated = [evt, ...prev];
          if (updated.length > maxVisible) {
            const exitId = updated[maxVisible]?.id;
            if (exitId) setExiting(exitId);
            setTimeout(() => {
              setExiting(null);
              setEvents(p => p.slice(0, maxVisible));
            }, 300);
          }
          return updated.slice(0, maxVisible + 1);
        });
        setTimeout(() => setEntering(null), 400);
      }
    };

    // Generate first event quickly (2-5s after load)
    const firstTimer = setTimeout(addEvent, 2000 + Math.random() * 3000);

    // Then regular interval
    const interval = setInterval(addEvent, intervalMs);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
      startedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents.length > 0, intervalMs, maxVisible]);

  if (events.length === 0) return null;

  return (
    <div
      data-tour="office-events"
      style={{
        background: theme.bgSecondary || 'rgba(15,23,42,0.6)',
        border: `2px solid ${theme.border || '#1e293b'}`,
        borderRadius: 12,
        padding: '8px 10px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        overflow: 'hidden',
        animation: 'eventContainerIn 0.4s ease-out',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        paddingBottom: 2,
      }}>
        <span style={{ fontSize: 10 }}>📡</span>
        <span style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          color: dimColor,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          Office Feed
        </span>
        <div style={{
          flex: 1,
          height: 1,
          background: theme.border || 'rgba(100,116,139,0.2)',
        }} />
      </div>

      {/* Event items */}
      {events.slice(0, maxVisible).map((evt) => {
        const isEntering = entering === evt.id;
        const isExiting = exiting === evt.id;

        return (
          <div
            key={evt.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 8px',
              background: CATEGORY_BG[evt.category],
              borderLeft: `2px solid ${CATEGORY_COLORS[evt.category]}`,
              borderRadius: 4,
              opacity: isExiting ? 0 : 1,
              transform: isEntering ? 'translateY(0)' : isExiting ? 'translateY(-8px)' : 'none',
              animation: isEntering ? 'eventSlideIn 0.4s ease-out' : isExiting ? 'eventFadeOut 0.3s ease-in forwards' : 'none',
              transition: 'opacity 0.3s, transform 0.3s',
            }}
          >
            <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1 }}>{evt.icon}</span>
            <span style={{
              fontSize: 10,
              color: textColor,
              lineHeight: 1.3,
              flex: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
            }}>
              {evt.text}
            </span>
            <span style={{
              fontSize: 8,
              color: dimColor,
              flexShrink: 0,
              fontFamily: 'monospace',
            }}>
              {formatTimeAgo(evt.timestamp)}
            </span>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes eventContainerIn {
          0% {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            max-height: 300px;
          }
        }
        @keyframes eventSlideIn {
          0% {
            opacity: 0;
            transform: translateX(-20px);
            max-height: 0;
          }
          100% {
            opacity: 1;
            transform: translateX(0);
            max-height: 60px;
          }
        }
        @keyframes eventFadeOut {
          0% {
            opacity: 1;
            transform: translateY(0);
            max-height: 60px;
          }
          100% {
            opacity: 0;
            transform: translateY(-8px);
            max-height: 0;
          }
        }
      `}</style>
    </div>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}

/**
 * Hook to track office event history for the event log.
 * Returns the last N events for display in settings/stats.
 */
export function useOfficeEventHistory(maxHistory: number = 20) {
  const [history, setHistory] = useState<OfficeEvent[]>([]);

  const addEvent = useCallback((event: OfficeEvent) => {
    setHistory(prev => [event, ...prev].slice(0, maxHistory));
  }, [maxHistory]);

  return { history, addEvent };
}
