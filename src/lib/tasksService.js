// ============================================================
// Tasks Service — Scoped to Authenticated User
// ============================================================
// - Every new user account starts completely fresh and clean (0 tasks).
// - Authenticated tasks are scoped exclusively to users/{uid}/tasks.
// - Private and isolated per user.
// ============================================================

import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

function getStorageKey(userId) {
  return `my_planner_tasks_${userId || 'guest'}`;
}

export function getLocalTasks(userId) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTasks(userId, tasks) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(tasks));
    window.dispatchEvent(new Event('local-tasks-changed'));
  } catch (err) {
    console.error('Failed to save tasks:', err);
  }
}

/**
 * Subscribe to tasks (real-time).
 * Scoped strictly to the authenticated user. Every new account starts at [].
 */
export function subscribeToTasks(userId, onUpdate) {
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate([]);
          return;
        }
        const tasks = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        onUpdate(tasks);
      },
      (err) => {
        console.warn('Firestore tasks subscription status:', err.message);
        // Fallback to user-scoped local storage on network/permission error
        onUpdate(getLocalTasks(userId));
      }
    );
  }

  // If user is unauthenticated or in local demo mode, read only user's scoped tasks
  onUpdate(getLocalTasks(userId));

  const handleUpdate = () => {
    onUpdate(getLocalTasks(userId));
  };

  window.addEventListener('storage', handleUpdate);
  window.addEventListener('local-tasks-changed', handleUpdate);

  return () => {
    window.removeEventListener('storage', handleUpdate);
    window.removeEventListener('local-tasks-changed', handleUpdate);
  };
}

/**
 * Create a new task
 */
export async function createTask(userId, taskData) {
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const docRef = await addDoc(tasksRef, {
      text: taskData.text.trim(),
      description: taskData.description?.trim() || '',
      priority: taskData.priority || 'important',
      dueDate: taskData.dueDate || null,
      isTopThree: Boolean(taskData.isTopThree),
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null,
    });
    return docRef.id;
  }

  // Scoped local storage
  const current = getLocalTasks(userId);
  const newTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    text: taskData.text.trim(),
    description: taskData.description?.trim() || '',
    priority: taskData.priority || 'important',
    dueDate: taskData.dueDate || null,
    isTopThree: Boolean(taskData.isTopThree),
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completedAt: null,
  };

  saveLocalTasks(userId, [newTask, ...current]);
  return newTask.id;
}

/**
 * Toggle task completed status
 */
export async function toggleTaskComplete(userId, taskId, currentCompleted) {
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, {
      completed: !currentCompleted,
      completedAt: !currentCompleted ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const tasks = getLocalTasks(userId).map((t) => {
    if (t.id === taskId) {
      const nextCompleted = !currentCompleted;
      return {
        ...t,
        completed: nextCompleted,
        completedAt: nextCompleted ? Date.now() : null,
        updatedAt: Date.now(),
      };
    }
    return t;
  });
  saveLocalTasks(userId, tasks);
}

/**
 * Delete a task
 */
export async function deleteTask(userId, taskId) {
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
    return;
  }

  const tasks = getLocalTasks(userId).filter((t) => t.id !== taskId);
  saveLocalTasks(userId, tasks);
}
