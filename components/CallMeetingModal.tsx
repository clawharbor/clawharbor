'use client';

import React from 'react';
import type { Agent } from './types';

type SFXType = 'click' | 'meetingStart';

interface CallMeetingModalProps {
  show: boolean;
  agents: Agent[];
  meetingTopic: string;
  selectedParticipants: string[];
  onTopicChange: (topic: string) => void;
  onParticipantToggle: (agentId: string) => void;
  onCancel: () => void;
  onStart: (topic: string, participants: string[]) => Promise<void>;
  onPlaySound: (type: SFXType) => void;
}

export function CallMeetingModal({
  show,
  agents,
  meetingTopic,
  selectedParticipants,
  onTopicChange,
  onParticipantToggle,
  onCancel,
  onStart,
  onPlaySound,
}: CallMeetingModalProps) {
  if (!show) return null;

  const canStart = meetingTopic.trim().length > 0 && selectedParticipants.length >= 2;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#0f172a',
          border: '2px solid #1e293b',
          borderRadius: 12,
          padding: 24,
          maxWidth: 600,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          margin: '0 0 16px 0',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 14,
          color: '#fff',
        }}>
          📞 Call Meeting
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Select participants and a discussion topic. They'll gather in the Meeting Room to work through it together.
        </p>

        {/* Topic Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block',
            color: '#e2e8f0',
            fontSize: 11,
            fontFamily: '"Press Start 2P", monospace',
            marginBottom: 8,
          }}>
            Meeting Topic
          </label>
          <input
            type="text"
            placeholder="What should they discuss? (e.g., 'Should we refactor the API?')"
            value={meetingTopic}
            onChange={(e) => onTopicChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#e2e8f0',
              fontSize: 13,
            }}
            autoFocus
          />
        </div>

        {/* Participant Selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block',
            color: '#e2e8f0',
            fontSize: 11,
            fontFamily: '"Press Start 2P", monospace',
            marginBottom: 8,
          }}>
            Participants (select at least 2)
          </label>
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 8,
          }}>
            {agents.filter(a => a.id !== '_owner').map(agent => {
              const isSelected = selectedParticipants.includes(agent.id);
              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    onPlaySound('click');
                    onParticipantToggle(agent.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: isSelected ? 'rgba(124,58,237,0.25)' : 'transparent',
                    border: `2px solid ${isSelected ? '#8b5cf6' : '#334155'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: isSelected ? '#8b5cf6' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    flexShrink: 0,
                  }}>
                    {isSelected && '✓'}
                  </div>
                  <span style={{ fontSize: 14 }}>{agent.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#e2e8f0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {agent.name}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {agent.role}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!canStart) return;
              onPlaySound('meetingStart');
              await onStart(meetingTopic, selectedParticipants);
            }}
            disabled={!canStart}
            style={{
              padding: '8px 16px',
              background: canStart ? '#8b5cf6' : '#334155',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: canStart ? 'pointer' : 'not-allowed',
              fontSize: 12,
              fontWeight: 600,
              opacity: canStart ? 1 : 0.5,
            }}
          >
            Start Meeting
          </button>
        </div>
      </div>
    </div>
  );
}
