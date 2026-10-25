'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks, toggleTaskComplete } from '@/lib/tasksService';
import { subscribeToHabits } from '@/lib/habitsService';
import TaskModal from '@/components/TaskModal';
import LinkifiedText from '@/components/LinkifiedText';
import './dashboard.css';

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

export default function DashboardPage() {
  const { user, isConfigured } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [focusTimeMins, setFocusTimeMins] = useState(0);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Greet user based on client time
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

  // Subscribe to real habits
  useEffect(() => {
    const unsubscribe = subscribeToHabits(user?.uid, (allHabits) => {
      setHabits(allHabits);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  // Read schedule slots (scoped to active user)
  useEffect(() => {
    // Purge any old legacy keys from previous steps
    try {
      localStorage.removeItem('my_planner_schedule_slots');
      localStorage.removeItem('my_planner_demo_habits');
      localStorage.removeItem('my_planner_demo_tasks');
    } catch {}

    const key = `my_planner_schedule_${user?.uid || 'guest'}`;
    const loadSchedule = () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) setScheduleSlots(JSON.parse(raw));
        else setScheduleSlots([]);
      } catch (e) {
        setScheduleSlots([]);
      }
    };

    loadSchedule();
    window.addEventListener('schedule-slots-changed', loadSchedule);
    return () => window.removeEventListener('schedule-slots-changed', loadSchedule);
  }, [user?.uid]);

  // Read focus sessions (scoped to active user)
  useEffect(() => {
    const key = `my_planner_focus_${user?.uid || 'guest'}`;
    const loadFocus = () => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const sessions = JSON.parse(raw);
          const total = sessions.reduce((acc, s) => acc + (s.durationMins || 25), 0);
          setFocusTimeMins(total);
        } else {
          setFocusTimeMins(0);
        }
      } catch (e) {
        setFocusTimeMins(0);
      }
    };

    loadFocus();
    window.addEventListener('focus-sessions-changed', loadFocus);
    return () => window.removeEventListener('focus-sessions-changed', loadFocus);
  }, [user?.uid]);

  // Derived tasks & statistics
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const habitsAchieved = habits.filter((h) => h.done >= h.target).length;

  const topThreeList = (() => {
    const pinned = activeTasks.filter((t) => t.isTopThree);
    const unpinned = activeTasks.filter((t) => !t.isTopThree);
    return [...pinned, ...unpinned].slice(0, 3);
  })();

  const scheduledBlocks = scheduleSlots.filter((s) => Boolean(s.title));
  const upcomingDeadlines = tasks.filter((t) => Boolean(t.dueDate) && !t.completed);

  const formatFocusTime = (mins) => {
    if (!mins || mins === 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

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

      {/* Real-Time Live Stats */}
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
          <div className="stat-value">{formatFocusTime(focusTimeMins)}</div>
          <div className="stat-label">Focus Time</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {habits.length > 0 ? `${habitsAchieved}/${habits.length}` : '0/0'}
          </div>
          <div className="stat-label">Habits Met</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="dashboard-grid">
        {/* ── 1. Top 3 Priorities ── */}
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
                  <span className="top-three-text">
                    <LinkifiedText text={item.text} />
                  </span>
                  <span className="top-three-badge">
                    {priorityBadge(item.priority)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 2. Today's Schedule ── */}
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

          {scheduledBlocks.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-5)' }}>
              <p className="empty-state-text">
                Your schedule is clear for today. Plan hours for deep work, classes, or breaks.
              </p>
              <Link href="/calendar" className="btn btn-primary">
                ＋ Plan time blocks
              </Link>
            </div>
          ) : (
            <div className="time-blocks">
              {scheduledBlocks.map((block, i) => (
                <div className="time-block" key={i}>
                  <div className="time-block-time">{block.time}</div>
                  <div
                    className="time-block-bar"
                    style={{ background: block.color || 'var(--color-primary)' }}
                  />
                  <div className="time-block-content">
                    <div className="time-block-title">{block.title}</div>
                    <div className="time-block-meta">1h block</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 3. Habits This Week ── */}
        <div className="card dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🎯</span>
              Habits This Week
            </h2>
            <Link href="/habits" className="btn btn-ghost">
              Manage
            </Link>
          </div>

          {habits.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-5)' }}>
              <p className="empty-state-text">
                No habits tracked yet. Set your first weekly consistency target!
              </p>
              <Link href="/habits" className="btn btn-primary">
                ＋ Add a habit
              </Link>
            </div>
          ) : (
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
          )}
        </div>

        {/* ── 4. Coming Up ── */}
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

          {upcomingDeadlines.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-5)' }}>
              <p className="empty-state-text">
                No upcoming deadlines on your calendar.
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => setIsTaskModalOpen(true)}
              >
                ＋ Add task with due date
              </button>
            </div>
          ) : (
            <div className="upcoming-list">
              {upcomingDeadlines.slice(0, 4).map((item) => (
                <div className="upcoming-item" key={item.id}>
                  <div
                    className="upcoming-dot"
                    style={{
                      background:
                        item.priority === 'urgent'
                          ? 'var(--color-danger)'
                          : item.priority === 'important'
                          ? 'var(--color-warning)'
                          : 'var(--color-accent)',
                    }}
                  />
                  <span className="upcoming-text">
                    <LinkifiedText text={item.text} />
                  </span>
                  <span className="upcoming-date">{item.dueDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cloud sync status banner */}
      <div className="sample-notice">
        <span className="sample-notice-icon">
          {isConfigured ? '☁️' : '💾'}
        </span>
        {isConfigured && user
          ? `Connected to Firebase Cloud Firestore for ${user.email} (Spark Free Tier • Private to you)`
          : 'Running in local mode.'}
      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
}
