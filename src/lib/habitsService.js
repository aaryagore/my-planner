// ============================================================
// Habits Service — Weekly Consistency Tracking ($0 Free Tier)
// ============================================================
// Scoped to users/{uid}/habits in Firestore with localStorage fallback.
// Tracks weekly target frequencies rather than high-stress streaks.
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

const LOCAL_HABITS_KEY = 'my_planner_demo_habits';

const INITIAL_HABITS = [
  {
    id: 'habit-1',
    name: 'Exercise / Workout',
    icon: '🏃',
    target: 3,
    done: 2,
    color: 'var(--color-accent)',
  },
  {
    id: 'habit-2',
    name: 'Reading (20 mins)',
    icon: '📖',
    target: 5,
    done: 4,
    color: 'var(--color-primary)',
  },
  {
    id: 'habit-3',
    name: 'Daily Hydration (2.5L)',
    icon: '💧',
    target: 7,
    done: 6,
    color: 'var(--color-warning)',
  },
  {
    id: 'habit-4',
    name: 'Evening Meditation',
    icon: '🧘',
    target: 4,
    done: 2,
    color: 'var(--color-danger)',
  },
];

export function getLocalHabits() {
  if (typeof window === 'undefined') return INITIAL_HABITS;
  try {
    const raw = localStorage.getItem(LOCAL_HABITS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(INITIAL_HABITS));
      return INITIAL_HABITS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_HABITS;
  }
}

function saveLocalHabits(habits) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(habits));
    window.dispatchEvent(new Event('local-habits-changed'));
  } catch (err) {
    console.error('Failed to save habits to localStorage:', err);
  }
}

/**
 * Subscribe to habits in real-time
 */
export function subscribeToHabits(userId, onUpdate) {
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const habitsRef = collection(db, 'users', userId, 'habits');

    return onSnapshot(
      habitsRef,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty for a new user, return local initial habits
          onUpdate(getLocalHabits());
          return;
        }
        const habits = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        onUpdate(habits);
      },
      (err) => {
        console.error('Firestore habits subscription error:', err);
        onUpdate(getLocalHabits());
      }
    );
  }

  // Local mode
  onUpdate(getLocalHabits());

  const handleUpdate = () => {
    onUpdate(getLocalHabits());
  };

  window.addEventListener('storage', handleUpdate);
  window.addEventListener('local-habits-changed', handleUpdate);

  return () => {
    window.removeEventListener('storage', handleUpdate);
    window.removeEventListener('local-habits-changed', handleUpdate);
  };
}

/**
 * Increment habit progress for the current week
 */
export async function incrementHabit(userId, habitId, currentDone, target) {
  const nextDone = Math.min(currentDone + 1, target + 7); // Allow slight surplus
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const habitRef = doc(db, 'users', userId, 'habits', habitId);
    await updateDoc(habitRef, {
      done: nextDone,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const habits = getLocalHabits().map((h) => {
    if (h.id === habitId) return { ...h, done: nextDone };
    return h;
  });
  saveLocalHabits(habits);
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

  const habits = getLocalHabits().map((h) => {
    if (h.id === habitId) return { ...h, done: nextDone };
    return h;
  });
  saveLocalHabits(habits);
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

  const current = getLocalHabits();
  const newHabit = {
    id: `habit_${Date.now()}`,
    name: habitData.name.trim(),
    icon: habitData.icon || '🎯',
    target: Number(habitData.target) || 3,
    done: 0,
    color: habitData.color || 'var(--color-primary)',
  };

  saveLocalHabits([...current, newHabit]);
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

  const habits = getLocalHabits().filter((h) => h.id !== habitId);
  saveLocalHabits(habits);
}
