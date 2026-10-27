'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import './auth.css';

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading, isConfigured } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // If user is already authenticated, redirect them to dashboard
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="landing-loading">
        <div
          className="auth-spinner"
          style={{ width: 32, height: 32, borderColor: 'var(--color-primary)' }}
        />
        <p>Loading your planner...</p>
      </div>
    );
  }

  return (
    <div className="landing-page animate-fade-in">
      {/* Top Navbar */}
      <header className="landing-nav">
        <div className="landing-brand">
          <div className="landing-logo-badge" aria-hidden="true">✦</div>
          <span className="landing-brand-name">My Planner</span>
        </div>
        <div className="landing-nav-actions">
          {user ? (
            <button
              type="button"
              className="btn-landing-primary"
              onClick={() => router.push('/dashboard')}
            >
              Open Dashboard →
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-landing-secondary"
                onClick={() => setAuthModalOpen(true)}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn-landing-primary"
                onClick={() => router.push('/dashboard')}
              >
                Open Planner →
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-pill-tag">
          <span>✨ Calm, focused productivity</span>
        </div>
        <h1 className="landing-title">
          Plan your day with clarity, <br />
          <span className="landing-title-accent">not clutter.</span>
        </h1>
        <p className="landing-subtitle">
          Natural voice task capture, dedicated Personal & Academic boards, daytime
          time-blocking, and mindful routines — without the overwhelm.
        </p>

        <div className="landing-cta-group">
          <button
            type="button"
            className="btn-hero-cta"
            onClick={() => router.push('/dashboard')}
          >
            <span>Open Planner (Instant Demo)</span>
            <span className="cta-arrow" aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            className="btn-hero-secondary"
            onClick={() => setAuthModalOpen(true)}
          >
            <span>Sign In / Cloud Sync</span>
          </button>
        </div>

        <div className="landing-badges">
          <span className="landing-badge-item">✓ 100% Free Forever</span>
          <span className="landing-badge-item">✓ Works Offline in Browser</span>
          <span className="landing-badge-item">✓ Voice & Keyboard Quick-Capture</span>
        </div>
      </section>

      {/* 4 Core Pillars Grid */}
      <section className="landing-features" aria-label="Core features">
        <div className="landing-feature-card">
          <div className="feature-icon-badge" aria-hidden="true">🎙️</div>
          <h3 className="feature-title">Effortless Voice Capture</h3>
          <p className="feature-desc">
            Speak naturally like <em>&ldquo;Remind me to review physics chapter 4 tomorrow at 3pm&rdquo;</em>.
            Automatically extracts due dates, times, and categories with zero manual tagging.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="feature-icon-badge" aria-hidden="true">🎯</div>
          <h3 className="feature-title">Personal & Academic Domains</h3>
          <p className="feature-desc">
            Keep coursework and personal tasks cleanly separated. Pin your Top 3 daily
            priorities to protect focus and conquer the day without mental clutter.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="feature-icon-badge" aria-hidden="true">⏱️</div>
          <h3 className="feature-title">Daytime Time-Blocking</h3>
          <p className="feature-desc">
            A clean schedule timeline from 7:00 to 22:00 with a live <strong>NOW</strong> indicator line.
            Slot tasks from your tray into realistic hours in a single click.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="feature-icon-badge" aria-hidden="true">🧘</div>
          <h3 className="feature-title">Habits & Mindful Review</h3>
          <p className="feature-desc">
            Build flexible routines with weekly targets instead of streak pressure. Focus with
            25-minute intervals and reflect on daily wins.
          </p>
        </div>
      </section>

      {/* Cloud Sync info */}
      <footer className="landing-footer-note">
        {!isConfigured ? (
          <p>
            💡 <strong>Instant Local Mode</strong>: All data is saved automatically in your browser.
            (Optional: Cloud sync keys can be added to <code>.env.local</code> anytime).
          </p>
        ) : (
          <p>
            🔒 Cloud synchronization enabled via Firebase Spark. Private to your account.
          </p>
        )}
      </footer>

      {/* Auth Modal for Login / Register */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
