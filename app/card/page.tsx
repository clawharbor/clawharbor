'use client';

import Link from 'next/link';

const AGENTS = [
  { name: 'Cipher', role: 'Lead Engineer', emoji: '⚡', level: 18, rarity: '◆ EPIC', color: '#a855f7' },
  { name: 'Scout', role: 'Outreach Lead', emoji: '🔍', level: 14, rarity: '● RARE', color: '#3b82f6' },
  { name: 'Nova', role: 'Product Lead', emoji: '✨', level: 13, rarity: '● RARE', color: '#3b82f6' },
  { name: 'Forge', role: 'Backend Dev', emoji: '🔧', level: 12, rarity: '● RARE', color: '#3b82f6' },
  { name: 'Pixel', role: 'UI Designer', emoji: '🎨', level: 11, rarity: '● RARE', color: '#3b82f6' },
];

export default function CardGalleryPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 60%)',
      padding: '40px 20px',
      fontFamily: '"Press Start 2P", monospace',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: '#f8fafc', fontSize: 20, marginBottom: 8 }}>🎴 AGENT CARDS</h1>
        <p style={{ color: '#64748b', fontSize: 9, marginBottom: 40 }}>
          Collect &apos;em all. Click a card to view &amp; share.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 20,
        }}>
          {AGENTS.map(agent => (
            <Link
              key={agent.name}
              href={`/card/${agent.name.toLowerCase()}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: 'rgba(15,23,42,0.8)',
                border: `2px solid ${agent.color}40`,
                borderRadius: 12,
                padding: 24,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = agent.color;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${agent.color}30`;
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${agent.color}40`;
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>{agent.emoji}</div>
                <div style={{ color: '#f8fafc', fontSize: 12, marginBottom: 4 }}>{agent.name}</div>
                <div style={{ color: '#64748b', fontSize: 8, marginBottom: 8 }}>{agent.role}</div>
                <div style={{ color: agent.color, fontSize: 8 }}>{agent.rarity}</div>
                <div style={{ color: '#475569', fontSize: 8, marginTop: 4 }}>LVL {agent.level}</div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 40 }}>
          <Link
            href="/?demo=true"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#fff',
              borderRadius: 8,
              fontFamily: '"Press Start 2P", monospace',
              fontSize: 10,
              textDecoration: 'none',
            }}
          >
            🏢 See Them in Action →
          </Link>
        </div>

        <div style={{ color: '#334155', fontSize: 7, marginTop: 20 }}>
          clawharbor.work — your AI agents, but they&apos;re Sims
        </div>
      </div>
    </div>
  );
}
