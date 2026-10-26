'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks, toggleTaskComplete } from '@/lib/tasksService';
import { subscribeToHabits } from '@/lib/habitsService';
import VoiceTaskBar from '@/components/VoiceTaskBar';
import TaskModal from '@/components/TaskModal';
import LinkifiedText from '@/components/LinkifiedText';
import './dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [scheduleBlocks, setScheduleBlocks] = useState([]);
  const [focusTimeMins, setFocusTimeMins] = useState(0);
  const [currentHour, setCurrentHour] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('personal');

  // Friendly date and greeting
  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    setCurrentHour(h);
    if (h < 12) setGreeting('Good morning');
    else if (h < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setDateStr(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    );
  }, []);

  // Subscribe to tasks
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

  // Read calendar blocks (for next scheduled item)
  useEffect(() => {
    const storageKey = 'my_planner_blocks_v2_' + (user?.uid || 'guest');
    const loadBlocks = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setScheduleBlocks(JSON.parse(saved));
        else setScheduleBlocks([]);
      } catch {
        setScheduleBlocks([]);
      }
    };

    loadBlocks();
    window.addEventListener('schedule-slots-changed', loadBlocks);
    return () => window.removeEventListener('schedule-slots-changed', loadBlocks);
  }, [user?.uid]);

  // Read focus minutes
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
      } catch {
        setFocusTimeMins(0);
      }
    };

    loadFocus();
    window.addEventListener('focus-sessions-changed', loadFocus);
    return () => window.removeEventListener('focus-sessions-changed', loadFocus);
  }, [user?.uid]);

  // Derived tasks
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const topThreeList = activeTasks.filter((t) => t.isTopThree);
  const regularTasks = activeTasks.filter((t) => !t.isTopThree).slice(0, 5);

  // Compute Next Scheduled Item from calendar blocks
  const nextScheduledItem = useMemo(() => {
    if (!scheduleBlocks || scheduleBlocks.length === 0) return null;
    const hour = currentHour !== null ? currentHour : 9;

    // 1. Check if an item is happening right now
    const currentBlock = scheduleBlocks.find(
      (b) => b.startHour <= hour && hour < b.startHour + b.duration
    );
    if (currentBlock) {
      return {
        ...currentBlock,
        isNow: true,
        timeLabel: `${String(currentBlock.startHour).padStart(2, '0')}:00 - ${String(
          currentBlock.startHour + currentBlock.duration
        ).padStart(2, '0')}:00`,
      };
    }

    // 2. Otherwise find next upcoming item today
    const upcoming = scheduleBlocks
      .filter((b) => b.startHour > hour)
      .sort((a, b) => a.startHour - b.startHour)[0];

    if (upcoming) {
      return {
        ...upcoming,
        isNow: false,
        timeLabel: `Starts at ${String(upcoming.startHour).padStart(2, '0')}:00`,
      };
    }

    // 3. Fallback to first block of schedule
    const first = [...scheduleBlocks].sort((a, b) => a.startHour - b.startHour)[0];
    return {
      ...first,
      isNow: false,
      timeLabel: `${String(first.startHour).padStart(2, '0')}:00 - ${String(
        first.startHour + first.duration
      ).padStart(2, '0')}:00`,
    };
  }, [scheduleBlocks]);

  const formatFocusTime = (mins) => {
    if (!mins || mins === 0) return '0m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const displayName = user?.displayName
    ? user.displayName.split(' ')[0]
    : user?.email
    ? user.email.split('@')[0]
    : 'there';

  return (
    <div className="animate-fade-in dashboard-page">
      {/* Calm Header */}
      <div className="dashboard-header-simple">
        <div>
          <h1 className="dashboard-title">
            {greeting}, {displayName}
          </h1>
          <p className="dashboard-date-label">{dateStr}</p>
        </div>
        <div className="dashboard-header-quick-links">
          <Link href="/inbox" className="link-subtle">
            All Tasks ({activeTasks.length})
          </Link>
          <Link href="/calendar" className="link-subtle">
            View Schedule
          </Link>
        </div>
      </div>

      {/* Prominent Voice & Quick Add Bar */}
      <section className="dashboard-quick-add-section" aria-label="Quick add task">
        <VoiceTaskBar
          placeholder="Type a task or click Add task by voice..."
          onTaskCreated={() => {}}
        />
      </section>

      {/* Main Focus Grid */}
      <div className="dashboard-focus-grid">
        {/* Left Column: Today's Priorities & Active Tasks */}
        <div className="dashboard-tasks-column">
          {/* Top 3 Priorities Card */}
          <div className="card calm-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-bullet priority"></span>
                <h2 className="panel-title">Today&apos;s Focus Priorities</h2>
              </div>
              <span className="panel-counter">
                {topThreeList.length} of 3
              </span>
            </div>

            {topThreeList.length === 0 ? (
              <div className="panel-empty-simple">
                <p>No high-priority tasks pinned for today.</p>
                <button
                  type="button"
                  className="btn-link-action"
                  onClick={() => {
                    setModalCategory('personal');
                    setIsTaskModalOpen(true);
                  }}
                >
                  + Add priority task
                </button>
              </div>
            ) : (
              <div className="compact-task-list">
                {topThreeList.map((task) => (
                  <div key={task.id} className="compact-task-row priority">
                    <button
                      type="button"
                      className={`compact-checkbox ${task.completed ? 'checked' : ''}`}
                      onClick={() => toggleTaskComplete(user?.uid, task.id, task.completed)}
                      aria-label="Mark task complete"
                    >
                      {task.completed ? '✓' : ''}
                    </button>
                    <div className="compact-task-info">
                      <span className="compact-task-text">
                        <LinkifiedText text={task.text} />
                      </span>
                      <div className="compact-task-meta">
                        <span className={`badge-pill ${task.category || 'personal'}`}>
                          {task.category === 'academic' ? 'Academic' : 'Personal'}
                        </span>
                        {task.dueDate && (
                          <span className="badge-pill due">Due {task.dueDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regular Active Tasks */}
          <div className="card calm-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-bullet tasks"></span>
                <h2 className="panel-title">Active Tasks</h2>
              </div>
              <Link href="/inbox" className="btn-link-action">
                View all ({activeTasks.length})
              </Link>
            </div>

            {regularTasks.length === 0 && topThreeList.length === 0 ? (
              <div className="panel-empty-simple">
                <p>All caught up! No pending tasks.</p>
              </div>
            ) : regularTasks.length === 0 ? (
              <div className="panel-empty-simple">
                <p>No other regular tasks for today.</p>
              </div>
            ) : (
              <div className="compact-task-list">
                {regularTasks.map((task) => (
                  <div key={task.id} className="compact-task-row">
                    <button
                      type="button"
                      className={`compact-checkbox ${task.completed ? 'checked' : ''}`}
                      onClick={() => toggleTaskComplete(user?.uid, task.id, task.completed)}
                      aria-label="Mark task complete"
                    >
                      {task.completed ? '✓' : ''}
                    </button>
                    <div className="compact-task-info">
                      <span className="compact-task-text">
                        <LinkifiedText text={task.text} />
                      </span>
                      <div className="compact-task-meta">
                        <span className={`badge-pill ${task.category || 'personal'}`}>
                          {task.category === 'academic' ? 'Academic' : 'Personal'}
                        </span>
                        {task.dueDate && (
                          <span className="badge-pill due">Due {task.dueDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Next Scheduled Item & Day at a Glance */}
        <div className="dashboard-schedule-column">
          {/* Next Scheduled Item */}
          <div className="card calm-panel next-item-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-bullet schedule"></span>
                <h2 className="panel-title">Next Scheduled Item</h2>
              </div>
              <Link href="/calendar" className="btn-link-action">
                Full schedule
              </Link>
            </div>

            {nextScheduledItem ? (
              <div className="next-item-body">
                <div className="next-item-badge">
                  {nextScheduledItem.isNow ? 'In Progress' : 'Upcoming Today'}
                </div>
                <h3 className="next-item-title">{nextScheduledItem.title}</h3>
                <span className="next-item-time">{nextScheduledItem.timeLabel}</span>
              </div>
            ) : (
              <div className="panel-empty-simple">
                <p>No time blocks scheduled for today.</p>
                <Link href="/calendar" className="btn-link-action">
                  + Plan in calendar
                </Link>
              </div>
            )}
          </div>

          {/* Quick Metrics (Restrained & Calm) */}
          <div className="metrics-strip">
            <div className="metric-box">
              <span className="metric-val">{activeTasks.length}</span>
              <span className="metric-lbl">Active</span>
            </div>
            <div className="metric-box">
              <span className="metric-val">{completedTasks.length}</span>
              <span className="metric-lbl">Completed</span>
            </div>
            <div className="metric-box">
              <span className="metric-val">{formatFocusTime(focusTimeMins)}</span>
              <span className="metric-lbl">Focus Time</span>
            </div>
          </div>

          {/* Compact Habits Progress */}
          {habits.length > 0 && (
            <div className="card calm-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <span className="panel-bullet habits"></span>
                  <h2 className="panel-title">Daily Habits</h2>
                </div>
                <Link href="/habits" className="btn-link-action">
                  Manage
                </Link>
              </div>

              <div className="habits-compact-list">
                {habits.slice(0, 4).map((h) => (
                  <div key={h.id} className="habit-compact-row">
                    <div className="habit-compact-info">
                      <span className="habit-compact-name">{h.name}</span>
                      <span className="habit-compact-streak">
                        {h.streak || 0} day streak
                      </span>
                    </div>
                    <div className="habit-progress-bar">
                      <div
                        className="habit-progress-fill"
                        style={{
                          width: `${Math.min(100, Math.round(((h.done || 0) / (h.target || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Modal for detailed edits */}
      <TaskModal
        isOpen={isTaskModalOpen}
        initialCategory={modalCategory}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
}
