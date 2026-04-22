'use client';

import { useState, useEffect } from 'react';

interface BootSequenceProps {
  onComplete: () => void;
}

/**
 * Retro boot sequence that plays on initial load.
 * 8-bit aesthetic with loading progress and system messages.
 * Sets the tone: this is a FUN tool, not boring enterprise software.
 */
export function BootSequence({ onComplete }: BootSequenceProps) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [visible, setVisible] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  const bootMessages = [
    { progress: 0, message: 'INITIALIZING clawharbor v0.1.0', delay: 0 },
    { progress: 15, message: 'LOADING PIXEL RENDERER...', delay: 200 },
    { progress: 30, message: 'SCANNING FOR AGENTS...', delay: 400 },
    { progress: 50, message: 'BOOTING WATER COOLER MODULE...', delay: 600 },
    { progress: 70, message: 'ACTIVATING QUEST SYSTEM...', delay: 800 },
    { progress: 85, message: 'WARMING UP OFFICE...', delay: 1000 },
    { progress: 100, message: 'READY!', delay: 1200 },
  ];

  useEffect(() => {
    // Play 8-bit boot sound
    const audio = new Audio();
    audio.volume = 0.3;
    // Generate simple beep using data URL
    const beep = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiJ0fLTgjMGHm7A7+OZRA0PU6zn7rdbGQU8l9vyzn0pBSl+zPLaizsIGGS57OihUhELTKXh8bllHAU2jtH'
    audio.src = beep;
    audio.play().catch(() => {}); // Ignore if autoplay blocked

    // Animate through boot sequence
    bootMessages.forEach(({ progress: targetProgress, message, delay }) => {
      setTimeout(() => {
        setProgress(targetProgress);
        setCurrentMessage(message);
        
        // Play subtle tick sound
        const tick = new Audio();
        tick.volume = 0.1;
        tick.src = beep;
        tick.playbackRate = 2.0;
        tick.play().catch(() => {});
      }, delay);
    });

    // Fade out and complete
    setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300); // Wait for fade animation
    }, 1400);
  }, [onComplete]);

  if (!mounted || (!visible && progress === 100)) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#020617',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {/* Retro CRT scanline effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          pointerEvents: 'none',
          opacity: 0.5,
        }}
      />

      <div style={{ textAlign: 'center', position: 'relative' }}>
        {/* Logo */}
        <div
          style={{
            fontSize: 48,
            marginBottom: 16,
            animation: 'pulse 2s infinite',
          }}
        >
          🏢
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 20,
            color: '#10b981',
            marginBottom: 8,
            textShadow: '0 0 10px #10b98166',
            letterSpacing: 2,
          }}
        >
          clawharbor
        </h1>

        <div
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 8,
            color: '#64748b',
            marginBottom: 32,
            letterSpacing: 1,
          }}
        >
          v1.1.0 BETA
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: 400,
            maxWidth: '90vw',
            height: 32,
            background: '#0f172a',
            border: '2px solid #1e293b',
            borderRadius: 4,
            padding: 4,
            marginBottom: 16,
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: progress === 100 
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              transition: 'width 0.3s ease-out, background 0.3s',
              borderRadius: 2,
              boxShadow: progress > 0 ? `0 0 10px ${progress === 100 ? '#10b98166' : '#6366f166'}` : 'none',
            }}
          />
        </div>

        {/* Progress percentage */}
        <div
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 10,
            color: progress === 100 ? '#10b981' : '#8b5cf6',
            marginBottom: 24,
            textShadow: progress === 100 ? '0 0 10px #10b98166' : '0 0 10px #8b5cf666',
          }}
        >
          {progress}%
        </div>

        {/* Status message */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#94a3b8',
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              animation: currentMessage ? 'fadeSlideIn 0.3s ease-out' : 'none',
            }}
          >
            {currentMessage}
            {progress < 100 && (
              <span
                style={{
                  display: 'inline-block',
                  animation: 'blink 1s infinite',
                  marginLeft: 4,
                }}
              >
                _
              </span>
            )}
          </span>
        </div>

        {/* Fun loading indicators */}
        {progress > 0 && progress < 100 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              marginTop: 16,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  background: '#6366f1',
                  borderRadius: '50%',
                  animation: `bounce 0.6s infinite ${i * 0.2}s`,
                  boxShadow: '0 0 8px #6366f166',
                }}
              />
            ))}
          </div>
        )}

        {/* Success checkmark */}
        {progress === 100 && (
          <div
            style={{
              fontSize: 32,
              color: '#10b981',
              marginTop: 8,
              animation: 'fadeSlideIn 0.3s ease-out',
            }}
          >
            ✓
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
