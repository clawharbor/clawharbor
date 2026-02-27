'use client';

import { useCallback, useRef } from 'react';

/**
 * Retro RPG Sound Effects - synthesized with Web Audio API
 * No external files needed - pure procedural 8-bit sounds
 */

type SFXType = 
  | 'click'          // UI click / select
  | 'open'           // Open panel / modal
  | 'close'          // Close panel
  | 'questNew'       // New quest appears
  | 'questComplete'  // Quest resolved
  | 'achievement'    // Accomplishment recorded
  | 'levelUp'        // Agent level up
  | 'message'        // New chat message
  | 'roomChange'     // Agent moves rooms
  | 'hover'          // Hover over interactive element
  | 'error'          // Error / warning
  | 'send'           // Send message
  | 'meetingStart'   // Meeting begins
  | 'waterCooler'    // Water cooler chat tick
  ;

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  volume: number = 0.08,
  delay: number = 0,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playNoise(
  ctx: AudioContext,
  duration: number,
  volume: number = 0.03,
  delay: number = 0,
) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime + delay);
}

const SFX_PLAYERS: Record<SFXType, (ctx: AudioContext) => void> = {
  click: (ctx) => {
    playTone(ctx, 800, 0.05, 'square', 0.03);
    playTone(ctx, 1200, 0.04, 'square', 0.02, 0.02);
  },

  hover: (ctx) => {
    playTone(ctx, 600, 0.03, 'sine', 0.015);
  },

  open: (ctx) => {
    playTone(ctx, 400, 0.08, 'square', 0.03);
    playTone(ctx, 600, 0.08, 'square', 0.03, 0.06);
    playTone(ctx, 800, 0.1, 'square', 0.025, 0.12);
  },

  close: (ctx) => {
    playTone(ctx, 800, 0.06, 'square', 0.025);
    playTone(ctx, 500, 0.08, 'square', 0.02, 0.05);
  },

  questNew: (ctx) => {
    // RPG quest fanfare - ascending notes
    playTone(ctx, 523, 0.12, 'square', 0.04);  // C5
    playTone(ctx, 659, 0.12, 'square', 0.04, 0.1);  // E5
    playTone(ctx, 784, 0.12, 'square', 0.04, 0.2);  // G5
    playTone(ctx, 1047, 0.2, 'square', 0.05, 0.3);  // C6
  },

  questComplete: (ctx) => {
    // Victory fanfare
    playTone(ctx, 523, 0.08, 'square', 0.04);
    playTone(ctx, 659, 0.08, 'square', 0.04, 0.08);
    playTone(ctx, 784, 0.08, 'square', 0.04, 0.16);
    playTone(ctx, 1047, 0.15, 'square', 0.05, 0.24);
    playTone(ctx, 988, 0.08, 'square', 0.03, 0.35);
    playTone(ctx, 1047, 0.25, 'square', 0.05, 0.43);
  },

  achievement: (ctx) => {
    // Zelda-style item get
    const notes = [784, 880, 988, 1047, 1175, 1319];
    notes.forEach((freq, i) => {
      playTone(ctx, freq, 0.08, 'square', 0.035, i * 0.06);
    });
    playTone(ctx, 1568, 0.3, 'triangle', 0.05, 0.36);
  },

  levelUp: (ctx) => {
    // RPG level up jingle
    const scale = [523, 587, 659, 698, 784, 880, 988, 1047];
    scale.forEach((freq, i) => {
      playTone(ctx, freq, 0.06, 'square', 0.03 + i * 0.003, i * 0.05);
    });
    playTone(ctx, 1047, 0.4, 'triangle', 0.05, 0.4);
    playTone(ctx, 1319, 0.4, 'triangle', 0.04, 0.45);
    playTone(ctx, 1568, 0.5, 'triangle', 0.035, 0.5);
  },

  message: (ctx) => {
    // Soft notification blip — very quiet
    playTone(ctx, 880, 0.06, 'sine', 0.025);
    playTone(ctx, 1100, 0.08, 'sine', 0.02, 0.05);
  },

  roomChange: (ctx) => {
    // Footsteps + door
    playNoise(ctx, 0.04, 0.02);
    playNoise(ctx, 0.04, 0.015, 0.08);
    playTone(ctx, 300, 0.1, 'triangle', 0.025, 0.15);
    playTone(ctx, 400, 0.08, 'triangle', 0.02, 0.2);
  },

  error: (ctx) => {
    playTone(ctx, 200, 0.15, 'square', 0.04);
    playTone(ctx, 150, 0.2, 'square', 0.03, 0.12);
  },

  send: (ctx) => {
    playTone(ctx, 600, 0.06, 'triangle', 0.03);
    playTone(ctx, 900, 0.06, 'triangle', 0.03, 0.05);
    playTone(ctx, 1200, 0.08, 'triangle', 0.025, 0.1);
  },

  meetingStart: (ctx) => {
    // Bell / chime
    playTone(ctx, 1047, 0.15, 'sine', 0.04);
    playTone(ctx, 1319, 0.15, 'sine', 0.035, 0.12);
    playTone(ctx, 1568, 0.2, 'sine', 0.03, 0.24);
    playTone(ctx, 2093, 0.3, 'sine', 0.025, 0.36);
  },

  waterCooler: (ctx) => {
    // Bubbly sound
    playTone(ctx, 400, 0.04, 'sine', 0.015);
    playTone(ctx, 500, 0.04, 'sine', 0.015, 0.05);
    playTone(ctx, 350, 0.04, 'sine', 0.01, 0.1);
  },
};

export function useRetroSFX() {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(typeof window !== 'undefined' ? localStorage.getItem('clawharbor-sfx') === 'on' : false);
  const lastPlayRef = useRef<Record<string, number>>({});

  const ensureContext = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = createAudioContext();
    }
    if (ctxRef.current?.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback((type: SFXType, minIntervalMs: number = 50) => {
    if (!enabledRef.current) return;
    
    // Debounce rapid-fire sounds
    const now = Date.now();
    const last = lastPlayRef.current[type] || 0;
    if (now - last < minIntervalMs) return;
    lastPlayRef.current[type] = now;

    const ctx = ensureContext();
    if (!ctx) return;

    try {
      SFX_PLAYERS[type]?.(ctx);
    } catch {
      // Audio context may be blocked by browser autoplay policy — that's fine
    }
  }, [ensureContext]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('clawharbor-sfx', enabled ? 'on' : 'off');
    }
  }, []);

  return { play, setEnabled, enabled: enabledRef };
}
