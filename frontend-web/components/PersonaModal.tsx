'use client';
import React from 'react';
import { SAMPLE_PERSONAS, SamplePersona, useAuth } from '../lib/auth';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PersonaModal({ isOpen, onClose }: PersonaModalProps) {
  const { user, quickSwitch } = useAuth();

  if (!isOpen) return null;

  const handleSelect = async (p: SamplePersona) => {
    await quickSwitch(p.email);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>PRD Persona Switcher</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
              Instant 1-tap testing across Customer & Ops roles
            </p>
          </div>
          <button className="icon-btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {SAMPLE_PERSONAS.map((p) => {
            const isSelected = user?.email === p.email;
            return (
              <div
                key={p.email}
                className={`persona-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelect(p)}
              >
                <div className="avatar-bubble">{p.avatar}</div>
                <div className="persona-meta">
                  <div className="persona-top">
                    <span className="persona-name">{p.name}</span>
                    <div className="badge-row">
                      <span className={`role-badge ${p.role !== 'CUSTOMER' ? 'staff' : ''}`}>
                        {p.role}
                      </span>
                      <span className="tier-badge">{p.membership}</span>
                    </div>
                  </div>
                  <div className="persona-tagline">{p.tagline}</div>
                  <div className="persona-scenario">{p.scenario}</div>
                </div>
                {isSelected && <div className="check-bubble">✓</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
