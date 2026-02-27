'use client';

import React from 'react';
import type { Accomplishment } from './types';
import { linkifyFiles } from './CooldownTimer';
import { useAuthToken } from '../hooks/useAuthToken';

interface AccomplishmentDetailModalProps {
  accomplishment: Accomplishment | null;
  onClose: () => void;
  onOpenFile: (filename: string) => Promise<void>;
}

export function AccomplishmentDetailModal({ accomplishment, onClose, onOpenFile }: AccomplishmentDetailModalProps) {
  const authToken = useAuthToken();
  
  if (!accomplishment) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>{accomplishment.icon}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
              {accomplishment.title}
            </div>
            <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
              {accomplishment.who} · {new Date(accomplishment.timestamp).toLocaleString('en-US')}
            </div>
          </div>
        </div>

        {accomplishment.detail && (
          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
            {linkifyFiles(accomplishment.detail, fetch)}
          </div>
        )}

        {/* File link — prominent when available */}
        {accomplishment.file && (
          <a
            href="#"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const filename = accomplishment.file!.split('/').pop() || '';
              try {
                await onOpenFile(filename);
              } catch (err) {
                alert('Failed to open file');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(96,165,250,0.08)',
              border: '1px solid rgba(96,165,250,0.25)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              color: '#60a5fa',
              fontSize: 13,
              fontFamily: 'monospace',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            title={`Open ${accomplishment.file.split('/').pop()} in editor`}
          >
            <span style={{ fontSize: 20 }}>📄</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>
                {accomplishment.file.split('/').pop()}
              </div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                Click to open in editor ↗
              </div>
            </div>
          </a>
        )}

        {accomplishment.screenshot && accomplishment.screenshot !== 'recording' && (
          <div>
            {accomplishment.file && (
              <div
                style={{ fontSize: 10, color: '#475569', marginBottom: 6, cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  const el = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                }}
              >
                ▶ Screen recording
              </div>
            )}
            <div style={accomplishment.file ? { display: 'none' } : undefined}>
              {accomplishment.screenshot.endsWith('.mp4') ||
              accomplishment.screenshot.endsWith('.webm') ||
              accomplishment.screenshot.endsWith('.mov') ? (
                <video
                  src={authToken ? `/api/office/screenshot?file=${encodeURIComponent(accomplishment.screenshot)}&token=${authToken}` : undefined}
                  controls
                  autoPlay={!accomplishment.file}
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    border: '1px solid #334155',
                    background: '#000',
                  }}
                />
              ) : (
                <img
                  src={authToken ? `/api/office/screenshot?file=${encodeURIComponent(accomplishment.screenshot)}&token=${authToken}` : undefined}
                  alt={accomplishment.title}
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    border: '1px solid #334155',
                  }}
                />
              )}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '8px 16px',
            background: '#334155',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
