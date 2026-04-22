'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Bankr Robot Pixel Art ────────────────────────────────────────────────────
// Warna brand Bankr: biru gelap (#1a3a5c), biru terang (#2563eb), accent (#38bdf8)

type PetState = 'walk' | 'idle' | 'sit' | 'wave';
type Direction = 'left' | 'right';

function BankrRobot({
  state,
  direction,
  s = 4,
}: {
  state: PetState;
  direction: Direction;
  s?: number;
}) {
  const flip = direction === 'left';
  const bobY = state === 'idle' || state === 'sit' ? 0 : Math.sin(Date.now() / 200) * s * 0.3;

  // Leg animation for walking
  const tick = Math.floor(Date.now() / 180);
  const legPhase = state === 'walk' ? tick % 2 : 0;

  const bodyColor = '#1e3a8a';   // Bankr dark blue
  const headColor = '#1d4ed8';   // Bankr mid blue
  const accentColor = '#38bdf8'; // Bankr light blue / cyan
  const screenColor = '#0ea5e9'; // Screen glow
  const eyeColor = '#ffffff';
  const jointColor = '#93c5fd';

  return (
    <div
      style={{
        position: 'relative',
        width: s * 10,
        height: s * 18,
        transform: flip ? 'scaleX(-1)' : undefined,
        imageRendering: 'pixelated',
        transition: 'transform 0.15s',
      }}
    >
      {/* ── Antenna ── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: s * 4.5,
        width: s,
        height: s * 2,
        background: accentColor,
        borderRadius: s * 0.3,
      }} />
      <div style={{
        position: 'absolute',
        top: -s * 0.5,
        left: s * 4,
        width: s * 2,
        height: s * 1,
        background: accentColor,
        borderRadius: '50%',
      }} />

      {/* ── Head ── */}
      <div style={{
        position: 'absolute',
        top: s * 1.5,
        left: s,
        width: s * 8,
        height: s * 6,
        background: headColor,
        borderRadius: s * 0.8,
        border: `${s * 0.3}px solid ${accentColor}`,
      }}>
        {/* Screen face */}
        <div style={{
          position: 'absolute',
          top: s * 0.8,
          left: s * 1,
          width: s * 6,
          height: s * 3.5,
          background: '#0c1a3a',
          borderRadius: s * 0.4,
          border: `${s * 0.2}px solid ${screenColor}`,
          overflow: 'hidden',
        }}>
          {/* Eyes */}
          <div style={{
            position: 'absolute',
            top: s * 0.6,
            left: s * 0.8,
            width: s * 1.5,
            height: s * 1.5,
            background: state === 'wave' ? accentColor : screenColor,
            borderRadius: s * 0.2,
            boxShadow: `0 0 ${s}px ${screenColor}`,
            transition: 'background 0.3s',
          }} />
          <div style={{
            position: 'absolute',
            top: s * 0.6,
            right: s * 0.8,
            width: s * 1.5,
            height: s * 1.5,
            background: state === 'wave' ? accentColor : screenColor,
            borderRadius: s * 0.2,
            boxShadow: `0 0 ${s}px ${screenColor}`,
            transition: 'background 0.3s',
          }} />
          {/* Smile / status bar */}
          <div style={{
            position: 'absolute',
            bottom: s * 0.5,
            left: s * 1,
            width: s * 4,
            height: s * 0.4,
            background: accentColor,
            borderRadius: s * 0.2,
            opacity: 0.8,
          }} />
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{
        position: 'absolute',
        top: s * 7.5,
        left: s * 1.5,
        width: s * 7,
        height: s * 5,
        background: bodyColor,
        borderRadius: s * 0.5,
        border: `${s * 0.3}px solid ${jointColor}`,
      }}>
        {/* BNKR logo badge */}
        <div style={{
          position: 'absolute',
          top: s * 1,
          left: s * 1.5,
          width: s * 4,
          height: s * 2.5,
          background: '#0c1a3a',
          borderRadius: s * 0.3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontSize: s * 1.4,
            fontFamily: 'monospace',
            color: accentColor,
            fontWeight: 700,
            letterSpacing: 0,
            lineHeight: 1,
          }}>
            BNKR
          </div>
        </div>
      </div>

      {/* ── Left Arm ── */}
      <div style={{
        position: 'absolute',
        top: s * 8,
        left: 0,
        width: s * 1.5,
        height: state === 'wave' ? s * 3 : s * 4,
        background: bodyColor,
        borderRadius: s * 0.4,
        border: `${s * 0.2}px solid ${jointColor}`,
        transform: state === 'wave' ? 'rotate(-50deg)' : legPhase === 0 ? 'rotate(10deg)' : 'rotate(-10deg)',
        transformOrigin: 'top center',
        transition: 'transform 0.2s',
      }} />

      {/* ── Right Arm ── */}
      <div style={{
        position: 'absolute',
        top: s * 8,
        right: 0,
        width: s * 1.5,
        height: s * 4,
        background: bodyColor,
        borderRadius: s * 0.4,
        border: `${s * 0.2}px solid ${jointColor}`,
        transform: legPhase === 0 ? 'rotate(-10deg)' : 'rotate(10deg)',
        transformOrigin: 'top center',
        transition: 'transform 0.2s',
      }} />

      {/* ── Left Leg ── */}
      <div style={{
        position: 'absolute',
        top: s * 12.5,
        left: s * 2.5,
        width: s * 2,
        height: s * 4,
        background: bodyColor,
        borderRadius: s * 0.4,
        border: `${s * 0.2}px solid ${jointColor}`,
        transform: state === 'sit' ? 'rotate(80deg)' : legPhase === 0 ? 'rotate(-15deg)' : 'rotate(15deg)',
        transformOrigin: 'top center',
        transition: 'transform 0.18s',
      }}>
        {/* Foot */}
        <div style={{
          position: 'absolute',
          bottom: -s * 0.5,
          left: -s * 0.5,
          width: s * 3,
          height: s,
          background: accentColor,
          borderRadius: s * 0.3,
        }} />
      </div>

      {/* ── Right Leg ── */}
      <div style={{
        position: 'absolute',
        top: s * 12.5,
        right: s * 2.5,
        width: s * 2,
        height: s * 4,
        background: bodyColor,
        borderRadius: s * 0.4,
        border: `${s * 0.2}px solid ${jointColor}`,
        transform: state === 'sit' ? 'rotate(-80deg)' : legPhase === 0 ? 'rotate(15deg)' : 'rotate(-15deg)',
        transformOrigin: 'top center',
        transition: 'transform 0.18s',
      }}>
        {/* Foot */}
        <div style={{
          position: 'absolute',
          bottom: -s * 0.5,
          right: -s * 0.5,
          width: s * 3,
          height: s,
          background: accentColor,
          borderRadius: s * 0.3,
        }} />
      </div>
    </div>
  );
}

// ─── Speech Bubble ────────────────────────────────────────────────────────────
const PET_QUIPS = [
  'gm ser 🌅',
  '$BNKR to the moon',
  'running on Base ⚡',
  'LFG!',
  '*beep boop*',
  'on-chain vibes',
  'ser, your agents need payroll',
  'buy high sell never',
  'based and blue-pilled',
  'executing swap...',
  'wen lambo?',
  'skill installed ✅',
];

function SpeechBubble({ text, flipped }: { text: string; flipped: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      top: -40,
      [flipped ? 'right' : 'left']: 0,
      background: 'rgba(255,255,255,0.95)',
      color: '#1e3a8a',
      fontSize: 11,
      fontFamily: 'monospace',
      fontWeight: 700,
      padding: '4px 8px',
      borderRadius: 8,
      whiteSpace: 'nowrap',
      border: '1.5px solid #38bdf8',
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      {text}
      <div style={{
        position: 'absolute',
        bottom: -7,
        [flipped ? 'right' : 'left']: 12,
        width: 0,
        height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '7px solid #38bdf8',
      }} />
    </div>
  );
}

// ─── Main OfficePet component ─────────────────────────────────────────────────
interface OfficePetProps {
  containerWidth?: number;
  containerHeight?: number;
  scale?: number;
}

export function OfficePet({ containerWidth = 800, containerHeight = 200, scale = 1 }: OfficePetProps) {
  const petWidth = 40 * scale;
  const petHeight = 72 * scale;

  const [x, setX] = useState(containerWidth / 2);
  const [petState, setPetState] = useState<PetState>('idle');
  const [direction, setDirection] = useState<Direction>('right');
  const [quip, setQuip] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  const xRef = useRef(x);
  const dirRef = useRef(direction);
  const stateRef = useRef(petState);
  const frameRef = useRef<number | undefined>(undefined);

  xRef.current = x;
  dirRef.current = direction;
  stateRef.current = petState;

  // Force re-render for walking animation
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 180);
    return () => clearInterval(interval);
  }, []);

  // AI movement: randomly walk, pause, sit, wave
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const decide = () => {
      const rand = Math.random();

      if (rand < 0.45) {
        // Walk to a random x position
        const target = Math.random() * (containerWidth - petWidth * 2) + petWidth;
        const dir: Direction = target > xRef.current ? 'right' : 'left';
        setDirection(dir);
        setPetState('walk');

        const speed = 1.2 * scale;
        const dist = Math.abs(target - xRef.current);
        const duration = (dist / speed) * 16;

        let startX = xRef.current;
        let startTime: number | null = null;

        const animate = (time: number) => {
          if (!startTime) startTime = time;
          const elapsed = time - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const newX = startX + (target - startX) * progress;
          setX(newX);
          xRef.current = newX;

          if (progress < 1) {
            frameRef.current = requestAnimationFrame(animate);
          } else {
            setPetState('idle');
            timeout = setTimeout(decide, 800 + Math.random() * 1200);
          }
        };
        frameRef.current = requestAnimationFrame(animate);

      } else if (rand < 0.65) {
        // Sit and chill
        setPetState('sit');
        timeout = setTimeout(() => {
          setPetState('idle');
          timeout = setTimeout(decide, 500);
        }, 2000 + Math.random() * 2000);

      } else if (rand < 0.8) {
        // Wave + show quip
        setPetState('wave');
        const q = PET_QUIPS[Math.floor(Math.random() * PET_QUIPS.length)];
        setQuip(q);
        timeout = setTimeout(() => {
          setQuip(null);
          setPetState('idle');
          timeout = setTimeout(decide, 600);
        }, 2500);

      } else {
        // Just idle
        setPetState('idle');
        timeout = setTimeout(decide, 1500 + Math.random() * 2000);
      }
    };

    timeout = setTimeout(decide, 1200);
    return () => {
      clearTimeout(timeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [containerWidth, petWidth, scale]);

  // Click: wave and say something
  const handleClick = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setPetState('wave');
    const q = PET_QUIPS[Math.floor(Math.random() * PET_QUIPS.length)];
    setQuip(q);
    setTimeout(() => {
      setQuip(null);
      setPetState('idle');
    }, 2500);
  }, []);

  const clampedX = Math.max(0, Math.min(x, containerWidth - petWidth));

  return (
    <div
      style={{
        position: 'absolute',
        left: clampedX,
        bottom: 0,
        width: petWidth,
        height: petHeight,
        cursor: 'pointer',
        zIndex: 10,
        userSelect: 'none',
      }}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click me! I'm the Bankr bot 🤖"
    >
      {/* Hover glow ring */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: -4,
          left: '50%',
          transform: 'translateX(-50%)',
          width: petWidth * 0.8,
          height: petWidth * 0.25,
          background: 'rgba(56, 189, 248, 0.25)',
          borderRadius: '50%',
          filter: 'blur(4px)',
        }} />
      )}

      {/* Speech bubble */}
      {quip && <SpeechBubble text={quip} flipped={direction === 'left'} />}

      {/* The robot */}
      <BankrRobot
        state={petState}
        direction={direction}
        s={scale * 4}
      />

      {/* Name tag on hover */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: -18,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 9,
          fontFamily: 'monospace',
          color: '#38bdf8',
          whiteSpace: 'nowrap',
          fontWeight: 700,
          letterSpacing: 1,
        }}>
          BANKR BOT
        </div>
      )}
    </div>
  );
}
