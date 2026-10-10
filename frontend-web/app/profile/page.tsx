'use client';
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth, SAMPLE_PERSONAS } from '../../lib/auth';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [prefs, setPrefs] = useState<any>({ preferredBrands: '', budgetMax: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const persona = SAMPLE_PERSONAS.find((p) => p.email === user?.email);

  useEffect(() => {
    if (user) {
      api('/auth/me')
        .then((me: any) =>
          setPrefs({
            preferredBrands: (me.preferences?.preferredBrands || []).join(', '),
            budgetMax: me.preferences?.budgetMax || '',
          })
        )
        .catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <h3>Authentication Required</h3>
        <p className="muted">Please log in to view and modify your account profile.</p>
      </div>
    );
  }

  const savePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await api('/auth/preferences', {
        method: 'PUT',
        body: {
          preferredBrands: prefs.preferredBrands
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean),
          budgetMax: prefs.budgetMax ? parseFloat(prefs.budgetMax) : null,
        },
      });
      setMsg('Preferences updated successfully!');
      refresh();
    } catch (e: any) {
      setMsg(e.message || 'Error updating preferences');
    }
    setBusy(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="hero" style={{ padding: '24px', marginBottom: 20 }}>
        <span className="hero-tag">AUTHENTICATED IDENTITY & PROFILE</span>
        <h1 style={{ fontSize: '26px' }}>My Account Profile</h1>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Configured preferences guide soft recommendations, but hard query constraints are never overridden.
        </p>
      </div>

      <div className="card glow" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="avatar-bubble" style={{ width: 64, height: 64, fontSize: 32 }}>
            {persona?.avatar || '👤'}
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px' }}>
              {user.fullName || persona?.name || user.email}
            </h2>
            <div className="muted" style={{ fontSize: '13px' }}>
              {user.email} · ID: {user.id}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <span className={`badge ${user.role !== 'CUSTOMER' ? 'b-blue' : 'b-green'}`}>
                Role: {user.role}
              </span>
              <span className="badge b-amber">
                Tier: {user.membershipTier || 'BASIC'}
              </span>
            </div>
          </div>
        </div>

        {persona && (
          <div className="card sunken" style={{ marginTop: 16, padding: '12px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', marginBottom: 2 }}>
              Active Testing Persona: {persona.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{persona.scenario}</div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Shopping Preferences</h3>
        <p className="muted" style={{ fontSize: '13px', marginTop: 0 }}>
          The AI shopping assistant will factor in your preferred brands and soft budgets when
          ranking recommendations.
        </p>

        <form onSubmit={savePreferences} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
              Preferred Brands (comma-separated)
            </label>
            <input
              className="input"
              value={prefs.preferredBrands}
              onChange={(e) => setPrefs({ ...prefs, preferredBrands: e.target.value })}
              placeholder="e.g. Apple, Lenovo, Sony"
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
              Default Budget Cap ($ USD)
            </label>
            <input
              className="input"
              type="number"
              value={prefs.budgetMax}
              onChange={(e) => setPrefs({ ...prefs, budgetMax: e.target.value })}
              placeholder="e.g. 1000"
            />
          </div>

          {msg && (
            <div
              style={{
                color: 'var(--ok)',
                background: 'var(--ok-bg)',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              ✓ {msg}
            </div>
          )}

          <button type="submit" className="btn" disabled={busy} style={{ width: 'fit-content', padding: '10px 24px' }}>
            {busy ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>
    </div>
  );
}
