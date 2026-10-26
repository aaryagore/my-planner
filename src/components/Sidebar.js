'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';
import './Sidebar.css';

/* ── Navigation items ─────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: 'Plan',
    items: [
      { href: '/dashboard',  icon: '📋', text: 'Dashboard' },
      { href: '/inbox',      icon: '📥', text: 'Inbox',      badgeKey: 'inbox' },
      { href: '/calendar',   icon: '📅', text: 'Calendar' },
    ],
  },
  {
    label: 'Focus',
    items: [
      { href: '/habits',  icon: '🎯', text: 'Habits' },
      { href: '/focus',   icon: '⏱️', text: 'Focus Timer' },
      { href: '/review',  icon: '📊', text: 'Review' },
    ],
  },
];

/* ── Component ────────────────────────────────────────────── */
export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isConfigured } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  /* Load saved preferences */
  useEffect(() => {
    const savedTheme = localStorage.getItem('planner-theme') || 'light';
    const savedCollapsed = localStorage.getItem('planner-sidebar-collapsed') === 'true';
    setTheme(savedTheme);
    setCollapsed(savedCollapsed);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  /* Theme toggle */
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('planner-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  /* Collapse toggle */
  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('planner-sidebar-collapsed', String(next));
  };

  /* Close mobile sidebar when navigating */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarClasses = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const userInitial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile top bar */}
      <header className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          ☰
        </button>
        <span className="mobile-logo-text">My Planner</span>
      </header>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={sidebarClasses} role="navigation" aria-label="Main navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true">✦</div>
          <span className="sidebar-logo-text">My Planner</span>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="sidebar-link-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="sidebar-link-text">{item.text}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom">
          {/* User Profile or Sign-in button */}
          {user ? (
            <div className="sidebar-user" title={`Logged in as ${user.email}`}>
              <div className="sidebar-user-avatar">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  />
                ) : (
                  userInitial
                )}
              </div>
              <span className="sidebar-user-name">
                {user.displayName || user.email.split('@')[0]}
              </span>
              <button
                className="sidebar-user-logout"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
              >
                🚪
              </button>
            </div>
          ) : (
            <button
              className="sidebar-auth-btn"
              onClick={() => setAuthModalOpen(true)}
              title="Sign in or create account"
            >
              <span aria-hidden="true">👤</span>
              <span className="sidebar-auth-btn-text">
                Sign In / Register
              </span>
            </button>
          )}

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
            <span className="theme-toggle-text">
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </span>
          </button>

          <button
            className="sidebar-toggle"
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '▸' : '◂'}
          </button>
        </div>
      </aside>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
