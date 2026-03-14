'use client';

import React from 'react';
import type { Agent } from './types';
import { NPC } from './NPC';
import { NPCParticles } from './NPCParticles';
import { ChatBubble } from './ChatBubble';
import { CooldownTimer } from './CooldownTimer';
import { prettifyTask } from './utils';

// ─── Department config — maps agent roles to departments ──────────────────────

interface Department {
  name: string;
  icon: string;
  color: string;       // room background
  border: string;      // room border color
  floor: string;       // checkerboard color
  label: string;       // display label
}

function getDepartment(role: string): Department {
  const r = (role || '').toLowerCase();

  if (r.match(/engineer|dev|code|frontend|backend|fullstack|software/))
    return { name: 'engineering', icon: '💻', color: '#0d1f1a', border: '#10b981', floor: '#0a1f16', label: 'Engineering' };
  if (r.match(/design|ui|ux|creative|art/))
    return { name: 'design', icon: '🎨', color: '#1a0d1f', border: '#a855f7', floor: '#150d1f', label: 'Design' };
  if (r.match(/product|pm|manager|lead|strategy/))
    return { name: 'product', icon: '📋', color: '#0d161f', border: '#3b82f6', floor: '#0a1520', label: 'Product' };
  if (r.match(/data|analyst|research|science|ml|ai/))
    return { name: 'data', icon: '📊', color: '#1f1a0d', border: '#f59e0b', floor: '#1f160a', label: 'Data' };
  if (r.match(/ops|devops|infra|security|deploy|sre/))
    return { name: 'ops', icon: '⚙️', color: '#1f0d0d', border: '#ef4444', floor: '#1f0a0a', label: 'Operations' };
  if (r.match(/marketing|growth|seo|content|social/))
    return { name: 'marketing', icon: '📣', color: '#1f1a0d', border: '#f97316', floor: '#1f160a', label: 'Marketing' };
  if (r.match(/sales|outreach|biz|bd|partner/))
    return { name: 'sales', icon: '🤝', color: '#0d1a1f', border: '#06b6d4', floor: '#0a1620', label: 'Sales' };
  if (r.match(/owner|ceo|cto|founder/))
    return { name: 'ceo', icon: '👑', color: '#1a1a0d', border: '#eab308', floor: '#1a180a', label: 'CEO Office' };

  return { name: 'general', icon: '🏢', color: '#0d0d1a', border: '#6366f1', floor: '#0a0a1a', label: 'Office' };
}

// ─── Checkerboard floor pattern ───────────────────────────────────────────────

function CheckerFloor({ color }: { color: string }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `
        repeating-conic-gradient(
          ${color}22 0% 25%,
          ${color}11 0% 50%
        )`,
      backgroundSize: '20px 20px',
      opacity: 0.6,
      pointerEvents: 'none',
    }} />
  );
}

// ─── Desk decoration ──────────────────────────────────────────────────────────

function Desk({ color }: { color: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Monitor */}
      <div style={{
        width: 32, height: 22,
        background: '#1e293b',
        border: `2px solid ${color}44`,
        borderRadius: 3,
        position: 'relative',
        marginBottom: 2,
      }}>
        {/* Screen glow */}
        <div style={{
          position: 'absolute', inset: 2,
          background: `${color}22`,
          borderRadius: 1,
        }} />
        {/* Fake lines on screen */}
        <div style={{ position: 'absolute', top: 4, left: 3, right: 3, height: 1, background: `${color}55`, borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: 7, left: 3, right: 6, height: 1, background: `${color}44`, borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: 10, left: 3, right: 4, height: 1, background: `${color}33`, borderRadius: 1 }} />
        {/* Monitor stand */}
        <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 3, height: 4, background: '#334155' }} />
        <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 10, height: 2, background: '#334155', borderRadius: 1 }} />
      </div>
      {/* Desk surface */}
      <div style={{
        width: 48, height: 8,
        background: '#2d1f0e',
        border: `1px solid #4a3520`,
        borderRadius: '2px 2px 4px 4px',
      }} />
    </div>
  );
}

// ─── Plant decoration ─────────────────────────────────────────────────────────

function Plant() {
  return (
    <div style={{ position: 'absolute', bottom: 8, right: 8, opacity: 0.7 }}>
      <div style={{ width: 8, height: 16, background: '#065f46', borderRadius: '4px 4px 0 0', margin: '0 auto' }} />
      <div style={{ width: 16, height: 12, background: '#059669', borderRadius: '50%', marginTop: -10, marginLeft: -4 }} />
      <div style={{ width: 10, height: 6, background: '#6b4226', margin: '0 auto', borderRadius: 2 }} />
    </div>
  );
}

// ─── Break Room (replaces lounge) ─────────────────────────────────────────────

function BreakRoomDecor() {
  return (<>
    {/* Couch */}
    <div style={{ position: 'absolute', bottom: 10, left: 12, opacity: 0.5 }}>
      <div style={{ width: 48, height: 18, background: '#7c3aed', borderRadius: '6px 6px 3px 3px' }} />
      <div style={{ position: 'absolute', top: -8, left: 0, width: 9, height: 10, background: '#6d28d9', borderRadius: '4px 0 0 0' }} />
      <div style={{ position: 'absolute', top: -8, right: 0, width: 9, height: 10, background: '#6d28d9', borderRadius: '0 4px 0 0' }} />
    </div>
    {/* Coffee table */}
    <div style={{ position: 'absolute', bottom: 8, right: 16, opacity: 0.5 }}>
      <div style={{ width: 28, height: 6, background: '#4a3520', borderRadius: 3 }} />
      <div style={{ width: 6, height: 6, background: '#6b4226', margin: '0 auto' }} />
    </div>
    {/* Coffee cup */}
    <div style={{ position: 'absolute', bottom: 22, right: 20, opacity: 0.6 }}>
      <div style={{ width: 10, height: 12, background: '#f5f5f4', borderRadius: '0 0 3px 3px', border: '1px solid #d4d4d4' }} />
      <div style={{ width: 12, height: 2, background: '#f5f5f4', borderRadius: 1, marginTop: -12 }} />
    </div>
  </>);
}

// ─── Single agent room ────────────────────────────────────────────────────────

interface AgentRoomProps {
  agent: Agent;
  npcSize: number;
  onClick: () => void;
  forceThought: string | null;
  hasCelebration: boolean;
  partyMode: boolean;
  chatBubble?: { message: string; color: string } | null;
  expandedTask: string | null;
  setExpandedTask: (id: string | null) => void;
  theme: any;
}

function AgentRoom({
  agent, npcSize, onClick, forceThought, hasCelebration, partyMode,
  chatBubble, expandedTask, setExpandedTask, theme,
}: AgentRoomProps) {
  const dept = getDepartment(agent.role);
  const isWorking = agent.status === 'working';

  return (
    <div style={{
      position: 'relative',
      background: dept.color,
      border: `2px solid ${dept.border}44`,
      borderRadius: 10,
      overflow: 'hidden',
      minHeight: 160,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 12,
      transition: 'border-color 0.3s',
      cursor: 'pointer',
    }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.borderColor = dept.border}
      onMouseLeave={e => e.currentTarget.style.borderColor = `${dept.border}44`}
    >
      {/* Checkerboard floor */}
      <CheckerFloor color={dept.floor} />

      {/* Room label top-center */}
      <div style={{
        position: 'absolute',
        top: 6, left: '50%',
        transform: 'translateX(-50%)',
        background: '#0f172acc',
        border: `1px solid ${dept.border}66`,
        borderRadius: 4,
        padding: '2px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        zIndex: 10,
        whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 10 }}>{dept.icon}</span>
        <span style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 6,
          color: dept.border,
          textTransform: 'uppercase',
        }}>{dept.label}</span>
      </div>

      {/* Working indicator top-right */}
      {isWorking && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 8, height: 8,
          background: '#22c55e',
          borderRadius: '50%',
          boxShadow: '0 0 6px #22c55e',
          animation: 'pulse 2s ease-in-out infinite',
          zIndex: 10,
        }} />
      )}

      {/* Plant decoration */}
      <Plant />

      {/* Desk + NPC layout */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        zIndex: 2,
      }}>
        {/* Task bubble */}
        {agent.task && isWorking && (
          <div style={{ position: 'relative' }}>
            <div
              onClick={e => { e.stopPropagation(); setExpandedTask(expandedTask === agent.id ? null : agent.id); }}
              style={{
                background: `${dept.border}22`,
                border: `1px solid ${dept.border}44`,
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 7,
                color: dept.border,
                maxWidth: 140,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
                fontFamily: 'system-ui',
              }}
            >
              {prettifyTask(agent.task)}
            </div>
            {expandedTask === agent.id && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', top: '100%', left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: 4, zIndex: 100,
                  background: theme.bgTertiary,
                  border: '1px solid #334155',
                  borderRadius: 8, padding: '8px 12px',
                  fontSize: 11, color: theme.text,
                  maxWidth: 280, minWidth: 160,
                  whiteSpace: 'normal', wordBreak: 'break-word',
                  lineHeight: 1.4,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ fontSize: 7, color: theme.textDim, marginBottom: 4, fontFamily: '"Press Start 2P", monospace' }}>{agent.name}</div>
                {agent.task}
              </div>
            )}
          </div>
        )}

        {/* Chat bubble */}
        {chatBubble && (
          <ChatBubble message={chatBubble.message} agentColor={chatBubble.color} size={npcSize} />
        )}

        {/* NPC */}
        <div style={{ position: 'relative' }}>
          <NPC
            agent={agent}
            size={npcSize}
            onClick={onClick}
            forceThought={forceThought}
            hasCelebration={hasCelebration}
            partyMode={partyMode}
          />
          <div style={{ position: 'absolute', inset: -10, pointerEvents: 'none', zIndex: 0 }}>
            <NPCParticles
              agentStatus={agent.status as 'working' | 'idle'}
              agentMood={agent.mood as any}
              agentRole={agent.role}
              width={Math.round(64 * npcSize) + 20}
              height={Math.round(64 * npcSize) + 20}
            />
          </div>
        </div>

        {/* Cooldown / idle tag */}
        {!isWorking && (
          agent.nextTaskAt
            ? <CooldownTimer targetMs={agent.nextTaskAt} />
            : (
              <div style={{
                background: 'rgba(100,116,139,0.2)',
                border: '1px solid rgba(100,116,139,0.3)',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 7,
                color: '#94a3b8',
              }}>
                {['☕ On break', '📖 Reading docs', '🎮 Taking 5', '💭 Thinking...'][
                  agent.id.split('').reduce((s: number, c: string) => s + c.charCodeAt(0), 0) % 4
                ]}
              </div>
            )
        )}

        {/* Desk */}
        <Desk color={dept.border} />

        {/* Agent name + role */}
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <div style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 7,
            color: '#e2e8f0',
          }}>{agent.name} <span style={{ color: dept.border, fontSize: 6 }}>Lv.{agent.level}</span></div>
          <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{agent.role}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Break Room (idle agents) ─────────────────────────────────────────────────

interface BreakRoomProps {
  agents: Agent[];
  npcSize: number;
  onClickAgent: (a: Agent) => void;
  forceThoughts: Record<string, string>;
  celebrations: { agentId: string }[];
  partyMode: boolean;
  chatBubbles: Record<string, { message: string; color: string }>;
  theme: any;
}

function BreakRoom({ agents, npcSize, onClickAgent, forceThoughts, celebrations, partyMode, chatBubbles, theme }: BreakRoomProps) {
  return (
    <div style={{
      position: 'relative',
      background: '#100d1a',
      border: '2px solid #6d28d944',
      borderRadius: 10,
      overflow: 'hidden',
      minHeight: 140,
      padding: '32px 16px 12px',
    }}>
      <CheckerFloor color="#150d1f" />
      <BreakRoomDecor />

      {/* Label */}
      <div style={{
        position: 'absolute', top: 6, left: '50%',
        transform: 'translateX(-50%)',
        background: '#0f172acc',
        border: '1px solid #6d28d966',
        borderRadius: 4,
        padding: '2px 10px',
        display: 'flex', alignItems: 'center', gap: 4,
        zIndex: 10, whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 10 }}>☕</span>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#a78bfa', textTransform: 'uppercase' }}>
          Break Room
        </span>
      </div>

      {/* Agents */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexWrap: 'wrap', gap: 24,
        justifyContent: 'center', alignItems: 'flex-end',
      }}>
        {agents.length > 0 ? agents.map((a, idx) => (
          <div key={a.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            animation: `npcEntrance 0.5s ease-out ${idx * 0.1}s both`,
          }}>
            {chatBubbles[a.id] && (
              <ChatBubble message={chatBubbles[a.id].message} agentColor={chatBubbles[a.id].color} size={npcSize} />
            )}
            {a.nextTaskAt
              ? <CooldownTimer targetMs={a.nextTaskAt} />
              : (
                <div style={{
                  background: 'rgba(109,40,217,0.15)',
                  border: '1px solid rgba(109,40,217,0.3)',
                  borderRadius: 4, padding: '2px 6px',
                  fontSize: 7, color: '#a78bfa',
                }}>
                  {['☕ On break', '📖 Reading docs', '🎮 Taking 5', '💭 Thinking...'][
                    a.id.split('').reduce((s: number, c: string) => s + c.charCodeAt(0), 0) % 4
                  ]}
                </div>
              )
            }
            <NPC
              agent={a}
              size={npcSize * 0.85}
              onClick={() => onClickAgent(a)}
              forceThought={forceThoughts[a.id] || null}
              hasCelebration={celebrations.some(c => c.agentId === a.id)}
              partyMode={partyMode}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#e2e8f0' }}>{a.name}</div>
              <div style={{ fontSize: 9, color: '#64748b' }}>{a.role}</div>
            </div>
          </div>
        )) : (
          <div style={{ color: '#475569', fontFamily: '"Press Start 2P", monospace', fontSize: 7, padding: 16, textAlign: 'center' }}>
            💼 Everyone is working!
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CEO Office (owner NPC) ───────────────────────────────────────────────────

function CeoOffice({ agent, npcSize, onClick, forceThought, hasCelebration, partyMode, theme }: {
  agent: Agent; npcSize: number; onClick: () => void;
  forceThought: string | null; hasCelebration: boolean; partyMode: boolean; theme: any;
}) {
  return (
    <div style={{
      position: 'relative',
      background: '#1a1a0a',
      border: '2px solid #eab30844',
      borderRadius: 10,
      overflow: 'hidden',
      minHeight: 160,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 12,
      cursor: 'pointer',
    }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#eab308'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#eab30844'}
    >
      <CheckerFloor color="#1a180a" />

      {/* Label */}
      <div style={{
        position: 'absolute', top: 6, left: '50%',
        transform: 'translateX(-50%)',
        background: '#0f172acc',
        border: '1px solid #eab30866',
        borderRadius: 4, padding: '2px 10px',
        display: 'flex', alignItems: 'center', gap: 4,
        zIndex: 10, whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 10 }}>👑</span>
        <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 6, color: '#eab308', textTransform: 'uppercase' }}>
          CEO Office
        </span>
      </div>

      {/* Big desk */}
      <div style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
        <div style={{
          width: 120, height: 16,
          background: '#3d2b0e',
          border: '2px solid #6b4226',
          borderRadius: '4px 4px 6px 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          {/* Tiny items on desk */}
          <div style={{ width: 8, height: 6, background: '#1e293b', borderRadius: 1, border: '1px solid #334155' }} />
          <div style={{ width: 12, height: 8, background: '#1e293b', borderRadius: 1 }} />
          <div style={{ width: 6, height: 6, background: '#1e293b', borderRadius: 1 }} />
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {agent.task && (
          <div style={{
            background: 'rgba(234,179,8,0.15)',
            border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: 4, padding: '2px 8px',
            fontSize: 7, color: '#fde047', maxWidth: 160,
            textAlign: 'center', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {prettifyTask(agent.task)}
          </div>
        )}
        <NPC agent={agent} size={npcSize} onClick={onClick} forceThought={forceThought}
          hasCelebration={hasCelebration} partyMode={partyMode} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: '"Press Start 2P", monospace', fontSize: 7, color: '#fde047' }}>{agent.name}</div>
          <div style={{ fontSize: 9, color: '#92400e' }}>{agent.role}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main MultiRoomGrid export ────────────────────────────────────────────────

export interface MultiRoomGridProps {
  agents: Agent[];
  npcSize: number;
  onClickAgent: (a: Agent) => void;
  forceThoughts: Record<string, string>;     // agentId → thought text
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

  // Determine grid columns based on working count
  const cols = isMobile ? 1 : working.length <= 2 ? 2 : working.length <= 4 ? 2 : 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* CEO Office — only if owner exists */}
      {owner && (
        <CeoOffice
          agent={owner}
          npcSize={npcSize}
          onClick={() => onClickAgent(owner)}
          forceThought={forceThoughts[owner.id] || null}
          hasCelebration={celebrations.some(c => c.agentId === owner.id)}
          partyMode={partyMode}
          theme={theme}
        />
      )}

      {/* Working agents — each in their own department room */}
      {working.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 8,
        }}>
          {working.map((agent) => (
            <AgentRoom
              key={agent.id}
              agent={agent}
              npcSize={npcSize}
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

      {/* Break Room — idle agents */}
      <BreakRoom
        agents={idle}
        npcSize={npcSize * 0.9}
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
