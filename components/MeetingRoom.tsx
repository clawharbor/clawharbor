'use client';

import React from 'react';
import type { Agent } from './types';
import { Room } from './Room';
import { NPC } from './NPC';

type SFXType = 'click' | 'close' | 'open' | 'questNew' | 'questComplete' | 'achievement' | 'levelUp' | 'message' | 'roomChange' | 'hover' | 'error' | 'send' | 'meetingStart' | 'waterCooler';

interface MeetingRoomProps {
  meeting: {
    active: boolean;
    topic?: string;
    participants?: string[];
    currentRound?: number;
    maxRounds?: number;
    startedAt?: number;
    lastMessage?: string;
    transcript?: { agent: string; message: string; round: number; timestamp: number }[];
  };
  agents: Agent[];
  nowMs: number;
  npcSize: number;
  isMobile: boolean;
  celebrations: { agentId: string; timestamp: number }[];
  onEndMeeting: () => Promise<void>;
  onSelectAgent: (agent: Agent) => void;
  onPlaySound: (type: SFXType, minIntervalMs?: number) => void;
}

export function MeetingRoom({
  meeting,
  agents,
  nowMs,
  npcSize,
  isMobile,
  celebrations,
  onEndMeeting,
  onSelectAgent,
  onPlaySound,
}: MeetingRoomProps) {
  if (!meeting.active) return null;

  const transcript = meeting.transcript || [];
  const hasTranscript = transcript.length > 0;
  const agentColors: Record<string, string> = {};
  const colorPalette = ['#c4b5fd', '#a78bfa', '#f0abfc', '#67e8f9', '#86efac', '#fcd34d', '#fca5a5', '#fdba74'];
  
  (meeting.participants || []).forEach((p, i) => {
    agentColors[p.toLowerCase()] = colorPalette[i % colorPalette.length];
  });
  
  agents.forEach((a) => {
    if (!agentColors[a.name.toLowerCase()]) {
      const idx = a.id.split('').reduce((s: number, c: string) => s + c.charCodeAt(0), 0) % colorPalette.length;
      agentColors[a.name.toLowerCase()] = colorPalette[idx];
    }
    if (!agentColors[a.id.toLowerCase()]) {
      agentColors[a.id.toLowerCase()] = agentColors[a.name.toLowerCase()];
    }
  });

  const startedAt = meeting.startedAt || nowMs;
  const elapsed = Math.max(0, nowMs - startedAt);
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);

  return (
    <Room
      title="Meeting Room"
      icon="🤝"
      color="#1a0a2e"
      borderColor="#7c3aed"
      roomType="meeting"
      style={{
        flex: '0 0 auto',
        animation: 'fadeSlideIn 0.5s ease-out',
      }}
    >
      <div style={{ padding: '12px 12px 16px' }}>
        {/* Topic */}
        <div style={{
          textAlign: 'center',
          marginBottom: 8,
          fontSize: 11,
          color: '#c4b5fd',
          fontWeight: 600,
          lineHeight: 1.4,
          padding: '0 8px',
        }}>
          {meeting.topic || 'Discussion in progress...'}
        </div>

        {/* Side-by-side: left = participants + controls, right = transcript */}
        <div style={{
          display: isMobile ? 'block' : 'flex',
          gap: 12,
          alignItems: 'stretch',
        }}>
          {/* Left column — participants & controls */}
          <div style={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: isMobile ? undefined : 140,
          }}>
            {/* Progress indicators */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}>
              <div style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 8,
                color: '#a78bfa',
                fontFamily: '"Press Start 2P", monospace',
              }}>
                Round {meeting.currentRound}/{meeting.maxRounds}
              </div>
              <div style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 8,
                color: '#a78bfa',
                fontFamily: '"Press Start 2P", monospace',
              }}>
                {mins}:{secs.toString().padStart(2, '0')} elapsed
              </div>
            </div>

            {/* Participants */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: isMobile ? 16 : 20,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}>
              {meeting.participants && meeting.participants.map((pId, idx) => {
                const agent = agents.find(a => a.id === pId);
                if (!agent) return null;
                const flipped = idx % 2 === 1;
                return (
                  <div key={pId} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: `npcEntrance 0.5s ease-out ${idx * 0.12}s both`,
                  }}>
                    <NPC
                      agent={agent}
                      size={npcSize * 0.75}
                      onClick={() => { onPlaySound('click'); onSelectAgent(agent); }}
                      flipped={flipped}
                      hasCelebration={celebrations.some(c => c.agentId === agent.id)}
                    />
                  </div>
                );
              })}
            </div>

            {/* End Meeting Button */}
            <button
              onClick={async () => {
                onPlaySound('close');
                await onEndMeeting();
              }}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5',
                padding: '5px 10px',
                borderRadius: 6,
                fontSize: 9,
                fontFamily: '"Press Start 2P", monospace',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
              }}
            >
              End Meeting
            </button>
          </div>

          {/* Right column — transcript */}
          {hasTranscript ? (
            <div style={{
              flex: 1,
              minWidth: 0,
              background: 'rgba(15,5,30,0.6)',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 8,
              padding: '8px',
              maxHeight: isMobile ? 160 : 200,
              overflowY: 'auto',
              marginTop: isMobile ? 8 : 0,
            }}>
              {transcript.map((entry, idx) => {
                const showRoundHeader = idx === 0 || entry.round !== transcript[idx - 1].round;
                const agentKey = entry.agent.toLowerCase();
                const agentColor = agentColors[agentKey] || '#c4b5fd';
                const displayAgent = agents.find(a => a.id === agentKey || a.name.toLowerCase() === agentKey);
                const agentName = displayAgent?.name || entry.agent;

                return (
                  <React.Fragment key={idx}>
                    {showRoundHeader && (
                      <div style={{
                        textAlign: 'center',
                        fontSize: 7,
                        color: '#7c3aed',
                        fontFamily: '"Press Start 2P", monospace',
                        padding: '4px 0 6px',
                        opacity: 0.7,
                        borderTop: idx > 0 ? '1px solid rgba(124,58,237,0.15)' : 'none',
                        marginTop: idx > 0 ? 6 : 0,
                      }}>
                        — Round {entry.round} —
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      gap: 6,
                      marginBottom: 6,
                      alignItems: 'flex-start',
                      animation: idx === transcript.length - 1 ? 'fadeSlideIn 0.3s ease-out' : undefined,
                    }}>
                      <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: agentColor,
                        flexShrink: 0,
                        marginTop: 4,
                        boxShadow: `0 0 4px ${agentColor}44`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontFamily: '"Press Start 2P", monospace',
                          fontSize: 7,
                          color: agentColor,
                          marginRight: 4,
                        }}>
                          {agentName}
                        </span>
                        <span style={{
                          fontSize: isMobile ? 9 : 10,
                          color: '#e2d9f3',
                          lineHeight: 1.4,
                          wordBreak: 'break-word' as const,
                        }}>
                          {entry.message}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          ) : meeting.lastMessage ? (
            <div style={{
              flex: 1,
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.25)',
              color: '#c4b5fd',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: isMobile ? 9 : 10,
              textAlign: 'center',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: isMobile ? 8 : 0,
            }}>
              {meeting.lastMessage.length > 120 
                ? meeting.lastMessage.slice(0, 117) + '...' 
                : meeting.lastMessage}
            </div>
          ) : null}
        </div>
      </div>
    </Room>
  );
}
