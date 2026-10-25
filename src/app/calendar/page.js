'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks } from '@/lib/tasksService';
import './calendar.css';

const DEFAULT_SLOTS = [
  { time: '08:00', title: null, color: 'var(--color-accent)' },
  { time: '09:00', title: null, color: 'var(--color-primary)' },
  { time: '10:00', title: null, color: 'var(--color-primary)' },
  { time: '11:00', title: null, color: 'var(--color-primary)' },
  { time: '12:00', title: null, color: 'var(--color-warning)' },
  { time: '13:00', title: null, color: 'var(--color-accent)' },
  { time: '14:00', title: null, color: 'var(--color-primary)' },
  { time: '15:00', title: null, color: 'var(--color-primary)' },
  { time: '16:00', title: null, color: 'var(--color-primary)' },
  { time: '17:00', title: null, color: 'var(--color-accent)' },
  { time: '18:00', title: null, color: 'var(--color-primary)' },
];

export default function CalendarPage() {
  const { user } = useAuth();
  const [view, setView] = useState('day'); // 'day' | 'month'
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [tasks, setTasks] = useState([]);
  const [activeSlotTime, setActiveSlotTime] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalColor, setModalColor] = useState('var(--color-primary)');

  useEffect(() => {
    const saved = localStorage.getItem('my_planner_schedule_slots');
    if (saved) {
      try {
        setSlots(JSON.parse(saved));
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  const saveSlots = (updated) => {
    setSlots(updated);
    localStorage.setItem('my_planner_schedule_slots', JSON.stringify(updated));
    window.dispatchEvent(new Event('schedule-slots-changed'));
  };

  useEffect(() => {
    const unsubscribe = subscribeToTasks(user?.uid, (allTasks) => {
      setTasks(allTasks.filter((t) => !t.completed));
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  const handleOpenSlot = (slot) => {
    setActiveSlotTime(slot.time);
    setModalTitle(slot.title || '');
    setModalColor(slot.color || 'var(--color-primary)');
  };

  const handleSaveSlot = (e) => {
    e.preventDefault();
    if (!activeSlotTime) return;

    const updated = slots.map((s) => {
      if (s.time === activeSlotTime) {
        return {
          ...s,
          title: modalTitle.trim() || null,
          color: modalColor,
        };
      }
      return s;
    });

    saveSlots(updated);
    setActiveSlotTime(null);
  };

  const handleClearSlot = () => {
    if (!activeSlotTime) return;
    const updated = slots.map((s) => {
      if (s.time === activeSlotTime) {
        return { ...s, title: null };
      }
      return s;
    });
    saveSlots(updated);
    setActiveSlotTime(null);
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Calendar & Time Blocking</h1>
          <p className="page-subtitle">
            Schedule specific hours for your top tasks and avoid overwhelm.
          </p>
        </div>

        <div className="calendar-view-toggles">
          <button
            className={`calendar-view-btn ${view === 'day' ? 'active' : ''}`}
            onClick={() => setView('day')}
          >
            Daily Time Blocks
          </button>
          <button
            className={`calendar-view-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            Monthly Overview
          </button>
        </div>
      </div>

      {view === 'day' ? (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🕐</span>
              Today&apos;s Time Blocks
            </h2>
            <button
              className="btn btn-ghost"
              onClick={() => saveSlots(DEFAULT_SLOTS)}
            >
              Reset Schedule
            </button>
          </div>

          <div className="schedule-grid">
            {slots.map((slot) => {
              const hasBlock = Boolean(slot.title);

              return (
                <div className="schedule-row" key={slot.time}>
                  <div className="schedule-time-col">{slot.time}</div>
                  <div
                    className={`schedule-slot ${hasBlock ? 'has-block' : ''}`}
                    style={
                      hasBlock
                        ? { borderLeftColor: slot.color || 'var(--color-primary)' }
                        : {}
                    }
                    onClick={() => handleOpenSlot(slot)}
                  >
                    {hasBlock ? (
                      <div>
                        <div className="schedule-block-title">{slot.title}</div>
                        <div className="schedule-block-meta">1 hour block</div>
                      </div>
                    ) : (
                      <span className="schedule-empty-hint">
                        ＋ Click to schedule task or event
                      </span>
                    )}

                    {hasBlock && (
                      <span className="badge badge-accent">Scheduled</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Monthly View */
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🗓️</span>
              October 2026
            </h2>
          </div>

          <div className="month-calendar-grid">
            {daysOfWeek.map((d) => (
              <div
                key={d}
                style={{
                  fontWeight: 700,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-tertiary)',
                  textAlign: 'center',
                  padding: '4px 0',
                }}
              >
                {d}
              </div>
            ))}

            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const isToday = dayNum === 26;

              return (
                <div
                  key={dayNum}
                  className={`month-day-cell ${isToday ? 'is-today' : ''}`}
                >
                  <div className="month-day-num">
                    {dayNum} {isToday ? '(Today)' : ''}
                  </div>
                  {dayNum === 27 && (
                    <div className="month-day-dot">Proposal Due</div>
                  )}
                  {dayNum === 28 && (
                    <div className="month-day-dot" style={{ background: 'var(--color-warning)' }}>
                      Presentation
                    </div>
                  )}
                  {dayNum === 30 && (
                    <div className="month-day-dot" style={{ background: 'var(--color-danger)' }}>
                      Midterm Exam
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {activeSlotTime && (
        <div
          className="task-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveSlotTime(null);
          }}
        >
          <div className="task-modal-dialog">
            <div className="task-modal-header">
              <h2 className="task-modal-title">
                <span>⏱</span> Schedule {activeSlotTime} Block
              </h2>
              <button
                className="task-modal-close"
                onClick={() => setActiveSlotTime(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlot}>
              <div className="task-modal-body">
                {tasks.length > 0 && (
                  <div className="task-input-field">
                    <label>Or select from active tasks</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) setModalTitle(e.target.value);
                      }}
                      defaultValue=""
                    >
                      <option value="">-- Choose an active task --</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.text}>
                          {t.text}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="task-input-field">
                  <label htmlFor="slot-title">Block Description</label>
                  <input
                    id="slot-title"
                    type="text"
                    placeholder="e.g. Deep Work on Math Problem Set"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="task-input-field">
                  <label>Highlight Color</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[
                      'var(--color-primary)',
                      'var(--color-accent)',
                      'var(--color-warning)',
                      'var(--color-danger)',
                    ].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setModalColor(col)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-full)',
                          background: col,
                          border: modalColor === col ? '3px solid var(--text-primary)' : 'none',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="task-modal-footer">
                {slots.find((s) => s.time === activeSlotTime)?.title && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClearSlot}
                    style={{ marginRight: 'auto', color: 'var(--color-danger)' }}
                  >
                    Clear Block
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveSlotTime(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
