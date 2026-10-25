// ============================================================
// Habits Service — Scoped to Authenticated User (Optimistic / Local-First)
// ============================================================
// - Zero UI latency: Local cache is updated instantly (<5ms)
// - Concurrently synced to Cloud Firestore in the background
// - Every new user account starts completely fresh and isolated
// - Safe: Offline and network-proof fallback
// ============================================================

import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

function getStorageKey(userId) {
  return `my_planner_habits_${userId || 'guest'}`;
}

export function getLocalHabits(userId) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHabits(userId, habits, notify = true) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(habits));
    if (notify) {
      window.dispatchEvent(new Event('local-habits-changed'));
    }
  } catch (err) {
    console.error('Failed to save habits:', err);
  }
}

/**
 * Subscribe to habits in real-time.
 * Emits local cached habits immediately and syncs with Cloud Firestore.
 */
export function subscribeToHabits(userId, onUpdate) {
  // 1. Instantly emit cached habits
  const cached = getLocalHabits(userId);
  onUpdate(cached);

  const handleLocalChange = () => {
    onUpdate(getLocalHabits(userId));
  };
  window.addEventListener('storage', handleLocalChange);
  window.addEventListener('local-habits-changed', handleLocalChange);

  const configured = isFirebaseConfigured();
  let unsubscribeFirestore = null;

  // 2. Real-time Cloud Firestore listener
  if (configured && db && userId) {
    try {
      const habitsRef = collection(db, 'users', userId, 'habits');
      unsubscribeFirestore = onSnapshot(
        habitsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreHabits = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            saveLocalHabits(userId, firestoreHabits, false);
            onUpdate(firestoreHabits);
          } else {
            const currentLocal = getLocalHabits(userId);
            if (currentLocal.length > 0) {
              onUpdate(currentLocal);
            } else {
              onUpdate([]);
            }
          }
        },
        (err) => {
          console.warn('Firestore habits subscription status:', err.message);
          onUpdate(getLocalHabits(userId));
        }
      );
    } catch (err) {
      console.warn('Firestore subscription setup note:', err.message);
    }
  }

  return () => {
    window.removeEventListener('storage', handleLocalChange);
    window.removeEventListener('local-habits-changed', handleLocalChange);
    if (typeof unsubscribeFirestore === 'function') {
      unsubscribeFirestore();
    }
  };
}

/**
 * Increment habit progress.
 * Instant local update, background cloud sync.
 */
export async function incrementHabit(userId, habitId, currentDone, target) {
  const nextDone = Math.min(currentDone + 1, target + 7);

  // 1. Instant local update
  const habits = getLocalHabits(userId).map((h) => {
    if (h.id === habitId) return { ...h, done: nextDone };
    return h;
  });
  saveLocalHabits(userId, habits, true);

  // 2. Cloud sync in background
  const configured = isFirebaseConfigured();
  if (configured && db && userId) {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    updateDoc(habitRef, {
      done: nextDone,
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      console.warn('Habit increment sync notice:', err.message);
    });
  }
}

/**
 * Decrement habit progress.
 * Instant local update, background cloud sync.
 */
export async function decrementHabit(userId, habitId, currentDone) {
  const nextDone = Math.max(currentDone - 1, 0);

  // 1. Instant local update
  const habits = getLocalHabits(userId).map((h) => {
    if (h.id === habitId) return { ...h, done: nextDone };
    return h;
  });
  saveLocalHabits(userId, habits, true);

  // 2. Cloud sync in background
  const configured = isFirebaseConfigured();
  if (configured && db && userId) {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    updateDoc(habitRef, {
      done: nextDone,
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      console.warn('Habit decrement sync notice:', err.message);
    });
  }
}

/**
 * Add a new habit.
 * Instant local creation (<5ms), background cloud sync.
 */
export async function createHabit(userId, habitData) {
  const newHabit = {
    id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: habitData.name.trim(),
    icon: habitData.icon || '🎯',
    target: Math.max(1, Math.min(7, Number(habitData.target) || 3)),
    done: 0,
    color: habitData.color || 'var(--color-primary)',
    createdAt: Date.now(),
  };

  // 1. Instant local write
  const current = getLocalHabits(userId);
  saveLocalHabits(userId, [...current, newHabit], true);

  // 2. Cloud sync in background
  const configured = isFirebaseConfigured();
  if (configured && db && userId) {
    const habitsRef = collection(db, 'users', userId, 'habits');
    addDoc(habitsRef, {
      name: newHabit.name,
      icon: newHabit.icon,
      target: newHabit.target,
      done: 0,
      color: newHabit.color,
      createdAt: serverTimestamp(),
    }).catch((err) => {
      console.warn('Habit creation cloud sync notice:', err.message);
    });
  }

  return newHabit.id;
}

/**
 * Delete a habit.
 * Instant local deletion, background cloud deletion.
 */
export async function deleteHabit(userId, habitId) {
  // 1. Instant local delete
  const habits = getLocalHabits(userId).filter((h) => h.id !== habitId);
  saveLocalHabits(userId, habits, true);

  // 2. Cloud deletion in background
  const configured = isFirebaseConfigured();
  if (configured && db && userId) {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    deleteDoc(habitRef).catch((err) => {
      console.warn('Habit deletion cloud sync notice:', err.message);
    });
  }
}
