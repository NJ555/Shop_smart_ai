'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, SAMPLE_PERSONAS } from '../../lib/auth';

export default function RegisterPage() {
  const { register, quickSwitch } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123');
  const [fullName, setFullName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await register(email, password, fullName);
      router.push('/');
    } catch (e: any) {
      setErr(e.message || 'Registration failed');
    }
    setBusy(false);
  };

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto' }}>
      <div className="card glow" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '36px', marginBottom: 8 }}>✨</div>
          <h2 style={{ fontSize: '24px', margin: '0 0 6px' }}>Create an Account</h2>
          <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
            Instantly creates user in SQLite DB, creates default cart & wishlist, signs JWT, and logs
            you in!
          </p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Full Name</label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Email Address</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
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
              placeholder="Password (min 8 chars, letter + number)"
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
            {busy ? 'Creating Account & Authenticating...' : 'Register & Start Shopping'}
          </button>
        </form>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
          <span className="muted" style={{ fontSize: '13px' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </span>
        </div>

        {/* 1-Tap Persona Testing Shortcuts */}
        <div style={{ marginTop: 20 }}>
          <div className="prompt-pill-label" style={{ textAlign: 'center', marginBottom: 10 }}>
            Or 1-Tap Switch to a Seeded Persona:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {SAMPLE_PERSONAS.slice(0, 3).map((p) => (
              <button
                key={p.email}
                type="button"
                className="btn plain"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={async () => {
                  await quickSwitch(p.email);
                  router.push('/');
                }}
              >
                <span>{p.avatar}</span> {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
