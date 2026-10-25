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
  signOut,
  updateProfile,
} from 'firebase/auth';

const AuthContext = createContext({
  user: null,
  loading: true,
  isConfigured: false,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
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
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [configured]);

  const clearError = () => setError(null);

  const signInWithGoogle = async () => {
    clearError();
    if (!configured || !auth || !googleProvider) {
      setError('Firebase is not yet configured. Please set your credentials in .env.local.');
      return;
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Google Sign-in error:', err);
      setError(err.message);
      throw err;
    }
  };

  const signInWithEmail = async (email, password) => {
    clearError();
    if (!configured || !auth) {
      setError('Firebase is not yet configured. Please set your credentials in .env.local.');
      return;
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      console.error('Email sign-in error:', err);
      setError(err.message);
      throw err;
    }
  };

  const signUpWithEmail = async (email, password, displayName = '') => {
    clearError();
    if (!configured || !auth) {
      setError('Firebase is not yet configured. Please set your credentials in .env.local.');
      return;
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }
      return result.user;
    } catch (err) {
      console.error('Sign-up error:', err);
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    clearError();
    if (!configured || !auth) return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
      setError(err.message);
      throw err;
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
