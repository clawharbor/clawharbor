'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Agent } from './types';

/**
 * Office Replay / Time-lapse
 *
 * Records office state snapshots every 30s and lets you play back your day.
 * "Your agents' whole day in 30 seconds" — extremely shareable.
 * Stored in memory (no persistence needed for MVP).
 */

export interface OfficeSnapshot {
  ts: number;
  agents: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
    status: Agent['status'];
    mood: Agent['mood'];
    task?: string;
    xp: number;
    level: number;
  }>;
  workingCount: number;
  idleCount: number;
}

const MAX_SNAPSHOTS = 288; // 24 hours at 5-min intervals
const SNAPSHOT_INTERVAL = 30000; // 30s in dev, use 300000 for production

// === useOfficeReplay Hook ===
export function useOfficeReplay(agents: Agent[]) {
  const [snapshots, setSnapshots] = useState<OfficeSnapshot[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const agentsRef = useRef(agents);

  useEffect(() => { agentsRef.current = agents; }, [agents]);

  const takeSnapshot = useCallback(() => {
    const current = agentsRef.current;
    if (current.length === 0) return;

    const snapshot: OfficeSnapshot = {
      ts: Date.now(),
      agents: current.map(a => ({
        id: a.id,
        name: a.name,
        emoji: a.emoji,
        color: a.color,
        status: a.status,
        mood: a.mood,
        task: a.task,
        xp: a.xp,
        level: a.level,
      })),
      workingCount: current.filter(a => a.status === 'working').length,
      idleCount: current.filter(a => a.status === 'idle').length,
    };

    setSnapshots(prev => [...prev, snapshot].slice(-MAX_SNAPSHOTS));
  }, []);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingStartedAt(Date.now());
    takeSnapshot(); // immediate first snapshot
  }, [takeSnapshot]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const clearRecording = useCallback(() => {
    setSnapshots([]);
    setRecordingStartedAt(null);
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(takeSnapshot, SNAPSHOT_INTERVAL);
    return () => clearInterval(interval);
  }, [isRecording, takeSnapshot]);

  return { snapshots, isRecording, recordingStartedAt, startRecording, stopRecording, clearRecording };
}

// === OfficeReplayPlayer Component ===
export function OfficeReplayPlayer({
  snapshots,
  isRecording,
  onStart,
  onStop,
  onClear,
  theme = {},
}: {
  snapshots: OfficeSnapshot[];
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  theme?: { text?: string; textDim?: string; bgSecondary?: string; border?: string };
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(500); // ms per frame
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const textColor = theme.text || '#e2e8f0';
  const dimColor = theme.textDim || '#64748b';
  const borderColor = theme.border || '#1e293b';

  const play = useCallback(() => {
    if (snapshots.length === 0) return;
    setCurrentFrame(0);
    setIsPlaying(true);
  }, [snapshots.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= snapshots.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, snapshots.length, playbackSpeed]);

  const currentSnapshot = snapshots[currentFrame];
  const durationMs = snapshots.length > 1
    ? snapshots[snapshots.length - 1].ts - snapshots[0].ts
    : 0;

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const MOOD_COLORS = { great: '#22c55e', good: '#84cc16', okay: '#eab308', stressed: '#ef4444' };

  return (
    <div style={{
      background: theme.bgSecondary || 'rgba(15,23,42,0.8)',
      border: `2px solid ${borderColor}`,
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minWidth: 280,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>📼</span>
          <span style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>Office Replay</span>
          {isRecording && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid #ef4444',
              borderRadius: 3,
              padding: '1px 5px',
            }}>
              <div style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#ef4444',
                animation: 'replayRecordPulse 1s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#ef4444' }}>REC</span>
            </div>
          )}
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color: dimColor }}>
          {snapshots.length} frames
          {durationMs > 0 ? ` • ${formatDuration(durationMs)}` : ''}
        </span>
      </div>

      {/* Current frame visualization */}
      {currentSnapshot ? (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          padding: '8px 10px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: 9, color: dimColor }}>
              {formatTime(currentSnapshot.ts)}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#22c55e' }}>
                ⚡ {currentSnapshot.workingCount}
              </span>
              <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: dimColor }}>
                💤 {currentSnapshot.idleCount}
              </span>
            </div>
          </div>

          {/* Agent mini-chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {currentSnapshot.agents.map(a => (
              <div key={a.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                background: `${a.color}22`,
                border: `1px solid ${a.color}55`,
                borderRadius: 4,
                padding: '2px 5px',
                opacity: a.status === 'idle' ? 0.5 : 1,
                transition: 'opacity 0.3s',
              }}>
                <span style={{ fontSize: 9 }}>{a.emoji}</span>
                <span style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 5,
                  color: textColor,
                }}>{a.name}</span>
                <div style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: MOOD_COLORS[a.mood],
                }} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 8,
          padding: '16px',
          textAlign: 'center',
          color: dimColor,
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
        }}>
          {isRecording ? 'Recording... first frame in 30s' : 'Start recording to capture your office day'}
        </div>
      )}

      {/* Playback scrubber */}
      {snapshots.length > 1 && (
        <div>
          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={currentFrame}
            onChange={e => {
              setIsPlaying(false);
              setCurrentFrame(Number(e.target.value));
            }}
            style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'monospace',
            fontSize: 8,
            color: dimColor,
          }}>
            <span>{snapshots[0] ? formatTime(snapshots[0].ts) : ''}</span>
            <span>{snapshots[snapshots.length - 1] ? formatTime(snapshots[snapshots.length - 1].ts) : ''}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Record toggle */}
        <button
          onClick={isRecording ? onStop : onStart}
          style={{
            background: isRecording ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)',
            border: `1px solid ${isRecording ? '#ef4444' : '#6366f1'}`,
            color: isRecording ? '#ef4444' : '#818cf8',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 6,
          }}
        >
          {isRecording ? '⏹ Stop' : '⏺ Record'}
        </button>

        {/* Play/Pause */}
        {snapshots.length > 1 && (
          <button
            onClick={isPlaying ? pause : play}
            style={{
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid #6366f1',
              color: '#818cf8',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 6,
            }}
          >
            {isPlaying ? '⏸' : '▶ Play'}
          </button>
        )}

        {/* Speed control */}
        {snapshots.length > 1 && (
          <select
            value={playbackSpeed}
            onChange={e => setPlaybackSpeed(Number(e.target.value))}
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid ${borderColor}`,
              color: textColor,
              borderRadius: 4,
              padding: '3px 5px',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 6,
              cursor: 'pointer',
            }}
          >
            <option value={1000}>0.5x</option>
            <option value={500}>1x</option>
            <option value={250}>2x</option>
            <option value={100}>5x</option>
          </select>
        )}

        {snapshots.length > 0 && (
          <button
            onClick={onClear}
            style={{
              background: 'transparent',
              border: `1px solid ${borderColor}`,
              color: dimColor,
              borderRadius: 4,
              padding: '4px 6px',
              cursor: 'pointer',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 6,
              marginLeft: 'auto',
            }}
          >
            🗑
          </button>
        )}
      </div>

      <style>{`
        @keyframes replayRecordPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
