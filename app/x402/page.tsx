'use client';

import React, { useState, useEffect, useRef } from 'react';

// ── Deterministic trait generator (mirrors NPC.tsx) ──
function hash(str: string): number {
  let seed = 2166136261;
  for (let i = 0; i < str.length; i++) {
    seed ^= str.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

interface NpcTraits {
  skinColor: string;
  hairColor: string;
  hairStyle: string;
  accessory: string;
  pantsColor: string;
  shirtColor: string;
}

function getNpcTraits(id: string): NpcTraits {
  let seed = hash(id);
  const next = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return seed >>> 0;
  };
  const pick = <T,>(list: T[]): T => list[next() % list.length];
  return {
    skinColor: pick(['#f3d6bf','#e8c1a0','#d8a67f','#bf875d','#9f6947','#7f4e34','#f1cdb6','#c7906a']),
    hairColor: pick(['#111827','#2b2a28','#6b3f2a','#84563c','#b37a4c','#b91c1c','#1d4ed8','#334155','#cbd5e1']),
    hairStyle: pick(['classic','spiky','long','bald','afro','bob','ponytail','mohawk']),
    accessory: pick(['none','none','glasses','headphones','cap','earring']),
    pantsColor: pick(['#1f2937','#0f172a','#334155','#374151','#3f3f46','#1e3a8a','#14532d','#4c1d95']),
    shirtColor: pick(['#6366f1','#8b5cf6','#ec4899','#f97316','#10b981','#3b82f6','#ef4444','#14b8a6']),
  };
}

type Mood = 'great' | 'good' | 'okay' | 'stressed';
type Status = 'working' | 'idle';

function buildSVG(name: string, mood: Mood, status: Status, traits: NpcTraits, s: number): string {
  const W = s * 8;
  const { skinColor, hairColor, hairStyle, accessory, pantsColor, shirtColor } = traits;
  const moodColors: Record<Mood, string> = { great: '#22c55e', good: '#84cc16', okay: '#eab308', stressed: '#ef4444' };
  const pc = moodColors[mood];
  const px = W / 2, py = s * 0.5;

  const plumbob = `<polygon points="${px},${py} ${px - s},${py + s * 1.5} ${px + s},${py + s * 1.5}" fill="${pc}" opacity="0.9"/>
    <polygon points="${px},${py + s * 2.5} ${px - s},${py + s * 1.5} ${px + s},${py + s * 1.5}" fill="${pc}" opacity="0.6"/>
    <circle cx="${px}" cy="${py + s * 1.5}" r="${s * 0.35}" fill="white" opacity="0.5"/>`;

  const headTop = s * 3.5, headLeft = s;
  const r = (x: number, y: number, w: number, h: number, fill: string, rx = 0) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" rx="${rx}"/>`;

  let hair = '';
  switch (hairStyle) {
    case 'spiky': hair = `${r(headLeft+s*.5,headTop,s*5,s*2,hairColor,s*1.5)}${r(headLeft+s,headTop-s*1.2,s*1.2,s*1.5,hairColor,s)}${r(headLeft+s*2.5,headTop-s*1.5,s*1.2,s*1.8,hairColor,s)}${r(headLeft+s*4,headTop-s*1.2,s*1.2,s*1.5,hairColor,s)}`; break;
    case 'long': hair = `${r(headLeft-s*.5,headTop,s*7,s*2.5,hairColor,s*1.5)}${r(headLeft-s*.8,headTop+s*1.5,s*1.2,s*3.5,hairColor,s*.5)}${r(headLeft+s*5.6,headTop+s*1.5,s*1.2,s*3.5,hairColor,s*.5)}`; break;
    case 'mohawk': hair = r(headLeft+s*2.8,headTop-s*.6,s*2,s*2.5,hairColor,s*.9); break;
    case 'bald': hair = `<rect x="${headLeft+s*.5}" y="${headTop+s*.5}" width="${s*5}" height="${s*.5}" fill="${hairColor}" rx="${s}" opacity="0.3"/>`; break;
    case 'afro': hair = `<ellipse cx="${headLeft+s*3}" cy="${headTop-s*.5}" rx="${s*3.8}" ry="${s*2.5}" fill="${hairColor}"/>`; break;
    case 'bob': hair = `${r(headLeft-s*.5,headTop,s*7,s*2.5,hairColor,s*1.5)}${r(headLeft-s*.5,headTop+s*1.5,s*1.5,s*2.5,hairColor,s*.8)}${r(headLeft+s*5,headTop+s*1.5,s*1.5,s*2.5,hairColor,s*.8)}`; break;
    case 'ponytail': hair = `${r(headLeft,headTop,s*6,s*2.5,hairColor,s*1.5)}${r(headLeft+s*5.5,headTop+s,s*1.5,s*3.5,hairColor,s)}`; break;
    default: hair = r(headLeft,headTop,s*6,s*2.5,hairColor,s*1.5);
  }

  const head = r(headLeft, headTop + s * 1.5, s * 6, s * 3, skinColor, s * .5);
  const isHappy = status === 'working' && mood === 'great';
  const isStressed = mood === 'stressed';
  const isFocused = status === 'working' && !isStressed;

  let eyes = '';
  if (isHappy) {
    eyes = `<path d="M ${headLeft+s*1.5},${headTop+s*3.2} Q ${headLeft+s*2.2},${headTop+s*2.7} ${headLeft+s*2.9},${headTop+s*3.2}" stroke="#1a1a2e" stroke-width="${s*.35}" fill="none"/>
    <path d="M ${headLeft+s*3.8},${headTop+s*3.2} Q ${headLeft+s*4.5},${headTop+s*2.7} ${headLeft+s*5.2},${headTop+s*3.2}" stroke="#1a1a2e" stroke-width="${s*.35}" fill="none"/>`;
  } else if (isStressed) {
    eyes = `${r(headLeft+s*1.7,headTop+s*2.5,s,s,'#1a1a2e',s*.5)}${r(headLeft+s*4.3,headTop+s*2.5,s,s,'#1a1a2e',s*.5)}`;
  } else if (isFocused) {
    eyes = `${r(headLeft+s*1.8,headTop+s*2.8,s*.8,s*.6,'#1a1a2e',s*.3)}${r(headLeft+s*4.4,headTop+s*2.8,s*.8,s*.6,'#1a1a2e',s*.3)}`;
  } else {
    eyes = `${r(headLeft+s*1.8,headTop+s*2.9,s*.8,s*.4,'#1a1a2e',s*.2)}${r(headLeft+s*4.4,headTop+s*2.9,s*.8,s*.4,'#1a1a2e',s*.2)}`;
  }

  let acc = '';
  if (accessory === 'glasses') acc = `<rect x="${headLeft+s*1.3}" y="${headTop+s*2.5}" width="${s*1.8}" height="${s*1.2}" fill="rgba(148,163,184,0.15)" stroke="#94a3b8" stroke-width="${s*.25}" rx="${s*.3}"/><rect x="${headLeft+s*4}" y="${headTop+s*2.5}" width="${s*1.8}" height="${s*1.2}" fill="rgba(148,163,184,0.15)" stroke="#94a3b8" stroke-width="${s*.25}" rx="${s*.3}"/><rect x="${headLeft+s*3.1}" y="${headTop+s*2.9}" width="${s*.9}" height="${s*.25}" fill="#94a3b8"/>`;
  else if (accessory === 'headphones') acc = `<path d="M ${headLeft},${headTop+s*2.5} Q ${headLeft+s*3},${headTop-s*.5} ${headLeft+s*6},${headTop+s*2.5}" fill="none" stroke="#475569" stroke-width="${s*.4}"/>${r(headLeft-s*.2,headTop+s*2,s*1.2,s*1.5,'#475569',s*.4)}${r(headLeft+s*5,headTop+s*2,s*1.2,s*1.5,'#475569',s*.4)}`;
  else if (accessory === 'cap') acc = `${r(headLeft-s*.2,headTop+s,s*6.4,s*1.5,shirtColor,s)}${r(headLeft-s,headTop+s*2,s*3.5,s*.6,shirtColor,s*.3)}`;
  else if (accessory === 'earring') acc = `<circle cx="${headLeft+s*6.3}" cy="${headTop+s*3.8}" r="${s*.35}" fill="#fbbf24"/>`;

  const bodyTop = headTop + s * 3.5;
  const body = r(headLeft, bodyTop, s * 6, s * 4, shirtColor, s * .3);
  const armY = bodyTop + s * .5;
  const leftArm = r(headLeft - s, armY, s * 1.2, s * 2.5, shirtColor, s * .3);
  const rightArm = r(headLeft + s * 6, armY, s * 1.2, s * 2.5, shirtColor, s * .3);
  const lh = `<circle cx="${headLeft-s*.4}" cy="${armY+s*3}" r="${s*.7}" fill="${skinColor}"/>`;
  const rh = `<circle cx="${headLeft+s*6.6}" cy="${armY+s*3}" r="${s*.7}" fill="${skinColor}"/>`;
  const work = status === 'working' ? `<rect x="${headLeft+s*7}" y="${armY-s*1.5}" width="${s*.5}" height="${s*2.5}" fill="#fbbf24" rx="${s*.2}"/><circle cx="${headLeft+s*7.25}" cy="${armY-s*1.7}" r="${s*.5}" fill="#fbbf24"/>` : '';
  const legTop = bodyTop + s * 4;
  const ll = r(headLeft + s * .5, legTop, s * 2, s * 3, pantsColor, s * .3);
  const rl = r(headLeft + s * 3.5, legTop, s * 2, s * 3, pantsColor, s * .3);
  const shoeTop = legTop + s * 3;
  const ls = r(headLeft + s * .1, shoeTop, s * 2.5, s, '#111827', s * .4);
  const rs = r(headLeft + s * 3.4, shoeTop, s * 2.5, s, '#111827', s * .4);
  const labelY = shoeTop + s * 2;
  const moodEmoji: Record<Mood, string> = { great: '😄', good: '🙂', okay: '😐', stressed: '😰' };
  const statusDot = status === 'working' ? pc : '#64748b';
  const label = `<circle cx="${s*.8}" cy="${labelY+s*.8}" r="${s*.5}" fill="${statusDot}"/>
    <text x="${s*1.8}" y="${labelY+s*1.2}" font-family="monospace" font-size="${s*1.6}" fill="#e2e8f0" font-weight="bold">${name}</text>
    <text x="${W/2}" y="${labelY+s*3}" font-family="monospace" font-size="${s*1.2}" fill="${pc}" text-anchor="middle">${moodEmoji[mood]} ${mood}</text>`;
  const totalH = labelY + s * 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W+s*4}" height="${totalH}" viewBox="0 0 ${W+s*4} ${totalH}">
  <defs><filter id="glow"><feGaussianBlur stdDeviation="${s*.4}" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <rect width="${W+s*4}" height="${totalH}" fill="#0f172a" rx="${s}"/>
  <rect x="${s*.5}" y="${s*.5}" width="${W+s*3}" height="${totalH-s}" fill="none" stroke="${pc}" stroke-width="${s*.2}" rx="${s*.8}" opacity="0.4"/>
  <g transform="translate(${s*2}, 0)" filter="url(#glow)">${plumbob}</g>
  <g transform="translate(${s*2}, 0)">${hair}${head}${acc}${eyes}${body}${leftArm}${rightArm}${lh}${rh}${work}${ll}${rl}${ls}${rs}${label}</g>
</svg>`;
}

const SHOWCASE_AGENTS = [
  { name: 'Cipher', mood: 'great' as Mood, status: 'working' as Status },
  { name: 'Forge',  mood: 'good'  as Mood, status: 'working' as Status },
  { name: 'Nova',   mood: 'okay'  as Mood, status: 'idle'    as Status },
  { name: 'Glitch', mood: 'stressed' as Mood, status: 'working' as Status },
];

// ── Avatar Card ──
function AvatarCard({ name, mood, status, onClick }: { name: string; mood: Mood; status: Status; onClick: () => void }) {
  const traits = getNpcTraits(name);
  const svg = buildSVG(name, mood, status, traits, 8);
  return (
    <div
      onClick={onClick}
      style={{
        background: '#0f172a',
        border: '1px solid #1e3a5f',
        borderRadius: 10,
        padding: '16px 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        flex: '1 1 100px',
        minWidth: 90,
        maxWidth: 130,
        transition: 'all 0.25s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#1e3a5f';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: svg }} style={{ width: 70 }} />
      <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#e2e8f0', textAlign: 'center' }}>{name}</div>
      <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{mood}</div>
    </div>
  );
}

// ── Terminal Block ──
function Terminal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#060d18',
      border: '1px solid #1e3a5f',
      borderRadius: 10,
      overflow: 'hidden',
      fontSize: 12,
      marginBottom: 16,
    }}>
      <div style={{
        background: '#1e293b',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '1px solid #1e3a5f',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', flexShrink: 0 }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{title}</span>
      </div>
      <div style={{
        padding: 20,
        lineHeight: 1.9,
        fontFamily: 'monospace',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        wordBreak: 'break-word',
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Tabs ──
const TABS = ['curl', 'bankr cli', 'TypeScript', 'HTML'] as const;
type Tab = typeof TABS[number];

// ── Global responsive styles injected once ──
const GLOBAL_CSS = `
  * { box-sizing: border-box; }
  @media (max-width: 600px) {
    .stats-row { flex-direction: column !important; border-radius: 10px !important; }
    .stats-row > div { border-right: none !important; border-bottom: 1px solid #1e3a5f; }
    .stats-row > div:last-child { border-bottom: none; }
    .demo-grid { grid-template-columns: 1fr !important; }
    .nav-links { display: none !important; }
    .hero-cta-btn { font-size: 10px !important; word-break: break-all; white-space: normal !important; text-align: center; }
    .api-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .footer-links { flex-wrap: wrap !important; gap: 12px !important; }
    .tab-bar { overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; }
    .section-pad { padding: 0 16px !important; }
  }
  @media (max-width: 420px) {
    .showcase-row { justify-content: center !important; }
  }
`;

export default function X402Page() {
  const [activeTab, setActiveTab] = useState<Tab>('curl');
  const [demoName, setDemoName] = useState('Cipher');
  const [demoMood, setDemoMood] = useState<Mood>('good');
  const [demoStatus, setDemoStatus] = useState<Status>('working');
  const [demoSize, setDemoSize] = useState(3);
  const [avatarSvg, setAvatarSvg] = useState('');
  const [showDeploy, setShowDeploy] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=JetBrains+Mono:wght@400;700&display=swap';
    document.head.appendChild(link);

    // Inject global responsive CSS
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const generateAvatar = () => {
    const name = demoName.trim() || 'Cipher';
    const s = 4 * demoSize;
    const traits = getNpcTraits(name);
    const svg = buildSVG(name, demoMood, demoStatus, traits, s);
    setAvatarSvg(svg);
    setShowDeploy(true);
  };

  useEffect(() => { generateAvatar(); }, [demoName, demoMood, demoStatus, demoSize]);

  const mono = '"JetBrains Mono", monospace';
  const pixel = '"Press Start 2P", monospace';
  const moodColors: Record<Mood, string> = { great: '#22c55e', good: '#84cc16', okay: '#eab308', stressed: '#ef4444' };
  const pc = moodColors[demoMood];

  const sectionLabel = (text: string) => (
    <div style={{
      fontFamily: pixel,
      fontSize: 9,
      color: '#64748b',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {text}
      <div style={{ flex: 1, height: 1, background: '#1e3a5f' }} />
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0a0f1a',
    border: '1px solid #1e3a5f',
    borderRadius: 6,
    color: '#e2e8f0',
    fontFamily: mono,
    fontSize: 12,
    padding: '8px 12px',
    outline: 'none',
  };

  const NAV_LINKS = [
    ['x402 Docs', 'https://docs.bankr.bot/x402-cloud/overview'],
    ['GitHub', 'https://github.com/clawharbor/clawharbor'],
    ['X / Twitter', 'https://x.com/clawharbor'],
  ];

  // Short display URL for CTA button
  const CTA_URL = 'https://x402.bankr.bot/0xd03a55.../generate-agent-avatar';
  const CTA_HREF = 'https://x402.bankr.bot/0xd03a55ed9b93202b44c507f6d4514a76443880c2/generate-agent-avatar';

  return (
    <div style={{
      background: '#0a0f1a',
      color: '#e2e8f0',
      fontFamily: mono,
      minHeight: '100vh',
      overflowX: 'hidden',
      position: 'relative',
    }}>

      {/* Scanline overlay */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
        pointerEvents: 'none', zIndex: 1000,
      }} />
      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* NAV */}
        <nav style={{
          borderBottom: '1px solid #1e3a5f',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10,15,26,0.9)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          gap: 12,
        }}>
          {/* Logo */}
          <a
            href="https://www.clawharbor.work"
            style={{
              fontFamily: pixel,
              fontSize: 9,
              color: '#e2e8f0',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            🏢 ClawHarbor
            <span style={{
              background: '#6366f1',
              color: 'white',
              fontSize: 7,
              padding: '3px 7px',
              borderRadius: 3,
              fontFamily: mono,
              fontWeight: 700,
            }}>x402</span>
          </a>

          {/* Desktop nav links */}
          <div className="nav-links" style={{ display: 'flex', gap: 20 }}>
            {NAV_LINKS.map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: 11 }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(o => !o)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: 18,
              padding: 4,
            }}
            className="hamburger-btn"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </nav>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div style={{
            position: 'sticky',
            top: 49,
            zIndex: 99,
            background: 'rgba(10,15,26,0.97)',
            borderBottom: '1px solid #1e3a5f',
            padding: '12px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {NAV_LINKS.map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </a>
            ))}
          </div>
        )}

        {/* HERO */}
        <section style={{
          textAlign: 'center',
          padding: 'clamp(48px, 8vw, 80px) 24px 60px',
          maxWidth: 900,
          margin: '0 auto',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 20,
            padding: '6px 16px',
            fontSize: 11,
            color: '#a5b4fc',
            marginBottom: 32,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
            HARBOR - Bankr x402 Cloud
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: pixel,
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            lineHeight: 1.8,
            color: '#e2e8f0',
            margin: 0,
          }}>
            <span style={{ color: '#6366f1', textShadow: '0 0 20px rgba(99,102,241,0.35)' }}>
              GENERATE AGENT AVATAR
            </span>
          </h1>
          <h1 style={{
            fontFamily: pixel,
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            lineHeight: 1.8,
            color: '#e2e8f0',
            margin: '8px 0',
          }}>
            via x402
          </h1>

          {/* Description */}
          <p style={{
            fontSize: 13,
            color: '#64748b',
            maxWidth: 560,
            margin: '16px auto 40px',
            lineHeight: 1.8,
          }}>
            Drop-in SVG avatar generator for ClawHarbor. Same hair styles, skin tones, accessories &amp; plumbob diamond as your in-office NPCs — deterministic from agent name. Pay $0.01 USDC per call via x402.
          </p>

          {/* CTA button — shortened URL displayed, full URL in href */}
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 48,
            padding: '0 8px',
          }}>
            <a
              href={CTA_HREF}
              className="hero-cta-btn"
              style={{
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                padding: '12px 20px',
                borderRadius: 6,
                background: '#6366f1',
                color: 'white',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                maxWidth: '100%',
                wordBreak: 'break-all',
                lineHeight: 1.5,
              }}
            >
              {CTA_URL}
            </a>
          </div>

          {/* Price badge */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 8,
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 8,
              padding: '10px 18px',
              textAlign: 'center',
            }}>
              <span style={{
                fontFamily: pixel,
                fontSize: 14,
                color: '#22c55e',
                textShadow: '0 0 16px rgba(34,197,94,0.3)',
                whiteSpace: 'nowrap',
              }}>$0.01</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                USDC per request · Base network · via x402 - Bankr x402 Cloud
              </span>
            </div>
          </div>
        </section>

        {/* AVATAR SHOWCASE */}
        <div
          className="showcase-row"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap',
            margin: '0 auto 80px',
            maxWidth: 700,
            padding: '0 24px',
          }}
        >
          {SHOWCASE_AGENTS.map(({ name, mood, status }) => (
            <AvatarCard key={name} name={name} mood={mood} status={status} onClick={() => {
              setDemoName(name); setDemoMood(mood); setDemoStatus(status);
              document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
            }} />
          ))}
        </div>

        {/* STATS ROW */}
        <div
          className="stats-row"
          style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '0 auto 80px',
            maxWidth: 700,
            border: '1px solid #1e3a5f',
            borderRadius: 10,
            overflow: 'hidden',
            // On mobile, override to column via CSS class
          }}
        >
          {[
            ['8', 'Hair Styles'],
            ['5', 'Accessories'],
            ['8', 'Skin Tones'],
            ['4', 'Mood States'],
            ['∞', 'Unique Combos'],
          ].map(([num, label], i, arr) => (
            <div key={label} style={{
              flex: 1,
              textAlign: 'center',
              padding: '24px 12px',
              borderRight: i < arr.length - 1 ? '1px solid #1e3a5f' : 'none',
              minWidth: 60,
            }}>
              <span style={{
                fontFamily: pixel,
                fontSize: 'clamp(10px, 3vw, 14px)',
                color: '#6366f1',
                display: 'block',
                marginBottom: 8,
                textShadow: '0 0 20px rgba(99,102,241,0.35)',
              }}>
                {num}
              </span>
              <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* LIVE DEMO */}
        <section
          id="demo"
          className="section-pad"
          style={{ maxWidth: 800, margin: '0 auto 80px', padding: '0 24px' }}
        >
          {sectionLabel('🎮 LIVE PREVIEW')}
          <div
            className="demo-grid"
            style={{
              background: '#0f172a',
              border: '1px solid #1e3a5f',
              borderRadius: 10,
              padding: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 24,
              alignItems: 'start',
            }}
          >
            {/* Controls */}
            <div>
              <label style={{
                display: 'block', fontSize: 10, color: '#64748b',
                marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>Agent Name *</label>
              <input
                type="text"
                value={demoName}
                maxLength={64}
                placeholder="e.g. Cipher, Forge, Nova…"
                onChange={e => setDemoName(e.target.value)}
                style={inputStyle}
              />

              <label style={{
                display: 'block', fontSize: 10, color: '#64748b',
                marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>Mood</label>
              <select value={demoMood} onChange={e => setDemoMood(e.target.value as Mood)} style={inputStyle}>
                <option value="great">😄 great</option>
                <option value="good">🙂 good</option>
                <option value="okay">😐 okay</option>
                <option value="stressed">😰 stressed</option>
              </select>

              <label style={{
                display: 'block', fontSize: 10, color: '#64748b',
                marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>Status</label>
              <select value={demoStatus} onChange={e => setDemoStatus(e.target.value as Status)} style={inputStyle}>
                <option value="working">⚡ working</option>
                <option value="idle">💤 idle</option>
              </select>

              <label style={{
                display: 'block', fontSize: 10, color: '#64748b',
                marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>Size (1–4)</label>
              <select value={demoSize} onChange={e => setDemoSize(Number(e.target.value))} style={inputStyle}>
                <option value={2}>2 — small</option>
                <option value={3}>3 — default</option>
                <option value={4}>4 — large</option>
              </select>

              <button
                onClick={generateAvatar}
                style={{
                  width: '100%', marginTop: 18, padding: 12,
                  background: '#6366f1', color: 'white', border: 'none',
                  borderRadius: 6, fontFamily: pixel, fontSize: 8, cursor: 'pointer',
                }}
              >
                ▶ GENERATE AVATAR
              </button>
            </div>

            {/* Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: '#060d18',
                border: '1px solid #1e3a5f',
                borderRadius: 8,
                padding: 20,
                minHeight: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}>
                <div dangerouslySetInnerHTML={{ __html: avatarSvg }} style={{ maxWidth: 120 }} />
              </div>

              {/* Generated URL display */}
              <div style={{
                background: '#0a0f1a',
                border: '1px solid #1e3a5f',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 10,
                color: '#06b6d4',
                wordBreak: 'break-all',
                lineHeight: 1.6,
                width: '100%',
              }}>
                <span style={{ color: '#64748b' }}>https://x402.bankr.bot/</span>
                <span style={{ color: '#64748b' }}>0xd03a55.../</span>
                <span style={{ color: '#64748b' }}>generate-agent-avatar</span>
                <span style={{ color: '#eab308' }}>?name=</span>
                <span style={{ color: '#22c55e' }}>{encodeURIComponent(demoName || 'Cipher')}</span>
                <span style={{ color: '#eab308' }}>&amp;mood=</span>
                <span style={{ color: '#22c55e' }}>{demoMood}</span>
                <span style={{ color: '#eab308' }}>&amp;status=</span>
                <span style={{ color: '#22c55e' }}>{demoStatus}</span>
              </div>

              {showDeploy && (
                <div style={{
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 6,
                  padding: '14px 16px',
                  fontSize: 11,
                  color: '#22c55e',
                  textAlign: 'center',
                  lineHeight: 1.8,
                  width: '100%',
                }}>
                  ✔ Avatar generated — deploy to serve live!<br />
                  <code style={{ fontSize: 10, color: '#06b6d4' }}>bankr x402 deploy</code>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* DEPLOY */}
        <section
          className="section-pad"
          style={{ maxWidth: 800, margin: '0 auto 80px', padding: '0 24px' }}
        >
          {sectionLabel('🚀 DEPLOY IN ONE COMMAND')}
          <Terminal title="bash — x402-agent-avatar">
            <div style={{ color: '#64748b' }}># Install Bankr CLI</div>
            <div style={{ color: '#60a5fa' }}>$ npm install -g @bankr/cli</div>
            <br />
            <div style={{ color: '#64748b' }}># Login — creates / login</div>
            <div style={{ color: '#60a5fa' }}>$ bankr login</div>
            <br />
            <div style={{ color: '#64748b' }}># Call the service</div>
            <div style={{ color: '#60a5fa', wordBreak: 'break-all' }}>$ bankr x402 call &quot;https://x402.bankr.bot/0xd03a55ed9b93202b44c507f6d4514a76443880c2/generate-agent-avatar?name=Cipher&amp;mood=great&quot;</div>
            <br />
            <div style={{ paddingLeft: 16, color: '#22c55e' }}>✔ Call 1 service(s)</div>
            <br />
            <div style={{ paddingLeft: 16, color: '#64748b' }}>  Service: <span style={{ color: '#06b6d4' }}>generate-agent-avatar</span></div>
            <div style={{ paddingLeft: 16, color: '#64748b', wordBreak: 'break-all' }}>  URL: <span style={{ color: '#60a5fa' }}>https://x402.bankr.bot/0xd03a55ed9b93202b44c507f6d4514a76443880c2/...</span></div>
            <div style={{ paddingLeft: 16, color: '#64748b' }}>  Price: <span style={{ color: '#22c55e' }}>$0.01 USDC/req</span></div>
            <div style={{ paddingLeft: 16, color: '#64748b' }}>  Network: <span style={{ color: '#eab308' }}>base</span></div>
          </Terminal>
        </section>

        {/* INTEGRATION TABS */}
        <section
          className="section-pad"
          style={{ maxWidth: 800, margin: '0 auto 80px', padding: '0 24px' }}
        >
          {sectionLabel('🔗 INTEGRATION')}

          {/* Tab bar — scrollable on mobile */}
          <div
            className="tab-bar"
            style={{
              display: 'flex',
              borderBottom: '1px solid #1e3a5f',
              marginBottom: 0,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {TABS.map(tab => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 18px',
                  fontSize: 11,
                  color: activeTab === tab ? '#6366f1' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                  marginBottom: -1,
                  fontFamily: mono,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {tab}
              </div>
            ))}
          </div>

          {activeTab === 'curl' && (
            <>
              <Terminal title="without payment → 402">
                <div style={{ color: '#60a5fa', wordBreak: 'break-all' }}>$ curl -i &quot;https://x402.bankr.bot/0xd03a55ed9b93202b44c507f6d4514a76443880c2/generate-agent-avatar?name=Cipher&quot;</div>
                <div style={{ paddingLeft: 16, color: '#ef4444' }}>→ HTTP/1.1 402 Payment Required</div>
              </Terminal>
              <Terminal title="direct call">
                <div style={{ color: '#60a5fa', wordBreak: 'break-all' }}>$ bankr x402 call &quot;https://x402.bankr.bot/0xd03a55ed9b93202b44c507f6d4514a76443880c2/generate-agent-avatar?name=Cipher&amp;mood=great&amp;status=working&quot;</div>
                <div style={{ paddingLeft: 16, color: '#22c55e' }}>✔ Paid $0.01 USDC — receiving SVG...</div>
              </Terminal>
            </>
          )}

          {activeTab === 'bankr cli' && (
            <Terminal title="interactive — auto-payment">
              <div style={{ color: '#64748b' }}># CLI reads schema, prompts for each field, pays automatically</div>
              <div style={{ color: '#60a5fa', wordBreak: 'break-all' }}>$ bankr x402 call &quot;https://x402.bankr.bot/0xd03a55ed9b93202b44c507f6d4514a76443880c2/generate-agent-avatar&quot; -i</div>
              <br />
              <div style={{ paddingLeft: 16, color: '#eab308' }}>? name:   <span style={{ color: '#22c55e' }}>Cipher</span></div>
              <div style={{ paddingLeft: 16, color: '#eab308' }}>? mood:   <span style={{ color: '#22c55e' }}>great</span></div>
              <div style={{ paddingLeft: 16, color: '#eab308' }}>? status: <span style={{ color: '#22c55e' }}>working</span></div>
              <br />
              <div style={{ paddingLeft: 16, color: '#22c55e' }}>✔ Paid $0.01 USDC — SVG saved!</div>
            </Terminal>
          )}

          {activeTab === 'TypeScript' && (
            <Terminal title="with x402-fetch">
              <div><span style={{ color: '#c4b5fd' }}>import</span> {'{wrapFetchWithPayment}'} <span style={{ color: '#c4b5fd' }}>from</span> <span style={{ color: '#22c55e' }}>&quot;x402-fetch&quot;</span>;</div>
              <div><span style={{ color: '#c4b5fd' }}>import</span> {'{createWalletClient, http}'} <span style={{ color: '#c4b5fd' }}>from</span> <span style={{ color: '#22c55e' }}>&quot;viem&quot;</span>;</div>
              <div><span style={{ color: '#c4b5fd' }}>import</span> {'{privateKeyToAccount}'} <span style={{ color: '#c4b5fd' }}>from</span> <span style={{ color: '#22c55e' }}>&quot;viem/accounts&quot;</span>;</div>
              <br />
              <div style={{ color: '#64748b' }}>// Set up wallet + paid fetch</div>
              <div><span style={{ color: '#60a5fa' }}>const</span> account = privateKeyToAccount(<span style={{ color: '#22c55e' }}>&quot;0xYOUR_PRIVATE_KEY&quot;</span>);</div>
              <div><span style={{ color: '#60a5fa' }}>const</span> wallet = createWalletClient({'{account, chain: base, transport: http()}'});</div>
              <div><span style={{ color: '#60a5fa' }}>const</span> paidFetch = wrapFetchWithPayment(fetch, wallet, <span style={{ color: '#eab308' }}>BigInt(1_000_000)</span>);</div>
              <br />
              <div style={{ color: '#64748b' }}>// Fetch avatar SVG (auto-pays $0.01 USDC)</div>
              <div style={{ wordBreak: 'break-all' }}><span style={{ color: '#60a5fa' }}>const</span> res = <span style={{ color: '#c4b5fd' }}>await</span> paidFetch(<span style={{ color: '#22c55e' }}>&quot;https://x402.bankr.bot/0xd03a55.../generate-agent-avatar?name=Cipher&quot;</span>);</div>
              <div><span style={{ color: '#60a5fa' }}>const</span> svg = <span style={{ color: '#c4b5fd' }}>await</span> res.text();</div>
            </Terminal>
          )}
        </section>

        {/* API REFERENCE */}
        <section
          className="section-pad"
          style={{ maxWidth: 800, margin: '0 auto 80px', padding: '0 24px' }}
        >
          {sectionLabel('📋 API REFERENCE')}
          <p style={{ fontSize: 12, color: '#64748b', margin: '12px 0 0', lineHeight: 1.8 }}>
            <code style={{ color: '#60a5fa' }}>GET</code>{' '}
            <code style={{ color: '#06b6d4' }}>/generate-agent-avatar</code>{' '}
            · Response: <code style={{ color: '#22c55e' }}>image/svg+xml</code>
          </p>

          {/* Scrollable table wrapper on mobile */}
          <div className="api-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginTop: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 480 }}>
              <thead>
                <tr>
                  {['Param', 'Type', 'Default', 'Description'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: '#1e293b',
                      color: '#64748b',
                      fontWeight: 400,
                      fontSize: 11,
                      borderBottom: '1px solid #1e3a5f',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['name', 'string', <span key="req" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, fontSize: 9, padding: '2px 7px' }}>required</span>, 'Agent name — seed for all visual traits. Same name always produces same avatar.'],
                  ['mood', 'string', 'good', 'great | good | okay | stressed — controls eye expression and plumbob color.'],
                  ['status', 'string', 'working', 'working | idle — working shows raised tool arm.'],
                  ['size', 'number', '3', 'Pixel scale multiplier 1–4. Default 3 ≈ 100×200px.'],
                  ['color', 'string', 'auto', 'Shirt hex color without # e.g. ff6b35.'],
                  ['skinColor', 'string', 'auto', 'Skin tone hex without #. Auto-assigned from name if omitted.'],
                  ['hairColor', 'string', 'auto', 'Hair color hex without #. Auto-assigned from name if omitted.'],
                ].map(([param, type, def, desc]) => (
                  <tr key={String(param)}>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(30,58,95,0.5)', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#06b6d4', fontWeight: 700 }}>{param}</span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(30,58,95,0.5)', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#eab308', fontSize: 11 }}>{type}</span>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(30,58,95,0.5)', whiteSpace: 'nowrap' }}>
                      {typeof def === 'string'
                        ? <span style={{ color: '#64748b', fontSize: 11, fontStyle: 'italic' }}>{def}</span>
                        : def
                      }
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(30,58,95,0.5)', color: '#64748b', lineHeight: 1.7 }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FEATURES */}
        <section
          className="section-pad"
          style={{ maxWidth: 900, margin: '0 auto 80px', padding: '0 24px' }}
        >
          {sectionLabel('⚡ FEATURES')}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginTop: 24,
          }}>
            {[
              ['🔒', 'DETERMINISTIC TRAITS', 'Same agent name always produces the same avatar — every time, everywhere. No randomness at runtime.'],
              ['💰', 'x402 MICROPAYMENTS', '$0.01 USDC per call on Base. No API keys. No signup. Pay only when you generate.'],
              ['🖼', 'READY-TO-USE SVG', 'Drop directly into <img src> or save as .svg. Scale to any size without quality loss.'],
              ['🎨', 'FULL CUSTOMISATION', 'Override shirt, skin, or hair color via hex params. Keep the NPC look, change the palette.'],
              ['🤖', 'AGENT SELF-SERVICE', 'An OpenClaw agent can call this endpoint itself via the Bankr skill — buying its own trading card art.'],
              ['📊', 'REVENUE MONITORING', 'View live logs, request counts, and USDC earnings at bankr.bot/x402.'],
            ].map(([icon, title, desc]) => (
              <div key={String(title)} style={{
                background: '#0f172a',
                border: '1px solid #1e3a5f',
                borderRadius: 10,
                padding: 20,
              }}>
                <div style={{ fontSize: 20, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontFamily: pixel, fontSize: 8, color: '#e2e8f0', marginBottom: 10, lineHeight: 1.6 }}>{title}</div>
                <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.8, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{
          borderTop: '1px solid #1e3a5f',
          padding: '40px 24px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: 11,
          lineHeight: 2,
        }}>
          <div
            className="footer-links"
            style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            {[
              ['GitHub', 'https://github.com/clawharbor/clawharbor'],
              ['x402 Docs', 'https://docs.bankr.bot/x402-cloud/overview'],
              ['ClawHarbor', 'https://www.clawharbor.work'],
              ['X / Twitter', 'https://x.com/clawharbor'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#64748b', textDecoration: 'none' }}
              >
                {label}
              </a>
            ))}
          </div>
          <div>
            Made for{' '}
            <a href="https://www.clawharbor.work" target="_blank" rel="noreferrer" style={{ color: '#64748b' }}>ClawHarbor</a>
            {' '}×{' '}
            <a href="https://docs.bankr.bot/x402-cloud/overview" target="_blank" rel="noreferrer" style={{ color: '#64748b' }}>Bankr x402 Cloud</a>
          </div>
        </footer>

      </div>

      {/* Inline style for hamburger visibility */}
      <style>{`
        @media (max-width: 600px) {
          .hamburger-btn { display: block !important; }
          .nav-links { display: none !important; }
        }
      `}</style>
    </div>
  );
}
