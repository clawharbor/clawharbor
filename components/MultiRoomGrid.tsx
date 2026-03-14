'use client';

/**
 * MultiRoomGrid — claw-empire style office layout
 * Faithfully recreates the visual language from claw-empire:
 * - Warm pastel light palette (creamWhite, warmSand, dustyRose per dept)
 * - Checkerboard tiled floor with per-tile edge highlights
 * - Bunting flags along ceiling
 * - Wall atmosphere (gradient top panel, darker baseboard)
 * - Windows with panes, curtains, cloud silhouettes
 * - Wood-grain desk + keyboard + monitor + coffee mug
 * - Wall clock (top-right of each room)
 * - Cactus/plant corner decorations
 * - CEO Office full-width at top with collab table
 * - Break Room full-width at bottom
 */

import React from 'react';
import type { Agent } from './types';
import { NPC } from './NPC';
import { NPCParticles } from './NPCParticles';
import { ChatBubble } from './ChatBubble';
import { CooldownTimer } from './CooldownTimer';
import { prettifyTask } from './utils';

// ─── Claw-empire exact color palette (light mode) ────────────────────────────
const P = {
  creamWhite: '#f8f3ec',
  creamDeep:  '#ebdfcf',
  softMint:   '#bfded5',
  dustyRose:  '#d5a5ae',
  warmSand:   '#d6b996',
  warmWood:   '#b8906d',
  cocoa:      '#6f4d3a',
  ink:        '#2f2530',
  slate:      '#586378',
};

// ─── Department themes (floor1, floor2, wall, accent) — exact from claw-empire
const DEPT_THEMES: Record<string, { floor1: string; floor2: string; wall: string; accent: string; label: string; icon: string }> = {
  engineering: { floor1: '#d8e8f5', floor2: '#cce1f2', wall: '#6c96b7', accent: '#5a9fd4', label: 'Engineering', icon: '💻' },
  design:      { floor1: '#e8def2', floor2: '#e1d4ee', wall: '#9378ad', accent: '#9a6fc4', label: 'Design',      icon: '🎨' },
  product:     { floor1: '#f0e1c5', floor2: '#eddaba', wall: '#ae9871', accent: '#d4a85a', label: 'Product',     icon: '📋' },
  operations:  { floor1: '#d0eede', floor2: '#c4ead5', wall: '#6eaa89', accent: '#5ac48a', label: 'Operations',  icon: '⚙️'  },
  qa:          { floor1: '#f0cbcb', floor2: '#edc0c0', wall: '#ae7979', accent: '#d46a6a', label: 'QA',          icon: '🔍' },
  devsecops:   { floor1: '#f0d5c5', floor2: '#edcdba', wall: '#ae8871', accent: '#d4885a', label: 'DevSecOps',   icon: '🛡️'  },
  data:        { floor1: '#f0e8c5', floor2: '#eddfba', wall: '#ae9e71', accent: '#d4bc5a', label: 'Data',        icon: '📊' },
  marketing:   { floor1: '#f5d5e5', floor2: '#f2cade', wall: '#b57898', accent: '#d4688a', label: 'Marketing',   icon: '📣' },
  sales:       { floor1: '#c5e8f0', floor2: '#badef0', wall: '#71a2ae', accent: '#5ab8d4', label: 'Sales',       icon: '🤝' },
  ceo:         { floor1: '#e5d9b9', floor2: '#dfd0a8', wall: '#998243', accent: '#a77d0c', label: 'CEO Office',  icon: '👑' },
  breakroom:   { floor1: '#f7e2b7', floor2: '#f6dead', wall: '#a99c83', accent: '#f0c878', label: 'Break Room',  icon: '☕' },
  general:     { floor1: '#e0dde8', floor2: '#d8d4e4', wall: '#7878a0', accent: '#8080c0', label: 'Office',      icon: '🏢' },
};

function getDeptTheme(role: string) {
  const r = (role || '').toLowerCase();
  if (r.match(/engineer|dev|code|frontend|backend|fullstack|software/)) return DEPT_THEMES.engineering;
  if (r.match(/design|ui|ux|creative|art/))    return DEPT_THEMES.design;
  if (r.match(/product|pm|manager|lead|strategy/)) return DEPT_THEMES.product;
  if (r.match(/data|analyst|research|science|ml|ai/)) return DEPT_THEMES.data;
  if (r.match(/ops|devops|infra|deploy|sre/))  return DEPT_THEMES.operations;
  if (r.match(/security|sec/))                  return DEPT_THEMES.devsecops;
  if (r.match(/qa|quality|test/))              return DEPT_THEMES.qa;
  if (r.match(/market|growth|seo|content|social/)) return DEPT_THEMES.marketing;
  if (r.match(/sales|outreach|biz|bd|partner/)) return DEPT_THEMES.sales;
  if (r.match(/owner|ceo|cto|founder/))        return DEPT_THEMES.ceo;
  return DEPT_THEMES.general;
}

// ─── SVG-based room renderer ──────────────────────────────────────────────────
// We use inline SVG to replicate claw-empire's PixiJS drawing primitives
// in a framework-agnostic way that works in Next.js without canvas/WebGL.

interface RoomSVGProps {
  width: number;
  height: number;
  theme: typeof DEPT_THEMES.engineering;
  isFullWidth?: boolean;
  isCeo?: boolean;
}

function RoomSVG({ width, height, theme, isCeo }: RoomSVGProps) {
  const TILE = 18;
  const tiles: React.ReactNode[] = [];
  // Checkerboard floor tiles
  for (let ty = 0; ty < height; ty += TILE) {
    for (let tx = 0; tx < width; tx += TILE) {
      const isEven = (((tx / TILE) + (ty / TILE)) & 1) === 0;
      const fill = isEven ? theme.floor1 : theme.floor2;
      tiles.push(
        <g key={`t-${tx}-${ty}`}>
          <rect x={tx} y={ty} width={TILE} height={TILE} fill={fill} />
          <line x1={tx} y1={ty} x2={tx + TILE} y2={ty} stroke="white" strokeWidth={0.3} strokeOpacity={0.15} />
          <line x1={tx} y1={ty} x2={tx} y2={ty + TILE} stroke="white" strokeWidth={0.3} strokeOpacity={0.1} />
          <line x1={tx} y1={ty + TILE} x2={tx + TILE} y2={ty + TILE} stroke="#8a7a60" strokeWidth={0.3} strokeOpacity={0.1} />
        </g>
      );
    }
  }

  // Bunting flags (▼ triangles along ceiling)
  const flagCount = Math.max(6, Math.floor(width / 22));
  const step = width / flagCount;
  const flags: React.ReactNode[] = [];
  for (let i = 0; i < flagCount; i++) {
    const fx = i * step + step / 2;
    const fy = i % 2 === 0 ? 18 : 20;
    const color = i % 2 === 0
      ? blend(theme.accent, '#ffffff', 0.2)
      : blend(theme.wall, '#ffffff', 0.4);
    flags.push(
      <polygon key={`f-${i}`}
        points={`${fx - 4},${fy} ${fx + 4},${fy} ${fx},${fy + 6}`}
        fill={color} fillOpacity={0.52}
      />
    );
  }
  // Bunting line
  const buntingLine = <line x1={12} y1={18} x2={width - 12} y2={18} stroke="#33261a" strokeWidth={1} strokeOpacity={0.6} />;

  // Wall atmosphere — top gradient panel
  const topH = Math.max(20, Math.min(34, height * 0.22));
  // Wall clock (top-right)
  const clockX = width - 16;
  const clockY = 12;

  // Windows (2 small ones near top-center)
  const wx1 = width / 2 - 28;
  const wx2 = width / 2 + 8;
  const wy = 17;

  // Bookshelf (left wall)
  // Whiteboard (right side)

  // CEO collab table
  const tableW = isCeo ? Math.min(180, width * 0.4) : 0;
  const tableCX = width / 2;

  return (
    <svg
      width="100%" height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Floor tiles */}
      {tiles}

      {/* Wall atmosphere — top panel */}
      <defs>
        <linearGradient id={`wg-${theme.accent}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={blend(theme.wall, '#ffffff', 0.24)} stopOpacity={0.75} />
          <stop offset="100%" stopColor={blend(theme.wall, '#ffffff', 0.05)} stopOpacity={0.75} />
        </linearGradient>
      </defs>
      <rect x={1} y={1} width={width - 2} height={topH} fill={`url(#wg-${theme.accent})`} />
      {/* Baseboard shadow */}
      <rect x={1} y={height - 14} width={width - 2} height={10} fill="black" fillOpacity={0.06} />
      <rect x={3} y={height - 14} width={width - 6} height={1} fill={blend(theme.accent, '#ffffff', 0.45)} fillOpacity={0.22} />

      {/* Bunting */}
      {buntingLine}
      {flags}

      {/* Window 1 */}
      <PixelWindow x={wx1} y={wy} w={22} h={16} />
      {/* Window 2 */}
      {width > 200 && <PixelWindow x={wx2} y={wy} w={22} h={16} />}

      {/* Bookshelf left */}
      <PixelBookshelf x={6} y={18} />

      {/* Whiteboard right */}
      <PixelWhiteboard x={width - 44} y={18} />

      {/* Ceiling light */}
      <PixelCeilingLight x={width / 2} y={14} accent={theme.accent} />

      {/* Wall clock */}
      <PixelWallClock x={clockX} y={clockY} />

      {/* CEO collab table */}
      {isCeo && <CollabTable cx={tableCX} y={height - 40} w={tableW} accent={theme.accent} />}

      {/* Room border */}
      <rect x={0} y={0} width={width} height={height} fill="none"
        stroke={theme.wall} strokeWidth={2.5} rx={3} />

      {/* Door gap at top center */}
      <rect x={width / 2 - 14} y={0} width={28} height={4} fill={P.creamWhite} />
    </svg>
  );
}

// ─── SVG drawing sub-components (mirroring claw-empire drawing-core.ts) ───────

function PixelWindow({ x, y, w = 24, h = 18 }: { x: number; y: number; w?: number; h?: number }) {
  const pw = (w - 5) / 2;
  const ph = (h - 5) / 2;
  return (
    <g>
      {/* Frame shadow */}
      <rect x={x + 1.5} y={y + 1.5} width={w} height={h} rx={2} fill="black" fillOpacity={0.12} />
      {/* Frame */}
      <rect x={x} y={y} width={w} height={h} rx={2} fill="#8a7a68" stroke="#a09080" strokeWidth={0.5} strokeOpacity={0.4} />
      {/* Glass panes */}
      <rect x={x + 2} y={y + 2} width={pw} height={ph} fill="#8abcdd" />
      <rect x={x + pw + 3} y={y + 2} width={pw} height={ph} fill="#9accee" />
      <rect x={x + 2} y={y + ph + 3} width={pw} height={ph} fill="#9accee" />
      <rect x={x + pw + 3} y={y + ph + 3} width={pw} height={ph} fill="#8abcdd" />
      {/* Warm sunlight overlay */}
      <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill="#ffe8a0" fillOpacity={0.1} />
      {/* Mullions */}
      <rect x={x + w / 2 - 0.6} y={y + 2} width={1.2} height={h - 4} fill="#7a6a58" fillOpacity={0.4} />
      <rect x={x + 2} y={y + h / 2 - 0.5} width={w - 4} height={1} fill="#7a6a58" fillOpacity={0.35} />
      {/* Cloud */}
      <circle cx={x + 5} cy={y + 4} r={1.4} fill="white" fillOpacity={0.2} />
      <circle cx={x + 7} cy={y + 4.5} r={2} fill="white" fillOpacity={0.18} />
      {/* Curtains */}
      <line x1={x + 1} y1={y + 1} x2={x + 3} y2={y + h * 0.4} stroke="#d8b0b8" strokeWidth={1.5} strokeOpacity={0.35} />
      <line x1={x + w - 1} y1={y + 1} x2={x + w - 3} y2={y + h * 0.4} stroke="#d8b0b8" strokeWidth={1.5} strokeOpacity={0.35} />
    </g>
  );
}

function PixelBookshelf({ x, y }: { x: number; y: number }) {
  const W = 20; const H = 28;
  const bookColors = ['#c47a4a', '#6a9fd8', '#d47888', '#7ab878', '#c8b848', '#a878c8'];
  const books = [];
  let bx = x + 2;
  for (let i = 0; i < 5; i++) {
    const bw = 2.5 + (i % 2) * 0.8;
    const bh = 8 + (i * 1.3) % 6;
    books.push(
      <rect key={`b${i}`} x={bx} y={y + H - bh - 2} width={bw} height={bh} rx={0.4}
        fill={bookColors[i % bookColors.length]} fillOpacity={0.7} />
    );
    books.push(
      <rect key={`b${i}t`} x={bx} y={y + H - bh - 2} width={bw} height={1} rx={0.4}
        fill="white" fillOpacity={0.18} />
    );
    bx += bw + 0.8;
  }
  return (
    <g>
      <rect x={x} y={y} width={W} height={H} rx={1} fill="#c8a870" fillOpacity={0.7} />
      <rect x={x} y={y} width={W} height={H} rx={1} stroke="#a88050" strokeWidth={0.6} strokeOpacity={0.5} fill="none" />
      <line x1={x + 1} y1={y + H - 10} x2={x + W - 1} y2={y + H - 10} stroke="#a88050" strokeWidth={0.5} strokeOpacity={0.3} />
      <line x1={x + 1} y1={y + 14} x2={x + W - 1} y2={y + 14} stroke="#a88050" strokeWidth={0.5} strokeOpacity={0.3} />
      {books}
    </g>
  );
}

function PixelWhiteboard({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={32} height={22} rx={1} fill="#f4f0e8" stroke="#c8b898" strokeWidth={0.7} />
      <rect x={x + 2} y={y + 2} width={28} height={15} rx={0.5} fill="white" fillOpacity={0.7} />
      {/* Scribbles on whiteboard */}
      <line x1={x + 4} y1={y + 6} x2={x + 14} y2={y + 6} stroke="#8ab8d8" strokeWidth={0.6} strokeOpacity={0.5} />
      <line x1={x + 4} y1={y + 9} x2={x + 20} y2={y + 9} stroke="#d87878" strokeWidth={0.6} strokeOpacity={0.45} />
      <line x1={x + 4} y1={y + 12} x2={x + 12} y2={y + 12} stroke="#7ac87a" strokeWidth={0.6} strokeOpacity={0.5} />
      {/* Tray */}
      <rect x={x} y={y + 20} width={32} height={3} rx={0.5} fill="#d0c0a0" />
      {/* Marker */}
      <rect x={x + 6} y={y + 20.5} width={6} height={1.5} rx={0.5} fill="#8ab8d8" />
      {/* Stand */}
      <rect x={x + 12} y={y + 23} width={8} height={2} rx={0.5} fill="#c8b898" />
    </g>
  );
}

function PixelCeilingLight({ x, y, accent }: { x: number; y: number; accent: string }) {
  return (
    <g>
      {/* Mounting bar */}
      <rect x={x - 14} y={y - 2} width={28} height={3} rx={1} fill="#c8b898" />
      {/* Bulb housing */}
      <rect x={x - 8} y={y + 1} width={16} height={5} rx={2} fill={blend(accent, '#ffffff', 0.4)} fillOpacity={0.7} />
      {/* Warm glow */}
      <ellipse cx={x} cy={y + 8} rx={20} ry={6} fill={accent} fillOpacity={0.06} />
      <ellipse cx={x} cy={y + 6} rx={10} ry={3} fill={accent} fillOpacity={0.08} />
    </g>
  );
}

function PixelWallClock({ x, y }: { x: number; y: number }) {
  // Static clock face — updates via React state in parent
  return (
    <g>
      <circle cx={x} cy={y} r={7} fill="#f0e8d8" stroke="#a09080" strokeWidth={0.7} />
      <circle cx={x} cy={y} r={1} fill="#3a2a1a" />
      {/* Hour hand */}
      <line x1={x} y1={y} x2={x - 2} y2={y - 3} stroke="#3a2a1a" strokeWidth={0.8} strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={x} y1={y} x2={x + 1} y2={y - 4} stroke="#3a2a1a" strokeWidth={0.6} strokeLinecap="round" />
      {/* Tick marks */}
      {[0, 90, 180, 270].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={x + Math.sin(rad) * 5.5} y1={y - Math.cos(rad) * 5.5}
            x2={x + Math.sin(rad) * 6.5} y2={y - Math.cos(rad) * 6.5}
            stroke="#a09080" strokeWidth={0.5}
          />
        );
      })}
    </g>
  );
}

function CollabTable({ cx, y, w, accent }: { cx: number; y: number; w: number; accent: string }) {
  // Oval collab table like claw-empire CEO office
  const chairs = [-w * 0.35, -w * 0.12, w * 0.12, w * 0.35];
  return (
    <g>
      {/* Table shadow */}
      <ellipse cx={cx + 2} cy={y + 6} rx={w / 2 + 4} ry={10} fill="black" fillOpacity={0.06} />
      {/* Table top */}
      <ellipse cx={cx} cy={y} rx={w / 2} ry={12} fill={blend(accent, '#ffffff', 0.5)} fillOpacity={0.8} />
      <ellipse cx={cx} cy={y} rx={w / 2} ry={12} stroke={blend(accent, '#ffffff', 0.2)} strokeWidth={1.5} fill="none" />
      {/* Table label */}
      <text x={cx} y={y + 3} textAnchor="middle" fontSize={7}
        fontFamily="system-ui" fill={P.cocoa} fillOpacity={0.6} fontWeight="bold">
        6P COLLAB TABLE
      </text>
      {/* Chairs above */}
      {chairs.map((ox, i) => (
        <g key={i}>
          <rect x={cx + ox - 8} y={y - 20} width={16} height={10} rx={3}
            fill={blend(accent, '#ffffff', 0.3)} fillOpacity={0.7} />
          <rect x={cx + ox - 8} y={y - 21} width={16} height={3} rx={1.5}
            fill={blend(accent, '#ffffff', 0.1)} fillOpacity={0.7} />
        </g>
      ))}
    </g>
  );
}

// ─── Pixel desk + monitor (CSS, positioned over SVG) ─────────────────────────

function PixelDesk({ color, isWorking }: { color: string; isWorking: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginBottom: 2 }}>
      {/* Monitor */}
      <div style={{
        width: 38, height: 26,
        background: '#3e4858',
        border: '1px solid #5a6678',
        borderRadius: 3,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Screen */}
        <div style={{
          position: 'absolute',
          top: 2, left: 2, right: 2, bottom: 4,
          background: isWorking ? '#89c8b9' : '#1e2836',
          borderRadius: 1,
        }}>
          {isWorking && (
            <div style={{ padding: '2px 2px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {['#e1fff8', '#f8d876', '#a8d8ea', '#f0b8c8'].map((c, i) => (
                <div key={i} style={{
                  height: 1.5,
                  width: `${40 + (i * 17) % 40}%`,
                  marginLeft: i === 2 ? '12%' : 0,
                  background: c, opacity: 0.6, borderRadius: 1,
                }} />
              ))}
            </div>
          )}
        </div>
        {/* Webcam dot */}
        <div style={{
          position: 'absolute', top: 1, left: '50%', transform: 'translateX(-50%)',
          width: 2, height: 2, borderRadius: '50%',
          background: '#44dd66', opacity: 0.4,
        }} />
        {/* Stand */}
        <div style={{
          position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
          width: 6, height: 4, background: '#4e5a70',
        }} />
        <div style={{
          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
          width: 14, height: 2, background: '#5e6a82', borderRadius: 1,
        }} />
      </div>
      {/* Desk surface — warm wood */}
      <div style={{
        width: 58, height: 18,
        background: 'linear-gradient(180deg, #e0c490 0%, #d4b478 40%, #be9860 100%)',
        border: '1px solid #b89060',
        borderRadius: '2px 2px 4px 4px',
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 3,
      }}>
        {/* Keyboard */}
        <div style={{
          position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
          width: 22, height: 7,
          background: '#788498',
          borderRadius: 1.5, border: '0.5px solid #5c6a80',
          display: 'flex', flexWrap: 'wrap', gap: 0.5, padding: '1px 1.5px',
        }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{
              width: 2, height: 1.5,
              background: '#d4d9e6', borderRadius: 0.3,
            }} />
          ))}
        </div>
        {/* Paper stack left */}
        <div style={{
          position: 'absolute', left: 3, top: 2,
          width: 9, height: 11,
          background: '#fffbf4',
          border: '0.5px solid #e0d8cc',
          boxShadow: '-1px 1px 0 #f0e8dc',
        }} />
        {/* Coffee mug right */}
        <div style={{
          position: 'absolute', right: 4, top: 1,
          width: 9, height: 10,
          background: '#f0dee5',
          borderRadius: '0 0 3px 3px',
          border: '0.5px solid #c5a0b0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8a6248' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Cactus corner plant ──────────────────────────────────────────────────────

function CornerCactus({ side = 'right' }: { side?: 'left' | 'right' }) {
  return (
    <div style={{
      position: 'absolute', bottom: 8, [side]: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      zIndex: 3, opacity: 0.8,
    }}>
      <div style={{ position: 'relative', width: 14, height: 22 }}>
        <div style={{ position: 'absolute', left: 5, top: 0, width: 4, height: 22, background: '#16a34a', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: -1, top: 6, width: 6, height: 3, background: '#16a34a', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: -1, top: 4, width: 3, height: 5, background: '#16a34a', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', right: -1, top: 10, width: 6, height: 3, background: '#16a34a', borderRadius: '0 2px 2px 0' }} />
        <div style={{ position: 'absolute', right: -1, top: 8, width: 3, height: 5, background: '#16a34a', borderRadius: '0 2px 2px 0' }} />
      </div>
      <div style={{ width: 14, height: 10, background: '#92400e', borderRadius: '0 0 3px 3px', border: '1px solid #78350f' }} />
    </div>
  );
}

// ─── Room sign (dept label, centered at top) ──────────────────────────────────

function RoomSign({ theme }: { theme: typeof DEPT_THEMES.engineering }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: '50%',
      transform: 'translateX(-50%)',
      background: theme.accent,
      borderRadius: '0 0 4px 4px',
      padding: '3px 10px',
      display: 'flex', alignItems: 'center', gap: 4,
      zIndex: 20, whiteSpace: 'nowrap',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    }}>
      <span style={{ fontSize: 10 }}>{theme.icon}</span>
      <span style={{
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 7, color: '#fff',
        letterSpacing: '0.05em',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}>{theme.label}</span>
    </div>
  );
}

// ─── Single agent desk slot ────────────────────────────────────────────────────

interface AgentSlotProps {
  agent: Agent;
  npcSize: number;
  onClick: () => void;
  forceThought: string | null;
  hasCelebration: boolean;
  partyMode: boolean;
  chatBubble: { message: string; color: string } | null;
  expandedTask: string | null;
  setExpandedTask: (id: string | null) => void;
  theme: any;
  deptTheme: typeof DEPT_THEMES.engineering;
}

function AgentSlot({
  agent, npcSize, onClick, forceThought, hasCelebration, partyMode,
  chatBubble, expandedTask, setExpandedTask, theme, deptTheme,
}: AgentSlotProps) {
  const isWorking = agent.status === 'working';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      position: 'relative', zIndex: 5,
    }}>
      {/* Name badge (like claw-empire agent header) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3,
        background: 'rgba(0,0,0,0.15)',
        border: `1px solid ${deptTheme.accent}55`,
        borderRadius: 4, padding: '1px 6px',
      }}>
        {isWorking && (
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 4px #ef4444',
          }} />
        )}
        <span style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 6, color: P.creamWhite,
        }}>{agent.name}</span>
        <span style={{
          fontSize: 8, fontWeight: 700, color: 'white',
          background: deptTheme.accent, borderRadius: 2,
          padding: '0 3px', opacity: 0.8,
        }}>Lv.{agent.level}</span>
      </div>

      {/* Task bubble */}
      {agent.task && isWorking && (
        <div style={{ position: 'relative' }}>
          <div
            onClick={e => { e.stopPropagation(); setExpandedTask(expandedTask === agent.id ? null : agent.id); }}
            style={{
              background: P.creamWhite,
              border: `1px solid ${deptTheme.accent}66`,
              borderRadius: 4, padding: '2px 8px',
              fontSize: 7, color: P.ink,
              maxWidth: 140, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
              cursor: 'pointer', fontFamily: 'system-ui',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >{prettifyTask(agent.task)}</div>
          {expandedTask === agent.id && (
            <div onClick={e => e.stopPropagation()} style={{
              position: 'absolute', top: '100%', left: '50%',
              transform: 'translateX(-50%)',
              marginTop: 4, zIndex: 100,
              background: P.creamWhite,
              border: `1px solid ${deptTheme.wall}`,
              borderRadius: 6, padding: '8px 10px',
              fontSize: 11, color: P.ink,
              maxWidth: 260, minWidth: 140,
              whiteSpace: 'normal', wordBreak: 'break-word',
              lineHeight: 1.5, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            }}>
              <div style={{ fontSize: 6, color: P.slate, marginBottom: 4, fontFamily: '"Press Start 2P", monospace' }}>{agent.name}</div>
              {agent.task}
            </div>
          )}
        </div>
      )}

      {/* Idle status */}
      {!isWorking && (
        agent.nextTaskAt
          ? <CooldownTimer targetMs={agent.nextTaskAt} />
          : (
            <div style={{
              background: P.creamWhite, border: `1px solid ${deptTheme.wall}55`,
              borderRadius: 4, padding: '2px 6px',
              fontSize: 7, color: P.cocoa,
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}>
              {['☕ On break', '📖 Reading docs', '🎮 Taking 5', '💭 Thinking...'][
                agent.id.split('').reduce((s: number, c: string) => s + c.charCodeAt(0), 0) % 4
              ]}
            </div>
          )
      )}

      {/* Chat bubble */}
      {chatBubble && <ChatBubble message={chatBubble.message} agentColor={chatBubble.color} size={npcSize} />}

      {/* NPC */}
      <div style={{ position: 'relative' }}>
        <NPC agent={agent} size={npcSize} onClick={onClick}
          forceThought={forceThought}
          hasCelebration={hasCelebration} partyMode={partyMode} />
        <div style={{ position: 'absolute', inset: -8, pointerEvents: 'none', zIndex: 0 }}>
          <NPCParticles
            agentStatus={agent.status as 'working' | 'idle'}
            agentMood={agent.mood as any}
            agentRole={agent.role}
            width={Math.round(64 * npcSize) + 16}
            height={Math.round(64 * npcSize) + 16}
          />
        </div>
      </div>

      {/* Chair + Desk */}
      <div style={{
        width: 16, height: 8,
        background: blend(deptTheme.accent, P.creamWhite, 0.18),
        borderRadius: '2px 2px 0 0',
        border: `1px solid ${deptTheme.accent}66`,
        marginBottom: -2,
      }} />
      <PixelDesk color={deptTheme.accent} isWorking={isWorking} />

      {/* Role */}
      <div style={{
        fontSize: 8, color: P.slate,
        fontFamily: 'system-ui', marginTop: 1,
      }}>{agent.role}</div>
    </div>
  );
}

// ─── Department Room (one per working agent) ───────────────────────────────────

interface DeptRoomProps {
  agent: Agent;
  npcSize: number;
  onClick: () => void;
  forceThought: string | null;
  hasCelebration: boolean;
  partyMode: boolean;
  chatBubble: { message: string; color: string } | null;
  expandedTask: string | null;
  setExpandedTask: (id: string | null) => void;
  theme: any;
}

function DeptRoom({
  agent, npcSize, onClick, forceThought, hasCelebration, partyMode,
  chatBubble, expandedTask, setExpandedTask, theme,
}: DeptRoomProps) {
  const deptTheme = getDeptTheme(agent.role);
  const isWorking = agent.status === 'working';
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        minHeight: 260,
        borderRadius: 4,
        overflow: 'hidden',
        cursor: 'pointer',
        border: `2.5px solid ${deptTheme.wall}`,
        boxShadow: isWorking ? `0 0 14px ${deptTheme.accent}33` : '0 2px 8px rgba(0,0,0,0.12)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 14, paddingTop: 28,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 20px ${deptTheme.accent}55`; e.currentTarget.style.borderColor = deptTheme.accent; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = isWorking ? `0 0 14px ${deptTheme.accent}33` : '0 2px 8px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor = deptTheme.wall; }}
    >
      {/* SVG room background */}
      <RoomSVG width={300} height={260} theme={deptTheme} />

      {/* Room sign */}
      <RoomSign theme={deptTheme} />

      {/* Cactus */}
      <CornerCactus side="right" />

      {/* Agent */}
      <AgentSlot
        agent={agent} npcSize={npcSize} onClick={onClick}
        forceThought={forceThought} hasCelebration={hasCelebration} partyMode={partyMode}
        chatBubble={chatBubble} expandedTask={expandedTask} setExpandedTask={setExpandedTask}
        theme={theme} deptTheme={deptTheme}
      />
    </div>
  );
}

// ─── Break Room ────────────────────────────────────────────────────────────────

function BreakRoom({
  agents, npcSize, onClickAgent, forceThoughts, celebrations,
  partyMode, chatBubbles, theme,
}: {
  agents: Agent[];
  npcSize: number;
  onClickAgent: (a: Agent) => void;
  forceThoughts: Record<string, string>;
  celebrations: { agentId: string }[];
  partyMode: boolean;
  chatBubbles: Record<string, { message: string; color: string }>;
  theme: any;
}) {
  const deptTheme = DEPT_THEMES.breakroom;
  return (
    <div
      style={{
        position: 'relative',
        minHeight: agents.length > 0 ? 200 : 120,
        borderRadius: 4,
        overflow: 'hidden',
        border: `2.5px solid ${deptTheme.wall}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        padding: '36px 24px 16px',
      }}
    >
      <RoomSVG width={1200} height={200} theme={deptTheme} />
      <RoomSign theme={deptTheme} />
      <CornerCactus side="right" />

      {/* Break room furniture (SVG overlay) */}
      <div style={{
        position: 'absolute', bottom: 10, left: 14, zIndex: 3,
        display: 'flex', gap: 4, alignItems: 'flex-end',
        opacity: 0.75,
      }}>
        {/* Left couch */}
        <div style={{ position: 'relative', width: 64, height: 24 }}>
          <div style={{ position: 'absolute', top: -10, left: 0, width: 10, height: 12, background: '#b07090', borderRadius: '3px 0 0 0' }} />
          <div style={{ position: 'absolute', top: -10, right: 0, width: 10, height: 12, background: '#b07090', borderRadius: '0 3px 0 0' }} />
          <div style={{ width: 64, height: 24, background: '#d5a5ae', borderRadius: '4px 4px 3px 3px', border: '1px solid #b07090' }} />
        </div>
        {/* Coffee table */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 28, height: 6, background: '#b89060', borderRadius: 3, border: '1px solid #a07840' }} />
          <div style={{ width: 4, height: 10, background: '#a07840' }} />
        </div>
      </div>

      {/* Right couch */}
      <div style={{
        position: 'absolute', bottom: 10, right: 14, zIndex: 3,
        opacity: 0.75,
      }}>
        <div style={{ position: 'relative', width: 64, height: 24 }}>
          <div style={{ position: 'absolute', top: -10, left: 0, width: 10, height: 12, background: '#708890', borderRadius: '3px 0 0 0' }} />
          <div style={{ position: 'absolute', top: -10, right: 0, width: 10, height: 12, background: '#708890', borderRadius: '0 3px 0 0' }} />
          <div style={{ width: 64, height: 24, background: '#90b8c8', borderRadius: '4px 4px 3px 3px', border: '1px solid #708890' }} />
        </div>
      </div>

      {/* Agents in break room */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex', flexWrap: 'wrap',
        gap: 20, justifyContent: 'center', alignItems: 'flex-end',
        minHeight: agents.length > 0 ? 100 : 24,
      }}>
        {agents.length > 0 ? agents.map((a, idx) => (
          <div key={a.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            animation: `npcEntrance 0.4s ease-out ${idx * 0.08}s both`,
            cursor: 'pointer',
          }} onClick={() => onClickAgent(a)}>
            {chatBubbles[a.id] && (
              <ChatBubble message={chatBubbles[a.id].message} agentColor={chatBubbles[a.id].color} size={npcSize * 0.85} />
            )}
            {a.nextTaskAt
              ? <CooldownTimer targetMs={a.nextTaskAt} />
              : (
                <div style={{
                  background: P.creamWhite, border: `1px solid ${deptTheme.wall}55`,
                  borderRadius: 4, padding: '1px 5px',
                  fontSize: 7, color: P.cocoa,
                }}>
                  {['☕ On break', '📖 Reading docs', '🎮 Taking 5', '💭 Thinking...'][
                    a.id.split('').reduce((s: number, c: string) => s + c.charCodeAt(0), 0) % 4
                  ]}
                </div>
              )
            }
            <NPC agent={a} size={npcSize * 0.85} onClick={() => onClickAgent(a)}
              forceThought={forceThoughts[a.id] || null}
              hasCelebration={celebrations.some(c => c.agentId === a.id)}
              partyMode={partyMode}
            />
            <div style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 6, color: P.cocoa, textAlign: 'center',
            }}>{a.name}</div>
            <div style={{ fontSize: 8, color: P.slate }}>{a.role}</div>
          </div>
        )) : (
          <div style={{
            color: P.slate,
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7, padding: '8px 16px', textAlign: 'center',
          }}>
            💼 All agents at their desks!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CEO Office ────────────────────────────────────────────────────────────────

function CeoOffice({ agent, npcSize, onClick, forceThought, hasCelebration, partyMode, theme }: {
  agent: Agent; npcSize: number; onClick: () => void;
  forceThought: string | null; hasCelebration: boolean; partyMode: boolean; theme: any;
}) {
  const deptTheme = DEPT_THEMES.ceo;
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        minHeight: 160,
        borderRadius: 4,
        overflow: 'hidden',
        cursor: 'pointer',
        border: `2.5px solid ${deptTheme.wall}`,
        boxShadow: `0 0 20px ${deptTheme.accent}22`,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 40px 16px',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 28px ${deptTheme.accent}44`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 20px ${deptTheme.accent}22`; }}
    >
      <RoomSVG width={1200} height={160} theme={deptTheme} isCeo />
      <RoomSign theme={deptTheme} />
      <CornerCactus side="left" />
      <CornerCactus side="right" />

      {/* CEO NPC left side */}
      <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <div style={{
          background: P.creamWhite, borderRadius: 4, padding: '1px 6px',
          fontSize: 7, color: P.cocoa,
          fontFamily: '"Press Start 2P", monospace',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}>👑 {agent.name}</div>
        {agent.task && (
          <div style={{
            background: P.creamWhite, border: `1px solid ${deptTheme.wall}`,
            borderRadius: 4, padding: '1px 8px',
            fontSize: 7, color: P.ink,
            maxWidth: 160, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{prettifyTask(agent.task)}</div>
        )}
        <NPC agent={agent} size={npcSize} onClick={onClick}
          forceThought={forceThought} hasCelebration={hasCelebration} partyMode={partyMode} />
        <div style={{
          position: 'relative', zIndex: 5,
          width: 16, height: 8,
          background: blend(deptTheme.accent, P.creamWhite, 0.18),
          borderRadius: '2px 2px 0 0', marginBottom: -2,
        }} />
        <PixelDesk color={deptTheme.accent} isWorking={agent.status === 'working'} />
        <div style={{ fontSize: 8, color: P.slate }}>{agent.role}</div>
      </div>

      {/* Stats top-right (Staff/Working/In Progress/Done) */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        display: 'flex', gap: 4, zIndex: 20,
      }}>
        {[
          { label: 'Staff', icon: '👥', color: '#6c96b7' },
          { label: 'Working', icon: '⚡', color: '#d4a85a' },
        ].map(s => (
          <div key={s.label} style={{
            background: P.creamWhite,
            border: `1px solid ${s.color}66`,
            borderRadius: 4, padding: '2px 6px',
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 7, color: P.ink,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <span style={{ fontSize: 9 }}>{s.icon}</span>
            <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hallway divider ────────────────────────────────────────────────────────────

function Hallway() {
  return (
    <div style={{
      height: 24,
      background: `linear-gradient(180deg, ${P.creamDeep} 0%, ${P.warmSand} 50%, ${P.creamDeep} 100%)`,
      borderTop: `1px solid ${P.warmWood}44`,
      borderBottom: `1px solid ${P.warmWood}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '60%', height: 1,
        background: `linear-gradient(90deg, transparent, ${P.warmWood}55, transparent)`,
      }} />
    </div>
  );
}

// ─── Color blend helper ────────────────────────────────────────────────────────

function blend(hex1: string, hex2: string, t: number): string {
  const parse = (h: string) => {
    const c = h.replace('#', '');
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ─── Main export ───────────────────────────────────────────────────────────────

export interface MultiRoomGridProps {
  agents: Agent[];
  npcSize: number;
  onClickAgent: (a: Agent) => void;
  forceThoughts: Record<string, string>;
  celebrations: { agentId: string; timestamp: number }[];
  partyMode: boolean;
  chatBubbles: Record<string, { message: string; color: string }>;
  expandedTask: string | null;
  setExpandedTask: (id: string | null) => void;
  theme: any;
  isMobile: boolean;
}

export function MultiRoomGrid({
  agents, npcSize, onClickAgent, forceThoughts, celebrations,
  partyMode, chatBubbles, expandedTask, setExpandedTask, theme, isMobile,
}: MultiRoomGridProps) {
  const owner = agents.find(a => a.id === '_owner');
  const working = agents.filter(a => a.id !== '_owner' && a.status === 'working');
  const idle = agents.filter(a => a.id !== '_owner' && a.status !== 'working');

  const cols = isMobile ? 1
    : working.length <= 1 ? 1
    : working.length <= 2 ? 2
    : working.length <= 6 ? 3
    : 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* CEO Office */}
      {owner && (
        <CeoOffice
          agent={owner} npcSize={npcSize}
          onClick={() => onClickAgent(owner)}
          forceThought={forceThoughts[owner.id] || null}
          hasCelebration={celebrations.some(c => c.agentId === owner.id)}
          partyMode={partyMode} theme={theme}
        />
      )}

      {/* Hallway */}
      {(owner || working.length > 0) && <Hallway />}

      {/* Department rooms grid */}
      {working.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 10,
          padding: '0 0 10px',
        }}>
          {working.map(agent => (
            <DeptRoom
              key={agent.id}
              agent={agent} npcSize={npcSize}
              onClick={() => onClickAgent(agent)}
              forceThought={forceThoughts[agent.id] || null}
              hasCelebration={celebrations.some(c => c.agentId === agent.id)}
              partyMode={partyMode}
              chatBubble={chatBubbles[agent.id] || null}
              expandedTask={expandedTask}
              setExpandedTask={setExpandedTask}
              theme={theme}
            />
          ))}
        </div>
      )}

      {/* Break Room gap */}
      <div style={{ height: 10 }} />

      {/* Break Room */}
      <BreakRoom
        agents={idle} npcSize={npcSize}
        onClickAgent={onClickAgent}
        forceThoughts={forceThoughts}
        celebrations={celebrations}
        partyMode={partyMode}
        chatBubbles={chatBubbles}
        theme={theme}
      />
    </div>
  );
}
