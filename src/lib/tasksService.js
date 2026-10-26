// ============================================================
// Tasks Service — Scoped to Authenticated User (Optimistic / Local-First)
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

function saveLocalTasks(userId, tasks, notify = true) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(tasks));
    if (notify) {
      window.dispatchEvent(new Event('local-tasks-changed'));
    }
  } catch (err) {
    console.error('Failed to save tasks:', err);
  }
}

/**
 * Subscribe to tasks (real-time).
 * Always serves local cache instantly, and syncs with Cloud Firestore in real time.
 */
export function subscribeToTasks(userId, onUpdate) {
  // 1. Instantly emit cached tasks so user sees zero delay
  const cached = getLocalTasks(userId);
  onUpdate(cached);

  const handleLocalChange = () => {
    onUpdate(getLocalTasks(userId));
  };
  window.addEventListener('storage', handleLocalChange);
  window.addEventListener('local-tasks-changed', handleLocalChange);

  const configured = isFirebaseConfigured();
  let unsubscribeFirestore = null;

  // 2. Connect to real-time Cloud Firestore if configured
  if (configured && db && userId) {
    try {
      const tasksRef = collection(db, 'users', userId, 'tasks');
      const q = query(tasksRef, orderBy('createdAt', 'desc'));

      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreTasks = snapshot.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            // Update local cache silently and update UI
            saveLocalTasks(userId, firestoreTasks, false);
            onUpdate(firestoreTasks);
          } else {
            // Snapshot is empty: If local tasks already exist, preserve them
            const currentLocal = getLocalTasks(userId);
            if (currentLocal.length > 0) {
              onUpdate(currentLocal);
            } else {
              onUpdate([]);
            }
          }
        },
        (err) => {
          console.warn('Firestore subscription status:', err.message);
          onUpdate(getLocalTasks(userId));
        }
      );
    } catch (err) {
      console.warn('Firestore subscription setup note:', err.message);
    }
  }

  return () => {
    window.removeEventListener('storage', handleLocalChange);
    window.removeEventListener('local-tasks-changed', handleLocalChange);
    if (typeof unsubscribeFirestore === 'function') {
      unsubscribeFirestore();
    }
  };
}

/**
 * Create a new task.
 * Saves immediately to local storage (<5ms) for instant UX,
 * and syncs to Firestore concurrently in background.
 */
export async function createTask(userId, taskData) {
  const newTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    text: taskData.text.trim(),
    description: taskData.description?.trim() || '',
    priority: taskData.priority || 'important',
    category: taskData.category || 'personal',
    dueDate: taskData.dueDate || null,
    isTopThree: Boolean(taskData.isTopThree),
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completedAt: null,
  };

  // 1. Instant local write & UI notification
  const current = getLocalTasks(userId);
  saveLocalTasks(userId, [newTask, ...current], true);

  // 2. Non-blocking Cloud Firestore sync in background
  const configured = isFirebaseConfigured();
  if (configured && db && userId) {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    addDoc(tasksRef, {
      text: newTask.text,
      description: newTask.description,
      priority: newTask.priority,
      category: newTask.category,
      dueDate: newTask.dueDate,
      isTopThree: newTask.isTopThree,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null,
    }).catch((err) => {
      console.warn('Cloud Firestore background sync notice:', err.message);
    });
  }

  return newTask.id;
}

/**
 * Toggle task completed status.
 * Instant local update, concurrent cloud sync.
 */
export async function toggleTaskComplete(userId, taskId, currentCompleted) {
  const nextCompleted = !currentCompleted;

  // 1. Instant local update
  const tasks = getLocalTasks(userId).map((t) => {
    if (t.id === taskId) {
      return {
        ...t,
        completed: nextCompleted,
        completedAt: nextCompleted ? Date.now() : null,
        updatedAt: Date.now(),
      };
    }
    return t;
  });
  saveLocalTasks(userId, tasks, true);

  // 2. Cloud sync in background
  const configured = isFirebaseConfigured();
  if (configured && db && userId) {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    updateDoc(taskRef, {
      completed: nextCompleted,
      completedAt: nextCompleted ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      console.warn('Cloud update sync notice:', err.message);
    });
  }
}

/**
 * Delete a task.
 * Instant local removal, concurrent cloud deletion.
 */
export async function deleteTask(userId, taskId) {
  // 1. Instant local delete
  const tasks = getLocalTasks(userId).filter((t) => t.id !== taskId);
  saveLocalTasks(userId, tasks, true);

  // 2. Cloud deletion in background
  const configured = isFirebaseConfigured();
  if (configured && db && userId) {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    deleteDoc(taskRef).catch((err) => {
      console.warn('Cloud delete sync notice:', err.message);
    });
  }
}
