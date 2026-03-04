'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Agent } from './types';

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

const MAX_SNAPSHOTS = 288;
const SNAPSHOT_INTERVAL = 30000;

const MOOD_COLORS: Record<string, string> = {
  great: '#22c55e',
  good: '#84cc16',
  okay: '#eab308',
  stressed: '#ef4444',
};

// ─── useOfficeReplay Hook ─────────────────────────────────────────────────────

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
    takeSnapshot();
  }, [takeSnapshot]);

  const stopRecording = useCallback(() => setIsRecording(false), []);

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

// ─── Canvas Export ────────────────────────────────────────────────────────────

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Draw the "Your Office Day" shareable PNG onto a canvas element.
 * Pure canvas API — no external libraries needed.
 */
export function drawOfficeDay(
  canvas: HTMLCanvasElement,
  snapshots: OfficeSnapshot[]
): void {
  if (snapshots.length === 0) return;

  const W = 900;
  const HEADER_H = 100;
  const TIMELINE_ROW_H = 44;
  const AGENT_ROWS = snapshots[0].agents.length;
  const FOOTER_H = 80;
  const H = HEADER_H + TIMELINE_ROW_H * (AGENT_ROWS + 1) + FOOTER_H + 40;
  const LABEL_W = 130;
  const TIME_W = 64;
  const BAR_AREA = W - LABEL_W - 32;

  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  // Gradient bar
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#1e1b4b');
  grad.addColorStop(0.5, '#0f172a');
  grad.addColorStop(1, '#1a0a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HEADER_H);

  // Border bottom
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(0, HEADER_H - 2, W, 2);

  // Logo pixel squares
  const sq = 8;
  const colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(24 + i * (sq + 3), 36, sq, sq);
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillText('clawharbor', 24, 72);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px "Courier New", monospace';
  ctx.fillText('office day recap', 24, 90);

  // Date top right
  const dateStr = formatDate(snapshots[0].ts);
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 13px "Courier New", monospace';
  const dateW = ctx.measureText(dateStr).width;
  ctx.fillText(dateStr, W - dateW - 24, 52);

  // Duration
  const durationMs = snapshots[snapshots.length - 1].ts - snapshots[0].ts;
  const durationMins = Math.round(durationMs / 60000);
  const durationStr = durationMins >= 60
    ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m recorded`
    : `${durationMins}m recorded`;
  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Courier New", monospace';
  const durW = ctx.measureText(durationStr).width;
  ctx.fillText(durationStr, W - durW - 24, 70);

  // ── Timeline area ───────────────────────────────────────────────────────────
  const tlTop = HEADER_H + 20;

  // Time axis header
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(LABEL_W, tlTop, BAR_AREA, TIMELINE_ROW_H - 4);

  // Draw time labels across top
  const numLabels = Math.min(8, snapshots.length);
  const step = Math.floor(snapshots.length / numLabels);
  ctx.fillStyle = '#475569';
  ctx.font = '9px "Courier New", monospace';
  for (let i = 0; i < snapshots.length; i += step) {
    const x = LABEL_W + (i / (snapshots.length - 1 || 1)) * BAR_AREA;
    ctx.fillText(formatTime(snapshots[i].ts), x, tlTop + 20);
    // Tick mark
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, tlTop + 24, 1, 8);
    ctx.fillStyle = '#475569';
  }

  // ── Agent rows ──────────────────────────────────────────────────────────────
  snapshots[0].agents.forEach((agentInfo, agentIdx) => {
    const rowY = tlTop + TIMELINE_ROW_H + agentIdx * TIMELINE_ROW_H;

    // Row background (alternating)
    ctx.fillStyle = agentIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, rowY, W, TIMELINE_ROW_H - 2);

    // Agent label
    ctx.fillStyle = agentInfo.color;
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(`${agentInfo.emoji} ${agentInfo.name}`, 12, rowY + 20);

    ctx.fillStyle = '#475569';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText(`Lv.${agentInfo.level}`, 12, rowY + 34);

    // Status bar — colored blocks per snapshot
    const blockW = BAR_AREA / snapshots.length;
    snapshots.forEach((snap, snapIdx) => {
      const snapAgent = snap.agents.find(a => a.id === agentInfo.id);
      if (!snapAgent) return;

      const x = LABEL_W + snapIdx * blockW;
      const isWorking = snapAgent.status === 'working';
      const moodColor = MOOD_COLORS[snapAgent.mood] || '#64748b';

      // Bar block
      ctx.fillStyle = isWorking ? moodColor : 'rgba(100,116,139,0.2)';
      ctx.fillRect(x + 1, rowY + 6, Math.max(blockW - 1, 1), TIMELINE_ROW_H - 14);

      // Tiny XP indicator on working blocks
      if (isWorking && blockW > 6) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 1, rowY + 6, Math.max(blockW - 1, 1), 2);
      }
    });

    // XP gained label (right side)
    const firstSnap = snapshots[0].agents.find(a => a.id === agentInfo.id);
    const lastSnap = snapshots[snapshots.length - 1].agents.find(a => a.id === agentInfo.id);
    if (firstSnap && lastSnap) {
      const xpGained = lastSnap.xp - firstSnap.xp;
      if (xpGained > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.fillText(`+${xpGained}xp`, W - 52, rowY + 20);
      }
    }
  });

  // ── Legend ──────────────────────────────────────────────────────────────────
  const legendY = tlTop + TIMELINE_ROW_H + AGENT_ROWS * TIMELINE_ROW_H + 16;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(LABEL_W, legendY, BAR_AREA, 24);

  const legends = [
    { color: '#22c55e', label: 'working / great mood' },
    { color: '#eab308', label: 'working / okay' },
    { color: '#ef4444', label: 'stressed' },
    { color: 'rgba(100,116,139,0.3)', label: 'idle' },
  ];
  let lx = LABEL_W + 8;
  legends.forEach(({ color, label }) => {
    ctx.fillStyle = color;
    ctx.fillRect(lx, legendY + 7, 10, 10);
    ctx.fillStyle = '#64748b';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText(label, lx + 14, legendY + 17);
    lx += ctx.measureText(label).width + 32;
  });

  // ── Footer stats ─────────────────────────────────────────────────────────────
  const footerY = legendY + 36;

  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, footerY, W, FOOTER_H);

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, footerY, W, 1);

  // Compute stats
  const totalWorking = snapshots.reduce((sum, s) => sum + s.workingCount, 0);
  const totalSnapshots = snapshots.length;
  const activePercent = Math.round((totalWorking / (totalSnapshots * (snapshots[0]?.agents.length || 1))) * 100);
  const peakWorking = Math.max(...snapshots.map(s => s.workingCount));

  const stats = [
    { label: 'snapshots', value: String(totalSnapshots) },
    { label: 'peak active', value: `${peakWorking} agents` },
    { label: 'activity rate', value: `${activePercent}%` },
    { label: 'time span', value: durationStr },
  ];

  const colW = (W - 48) / stats.length;
  stats.forEach(({ label, value }, i) => {
    const sx = 24 + i * colW;
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(value, sx, footerY + 32);
    ctx.fillStyle = '#475569';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(label, sx, footerY + 50);
  });

  // Watermark
  ctx.fillStyle = '#1e293b';
  ctx.font = '10px "Courier New", monospace';
  const wm = 'clawharbor.work';
  ctx.fillText(wm, W - ctx.measureText(wm).width - 16, footerY + FOOTER_H - 12);
}

// ─── Export Button ────────────────────────────────────────────────────────────

export function ExportOfficeDayButton({
  snapshots,
  theme = {},
}: {
  snapshots: OfficeSnapshot[];
  theme?: { text?: string; border?: string };
}) {
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExport = useCallback(async () => {
    if (snapshots.length < 2) return;
    setExporting(true);

    // Give React a tick to render the canvas
    await new Promise(r => setTimeout(r, 50));

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      drawOfficeDay(canvas, snapshots);

      // Download
      const link = document.createElement('a');
      link.download = `clawharbor-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setExporting(false);
    }
  }, [snapshots]);

  const textColor = theme.text || '#e2e8f0';
  const borderColor = theme.border || '#1e293b';
  const disabled = snapshots.length < 2;

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button
        onClick={handleExport}
        disabled={disabled || exporting}
        title={disabled ? 'Need at least 2 snapshots to export' : 'Export office day as PNG'}
        style={{
          background: disabled ? 'transparent' : 'rgba(167,139,250,0.15)',
          border: `1px solid ${disabled ? borderColor : '#a78bfa'}`,
          color: disabled ? '#475569' : '#a78bfa',
          borderRadius: 4,
          padding: '4px 8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
      >
        {exporting ? '⏳' : '📤'} {exporting ? 'Exporting...' : 'Export PNG'}
      </button>
    </>
  );
}

// ─── OfficeReplayPlayer ───────────────────────────────────────────────────────

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
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const textColor = theme.text || '#e2e8f0';
  const dimColor = theme.textDim || '#64748b';
  const borderColor = theme.border || '#1e293b';

  const play = useCallback(() => {
    if (snapshots.length < 2) return;
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

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      background: theme.bgSecondary || 'rgba(15,23,42,0.8)',
      border: `2px solid ${borderColor}`,
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>📼</span>
          <span style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: textColor,
            textTransform: 'uppercase' as const,
          }}>
            Office Replay
          </span>
          {isRecording && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444',
              borderRadius: 3, padding: '1px 5px',
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#ef4444',
                animation: 'replayRecordPulse 1s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: '#ef4444' }}>REC</span>
            </div>
          )}
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color: dimColor }}>
          {snapshots.length} frames
        </span>
      </div>

      {/* Current frame */}
      {currentSnapshot ? (
        <div style={{
          background: 'rgba(0,0,0,0.3)', border: `1px solid ${borderColor}`,
          borderRadius: 8, padding: '8px 10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
            {currentSnapshot.agents.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: `${a.color}22`, border: `1px solid ${a.color}55`,
                borderRadius: 4, padding: '2px 5px',
                opacity: a.status === 'idle' ? 0.5 : 1,
              }}>
                <span style={{ fontSize: 9 }}>{a.emoji}</span>
                <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 5, color: textColor }}>
                  {a.name}
                </span>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: MOOD_COLORS[a.mood] || '#64748b',
                }} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '16px',
          textAlign: 'center' as const, color: dimColor,
          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
        }}>
          {isRecording ? 'Recording... first frame in 30s' : 'Press Record to start'}
        </div>
      )}

      {/* Scrubber */}
      {snapshots.length > 1 && (
        <div>
          <input type="range" min={0} max={snapshots.length - 1} value={currentFrame}
            onChange={e => { setIsPlaying(false); setCurrentFrame(Number(e.target.value)); }}
            style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 8, color: dimColor }}>
            <span>{formatTime(snapshots[0].ts)}</span>
            <span>{formatTime(snapshots[snapshots.length - 1].ts)}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const }}>
        <button onClick={isRecording ? onStop : onStart} style={{
          background: isRecording ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)',
          border: `1px solid ${isRecording ? '#ef4444' : '#6366f1'}`,
          color: isRecording ? '#ef4444' : '#818cf8',
          borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
          fontFamily: '"Press Start 2P", monospace', fontSize: 6,
        }}>
          {isRecording ? '⏹ Stop' : '⏺ Record'}
        </button>

        {snapshots.length > 1 && (
          <button onClick={isPlaying ? pause : play} style={{
            background: 'rgba(99,102,241,0.2)', border: '1px solid #6366f1',
            color: '#818cf8', borderRadius: 4, padding: '4px 8px',
            cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: 6,
          }}>
            {isPlaying ? '⏸' : '▶ Play'}
          </button>
        )}

        {snapshots.length > 1 && (
          <select value={playbackSpeed} onChange={e => setPlaybackSpeed(Number(e.target.value))}
            style={{
              background: 'rgba(0,0,0,0.4)', border: `1px solid ${borderColor}`,
              color: textColor, borderRadius: 4, padding: '3px 5px',
              fontFamily: '"Press Start 2P", monospace', fontSize: 6, cursor: 'pointer',
            }}>
            <option value={1000}>0.5x</option>
            <option value={500}>1x</option>
            <option value={250}>2x</option>
            <option value={100}>5x</option>
          </select>
        )}

        {/* 📤 Export PNG button */}
        <ExportOfficeDayButton snapshots={snapshots} theme={{ text: textColor, border: borderColor }} />

        {snapshots.length > 0 && (
          <button onClick={onClear} style={{
            background: 'transparent', border: `1px solid ${borderColor}`,
            color: dimColor, borderRadius: 4, padding: '4px 6px',
            cursor: 'pointer', fontFamily: '"Press Start 2P", monospace', fontSize: 6,
            marginLeft: 'auto',
          }}>
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
