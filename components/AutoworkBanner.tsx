'use client';

import React from 'react';
import type { Agent } from './types';
import { formatInterval } from './utils';

interface AutoworkBannerProps {
  pendingAutowork: Record<string, Partial<{ enabled: boolean; intervalMs: number; directive: string }>>;
  agents: Agent[];
  onDiscard: () => void;
  onApply: (entries: [string, Partial<{ enabled: boolean; intervalMs: number; directive: string }>][]) => Promise<void>;
}

export function AutoworkBanner({ pendingAutowork, agents, onDiscard, onApply }: AutoworkBannerProps) {
  if (Object.keys(pendingAutowork).length === 0) return null;

  const entries = Object.entries(pendingAutowork);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      background: 'linear-gradient(to right, #1e1b4b, #312e81)',
      borderTop: '2px solid #6366f1',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      animation: 'fadeSlideIn 0.3s ease-out',
      boxShadow: '0 -4px 20px rgba(99,102,241,0.3)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#e0e7ff',
          fontFamily: '"Press Start 2P", monospace',
          marginBottom: 4,
        }}>
          ⚠ WORKSPACE RESTART REQUIRED
        </div>
        <div style={{ fontSize: 11, color: '#a5b4fc', lineHeight: 1.5 }}>
          {entries.map(([agentId, changes]) => {
            const agentName = agents.find(a => a.id === agentId)?.name || agentId;
            const parts: string[] = [];
            if (changes.enabled !== undefined) {
              parts.push(changes.enabled ? 'enable auto-work' : 'disable auto-work');
            }
            if (changes.intervalMs !== undefined) {
              parts.push(`interval → ${formatInterval(changes.intervalMs)}`);
            }
            if (changes.directive !== undefined) {
              parts.push('updated directive');
            }
            return `${agentName}: ${parts.join(', ')}`;
          }).join(' · ')}
        </div>
      </div>
      <button
        onClick={onDiscard}
        style={{
          background: 'transparent',
          border: '1px solid #475569',
          borderRadius: 8,
          padding: '8px 16px',
          color: '#94a3b8',
          fontSize: 10,
          cursor: 'pointer',
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        DISCARD
      </button>
      <button
        onClick={async () => {
          try {
            await onApply(entries);
          } catch {
            alert('Failed to apply changes');
          }
        }}
        style={{
          background: '#6366f1',
          border: 'none',
          borderRadius: 8,
          padding: '8px 20px',
          color: '#fff',
          fontSize: 10,
          cursor: 'pointer',
          fontFamily: '"Press Start 2P", monospace',
          boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
        }}
      >
        APPLY & RESTART
      </button>
    </div>
  );
}
