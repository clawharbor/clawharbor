'use client';

/**
 * MultiRoomGrid — claw-empire faithful office layout
 *
 * Core concept (same as claw-empire):
 * - Department rooms ALWAYS visible — never disappear
 * - Multiple agents can share one room (grouped by role/dept)
 * - NPC sits at desk when working, moves to Break Room when idle
 * - CEO Office at top (owner agent), Break Room at bottom (idle agents)
 */

import React from 'react';
import type { Agent } from './types';
import { NPC } from './NPC';
import { NPCParticles } from './NPCParticles';
import { ChatBubble } from './ChatBubble';
import { CooldownTimer } from './CooldownTimer';
import { prettifyTask } from './utils';

// ─── Claw-empire light palette ────────────────────────────────────────────────
const P = {
  creamWhite: '#f8f3ec',
  creamDeep:  '#ebdfcf',
  warmSand:   '#d6b996',
  warmWood:   '#b8906d',
  cocoa:      '#6f4d3a',
  ink:        '#2f2530',
  slate:      '#586378',
};

// ─── Department definitions ────────────────────────────────────────────────────
interface DeptDef {
  key: string;
  label: string;
  icon: string;
  floor1: string;
  floor2: string;
  wall: string;
  accent: string;
  matchRole: (role: string) => boolean;
}

const DEPARTMENTS: DeptDef[] = [
  {
    key: 'product',
    label: 'Product',
    icon: '📋',
    floor1: '#f0e1c5', floor2: '#eddaba', wall: '#ae9871', accent: '#d4a85a',
    matchRole: r => /product|pm|manager|lead|strategy/i.test(r),
  },
  {
    key: 'engineering',
    label: 'Engineering',
    icon: '💻',
    floor1: '#d8e8f5', floor2: '#cce1f2', wall: '#6c96b7', accent: '#5a9fd4',
    matchRole: r => /engineer|dev|code|frontend|backend|fullstack|software/i.test(r),
  },
  {
    key: 'data',
    label: 'Data',
    icon: '📊',
    floor1: '#d0eede', floor2: '#c4ead5', wall: '#6eaa89', accent: '#5ac48a',
    matchRole: r => /data|analyst|research|science|ml|ai/i.test(r),
  },
  {
    key: 'design',
    label: 'Design',
    icon: '🎨',
    floor1: '#e8def2', floor2: '#e1d4ee', wall: '#9378ad', accent: '#9a6fc4',
    matchRole: r => /design|ui|ux|creative|art/i.test(r),
  },
  {
    key: 'operations',
    label: 'Operations',
    icon: '⚙️',
    floor1: '#f0cbcb', floor2: '#edc0c0', wall: '#ae7979', accent: '#d46a6a',
    matchRole: r => /ops|devops|infra|deploy|sre|operation|security/i.test(r),
  },
  {
    key: 'general',
    label: 'Office',
    icon: '🏢',
    floor1: '#e0dde8', floor2: '#d8d4e4', wall: '#7878a0', accent: '#8080c0',
    matchRole: () => true, // catch-all
  },
];

const CEO_THEME = {
  floor1: '#e5d9b9', floor2: '#dfd0a8', wall: '#998243', accent: '#a77d0c',
};
const BREAK_THEME = {
  floor1: '#f7e2b7', floor2: '#f6dead', wall: '#a99c83', accent: '#f0c878',
};

function getDept(role: string): DeptDef {
  for (const dept of DEPARTMENTS) {
    if (dept.matchRole(role)) return dept;
  }
  return DEPARTMENTS[DEPARTMENTS.length - 1];
}

// ─── Color blend helper ────────────────────────────────────────────────────────
function blend(hex1: string, hex2: string, t: number): string {
  const p = (h: string) => {
    const c = h.replace('#', '');
    return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
  };
  const [r1,g1,b1] = p(hex1), [r2,g2,b2] = p(hex2);
  const r = Math.round(r1+(r2-r1)*t), g = Math.round(g1+(g2-g1)*t), b = Math.round(b1+(b2-b1)*t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ─── SVG Room background (floor + decorations) ────────────────────────────────
interface RoomBgProps {
  floor1: string;
  floor2: string;
  wall: string;
  accent: string;
  isCeo?: boolean;
  tableW?: number;
}

function RoomBg({ floor1, floor2, wall, accent, isCeo, tableW = 180 }: RoomBgProps) {
  const TILE = 18;
  // Use 100% SVG — tiles are computed for a 600x260 logical grid, scaled via viewBox
  const W = 600, H = 260;
  const tiles: React.ReactNode[] = [];
  for (let ty = 0; ty < H; ty += TILE) {
    for (let tx = 0; tx < W; tx += TILE) {
      const even = (((tx/TILE)+(ty/TILE))&1)===0;
      tiles.push(<rect key={`${tx}-${ty}`} x={tx} y={ty} width={TILE} height={TILE} fill={even?floor1:floor2}/>);
      tiles.push(<line key={`h${tx}-${ty}`} x1={tx} y1={ty} x2={tx+TILE} y2={ty} stroke="white" strokeWidth={0.3} strokeOpacity={0.15}/>);
      tiles.push(<line key={`v${tx}-${ty}`} x1={tx} y1={ty} x2={tx} y2={ty+TILE} stroke="white" strokeWidth={0.3} strokeOpacity={0.1}/>);
    }
  }

  // Bunting flags
  const flagCount = 28;
  const step = W / flagCount;
  const flags = Array.from({length:flagCount},(_,i)=>{
    const fx = i*step+step/2, fy = i%2===0?18:21;
    return <polygon key={`f${i}`} points={`${fx-4},${fy} ${fx+4},${fy} ${fx},${fy+7}`}
      fill={i%2===0?blend(accent,'#ffffff',0.2):blend(wall,'#ffffff',0.4)} fillOpacity={0.55}/>;
  });

  // Wall atmosphere top
  const topH = 32;

  // Windows
  const wins: React.ReactNode[] = [];
  [W/2-60, W/2-20, W/2+20].forEach((wx,i)=>{
    const wy=18, ww=22, wh=16, pw=(ww-5)/2, ph=(wh-5)/2;
    wins.push(<g key={`w${i}`}>
      <rect x={wx+1.5} y={wy+1.5} width={ww} height={wh} rx={2} fill="black" fillOpacity={0.1}/>
      <rect x={wx} y={wy} width={ww} height={wh} rx={2} fill="#8a7a68"/>
      <rect x={wx+2} y={wy+2} width={pw} height={ph} fill="#8abcdd"/>
      <rect x={wx+pw+3} y={wy+2} width={pw} height={ph} fill="#9accee"/>
      <rect x={wx+2} y={wy+ph+3} width={pw} height={ph} fill="#9accee"/>
      <rect x={wx+pw+3} y={wy+ph+3} width={pw} height={ph} fill="#8abcdd"/>
      <rect x={wx+2} y={wy+2} width={ww-4} height={wh-4} fill="#ffe8a0" fillOpacity={0.1}/>
      <rect x={wx+ww/2-0.6} y={wy+2} width={1.2} height={wh-4} fill="#7a6a58" fillOpacity={0.4}/>
      <rect x={wx+2} y={wy+wh/2} width={ww-4} height={1} fill="#7a6a58" fillOpacity={0.35}/>
      <line x1={wx+1} y1={wy+1} x2={wx+3} y2={wy+wh*0.4} stroke="#d8b0b8" strokeWidth={1.5} strokeOpacity={0.35}/>
      <line x1={wx+ww-1} y1={wy+1} x2={wx+ww-3} y2={wy+wh*0.4} stroke="#d8b0b8" strokeWidth={1.5} strokeOpacity={0.35}/>
    </g>);
  });

  // Bookshelf left
  const bookColors=['#c47a4a','#6a9fd8','#d47888','#7ab878','#c8b848'];
  const books: React.ReactNode[] = [];
  let bx=8;
  for(let i=0;i<5;i++){
    const bw=2.5+(i%2)*0.8, bh=8+(i*1.3)%6;
    books.push(<rect key={`bk${i}`} x={bx} y={36-bh} width={bw} height={bh} rx={0.4} fill={bookColors[i%bookColors.length]} fillOpacity={0.7}/>);
    bx+=bw+0.8;
  }

  // Wall clock right
  const clockX=W-16, clockY=12;

  // Ceiling light
  const lightX=W/2;

  // CEO collab table
  const tableY = H-30;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{position:'absolute',inset:0,display:'block'}}
      xmlns="http://www.w3.org/2000/svg">
      {/* Floor */}
      {tiles}
      {/* Wall top panel */}
      <defs>
        <linearGradient id={`wg${accent.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={blend(wall,'#ffffff',0.24)} stopOpacity={0.75}/>
          <stop offset="100%" stopColor={blend(wall,'#ffffff',0.05)} stopOpacity={0.75}/>
        </linearGradient>
      </defs>
      <rect x={1} y={1} width={W-2} height={topH} fill={`url(#wg${accent.replace('#','')})`}/>
      <rect x={1} y={H-14} width={W-2} height={10} fill="black" fillOpacity={0.05}/>
      {/* Bunting string */}
      <line x1={12} y1={19} x2={W-12} y2={19} stroke="#33261a" strokeWidth={1} strokeOpacity={0.6}/>
      {flags}
      {/* Windows */}
      {wins}
      {/* Bookshelf */}
      <rect x={4} y={18} width={22} height={28} rx={1} fill="#c8a870" fillOpacity={0.7} stroke="#a88050" strokeWidth={0.5}/>
      <line x1={5} y1={34} x2={25} y2={34} stroke="#a88050" strokeWidth={0.4} strokeOpacity={0.4}/>
      {books}
      {/* Whiteboard */}
      <rect x={W-38} y={18} width={32} height={22} rx={1} fill="#f4f0e8" stroke="#c8b898" strokeWidth={0.7}/>
      <rect x={W-36} y={20} width={28} height={15} rx={0.5} fill="white" fillOpacity={0.7}/>
      <line x1={W-34} y1={25} x2={W-24} y2={25} stroke="#8ab8d8" strokeWidth={0.6} strokeOpacity={0.5}/>
      <line x1={W-34} y1={28} x2={W-18} y2={28} stroke="#d87878" strokeWidth={0.6} strokeOpacity={0.45}/>
      <line x1={W-34} y1={31} x2={W-26} y2={31} stroke="#7ac87a" strokeWidth={0.6} strokeOpacity={0.5}/>
      <rect x={W-38} y={38} width={32} height={3} rx={0.5} fill="#d0c0a0"/>
      {/* Ceiling light */}
      <rect x={lightX-14} y={12} width={28} height={3} rx={1} fill="#c8b898"/>
      <rect x={lightX-8} y={15} width={16} height={5} rx={2} fill={blend(accent,'#ffffff',0.4)} fillOpacity={0.7}/>
      <ellipse cx={lightX} cy={22} rx={22} ry={7} fill={accent} fillOpacity={0.06}/>
      {/* Wall clock */}
      <circle cx={clockX} cy={clockY} r={8} fill="#f0e8d8" stroke="#a09080" strokeWidth={0.7}/>
      <circle cx={clockX} cy={clockY} r={1} fill="#3a2a1a"/>
      <line x1={clockX} y1={clockY} x2={clockX-2} y2={clockY-4} stroke="#3a2a1a" strokeWidth={0.8} strokeLinecap="round"/>
      <line x1={clockX} y1={clockY} x2={clockX+1} y2={clockY-5} stroke="#3a2a1a" strokeWidth={0.6} strokeLinecap="round"/>
      {[0,90,180,270].map(deg=>{
        const r=deg*Math.PI/180;
        return <line key={deg} x1={clockX+Math.sin(r)*6} y1={clockY-Math.cos(r)*6}
          x2={clockX+Math.sin(r)*7} y2={clockY-Math.cos(r)*7} stroke="#a09080" strokeWidth={0.6}/>;
      })}
      {/* Door gap top center */}
      <rect x={W/2-14} y={0} width={28} height={3} fill={P.creamWhite}/>
      {/* CEO collab table */}
      {isCeo && <>
        <ellipse cx={W/2+2} cy={tableY+5} rx={tableW/2+4} ry={10} fill="black" fillOpacity={0.05}/>
        <ellipse cx={W/2} cy={tableY} rx={tableW/2} ry={12} fill={blend(accent,'#ffffff',0.5)} fillOpacity={0.8}/>
        <ellipse cx={W/2} cy={tableY} rx={tableW/2} ry={12} stroke={blend(accent,'#ffffff',0.2)} strokeWidth={1.5} fill="none"/>
        <text x={W/2} y={tableY+3} textAnchor="middle" fontSize={8} fontFamily="system-ui" fill={P.cocoa} fillOpacity={0.65} fontWeight="bold">6P COLLAB TABLE</text>
        {[-tableW*0.35,-tableW*0.12,tableW*0.12,tableW*0.35].map((ox,i)=>(
          <g key={i}>
            <rect x={W/2+ox-9} y={tableY-22} width={18} height={11} rx={3} fill={blend(accent,'#ffffff',0.3)} fillOpacity={0.7}/>
            <rect x={W/2+ox-9} y={tableY-23} width={18} height={3} rx={1.5} fill={blend(accent,'#ffffff',0.1)} fillOpacity={0.7}/>
          </g>
        ))}
      </>}
      {/* Room border */}
      <rect x={0} y={0} width={W} height={H} fill="none" stroke={wall} strokeWidth={2.5} rx={3}/>
    </svg>
  );
}

// ─── Cactus corner plant ───────────────────────────────────────────────────────
function Cactus({ side='right' }: { side?: 'left'|'right' }) {
  return (
    <div style={{position:'absolute',bottom:8,[side]:8,display:'flex',flexDirection:'column',alignItems:'center',zIndex:4,opacity:0.8}}>
      <div style={{position:'relative',width:14,height:22}}>
        <div style={{position:'absolute',left:5,top:0,width:4,height:22,background:'#16a34a',borderRadius:2}}/>
        <div style={{position:'absolute',left:-1,top:6,width:6,height:3,background:'#16a34a',borderRadius:'2px 0 0 2px'}}/>
        <div style={{position:'absolute',left:-1,top:4,width:3,height:5,background:'#16a34a',borderRadius:'2px 0 0 2px'}}/>
        <div style={{position:'absolute',right:-1,top:10,width:6,height:3,background:'#16a34a',borderRadius:'0 2px 2px 0'}}/>
        <div style={{position:'absolute',right:-1,top:8,width:3,height:5,background:'#16a34a',borderRadius:'0 2px 2px 0'}}/>
      </div>
      <div style={{width:14,height:10,background:'#92400e',borderRadius:'0 0 3px 3px',border:'1px solid #78350f'}}/>
    </div>
  );
}

// ─── Room name sign ────────────────────────────────────────────────────────────
function RoomSign({ label, icon, accent }: { label: string; icon: string; accent: string }) {
  return (
    <div style={{
      position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',
      background:accent,borderRadius:'0 0 4px 4px',
      padding:'3px 10px',display:'flex',alignItems:'center',gap:4,
      zIndex:20,whiteSpace:'nowrap',
      boxShadow:'0 2px 6px rgba(0,0,0,0.2)',
    }}>
      <span style={{fontSize:10}}>{icon}</span>
      <span style={{fontFamily:'"Press Start 2P", monospace',fontSize:7,color:'#fff',letterSpacing:'0.05em'}}>{label}</span>
    </div>
  );
}

// ─── Pixel desk + monitor ──────────────────────────────────────────────────────
function Desk({ accent, isWorking }: { accent: string; isWorking: boolean }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0}}>
      {/* Monitor */}
      <div style={{width:36,height:24,background:'#3e4858',border:'1px solid #5a6678',borderRadius:3,position:'relative'}}>
        <div style={{
          position:'absolute',inset:'2px 2px 4px 2px',
          background:isWorking?'#89c8b9':'#1e2836',borderRadius:1,
          display:'flex',flexDirection:'column',gap:1.5,padding:'2px 2px',overflow:'hidden',
        }}>
          {isWorking && ['#e1fff8','#f8d876','#a8d8ea','#f0b8c8'].map((c,i)=>(
            <div key={i} style={{height:1.5,width:`${42+(i*17)%38}%`,marginLeft:i===2?'10%':0,background:c,opacity:0.6,borderRadius:1}}/>
          ))}
        </div>
        {/* Stand */}
        <div style={{position:'absolute',bottom:-4,left:'50%',transform:'translateX(-50%)',width:4,height:4,background:'#4e5a70'}}/>
        <div style={{position:'absolute',bottom:-6,left:'50%',transform:'translateX(-50%)',width:12,height:2,background:'#5e6a82',borderRadius:1}}/>
      </div>
      {/* Desk surface */}
      <div style={{
        width:54,height:16,
        background:'linear-gradient(180deg,#e0c490 0%,#d4b478 50%,#be9860 100%)',
        border:'1px solid #b89060',borderRadius:'2px 2px 4px 4px',
        position:'relative',display:'flex',alignItems:'center',justifyContent:'space-around',padding:'0 4px',
      }}>
        {/* Keyboard */}
        <div style={{position:'absolute',top:1,left:'50%',transform:'translateX(-50%)',
          width:20,height:6,background:'#788498',borderRadius:1.5,border:'0.5px solid #5c6a80'}}/>
        {/* Paper */}
        <div style={{position:'absolute',left:2,top:1,width:8,height:10,background:'#fffbf4',border:'0.5px solid #e0d8cc'}}/>
        {/* Mug */}
        <div style={{position:'absolute',right:2,top:1,width:8,height:9,background:'#f0dee5',borderRadius:'0 0 2px 2px',border:'0.5px solid #c5a0b0',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:4,height:4,borderRadius:'50%',background:'#8a6248'}}/>
        </div>
      </div>
    </div>
  );
}

// ─── Agent at desk (working NPC) ───────────────────────────────────────────────
function AgentAtDesk({
  agent, npcSize, onClick, forceThought, hasCelebration, partyMode,
  chatBubble, expandedTask, setExpandedTask, theme, accent,
}: {
  agent: Agent; npcSize: number; onClick: ()=>void;
  forceThought: string|null; hasCelebration: boolean; partyMode: boolean;
  chatBubble: {message:string;color:string}|null;
  expandedTask: string|null; setExpandedTask: (id:string|null)=>void;
  theme: any; accent: string;
}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,position:'relative',zIndex:5}}>
      {/* Name badge */}
      <div style={{
        display:'flex',alignItems:'center',gap:3,
        background:'rgba(255,255,255,0.85)',border:`1px solid ${accent}66`,
        borderRadius:4,padding:'1px 6px',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{width:6,height:6,borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 4px #ef4444'}}/>
        <span style={{fontFamily:'"Press Start 2P", monospace',fontSize:6,color:P.ink}}>{agent.name}</span>
        <span style={{fontSize:7,fontWeight:700,color:'white',background:accent,borderRadius:2,padding:'0 3px'}}>{agent.level}</span>
      </div>
      {/* Task label */}
      {agent.task && (
        <div style={{position:'relative'}}>
          <div onClick={e=>{e.stopPropagation();setExpandedTask(expandedTask===agent.id?null:agent.id);}} style={{
            background:P.creamWhite,border:`1px solid ${accent}55`,
            borderRadius:4,padding:'2px 7px',fontSize:7,color:P.ink,
            maxWidth:140,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
            cursor:'pointer',boxShadow:'0 1px 2px rgba(0,0,0,0.08)',
          }}>{prettifyTask(agent.task)}</div>
          {expandedTask===agent.id && (
            <div onClick={e=>e.stopPropagation()} style={{
              position:'absolute',top:'100%',left:'50%',transform:'translateX(-50%)',
              marginTop:4,zIndex:100,background:P.creamWhite,
              border:`1px solid ${accent}66`,borderRadius:6,
              padding:'8px 10px',fontSize:11,color:P.ink,
              maxWidth:260,minWidth:140,whiteSpace:'normal',wordBreak:'break-word',
              lineHeight:1.5,boxShadow:'0 4px 16px rgba(0,0,0,0.18)',
            }}>
              <div style={{fontSize:6,color:P.slate,marginBottom:4,fontFamily:'"Press Start 2P", monospace'}}>{agent.name}</div>
              {agent.task}
            </div>
          )}
        </div>
      )}
      {/* Chat bubble */}
      {chatBubble && <ChatBubble message={chatBubble.message} agentColor={chatBubble.color} size={npcSize}/>}
      {/* NPC */}
      <div style={{position:'relative'}}>
        <NPC agent={agent} size={npcSize} onClick={onClick} forceThought={forceThought}
          hasCelebration={hasCelebration} partyMode={partyMode}/>
        <div style={{position:'absolute',inset:-8,pointerEvents:'none',zIndex:0}}>
          <NPCParticles agentStatus="working" agentMood={agent.mood as any} agentRole={agent.role}
            width={Math.round(64*npcSize)+16} height={Math.round(64*npcSize)+16}/>
        </div>
      </div>
      {/* Chair back */}
      <div style={{width:14,height:7,background:blend(accent,P.creamWhite,0.2),borderRadius:'2px 2px 0 0',border:`1px solid ${accent}55`,marginBottom:-2}}/>
      {/* Desk */}
      <Desk accent={accent} isWorking={true}/>
      {/* Role label */}
      <div style={{fontSize:8,color:P.slate,marginTop:2}}>{agent.role}</div>
    </div>
  );
}

// ─── Department Room ───────────────────────────────────────────────────────────
// Always visible. Shows working agents at desks. Empty = "No assigned staff".
interface DeptRoomProps {
  dept: DeptDef;
  workingAgents: Agent[];   // agents currently working in this dept
  npcSize: number;
  onClickAgent: (a: Agent) => void;
  forceThoughts: Record<string, string>;
  celebrations: {agentId: string}[];
  partyMode: boolean;
  chatBubbles: Record<string, {message:string;color:string}>;
  expandedTask: string|null;
  setExpandedTask: (id: string|null) => void;
  theme: any;
}

function DeptRoom({
  dept, workingAgents, npcSize, onClickAgent, forceThoughts,
  celebrations, partyMode, chatBubbles, expandedTask, setExpandedTask, theme,
}: DeptRoomProps) {
  return (
    <div style={{
      position:'relative',
      minHeight:240,
      maxHeight:320,
      borderRadius:4,overflow:'hidden',
      border:`2.5px solid ${dept.wall}`,
      boxShadow:workingAgents.length>0?`0 0 12px ${dept.accent}22`:'none',
      display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'flex-end',
      paddingBottom:14,paddingTop:30,
      transition:'box-shadow 0.3s',
    }}>
      <RoomBg floor1={dept.floor1} floor2={dept.floor2} wall={dept.wall} accent={dept.accent}/>
      <RoomSign label={dept.label} icon={dept.icon} accent={dept.accent}/>
      <Cactus side="right"/>

      {/* Agents at desks */}
      <div style={{
        position:'relative',zIndex:5,
        display:'flex',flexWrap:'wrap',
        gap:20,justifyContent:'center',alignItems:'flex-end',
        width:'100%',padding:'0 16px',
      }}>
        {workingAgents.length > 0 ? (
          workingAgents.map(agent => (
            <AgentAtDesk
              key={agent.id}
              agent={agent} npcSize={npcSize}
              onClick={()=>onClickAgent(agent)}
              forceThought={forceThoughts[agent.id]||null}
              hasCelebration={celebrations.some(c=>c.agentId===agent.id)}
              partyMode={partyMode}
              chatBubble={chatBubbles[agent.id]||null}
              expandedTask={expandedTask}
              setExpandedTask={setExpandedTask}
              theme={theme}
              accent={dept.accent}
            />
          ))
        ) : (
          // Empty room — still visible like claw-empire
          <div style={{
            display:'flex',flexDirection:'column',alignItems:'center',gap:8,
            padding:'16px 0',
          }}>
            {/* Empty desk */}
            <Desk accent={dept.accent} isWorking={false}/>
            <div style={{
              fontFamily:'"Press Start 2P", monospace',
              fontSize:7,color:`${dept.wall}99`,
              textAlign:'center',lineHeight:1.8,
            }}>No assigned staff</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Break Room ────────────────────────────────────────────────────────────────
// Full width. Shows ALL idle agents.
function BreakRoom({
  idleAgents, npcSize, onClickAgent, forceThoughts,
  celebrations, partyMode, chatBubbles,
}: {
  idleAgents: Agent[]; npcSize: number;
  onClickAgent: (a: Agent) => void;
  forceThoughts: Record<string, string>;
  celebrations: {agentId:string}[];
  partyMode: boolean;
  chatBubbles: Record<string, {message:string;color:string}>;
}) {
  return (
    <div style={{
      position:'relative',
      minHeight:idleAgents.length>0?190:110,
      borderRadius:4,overflow:'hidden',
      border:`2.5px solid ${BREAK_THEME.wall}`,
      display:'flex',flexDirection:'column',
      padding:'32px 24px 16px',
    }}>
      <RoomBg floor1={BREAK_THEME.floor1} floor2={BREAK_THEME.floor2}
        wall={BREAK_THEME.wall} accent={BREAK_THEME.accent}/>
      <RoomSign label="Break Room" icon="☕" accent={BREAK_THEME.accent}/>
      <Cactus side="right"/>

      {/* Furniture */}
      {/* Left couch */}
      <div style={{position:'absolute',bottom:10,left:20,zIndex:3,opacity:0.7}}>
        <div style={{position:'relative',width:68,height:26}}>
          <div style={{position:'absolute',top:-10,left:0,width:11,height:12,background:'#b07090',borderRadius:'3px 0 0 0'}}/>
          <div style={{position:'absolute',top:-10,right:0,width:11,height:12,background:'#b07090',borderRadius:'0 3px 0 0'}}/>
          <div style={{width:68,height:26,background:'#d5a5ae',borderRadius:'4px 4px 3px 3px',border:'1px solid #b07090'}}/>
        </div>
      </div>
      {/* Coffee table */}
      <div style={{position:'absolute',bottom:14,left:100,zIndex:3,opacity:0.65}}>
        <div style={{width:30,height:7,background:'#b89060',borderRadius:3,border:'1px solid #a07840'}}/>
        <div style={{width:4,height:10,background:'#a07840',margin:'0 auto'}}/>
      </div>
      {/* Right couch */}
      <div style={{position:'absolute',bottom:10,right:20,zIndex:3,opacity:0.7}}>
        <div style={{position:'relative',width:68,height:26}}>
          <div style={{position:'absolute',top:-10,left:0,width:11,height:12,background:'#708890',borderRadius:'3px 0 0 0'}}/>
          <div style={{position:'absolute',top:-10,right:0,width:11,height:12,background:'#708890',borderRadius:'0 3px 0 0'}}/>
          <div style={{width:68,height:26,background:'#90b8c8',borderRadius:'4px 4px 3px 3px',border:'1px solid #708890'}}/>
        </div>
      </div>

      {/* Idle agents */}
      <div style={{
        position:'relative',zIndex:5,
        display:'flex',flexWrap:'wrap',
        gap:24,justifyContent:'center',alignItems:'flex-end',
        minHeight:idleAgents.length>0?110:30,
      }}>
        {idleAgents.length > 0 ? idleAgents.map((a,idx) => (
          <div key={a.id} onClick={()=>onClickAgent(a)} style={{
            display:'flex',flexDirection:'column',alignItems:'center',gap:2,
            cursor:'pointer',animation:`npcEntrance 0.4s ease-out ${idx*0.08}s both`,
          }}>
            {/* Name badge */}
            <div style={{
              background:'rgba(255,255,255,0.85)',border:`1px solid ${BREAK_THEME.wall}66`,
              borderRadius:4,padding:'1px 6px',display:'flex',alignItems:'center',gap:3,
              boxShadow:'0 1px 2px rgba(0,0,0,0.08)',
            }}>
              <span style={{fontFamily:'"Press Start 2P", monospace',fontSize:6,color:P.ink}}>{a.name}</span>
              <span style={{fontSize:7,fontWeight:700,color:'white',background:BREAK_THEME.accent,borderRadius:2,padding:'0 3px'}}>{a.level}</span>
            </div>
            {/* Cooldown or break status */}
            {a.nextTaskAt
              ? <CooldownTimer targetMs={a.nextTaskAt}/>
              : (
                <div style={{
                  background:P.creamWhite,border:`1px solid ${BREAK_THEME.wall}55`,
                  borderRadius:4,padding:'1px 6px',fontSize:7,color:P.cocoa,
                }}>
                  {['☕ On break','📖 Reading docs','🎮 Taking 5','💭 Thinking...'][
                    a.id.split('').reduce((s:number,c:string)=>s+c.charCodeAt(0),0)%4
                  ]}
                </div>
              )
            }
            {/* Chat bubble */}
            {chatBubbles[a.id] && (
              <ChatBubble message={chatBubbles[a.id].message} agentColor={chatBubbles[a.id].color} size={npcSize*0.85}/>
            )}
            {/* NPC */}
            <NPC agent={a} size={npcSize*0.85} onClick={()=>onClickAgent(a)}
              forceThought={forceThoughts[a.id]||null}
              hasCelebration={celebrations.some(c=>c.agentId===a.id)}
              partyMode={partyMode}/>
            <div style={{fontFamily:'"Press Start 2P", monospace',fontSize:6,color:P.cocoa}}>{a.name}</div>
            <div style={{fontSize:8,color:P.slate}}>{a.role}</div>
          </div>
        )) : (
          <div style={{fontFamily:'"Press Start 2P", monospace',fontSize:7,color:`${BREAK_THEME.wall}99`,padding:'8px 16px'}}>
            💼 All agents at their desks!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CEO Office ────────────────────────────────────────────────────────────────
function CeoOffice({ owner, npcSize, onClick, forceThought, hasCelebration, partyMode }: {
  owner: Agent; npcSize: number; onClick: ()=>void;
  forceThought: string|null; hasCelebration: boolean; partyMode: boolean;
}) {
  return (
    <div onClick={onClick} style={{
      position:'relative',minHeight:150,
      borderRadius:4,overflow:'hidden',
      border:`2.5px solid ${CEO_THEME.wall}`,
      boxShadow:`0 0 16px ${CEO_THEME.accent}22`,
      display:'flex',alignItems:'center',
      padding:'28px 40px 16px',gap:40,
      cursor:'pointer',transition:'box-shadow 0.2s',
    }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 24px ${CEO_THEME.accent}44`}
      onMouseLeave={e=>e.currentTarget.style.boxShadow=`0 0 16px ${CEO_THEME.accent}22`}
    >
      <RoomBg floor1={CEO_THEME.floor1} floor2={CEO_THEME.floor2}
        wall={CEO_THEME.wall} accent={CEO_THEME.accent} isCeo/>
      <RoomSign label="CEO Office" icon="👑" accent={CEO_THEME.accent}/>
      <Cactus side="left"/>
      <Cactus side="right"/>

      {/* CEO NPC */}
      <div style={{position:'relative',zIndex:5,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
        <div style={{
          background:'rgba(255,255,255,0.9)',border:`1px solid ${CEO_THEME.wall}`,
          borderRadius:4,padding:'1px 7px',display:'flex',alignItems:'center',gap:3,
          boxShadow:'0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <span style={{fontFamily:'"Press Start 2P", monospace',fontSize:6,color:P.ink}}>👑 {owner.name}</span>
        </div>
        {owner.task && (
          <div style={{
            background:P.creamWhite,border:`1px solid ${CEO_THEME.wall}`,
            borderRadius:4,padding:'1px 8px',fontSize:7,color:P.ink,
            maxWidth:160,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',
          }}>{prettifyTask(owner.task)}</div>
        )}
        <NPC agent={owner} size={npcSize} onClick={onClick}
          forceThought={forceThought} hasCelebration={hasCelebration} partyMode={partyMode}/>
        <div style={{width:14,height:7,background:blend(CEO_THEME.accent,P.creamWhite,0.2),borderRadius:'2px 2px 0 0',marginBottom:-2}}/>
        <Desk accent={CEO_THEME.accent} isWorking={owner.status==='working'}/>
        <div style={{fontSize:8,color:P.slate}}>{owner.role}</div>
      </div>

      {/* Stats top-right */}
      <div style={{position:'absolute',top:8,right:8,display:'flex',gap:4,zIndex:20}}>
        {[{label:'Staff',icon:'👥'},{label:'Working',icon:'⚡'}].map(s=>(
          <div key={s.label} style={{
            background:'rgba(255,255,255,0.9)',border:`1px solid ${CEO_THEME.wall}55`,
            borderRadius:4,padding:'2px 6px',display:'flex',alignItems:'center',gap:3,
            boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <span style={{fontSize:9}}>{s.icon}</span>
            <span style={{fontFamily:'"Press Start 2P", monospace',fontSize:5,color:P.slate}}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hallway divider ───────────────────────────────────────────────────────────
function Hallway() {
  return (
    <div style={{
      height:20,
      background:`linear-gradient(180deg,${P.creamDeep} 0%,${P.warmSand} 50%,${P.creamDeep} 100%)`,
      borderTop:`1px solid ${P.warmWood}33`,borderBottom:`1px solid ${P.warmWood}33`,
    }}/>
  );
}


// ─── Helper: assign agent to exactly one department ───────────────────────────
function agentDept(agent: Agent): DeptDef {
  for (const dept of DEPARTMENTS.slice(0, -1)) { // skip catch-all
    if (dept.matchRole(agent.role)) return dept;
  }
  return DEPARTMENTS[DEPARTMENTS.length - 1];
}

// ─── Main export ───────────────────────────────────────────────────────────────
export interface MultiRoomGridProps {
  agents: Agent[];
  npcSize: number;
  onClickAgent: (a: Agent) => void;
  forceThoughts: Record<string, string>;
  celebrations: {agentId: string; timestamp: number}[];
  partyMode: boolean;
  chatBubbles: Record<string, {message: string; color: string}>;
  expandedTask: string|null;
  setExpandedTask: (id: string|null) => void;
  theme: any;
  isMobile: boolean;
}

export function MultiRoomGrid({
  agents, npcSize, onClickAgent, forceThoughts, celebrations,
  partyMode, chatBubbles, expandedTask, setExpandedTask, theme, isMobile,
}: MultiRoomGridProps) {
  const owner = agents.find(a => a.id === '_owner');
  const nonOwner = agents.filter(a => a.id !== '_owner');

  // Split agents: working → in their dept room, idle → Break Room
  const workingAgents = nonOwner.filter(a => a.status === 'working');
  const idleAgents = nonOwner.filter(a => a.status !== 'working');

  // Build dept rooms from unique depts used by agents
  // Each agent belongs to exactly one dept
  const deptMap = new Map<string, DeptDef>();
  for (const agent of nonOwner) {
    const dept = agentDept(agent);
    if (!deptMap.has(dept.key)) deptMap.set(dept.key, dept);
  }
  const usedDepts: DeptDef[] = Array.from(deptMap.values());

  const cols = isMobile ? 1 : usedDepts.length <= 2 ? 2 : 3;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      {/* CEO Office — full width */}
      {owner && (
        <CeoOffice
          owner={owner} npcSize={npcSize}
          onClick={()=>onClickAgent(owner)}
          forceThought={forceThoughts[owner.id]||null}
          hasCelebration={celebrations.some(c=>c.agentId===owner.id)}
          partyMode={partyMode}
        />
      )}

      <Hallway/>

      {/* Department rooms — ALWAYS shown, NPC inside only if working */}
      <div style={{
        display:'grid',
        gridTemplateColumns:`repeat(${cols}, 1fr)`,
        gap:10,
        padding:'0 0 10px',
      }}>
        {usedDepts.map(dept => {
          // Only working agents whose PRIMARY dept is this room
          const deptWorking = workingAgents.filter(a => agentDept(a).key === dept.key);
          return (
            <DeptRoom
              key={dept.key}
              dept={dept}
              workingAgents={deptWorking}
              npcSize={npcSize}
              onClickAgent={onClickAgent}
              forceThoughts={forceThoughts}
              celebrations={celebrations}
              partyMode={partyMode}
              chatBubbles={chatBubbles}
              expandedTask={expandedTask}
              setExpandedTask={setExpandedTask}
              theme={theme}
            />
          );
        })}
      </div>

      {/* Break Room — full width, ALL idle agents */}
      <BreakRoom
        idleAgents={idleAgents}
        npcSize={npcSize}
        onClickAgent={onClickAgent}
        forceThoughts={forceThoughts}
        celebrations={celebrations}
        partyMode={partyMode}
        chatBubbles={chatBubbles}
      />
    </div>
  );
}
