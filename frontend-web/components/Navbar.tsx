'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, isStaff, SAMPLE_PERSONAS } from '../lib/auth';
import { api } from '../lib/api';
import PersonaModal from './PersonaModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  // Find persona details for avatar
  const persona = SAMPLE_PERSONAS.find((p) => p.email === user?.email);
  const avatar = persona?.avatar || '👤';
  const displayName = user?.fullName || persona?.name || user?.email?.split('@')[0] || 'Guest';

  // Fetch cart count
  const loadCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const c: any = await api('/cart');
      setCartCount(c?.count || 0);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    loadCartCount();
    const interval = setInterval(loadCartCount, 4000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="brand">
            <div className="brand-icon">🛍️</div>
            <span>ShopSmart</span>
            <span className="brand-ai-tag">AI</span>
          </Link>

          <div className="nav-links">
            <Link href="/" className={`link ${pathname === '/' ? 'active' : ''}`}>
              Catalog
            </Link>
            <Link href="/assistant" className={`link ${pathname.startsWith('/assistant') ? 'active' : ''}`}>
              ✨ AI Hub
            </Link>
            <Link href="/compare" className={`link ${pathname === '/compare' ? 'active' : ''}`}>
              Compare
            </Link>
            <Link href="/wishlist" className={`link ${pathname === '/wishlist' ? 'active' : ''}`}>
              Wishlist
            </Link>
            <Link href="/orders" className={`link ${pathname.startsWith('/orders') ? 'active' : ''}`}>
              Orders
            </Link>
            {user && isStaff(user) && (
              <Link href="/admin" className={`link ${pathname.startsWith('/admin') ? 'active' : ''}`}>
                Admin
              </Link>
            )}
          </div>

          <div className="spacer" />

          <div className="nav-actions">
            {/* 1-Tap Persona Switcher Button */}
            <button
              className="persona-btn"
              onClick={() => setIsPersonaOpen(true)}
              title="Click to switch PRD persona (1-tap testing)"
            >
              <span className="persona-avatar">{avatar}</span>
              <div className="persona-meta-nav">
                <span className="persona-name-nav">{displayName}</span>
                <span className="persona-tier-chip">
                  {user?.membershipTier || user?.role || 'BASIC'} ▾
                </span>
              </div>
            </button>

            {/* Cart Button with Count Badge */}
            <Link href="/cart" className="action-circle-btn" title="View Cart">
              🛒
              {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
            </Link>

            {user ? (
              <button className="btn ghost" style={{ padding: '8px 14px', fontSize: '12px' }} onClick={logout}>
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="link">
                  Login
                </Link>
                <Link href="/register">
                  <button className="btn" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    Register
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Modal Dialog */}
      <PersonaModal isOpen={isPersonaOpen} onClose={() => setIsPersonaOpen(false)} />
    </>
  );
}
