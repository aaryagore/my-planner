'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks, toggleTaskComplete } from '@/lib/tasksService';
import { subscribeToHabits } from '@/lib/habitsService';
import TaskModal from '@/components/TaskModal';
import './dashboard.css';

/* ── Sample schedule & upcoming ── */
const SAMPLE_TIME_BLOCKS = [
  { time: '09:00', title: 'Deep work session',       duration: '2h', color: 'var(--color-primary)' },
  { time: '11:00', title: null },
  { time: '12:00', title: 'Lunch & recharge',         duration: '1h', color: 'var(--color-accent)' },
  { time: '13:00', title: 'Review & research',        duration: '1.5h', color: 'var(--color-warning)' },
  { time: '14:30', title: null },
  { time: '15:00', title: 'Team / Study sync',        duration: '1h', color: 'var(--color-primary)' },
  { time: '16:00', title: null },
];

const SAMPLE_UPCOMING = [
  { text: 'Project milestone deadline',  date: 'Tomorrow',  color: 'var(--color-danger)' },
  { text: 'Study group presentation',    date: 'Wed',       color: 'var(--color-primary)' },
  { text: 'Review notes Ch. 4–6',        date: 'Fri',       color: 'var(--color-warning)' },
  { text: 'Weekly retrospective',        date: 'Sunday',    color: 'var(--color-accent)' },
];

/* ── Priority badge helper ───────────────────────────────── */
const priorityBadge = (p) => {
  const map = {
    urgent:    { className: 'badge badge-danger',  label: 'Urgent' },
    important: { className: 'badge badge-warning', label: 'Important' },
    optional:  { className: 'badge badge-accent',  label: 'Optional' },
  };
  const b = map[p] || map.important;
  return <span className={b.className}>{b.label}</span>;
};

/* ── Dashboard page ──────────────────────────────────────── */
export default function DashboardPage() {
  const { user, isConfigured } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setDateStr(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    );
  }, []);

  // Subscribe to real tasks
  useEffect(() => {
    const unsubscribe = subscribeToTasks(user?.uid, (allTasks) => {
      setTasks(allTasks);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  // Subscribe to habits
  useEffect(() => {
    const unsubscribe = subscribeToHabits(user?.uid, (allHabits) => {
      setHabits(allHabits);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  // Derive Top 3 items: either pinned or top uncompleted items
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const habitsAchieved = habits.filter((h) => h.done >= h.target).length;

  const topThreeList = (() => {
    const pinned = activeTasks.filter((t) => t.isTopThree);
    const unpinned = activeTasks.filter((t) => !t.isTopThree);
    const combined = [...pinned, ...unpinned];
    return combined.slice(0, 3);
  })();

  const userDisplayName = user?.displayName
    ? user.displayName.split(' ')[0]
    : user?.email
    ? user.email.split('@')[0]
    : null;

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="dashboard-greeting">
        <h1>
          {greeting ? `${greeting}${userDisplayName ? `, ${userDisplayName}` : ''}` : '\u00A0'}{' '}
          <span className="wave">👋</span>
        </h1>
        <p>Here&apos;s your focus and schedule for today.</p>
        <div className="dashboard-date">{dateStr || '\u00A0'}</div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <button
          className="quick-action-btn"
          onClick={() => setIsTaskModalOpen(true)}
        >
          <span className="quick-action-icon">＋</span>
          <span>Add task</span>
        </button>
        <Link href="/focus" className="quick-action-btn">
          <span className="quick-action-icon">⏱</span>
          <span>Start focus</span>
        </Link>
        <Link href="/inbox" className="quick-action-btn">
          <span className="quick-action-icon">📥</span>
          <span>Open inbox</span>
        </Link>
      </div>

      {/* Live Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{activeTasks.length}</div>
          <div className="stat-label">Active Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedTasks.length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">2h 15m</div>
          <div className="stat-label">Focus time</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{habits.length ? `${habitsAchieved}/${habits.length}` : '0/0'}</div>
          <div className="stat-label">Habits Met</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        {/* ── Top 3 Priorities ── */}
        <div className="card dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">⭐</span>
              Today&apos;s Top 3
            </h2>
            <Link href="/inbox" className="btn btn-ghost">
              View all
            </Link>
          </div>

          {topThreeList.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-5)' }}>
              <p className="empty-state-text">
                No active priorities right now. Add a task and pin it to your Top 3.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setIsTaskModalOpen(true)}
              >
                ＋ Add priority task
              </button>
            </div>
          ) : (
            <div className="top-three-list">
              {topThreeList.map((item, i) => (
                <div className="top-three-item" key={item.id}>
                  <button
                    type="button"
                    className="top-three-number"
                    onClick={() =>
                      toggleTaskComplete(user?.uid, item.id, item.completed)
                    }
                    title="Click to mark completed"
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    {i + 1}
                  </button>
                  <span className="top-three-text">{item.text}</span>
                  <span className="top-three-badge">
                    {priorityBadge(item.priority)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Time Blocks ── */}
        <div className="card dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🕐</span>
              Today&apos;s Schedule
            </h2>
            <Link href="/calendar" className="btn btn-ghost">
              Calendar
            </Link>
          </div>
          <div className="time-blocks">
            {SAMPLE_TIME_BLOCKS.map((block, i) => (
              <div className="time-block" key={i}>
                <div className="time-block-time">{block.time}</div>
                <div
                  className="time-block-bar"
                  style={{ background: block.title ? block.color : 'transparent' }}
                />
                {block.title ? (
                  <div className="time-block-content">
                    <div className="time-block-title">{block.title}</div>
                    {block.duration && (
                      <div className="time-block-meta">{block.duration}</div>
                    )}
                  </div>
                ) : (
                  <Link href="/calendar" className="time-block-empty">
                    + Plan time block
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Habits ── */}
        <div className="card dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🎯</span>
              Habits This Week
            </h2>
            <Link href="/habits" className="btn btn-ghost">
              See all
            </Link>
          </div>
          <div className="habits-mini">
            {habits.slice(0, 4).map((habit) => (
              <div className="habit-mini-item" key={habit.id}>
                <span className="habit-mini-icon">{habit.icon}</span>
                <div className="habit-mini-info">
                  <div className="habit-mini-name">{habit.name}</div>
                  <div className="habit-mini-progress">
                    {habit.done}/{habit.target} this week
                  </div>
                </div>
                <div className="habit-mini-bar-track">
                  <div
                    className="habit-mini-bar-fill"
                    style={{
                      width: `${Math.min((habit.done / habit.target) * 100, 100)}%`,
                      background: habit.color || 'var(--color-primary)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Upcoming ── */}
        <div className="card dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">📆</span>
              Coming Up
            </h2>
            <Link href="/calendar" className="btn btn-ghost">
              Calendar
            </Link>
          </div>
          <div className="upcoming-list">
            {SAMPLE_UPCOMING.map((item, i) => (
              <div className="upcoming-item" key={i}>
                <div
                  className="upcoming-dot"
                  style={{ background: item.color }}
                />
                <span className="upcoming-text">{item.text}</span>
                <span className="upcoming-date">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cloud sync status banner */}
      <div className="sample-notice">
        <span className="sample-notice-icon">
          {isConfigured ? '☁️' : '💾'}
        </span>
        {isConfigured
          ? user
            ? `Syncing live with Cloud Firestore for ${user.email} (Spark Free Tier)`
            : 'Sign in from the sidebar to sync your tasks across devices'
          : 'Running in offline demo mode. Connect Firebase to enable cross-device cloud sync.'}
      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
}
