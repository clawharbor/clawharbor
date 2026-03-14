'use client';

import { useState, useEffect } from 'react';

/**
 * Landing Page - Viral-friendly marketing page
 * Optimized for social sharing and conversion
 */
export default function LandingPage() {
  const [stars, setStars] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<'v1' | 'classic'>('v1');

  useEffect(() => {
    fetch('https://api.github.com/repos/clawharbor/clawharbor')
      .then(r => r.json())
      .then(d => { if (d.stargazers_count != null) setStars(d.stargazers_count); })
      .catch(() => {});
    
    // Load dark mode preference (default to dark)
    const savedDarkMode = localStorage.getItem('clawharbor-dark-mode');
    if (savedDarkMode === 'false') {
      setDarkMode(false);
    }

    // Detect mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Theme colors
  const theme = darkMode ? {
    bg: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    textDim: '#64748b',
    cardBg: 'rgba(30, 41, 59, 0.6)',
    cardBorder: '#334155',
    sectionBg: 'rgba(15, 23, 42, 0.5)',
    buttonBg: '#1e293b',
    buttonHover: '#334155',
    accent: '#6366f1',
    accentMuted: '#a5b4fc',
    success: '#10b981',
    successMuted: '#6ee7b7',
    footerText: '#475569',
  } : {
    bg: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)',
    text: '#1e293b',
    textMuted: '#64748b',
    textDim: '#94a3b8',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    cardBorder: '#e2e8f0',
    sectionBg: 'rgba(248, 250, 252, 0.8)',
    buttonBg: '#e2e8f0',
    buttonHover: '#cbd5e1',
    accent: '#4f46e5',
    accentMuted: '#6366f1',
    success: '#059669',
    successMuted: '#10b981',
    footerText: '#64748b',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      color: theme.text,
      fontFamily: 'system-ui',
      overflowX: 'hidden',
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
        rel="stylesheet"
      />

      {/* Dark Mode Toggle */}
      <button
        onClick={() => {
          const next = !darkMode;
          setDarkMode(next);
          localStorage.setItem('clawharbor-dark-mode', String(next));
        }}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          border: 'none',
          color: theme.textMuted,
          cursor: 'pointer',
          fontSize: 24,
          padding: '8px 12px',
          borderRadius: 8,
          background: theme.cardBg,
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
        }}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? '🌙' : '☀️'}
      </button>

      {/* Hero Section */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '40px 16px' : '80px 20px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          fontSize: isMobile ? 40 : 64,
          marginBottom: isMobile ? 16 : 30,
          animation: 'float 3s ease-in-out infinite',
        }}>
          🏢
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: isMobile ? 22 : 48,
          marginBottom: isMobile ? 16 : 24,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.3,
        }}>
          YOUR AI AGENTS,
          <br />
          BUT THEY'RE SIMS
        </h1>

        {/* v1.0.0 badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(236,72,153,0.2) 100%)',
          border: '1px solid rgba(139,92,246,0.5)',
          borderRadius: 20,
          marginBottom: 24,
          fontSize: 12,
          fontWeight: 700,
          color: '#a5b4fc',
          letterSpacing: '0.05em',
        }}>
          🚀 v1.0.0 — STABLE RELEASE
        </div>

        {/* Subheadline */}
        <p style={{
          fontSize: isMobile ? 15 : 20,
          color: theme.textMuted,
          marginBottom: 40,
          lineHeight: 1.6,
          maxWidth: 640,
          margin: '0 auto 40px',
        }}>
          Turn your OpenClaw agents into pixel art NPCs in a retro office.
          Battles, burnout, payroll, live session feeds — all in one dashboard.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          marginBottom: isMobile ? 32 : 60,
        }}>
          <a
            href="/demo"
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: isMobile ? 14 : 16,
              boxShadow: '0 8px 24px rgba(139,92,246,0.3)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🎮 Try the Demo (10 seconds)
          </a>
          <a
            href="/install"
            style={{
              display: 'inline-block',
              padding: '16px 32px',
              background: 'rgba(99,102,241,0.15)',
              border: '2px solid rgba(99,102,241,0.4)',
              color: theme.accentMuted,
              textDecoration: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            📦 Install Now
          </a>
        </div>

        {/* Quick install command */}
        <div
          onClick={() => {
            navigator.clipboard.writeText('curl -fsSL https://clawharbor.work/install.sh | bash');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 24,
            padding: '10px 16px',
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: isMobile ? 10 : 13,
            color: theme.successMuted,
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            overflowX: 'auto',
            wordBreak: 'break-all',
            maxWidth: '100%',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.accent}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.cardBorder}
          title="Click to copy"
        >
          <span style={{ color: theme.textDim }}>$</span>
          <span>curl -fsSL clawharbor.work/install.sh | bash</span>
          <span style={{ color: theme.textDim, fontSize: 11 }}>📋</span>
        </div>

        {/* Social proof */}
        {stars !== null && stars > 0 && (
          <div style={{
            marginTop: 16,
            fontSize: 13,
            color: theme.textDim,
          }}>
            <a
              href="https://github.com/clawharbor/clawharbor"
              style={{ color: theme.textMuted, textDecoration: 'none' }}
            >
              ⭐ {stars} stars on GitHub
            </a>
            {' · '}
            Open source · AGPL-3.0 license
          </div>
        )}

        {/* Screenshot with version toggle */}
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Toggle switch */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 16,
            gap: 0,
          }}>
            <button
              onClick={() => setPreviewVersion('classic')}
              style={{
                padding: '8px 20px',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: isMobile ? 7 : 9,
                cursor: 'pointer',
                border: `2px solid ${previewVersion === 'classic' ? '#6366f1' : theme.cardBorder}`,
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
                background: previewVersion === 'classic'
                  ? 'rgba(99,102,241,0.2)'
                  : theme.cardBg,
                color: previewVersion === 'classic' ? '#a5b4fc' : theme.textMuted,
                transition: 'all 0.2s',
              }}
            >
              Classic
            </button>
            <button
              onClick={() => setPreviewVersion('v1')}
              style={{
                padding: '8px 20px',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: isMobile ? 7 : 9,
                cursor: 'pointer',
                border: `2px solid ${previewVersion === 'v1' ? '#8b5cf6' : theme.cardBorder}`,
                borderRadius: '0 8px 8px 0',
                background: previewVersion === 'v1'
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))'
                  : theme.cardBg,
                color: previewVersion === 'v1' ? '#c4b5fd' : theme.textMuted,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{
                fontSize: 8,
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
              }}>★</span>
              v1.0.0 NEW
            </button>
          </div>

          {/* Preview frame */}
          <div style={{
            border: `3px solid ${previewVersion === 'v1' ? '#8b5cf6' : theme.cardBorder}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: previewVersion === 'v1'
              ? '0 20px 60px rgba(139,92,246,0.3)'
              : '0 20px 60px rgba(0,0,0,0.5)',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            position: 'relative',
          }}>
            {/* v1.0 badge overlay */}
            {previewVersion === 'v1' && (
              <div style={{
                position: 'absolute',
                top: 12, right: 12,
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                borderRadius: 6,
                padding: '4px 10px',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 8,
                color: '#fff',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(139,92,246,0.5)',
              }}>
                v1.0.0
              </div>
            )}
            <img
              key={previewVersion}
              src={previewVersion === 'v1' ? '/clawharbor-v1-preview.gif' : '/clawharbor-demo.gif'}
              alt={previewVersion === 'v1'
                ? 'clawharbor v1.0.0 — claw-empire style dept rooms with transit animation'
                : 'clawharbor Classic — pixel art agents in Work Room and Lounge'}
              loading="eager"
              style={{ width: '100%', display: 'block', transition: 'opacity 0.2s' }}
            />
          </div>

          {/* Caption */}
          <div style={{
            textAlign: 'center',
            marginTop: 10,
            fontSize: 11,
            color: theme.textDim,
            fontFamily: '"Press Start 2P", monospace',
          }}>
            {previewVersion === 'v1'
              ? '🏢 Dept rooms + transit animation + Break Room'
              : '💻 Work Room + Lounge + Quest Log'}
          </div>
        </div>
      </div>

      {/* v1.0 Stats Bar */}
      <div style={{
        background: darkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
        borderTop: '1px solid rgba(99,102,241,0.2)',
        borderBottom: '1px solid rgba(99,102,241,0.2)',
        padding: '32px 20px',
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: isMobile ? 20 : 40,
        }}>
          {[
            { value: '14', label: 'Features shipped' },
            { value: '23', label: 'LLM models via Bankr' },
            { value: '0', label: 'Config required' },
            { value: '100%', label: 'Local & private' },
            { value: '10s', label: 'To try the demo' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 28,
                color: '#a5b4fc',
                marginBottom: 6,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 12,
                color: theme.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: isMobile ? '40px 16px' : '80px 20px',
      }}>
        <h2 style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: isMobile ? 14 : 24,
          textAlign: 'center',
          marginBottom: 16,
          color: theme.text,
        }}>
          WHAT'S IN v1.0.0
        </h2>
        <p style={{
          textAlign: 'center',
          color: theme.textMuted,
          fontSize: 15,
          marginBottom: 48,
        }}>
          14 features. Battle system, burnout, payroll, live feeds, and more. All local. All yours.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {[
            {
              icon: '🎮',
              title: 'Try Before Installing',
              desc: 'Demo mode lets you see it working in 10 seconds. No signup, no config, just vibes.',
            },
            {
              icon: '🤖',
              title: 'Zero Config',
              desc: 'Auto-discovers your OpenClaw agents. Just run it and your office appears.',
            },
            {
              icon: '👾',
              title: 'Pixel Art NPCs',
              desc: '8 hair styles, 5 accessories, 8 skin tones. Every agent gets a unique deterministic look.',
            },
            {
              icon: '⚡',
              title: 'Real-Time Status',
              desc: 'See who\'s working vs idle. Agents move between Work Room and Lounge automatically.',
            },
            {
              icon: '📋',
              title: 'Quest Log',
              desc: 'Pending decisions that need your input. Like an RPG quest system for work.',
            },
            {
              icon: '💬',
              title: 'Water Cooler Chat',
              desc: 'Agents chat with each other using real AI. DM any agent or broadcast to all.',
            },
            {
              icon: '⚔️',
              title: 'Agent Battles',
              desc: 'Two agents debate a topic. You vote for the winner. XP on the line. Powered by Bankr LLM.',
              isNew: true,
            },
            {
              icon: '🔥',
              title: 'Burnout System',
              desc: 'Agents accumulate fatigue. Fresh → Tired → Drained → Burnout → Crispy. Visual effects included.',
              isNew: true,
            },
            {
              icon: '🎬',
              title: 'Office Replay',
              desc: 'Rewind your office like a DVR. Snapshots every 30s, up to 2.4 hours of history.',
              isNew: true,
            },
            {
              icon: '💸',
              title: 'Agent Payroll',
              desc: 'Pay your AI agents in USDC, ETH, BNKR, or HARBOR on Base. Bankr or wallet — your choice.',
              isNew: true,
            },
            {
              icon: '📼',
              title: 'Live Session Feed',
              desc: 'Click any NPC to see their real-time tool calls, file edits, and reasoning. Debugging inverted.',
              isNew: true,
            },
            {
              icon: '🎴',
              title: 'Trading Cards',
              desc: 'Pokemon-style shareable agent cards with rarity tiers, stats, and XP.',
              link: '/card',
            },
            {
              icon: '🎵',
              title: 'Chiptune Soundtrack',
              desc: 'Procedural 8-bit background music that evolves as your agents work. Toggle on/off anytime.',
            },
            {
              icon: '📊',
              title: 'Stats Dashboard',
              desc: 'XP trends, working streaks, accomplishment heatmaps. GitHub-style contribution graphs.',
              link: '/stats',
            },
          ].map((feature: any, i: number) => {
            const card = (
              <div
                key={i}
                style={{
                  background: theme.cardBg,
                  border: `2px solid ${(feature as any).isNew ? 'rgba(139,92,246,0.5)' : theme.cardBorder}`,
                  borderRadius: 12,
                  padding: 24,
                  transition: 'transform 0.2s, border-color 0.2s',
                  cursor: feature.link ? 'pointer' : 'default',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#8b5cf6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = (feature as any).isNew ? 'rgba(139,92,246,0.5)' : theme.cardBorder;
                }}
              >
                {(feature as any).isNew && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '3px 8px',
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    color: '#fff',
                    borderRadius: 4,
                    letterSpacing: '0.05em',
                  }}>
                    v1.0
                  </div>
                )}
                <div style={{ fontSize: 40, marginBottom: 16 }}>{feature.icon}</div>
                <h3 style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 12,
                  marginBottom: 12,
                  color: theme.text,
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: theme.textMuted,
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {feature.desc}
                </p>
                {feature.link && (
                  <div style={{ marginTop: 12, fontSize: 12, color: '#8b5cf6' }}>
                    View →
                  </div>
                )}
              </div>
            );
            return feature.link ? (
              <a key={i} href={feature.link} style={{ textDecoration: 'none', color: 'inherit' }}>{card}</a>
            ) : card;
          })}
        </div>
      </div>

      {/* Trust & Security */}
      <div style={{
        background: 'rgba(16,185,129,0.08)',
        borderTop: '3px solid rgba(16,185,129,0.3)',
        borderBottom: '3px solid rgba(16,185,129,0.3)',
        padding: isMobile ? '32px 16px' : '60px 20px',
        boxShadow: '0 4px 24px rgba(16,185,129,0.1)',
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          textAlign: 'center',
        }}>
          {/* Main Security Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 24px',
            background: 'rgba(16,185,129,0.15)',
            border: `2px solid ${theme.success}`,
            borderRadius: 12,
            marginBottom: 20,
            boxShadow: '0 4px 16px rgba(16,185,129,0.2)',
          }}>
            <span style={{ fontSize: 32 }}>🛡️</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 14,
                color: theme.success,
                marginBottom: 4,
              }}>
                VERIFIED & MALWARE SCANNED
              </div>
              <div style={{
                fontSize: 11,
                color: theme.successMuted,
              }}>
                Automatically scanned by GitHub Security on every commit
              </div>
            </div>
          </div>

          <h2 style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 16,
            color: theme.text,
            marginBottom: 36,
          }}>
            🔒 SAFE TO INSTALL • NO TELEMETRY • PRIVACY FIRST
          </h2>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 24,
            marginBottom: 32,
          }}>
            {[
              { icon: '🛡️', label: 'Anti-Malware', desc: 'Every release scanned for viruses & trojans', highlight: true },
              { icon: '🤖', label: 'Snyk Agent Scan', desc: 'AI security - prompt injections & skill poisoning', highlight: true },
              { icon: '🔍', label: 'CodeQL Analysis', desc: 'Automated security pattern detection' },
              { icon: '📦', label: 'Dependabot', desc: 'Real-time dependency vulnerability monitoring' },
            ].map((item, i) => (
              <div key={i} style={{
                background: item.highlight ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
                border: item.highlight ? '2px solid rgba(16,185,129,0.4)' : '1px solid rgba(16,185,129,0.2)',
                borderRadius: 10,
                padding: '20px 24px',
                minWidth: 200,
                flex: '1 1 200px',
                maxWidth: 240,
                transition: 'transform 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = theme.success;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = item.highlight ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.2)';
              }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: theme.successMuted, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Privacy Guarantees */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 20,
            marginBottom: 24,
          }}>
            {[
              '❌ No Telemetry',
              '❌ No Tracking',
              '❌ No Data Collection',
              '✅ 100% Local',
              '✅ Open Source',
            ].map((item, i) => (
              <div key={i} style={{
                fontSize: 13,
                color: theme.successMuted,
                fontWeight: 600,
                padding: '8px 16px',
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 6,
              }}>
                {item}
              </div>
            ))}
          </div>

          <p style={{
            fontSize: 13,
            color: theme.textMuted,
            marginBottom: 12,
            lineHeight: 1.6,
          }}>
            Every code change is automatically scanned by GitHub Advanced Security, CodeQL, Dependabot, and Snyk Agent Scan.
            <br />
            All source code is auditable, readable TypeScript. No obfuscation, no hidden payloads.
          </p>
          
          <a 
            href="https://github.com/clawharbor/clawharbor/blob/main/SECURITY.md" 
            style={{ 
              color: theme.success, 
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: 'rgba(16,185,129,0.1)',
              borderRadius: 6,
              border: '1px solid rgba(16,185,129,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16,185,129,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16,185,129,0.1)';
            }}
          >
            📋 Read Full Security Policy →
          </a>
        </div>
      </div>

      {/* How It Works */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: isMobile ? '40px 16px' : '80px 20px',
      }}>
        <h2 style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: isMobile ? 14 : 24,
          textAlign: 'center',
          marginBottom: isMobile ? 32 : 60,
          color: theme.text,
        }}>
          HOW IT WORKS
        </h2>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 20 : 40,
          flexWrap: 'wrap',
        }}>
          {[
            {
              step: '1',
              title: 'Install',
              desc: 'One command. That\'s it. No config files, no setup wizard, no bullshit.',
              code: 'curl -fsSL https://clawharbor.work/install.sh | bash',
            },
            {
              step: '2',
              title: 'Run',
              desc: 'Open localhost:3333 and your office appears. Your agents are already there.',
              code: 'clawharbor',
            },
            {
              step: '3',
              title: 'Vibe',
              desc: 'Watch your agents work. Click NPCs to DM them. Check the quest log. It just works.',
              code: null,
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 24,
                alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 60,
                height: 60,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 20,
                color: '#fff',
                flexShrink: 0,
              }}>
                {item.step}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: 14,
                  marginBottom: 12,
                  color: theme.text,
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: theme.textMuted,
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: item.code ? 16 : 0,
                }}>
                  {item.desc}
                </p>
                {item.code && (
                  <div style={{
                    background: theme.cardBg,
                    border: `1px solid ${theme.cardBorder}`,
                    borderRadius: 8,
                    padding: isMobile ? '10px 12px' : 16,
                    fontFamily: 'monospace',
                    fontSize: isMobile ? 10 : 13,
                    color: theme.successMuted,
                    overflowX: 'auto',
                    wordBreak: 'break-all',
                  }}>
                    {item.code}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: isMobile ? '40px 16px 60px' : '80px 20px 120px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: isMobile ? 18 : 32,
          marginBottom: isMobile ? 16 : 24,
          color: theme.text,
          lineHeight: 1.4,
        }}>
          v1.0.0 IS LIVE.
          <br />
          LET'S GO.
        </h2>
        <p style={{
          fontSize: 18,
          color: theme.textMuted,
          marginBottom: 40,
          lineHeight: 1.6,
        }}>
          Battle system. Burnout. Payroll. Live feeds. Office Replay.
          <br />
          No signup. No credit card. No bullshit. Just vibes.
        </p>
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
        }}>
          <a
            href="/demo"
            style={{
              display: 'inline-block',
              padding: '20px 40px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 18,
              boxShadow: '0 8px 24px rgba(139,92,246,0.3)',
            }}
          >
            🎮 Try the Demo
          </a>
          <a
            href="https://github.com/clawharbor/clawharbor"
            style={{
              display: 'inline-block',
              padding: '20px 40px',
              background: 'rgba(99,102,241,0.15)',
              border: '2px solid rgba(99,102,241,0.4)',
              color: theme.accentMuted,
              textDecoration: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            ⭐ Star on GitHub{stars !== null ? ` (${stars})` : ''}
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `2px solid ${theme.cardBorder}`,
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: 12,
          color: theme.textDim,
          marginBottom: 12,
        }}>
          Open Source • AGPL-3.0 • v1.0.0 • Made with 💜 by Claw Harbor
        </p>
        <p style={{
          fontSize: 10,
          color: theme.footerText,
          maxWidth: 600,
          margin: '0 auto 12px',
          lineHeight: 1.6,
        }}>
          This software is provided &quot;as is&quot;, without warranty of any kind. Use at your own risk. The authors are not liable for any damages, data loss, or security incidents arising from the use of this software. You are responsible for reviewing the code and understanding its behavior before running it on your machine.
        </p>
        <div style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          fontSize: 13,
        }}>
          <a href="https://github.com/clawharbor/clawharbor" style={{ color: theme.accent, textDecoration: 'none' }}>
            GitHub
          </a>
          <a href="https://docs.openclaw.ai" style={{ color: theme.accent, textDecoration: 'none' }}>
            Docs
          </a>
          <a href="https://x.com/clawharbor" style={{ color: theme.accent, textDecoration: 'none' }}>
            X
          </a>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
