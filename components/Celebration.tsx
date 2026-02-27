'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * XP Celebration Animation — RPG-style feedback when agents complete tasks.
 * 
 * Features:
 * - Variable XP amount with golden retro text
 * - 6 particles bursting outward (sparkles, stars, coins)
 * - Brief golden glow ring
 * - Plumbob flash effect via CSS class injection
 * - All CSS-animated for GPU performance
 */

const PARTICLE_EMOJIS = ['✨', '⭐', '💫', '🪙', '✨', '⭐'];
const XP_AMOUNTS = [5, 10, 10, 15, 20, 25, 10, 10, 10, 50]; // weighted toward 10

interface CelebrationProps {
  /** Optional XP override; otherwise random from pool */
  xp?: number;
}

export function Celebration({ xp }: CelebrationProps) {
  // Pick a stable random XP amount for this instance
  const amount = useMemo(() => xp ?? XP_AMOUNTS[Math.floor(Math.random() * XP_AMOUNTS.length)], [xp]);
  
  // Generate stable random particle angles (burst in a ring)
  const particles = useMemo(() => {
    return PARTICLE_EMOJIS.map((emoji, i) => {
      const baseAngle = (i / PARTICLE_EMOJIS.length) * 360;
      const jitter = (Math.random() - 0.5) * 30; // ±15° randomness
      const angle = baseAngle + jitter;
      const distance = 22 + Math.random() * 18; // 22-40px burst radius
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * distance;
      const ty = Math.sin(rad) * distance;
      const size = 10 + Math.random() * 8; // 10-18px
      const delay = i * 0.06; // staggered
      const rotation = Math.random() * 360;
      return { emoji, tx, ty, size, delay, rotation };
    });
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: -35,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      pointerEvents: 'none',
      width: 0,
      height: 0,
    }}>
      {/* Golden glow ring */}
      <div className="xp-glow-ring" />

      {/* XP Text — floats up and scales */}
      <div className="xp-text">
        +{amount} XP
      </div>

      {/* Particle burst */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="xp-particle"
          style={{
            fontSize: p.size,
            animationDelay: `${p.delay}s`,
            // Custom properties for the animation endpoint
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rotation}deg`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </span>
      ))}

      {/* Rising pixel dots (extra flair) */}
      {[0, 1, 2].map(i => (
        <div
          key={`dot-${i}`}
          className="xp-pixel-dot"
          style={{
            animationDelay: `${0.1 + i * 0.15}s`,
            left: `${(i - 1) * 12}px`,
          }}
        />
      ))}

      <style jsx>{`
        .xp-glow-ring {
          position: absolute;
          top: 10px;
          left: -18px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(255, 215, 0, 0.6);
          animation: glowRingPulse 0.8s ease-out forwards;
          pointer-events: none;
        }

        .xp-text {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          font-family: "Press Start 2P", monospace;
          font-size: 11px;
          color: #FFD700;
          text-shadow:
            2px 2px 0 #000,
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            0 0 8px rgba(255, 215, 0, 0.5);
          white-space: nowrap;
          animation: xpFloatUp 1.2s ease-out forwards;
          z-index: 2;
        }

        .xp-particle {
          position: absolute;
          top: 12px;
          left: 0;
          opacity: 0;
          animation: particleBurst 0.7s ease-out forwards;
          will-change: transform, opacity;
          z-index: 1;
        }

        .xp-pixel-dot {
          position: absolute;
          top: 15px;
          width: 3px;
          height: 3px;
          background: #FFD700;
          border-radius: 0;
          image-rendering: pixelated;
          opacity: 0;
          animation: pixelRise 0.9s ease-out forwards;
          z-index: 1;
        }

        @keyframes xpFloatUp {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(0) scale(0.5);
          }
          15% {
            opacity: 1;
            transform: translateX(-50%) translateY(-2px) scale(1.3);
          }
          30% {
            transform: translateX(-50%) translateY(-5px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-30px) scale(0.8);
          }
        }

        @keyframes particleBurst {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0) rotate(0deg);
          }
          25% {
            opacity: 1;
            transform: translate(
              calc(var(--tx) * 0.3),
              calc(var(--ty) * 0.3)
            ) scale(1.2) rotate(calc(var(--rot) * 0.5));
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0.3) rotate(var(--rot));
          }
        }

        @keyframes glowRingPulse {
          0% {
            opacity: 0;
            transform: scale(0.3);
            border-color: rgba(255, 215, 0, 0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.8);
            border-color: rgba(255, 215, 0, 0);
          }
        }

        @keyframes pixelRise {
          0% {
            opacity: 0;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
