'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, SAMPLE_PERSONAS } from '../../lib/auth';

export default function LoginPage() {
  const { login, quickSwitch } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('Password123');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (e: any) {
      setErr(e.message || 'Login failed. Please verify credentials.');
    }
    setBusy(false);
  };

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto' }}>
      <div className="card glow" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '36px', marginBottom: 8 }}>🔐</div>
          <h2 style={{ fontSize: '24px', margin: '0 0 6px' }}>Welcome Back</h2>
          <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
            Sign in to access your orders, saved preferences, cart, and personalized recommendations.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Email Address</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password123"
              required
            />
          </div>

          {err && (
            <div
              style={{
                color: 'var(--bad)',
                background: 'var(--bad-bg)',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: '13px',
              }}
            >
              {err}
            </div>
          )}

          <button type="submit" className="btn" disabled={busy} style={{ marginTop: 8, padding: '13px' }}>
            {busy ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
          <span className="muted" style={{ fontSize: '13px' }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              Create Account
            </Link>
          </span>
        </div>

        {/* 1-Tap Persona Switcher Cards */}
        <div style={{ marginTop: 20 }}>
          <div className="prompt-pill-label" style={{ textAlign: 'center', marginBottom: 10 }}>
            ⚡ 1-Tap Instant Login with Seeded Personas:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {SAMPLE_PERSONAS.map((p) => (
              <button
                key={p.email}
                type="button"
                className="btn plain"
                style={{ fontSize: '11px', padding: '6px 10px' }}
                onClick={async () => {
                  await quickSwitch(p.email);
                  router.push('/');
                }}
              >
                <span>{p.avatar}</span> {p.name} ({p.role.slice(0, 4)})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
