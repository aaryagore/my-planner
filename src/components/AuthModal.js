'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose }) {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    isConfigured,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    clearError();
    setLocalError(null);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      handleClose();
    } catch (err) {
      setLocalError(err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      handleClose();
    } catch (err) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const displayErr = localError || error;

  return (
    <div
      className="auth-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="auth-modal-dialog">
        <div className="auth-modal-header">
          <button
            className="auth-modal-close"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
          <div className="auth-modal-icon">✦</div>
          <h2 className="auth-modal-title">
            {mode === 'signin' ? 'Welcome Back' : 'Create Free Account'}
          </h2>
          <p className="auth-modal-subtitle">
            {isConfigured
              ? 'Sign in to sync your planner across all your devices'
              : 'Firebase setup pending — configure credentials in .env.local'}
          </p>
        </div>

        <div className="auth-modal-body">
          {displayErr && (
            <div className="auth-error">
              {displayErr}
            </div>
          )}

          {/* Google Sign-in */}
          <button
            type="button"
            className="btn-google"
            onClick={handleGoogleSignIn}
            disabled={submitting}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or with email</span>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setMode('signin');
                clearError();
                setLocalError(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                clearError();
                setLocalError(null);
              }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="auth-field">
                <label htmlFor="name-input">Full Name</label>
                <input
                  id="name-input"
                  type="text"
                  placeholder="e.g. Alex Smith"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email-input">Email address</label>
              <input
                id="email-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password-input">Password</label>
              <input
                id="password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
              disabled={submitting}
            >
              {submitting
                ? 'Processing...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Create Free Account'}
            </button>
          </form>

          <div className="auth-badge-free">
            <span>🔒 100% Free Forever • Firebase Spark Plan • Zero Ads</span>
          </div>
        </div>
      </div>
    </div>
  );
}
