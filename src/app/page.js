'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import './auth.css';

export default function HomePage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    isConfigured,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
  } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // If user is already authenticated, redirect them to their dashboard
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const switchMode = (newMode) => {
    clearMessages();
    setMode(newMode);
  };

  /* ── 1. Google Sign-In ── */
  const handleGoogleSignIn = async () => {
    clearMessages();
    setSubmitting(true);
    try {
      await signInWithGoogle();
      setSuccessMsg('Successfully signed in! Taking you to your planner...');
      router.push('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in was not completed.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 2. Email Sign-In / Sign-Up / Forgot Password ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    // Forgot password flow
    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address to receive a password reset link.');
        return;
      }
      setSubmitting(true);
      try {
        await resetPassword(email);
        setSuccessMsg(`Password reset instructions have been sent to ${email}. Check your inbox!`);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Sign up validation
    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify.');
        return;
      }
      setSubmitting(true);
      try {
        await signUpWithEmail(email, password, displayName);
        setSuccessMsg('Account created successfully! Taking you to your planner...');
        router.push('/dashboard');
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Sign in flow
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      setSuccessMsg('Welcome back! Loading your planner...');
      router.push('/dashboard');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // If checking existing session, show a clean loading pulse
  if (authLoading) {
    return (
      <div className="auth-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <div className="auth-spinner" style={{ width: 28, height: 28, borderColor: 'var(--color-primary)' }} />
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-secondary)' }}>
          Checking authentication session...
        </p>
      </div>
    );
  }

  // If already authenticated
  if (user) {
    return (
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-logo-badge">✦</div>
        <h2 className="auth-title">Welcome back!</h2>
        <p className="auth-subtitle">Signed in as {user.email}</p>
        <button
          className="btn btn-primary btn-auth-submit"
          onClick={() => router.push('/dashboard')}
        >
          Open Your Planner →
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card">
      {/* Brand Header */}
      <div className="auth-header">
        <div className="auth-logo-badge">✦</div>
        <h1 className="auth-title">
          {mode === 'signin'
            ? 'Sign in to My Planner'
            : mode === 'signup'
            ? 'Create Your Account'
            : 'Reset Your Password'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'forgot'
            ? 'Enter your email to receive a password recovery link'
            : 'Plan your day, track your habits, and stay calm.'}
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="auth-alert-error" role="alert">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="auth-alert-success" role="status">
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mode navigation tabs (hidden in forgot-password mode) */}
      {mode !== 'forgot' && (
        <>
          {/* Google Sign-in */}
          <button
            type="button"
            className="btn-google-auth"
            onClick={handleGoogleSignIn}
            disabled={submitting}
          >
            <svg className="google-icon-svg" viewBox="0 0 24 24">
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
            <span>
              {submitting ? 'Connecting...' : 'Continue with Google'}
            </span>
          </button>

          <div className="auth-separator">
            <span>or with email</span>
          </div>

          <div className="auth-nav-tabs">
            <button
              type="button"
              className={`auth-nav-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => switchMode('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-nav-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Create Account
            </button>
          </div>
        </>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="auth-form-group">
        {mode === 'signup' && (
          <div className="auth-input-block">
            <label className="auth-input-label" htmlFor="auth-name">
              Full Name
            </label>
            <input
              id="auth-name"
              type="text"
              placeholder="e.g. Alex Smith"
              className="auth-text-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="auth-input-block">
          <label className="auth-input-label" htmlFor="auth-email">
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            placeholder="you@example.com"
            className="auth-text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        {mode !== 'forgot' && (
          <div className="auth-input-block">
            <div className="auth-input-label-row">
              <label className="auth-input-label" htmlFor="auth-password">
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => switchMode('forgot')}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              className="auth-text-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
        )}

        {mode === 'signup' && (
          <div className="auth-input-block">
            <label className="auth-input-label" htmlFor="auth-confirm-password">
              Confirm Password
            </label>
            <input
              id="auth-confirm-password"
              type="password"
              placeholder="••••••••"
              className="auth-text-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-auth-submit"
          disabled={submitting}
        >
          {submitting && <span className="auth-spinner" />}
          <span>
            {submitting
              ? mode === 'signin'
                ? 'Signing in...'
                : mode === 'signup'
                ? 'Creating account...'
                : 'Sending reset link...'
              : mode === 'signin'
              ? 'Sign In to Planner'
              : mode === 'signup'
              ? 'Create Free Account'
              : 'Send Reset Link'}
          </span>
        </button>

        {mode === 'forgot' && (
          <button
            type="button"
            className="auth-forgot-link"
            style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}
            onClick={() => switchMode('signin')}
          >
            ← Back to Sign In
          </button>
        )}
      </form>

      {/* Firebase Setup Status Card & Guest Mode */}
      {!isConfigured ? (
        <div className="firebase-setup-box">
          <div className="firebase-setup-title">
            <span>⚙️</span> Firebase Setup Pending
          </div>
          <p style={{ marginBottom: 'var(--space-2)' }}>
            To activate real cloud sign-in, add your 6 keys from Firebase Console to <code>.env.local</code>.
          </p>
          <ol className="firebase-setup-steps">
            <li>Create free project at <b>console.firebase.google.com</b></li>
            <li>Enable <b>Google</b> & <b>Email/Password</b> in Authentication</li>
            <li>Copy Web app config keys into <code>.env.local</code></li>
          </ol>
          <button
            type="button"
            className="btn-guest-bypass"
            onClick={() => router.push('/dashboard')}
          >
            Or explore planner now in Guest / Demo Mode →
          </button>
        </div>
      ) : (
        <div className="auth-card-footer">
          <span>🔒 100% Free Forever • Firebase Spark Plan • Private to your account</span>
        </div>
      )}
    </div>
  );
}
