// ============================================================
// Habits Service — Scoped to Authenticated User
// ============================================================
// - Every new user account starts completely fresh (0 habits).
// - Habits are stored in users/{uid}/habits in Firestore.
// - Private and isolated per user.
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

function saveLocalHabits(userId, habits) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(habits));
    window.dispatchEvent(new Event('local-habits-changed'));
  } catch (err) {
    console.error('Failed to save habits:', err);
  }
}

/**
 * Subscribe to habits in real-time.
 * Every new account starts at [].
 */
export function subscribeToHabits(userId, onUpdate) {
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const habitsRef = collection(db, 'users', userId, 'habits');

    return onSnapshot(
      habitsRef,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate([]);
          return;
        }
        const habits = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        onUpdate(habits);
      },
      (err) => {
        console.warn('Firestore habits subscription status:', err.message);
        onUpdate(getLocalHabits(userId));
      }
    );
  }

  // Scoped local storage
  onUpdate(getLocalHabits(userId));

  const handleUpdate = () => {
    onUpdate(getLocalHabits(userId));
  };

  window.addEventListener('storage', handleUpdate);
  window.addEventListener('local-habits-changed', handleUpdate);

  return () => {
    window.removeEventListener('storage', handleUpdate);
    window.removeEventListener('local-habits-changed', handleUpdate);
  };
}

/**
 * Increment habit progress
 */
export async function incrementHabit(userId, habitId, currentDone, target) {
  const nextDone = Math.min(currentDone + 1, target + 7);
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    await updateDoc(habitRef, {
      done: nextDone,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const habits = getLocalHabits(userId).map((h) => {
    if (h.id === habitId) return { ...h, done: nextDone };
    return h;
  });
  saveLocalHabits(userId, habits);
}

/**
 * Decrement habit progress
 */
export async function decrementHabit(userId, habitId, currentDone) {
  const nextDone = Math.max(currentDone - 1, 0);
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    await updateDoc(habitRef, {
      done: nextDone,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const habits = getLocalHabits(userId).map((h) => {
    if (h.id === habitId) return { ...h, done: nextDone };
    return h;
  });
  saveLocalHabits(userId, habits);
}

/**
 * Add a new habit
 */
export async function createHabit(userId, habitData) {
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const habitsRef = collection(db, 'users', userId, 'habits');
    const docRef = await addDoc(habitsRef, {
      name: habitData.name.trim(),
      icon: habitData.icon || '🎯',
      target: Number(habitData.target) || 3,
      done: 0,
      color: habitData.color || 'var(--color-primary)',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  const current = getLocalHabits(userId);
  const newHabit = {
    id: `habit_${Date.now()}`,
    name: habitData.name.trim(),
    icon: habitData.icon || '🎯',
    target: Number(habitData.target) || 3,
    done: 0,
    color: habitData.color || 'var(--color-primary)',
  };

  saveLocalHabits(userId, [...current, newHabit]);
  return newHabit.id;
}

/**
 * Delete a habit
 */
export async function deleteHabit(userId, habitId) {
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    await deleteDoc(habitRef);
    return;
  }

  const habits = getLocalHabits(userId).filter((h) => h.id !== habitId);
  saveLocalHabits(userId, habits);
}
