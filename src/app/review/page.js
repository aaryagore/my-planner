'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks } from '@/lib/tasksService';
import { subscribeToHabits } from '@/lib/habitsService';
import LinkifiedText from '@/components/LinkifiedText';
import './review.css';

const ENERGY_OPTIONS = [
  { id: 'focus', label: '⚡ High Focus' },
  { id: 'steady', label: '🎯 Steady' },
  { id: 'balanced', label: '☕ Balanced' },
  { id: 'recovery', label: '🌱 Rest & Recovery' },
];

const PROMPTS = [
  '🎯 Biggest win today:',
  '💡 What I learned:',
  '✨ Something I am grateful for:',
  '🚀 Top priority for tomorrow:',
];

function parseDateToYMD(val) {
  if (!val) return null;
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  let d = null;
  if (typeof val === 'number') d = new Date(val);
  else if (val && typeof val.toDate === 'function') d = val.toDate();
  else if (val && val.seconds) d = new Date(val.seconds * 1000);
  else d = new Date(val);
  if (!d || isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ReviewPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('2026-10-26');
  const [todayStr, setTodayStr] = useState('2026-10-26');

  // Set real client date inside useEffect (satisfies Next.js 16 prerender)
  useEffect(() => {
    const clientToday = parseDateToYMD(new Date()) || '2026-10-26';
    setSelectedDate(clientToday);
    setTodayStr(clientToday);
  }, []);

  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [reflection, setReflection] = useState('');
  const [energyLevel, setEnergyLevel] = useState('focus');
  const [savedNotice, setSavedNotice] = useState(false);

  // Subscribe to real tasks & habits
  useEffect(() => {
    const unsubTasks = subscribeToTasks(user?.uid, (allTasks) => setTasks(allTasks));
    const unsubHabits = subscribeToHabits(user?.uid, (allHabits) => setHabits(allHabits));
    return () => {
      if (typeof unsubTasks === 'function') unsubTasks();
      if (typeof unsubHabits === 'function') unsubHabits();
    };
  }, [user?.uid]);

  // Load Focus Sessions (scoped to user)
  useEffect(() => {
    const focusKey = `my_planner_focus_${user?.uid || 'guest'}`;
    const loadFocus = () => {
      try {
        const raw = localStorage.getItem(focusKey);
        if (raw) setFocusSessions(JSON.parse(raw));
        else setFocusSessions([]);
      } catch {
        setFocusSessions([]);
      }
    };
    loadFocus();
    window.addEventListener('focus-sessions-changed', loadFocus);
    return () => window.removeEventListener('focus-sessions-changed', loadFocus);
  }, [user?.uid]);

  // Load Date-Specific Reflection and Energy rating
  useEffect(() => {
    const reflectionKey = `my_planner_reflection_${user?.uid || 'guest'}_${selectedDate}`;
    const energyKey = `my_planner_energy_${user?.uid || 'guest'}_${selectedDate}`;

    try {
      const savedReflection = localStorage.getItem(reflectionKey);
      setReflection(savedReflection || '');

      const savedEnergy = localStorage.getItem(energyKey);
      setEnergyLevel(savedEnergy || 'focus');
    } catch (e) {
      console.warn(e);
      setReflection('');
    }
  }, [selectedDate, user?.uid]);

  // Save Reflection & Energy per date
  const handleSaveReflection = (e) => {
    if (e) e.preventDefault();
    const reflectionKey = `my_planner_reflection_${user?.uid || 'guest'}_${selectedDate}`;
    const energyKey = `my_planner_energy_${user?.uid || 'guest'}_${selectedDate}`;

    try {
      localStorage.setItem(reflectionKey, reflection);
      localStorage.setItem(energyKey, energyLevel);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (err) {
      console.error('Failed to save reflection:', err);
    }
  };

  const handleSelectEnergy = (id) => {
    setEnergyLevel(id);
    const energyKey = `my_planner_energy_${user?.uid || 'guest'}_${selectedDate}`;
    try {
      localStorage.setItem(energyKey, id);
    } catch {}
  };

  const addPromptToReflection = (promptText) => {
    setReflection((prev) => (prev ? `${prev}\n\n${promptText} ` : `${promptText} `));
  };

  // Date Navigation Helpers
  const changeDate = (days) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    const nextStr = parseDateToYMD(d);
    if (nextStr) setSelectedDate(nextStr);
  };

  const jumpToToday = () => {
    const todayStr = parseDateToYMD(new Date());
    if (todayStr) setSelectedDate(todayStr);
  };

  const isSelectedDateToday = selectedDate === todayStr;

  // Format readable banner (e.g., Monday, October 26, 2026)
  const displayDateStr = (() => {
    try {
      const d = new Date(selectedDate + 'T12:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  })();

  // Tasks completed on the selected date
  const dayCompletedTasks = tasks.filter((t) => {
    if (!t.completed) return false;
    const taskDate = parseDateToYMD(t.completedAt) || parseDateToYMD(t.updatedAt) || t.dueDate;
    return taskDate === selectedDate;
  });

  // Focus sessions on the selected date
  const dayFocusSessions = focusSessions.filter((s) => {
    const sessionDate = s.date || parseDateToYMD(s.id);
    return sessionDate === selectedDate;
  });

  const dayFocusMinutes = dayFocusSessions.reduce((acc, s) => acc + (s.durationMins || 25), 0);
  const habitsMet = habits.filter((h) => h.done >= h.target).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Review & Retrospective</h1>
          <p className="page-subtitle">
            Track daily accomplishments, review completed tasks, and reflect by date.
          </p>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="review-date-nav">
        <div className="review-date-controls">
          <button
            type="button"
            className="review-nav-btn"
            onClick={() => changeDate(-1)}
            title="Previous Day"
            aria-label="Previous Day"
          >
            ◀
          </button>

          <input
            type="date"
            className="review-date-input"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
          />

          <button
            type="button"
            className="review-nav-btn"
            onClick={() => changeDate(1)}
            title="Next Day"
            aria-label="Next Day"
          >
            ▶
          </button>

          {!isSelectedDateToday && (
            <button
              type="button"
              className="review-today-btn"
              onClick={jumpToToday}
            >
              Today
            </button>
          )}
        </div>

        <div className="review-current-date-text">
          <span>{displayDateStr}</span>
          {isSelectedDateToday && (
            <span className="review-is-today-badge">Today</span>
          )}
        </div>
      </div>

      {/* Metrics Row for Selected Date */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-success)' }}>
            {dayCompletedTasks.length}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
            TASKS COMPLETED ON THIS DATE
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
            {dayFocusMinutes}m
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
            FOCUS TIME ON THIS DATE
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-warning)' }}>
            {habitsMet} / {habits.length || 0}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
            WEEKLY HABIT TARGETS MET
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Daily Reflection Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🌙</span> Reflection for {selectedDate}
            </h2>
            {savedNotice && <span className="badge badge-accent">Saved!</span>}
          </div>

          <form onSubmit={handleSaveReflection}>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                HOW DID TODAY FEEL?
              </div>
              <div className="mood-selector">
                {ENERGY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`mood-btn ${energyLevel === opt.id ? 'active' : ''}`}
                    onClick={() => handleSelectEnergy(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
              PROMPT STARTERS
            </div>
            <div className="review-prompt-chips">
              {PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="review-prompt-chip"
                  onClick={() => addPromptToReflection(p)}
                >
                  ＋ {p.split(':')[0]}
                </button>
              ))}
            </div>

            <textarea
              rows={7}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Jot down notes, achievements, lessons learned, or ideas for this date..."
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                background: 'var(--bg-input)',
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 1.5,
                resize: 'vertical',
                marginBottom: 'var(--space-4)',
              }}
            />

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Reflection for {selectedDate}
            </button>
          </form>
        </div>

        {/* Completed on this date & Focus Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Completed Tasks on Selected Date */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-title-icon">🏆</span> Tasks Completed ({dayCompletedTasks.length})
              </h2>
            </div>

            {dayCompletedTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-5)' }}>
                <p className="empty-state-text">
                  No tasks were marked complete on {selectedDate}.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {dayCompletedTasks.map((task) => (
                  <div key={task.id} className="review-task-item">
                    <span className="review-task-check">✓</span>
                    <span className="review-task-text">
                      <LinkifiedText text={task.text} />
                    </span>
                    {task.priority && (
                      <span className={`badge badge-${task.priority === 'urgent' ? 'danger' : 'accent'}`} style={{ fontSize: '0.68rem' }}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Focus Sessions on Selected Date */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-title-icon">⏱️</span> Focus Sessions ({dayFocusSessions.length})
              </h2>
              {dayFocusMinutes > 0 && (
                <span className="badge badge-accent">{dayFocusMinutes}m Total</span>
              )}
            </div>

            {dayFocusSessions.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-4)' }}>
                <p className="empty-state-text">
                  No focus sessions logged on this date.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {dayFocusSessions.map((session) => (
                  <div key={session.id} className="review-session-item">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                        {session.taskTitle}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        {session.durationMins || 25} minutes
                      </div>
                    </div>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      {session.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
