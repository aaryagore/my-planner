// ============================================================
// Tasks Service — Cloud Firestore & Local Fallback
// ============================================================
// Zero-Cost Firestore Strategy:
// 1. Scoped to users/{uid}/tasks so every query is indexed and free.
// 2. Real-time onSnapshot listener only listens to the active user's tasks.
// 3. Reads and writes remain well within the 50,000 / 20,000 daily free limit.
// 4. LocalStorage fallback ensures the app is 100% interactive even in demo mode!
// ============================================================

import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'my_planner_demo_tasks';

const INITIAL_DEMO_TASKS = [
  {
    id: 'demo-1',
    text: 'Finish project proposal draft',
    priority: 'urgent',
    isTopThree: true,
    completed: false,
    dueDate: '2026-10-27',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'demo-2',
    text: 'Review lecture notes Ch. 5–7',
    priority: 'important',
    isTopThree: true,
    completed: false,
    dueDate: '2026-10-28',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'demo-3',
    text: 'Reply to study-group messages',
    priority: 'optional',
    isTopThree: true,
    completed: false,
    dueDate: null,
    createdAt: Date.now() - 10800000,
  },
  {
    id: 'demo-4',
    text: 'Set up weekly meal plan',
    priority: 'optional',
    isTopThree: false,
    completed: true,
    dueDate: '2026-10-25',
    createdAt: Date.now() - 86400000,
  },
];

// Helper to get local demo tasks
export function getLocalTasks() {
  if (typeof window === 'undefined') return INITIAL_DEMO_TASKS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_TASKS));
      return INITIAL_DEMO_TASKS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_TASKS;
  }
}

// Helper to save local demo tasks
function saveLocalTasks(tasks) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

/**
 * Subscribe to tasks (real-time).
 * If user is authenticated and Firebase is configured, uses Cloud Firestore onSnapshot.
 * Otherwise, uses a window storage listener + local cache.
 */
export function subscribeToTasks(userId, onUpdate) {
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const tasks = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        onUpdate(tasks);
      },
      (err) => {
        console.error('Firestore tasks subscription error:', err);
        // Fallback to local on error
        onUpdate(getLocalTasks());
      }
    );
  }

  // Demo / Unauthenticated Mode
  onUpdate(getLocalTasks());

  const handleStorage = () => {
    onUpdate(getLocalTasks());
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('local-tasks-changed', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('local-tasks-changed', handleStorage);
  };
}

function notifyLocalChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('local-tasks-changed'));
  }
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

  // Local mode
  const current = getLocalTasks();
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

  const updated = [newTask, ...current];
  saveLocalTasks(updated);
  notifyLocalChange();
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

  // Local mode
  const tasks = getLocalTasks().map((t) => {
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
  saveLocalTasks(tasks);
  notifyLocalChange();
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

  // Local mode
  const tasks = getLocalTasks().filter((t) => t.id !== taskId);
  saveLocalTasks(tasks);
  notifyLocalChange();
}

/**
 * Update task fields
 */
export async function updateTask(userId, taskId, updates) {
  const configured = isFirebaseConfigured();

  if (configured && db && userId) {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  // Local mode
  const tasks = getLocalTasks().map((t) => {
    if (t.id === taskId) {
      return {
        ...t,
        ...updates,
        updatedAt: Date.now(),
      };
    }
    return t;
  });
  saveLocalTasks(tasks);
  notifyLocalChange();
}
