'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
} from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth';

/**
 * Translate technical Firebase error codes into friendly, actionable explanations.
 */
export function translateAuthError(error) {
  if (!error) return null;
  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account exists with this email address. Please click "Create account" to register.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or use the "Forgot password?" link below.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please double check and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Console. Go to Authentication → Settings → Authorized domains and ensure "localhost" is listed.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Console. Go to Authentication → Sign-in method to enable Google or Email/Password.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Account access is temporarily locked. Reset your password or wait a few minutes.';
    default:
      if (message.includes('API key not valid')) {
        return 'Firebase API key in .env.local is not valid. Please verify your Project Settings in Firebase Console.';
      }
      return message || 'Authentication failed. Please try again.';
  }
}

const AuthContext = createContext({
  user: null,
  loading: true,
  isConfigured: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
  error: null,
  clearError: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state listener error:', err);
        setError(translateAuthError(err));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [configured]);

  const clearError = () => setError(null);

  const signInWithGoogle = async () => {
    clearError();
    if (!configured || !auth || !googleProvider) {
      const msg = 'Firebase is not yet configured. Please add your credentials to .env.local.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Google Sign-in error:', err);
      const friendly = translateAuthError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const signInWithEmail = async (email, password) => {
    clearError();
    if (!configured || !auth) {
      const msg = 'Firebase is not yet configured. Please add your credentials to .env.local.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      return result.user;
    } catch (err) {
      console.error('Email sign-in error:', err);
      const friendly = translateAuthError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const signUpWithEmail = async (email, password, displayName = '') => {
    clearError();
    if (!configured || !auth) {
      const msg = 'Firebase is not yet configured. Please add your credentials to .env.local.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      return result.user;
    } catch (err) {
      console.error('Sign-up error:', err);
      const friendly = translateAuthError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const resetPassword = async (email) => {
    clearError();
    if (!configured || !auth) {
      const msg = 'Firebase is not yet configured. Please add your credentials to .env.local.';
      setError(msg);
      throw new Error(msg);
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (err) {
      console.error('Password reset error:', err);
      const friendly = translateAuthError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  };

  const logout = async () => {
    clearError();
    if (!configured || !auth) return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
      const friendly = translateAuthError(err);
      setError(friendly);
      throw new Error(friendly);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: configured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
