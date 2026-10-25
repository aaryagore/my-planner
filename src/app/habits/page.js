'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToHabits,
  incrementHabit,
  decrementHabit,
  createHabit,
  deleteHabit,
} from '@/lib/habitsService';
import './habits.css';

const EMOJI_OPTIONS = ['🏃', '📖', '💧', '🧘', '✍️', '🥦', '💤', '🎸', '💻', '🎨'];
const COLOR_OPTIONS = [
  'var(--color-primary)',
  'var(--color-accent)',
  'var(--color-warning)',
  'var(--color-danger)',
];

export default function HabitsPage() {
  const { user, isConfigured } = useAuth();
  const [habits, setHabits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New habit form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏃');
  const [target, setTarget] = useState(3);
  const [color, setColor] = useState('var(--color-primary)');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setIcon('🏃');
    setTarget(3);
    setColor('var(--color-primary)');
    setSubmitting(false);
  }, []);

  // Clean form every time modal opens
  useEffect(() => {
    if (showAddModal) {
      resetForm();
    }
  }, [showAddModal, resetForm]);

  useEffect(() => {
    const unsubscribe = subscribeToHabits(user?.uid, (allHabits) => {
      setHabits(allHabits);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  const handleCloseModal = () => {
    resetForm();
    setShowAddModal(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const payload = {
      name: trimmed,
      icon,
      target: Number(target) || 3,
      color,
    };

    // Instant UI close & clean reset
    resetForm();
    setShowAddModal(false);

    try {
      await createHabit(user?.uid, payload);
    } catch (err) {
      console.error('Failed to create habit:', err);
    }
  };

  const totalDone = habits.reduce((acc, h) => acc + (h.done >= h.target ? 1 : 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 Habits & Routines</h1>
          <p className="page-subtitle">
            {habits.length === 0
              ? 'Build routines with flexible weekly frequency targets.'
              : `${totalDone} of ${habits.length} weekly targets achieved so far.`}
            {!isConfigured && ' (Local demo mode)'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          ＋ New habit
        </button>
      </div>

      {/* Habits Grid */}
      {habits.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <h3 className="empty-state-title">No habits tracked yet</h3>
            <p className="empty-state-text">
              Track positive daily routines like reading, exercise, or hydration.
              No rigid streaks — just weekly progress.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              ＋ Add your first habit
            </button>
          </div>
        </div>
      ) : (
        <div className="habits-grid">
          {habits.map((habit) => {
            const percentage = Math.min(Math.round((habit.done / habit.target) * 100), 100);
            const isCompleted = habit.done >= habit.target;

            return (
              <div className="habit-card" key={habit.id}>
                <div className="habit-header">
                  <div className="habit-title-group">
                    <div className="habit-avatar">{habit.icon}</div>
                    <div>
                      <div className="habit-name">{habit.name}</div>
                      <div className="habit-target-badge">
                        Target: {habit.target}× per week
                      </div>
                    </div>
                  </div>
                  <button
                    className="habit-delete-btn"
                    onClick={() => deleteHabit(user?.uid, habit.id)}
                    title="Delete habit"
                    aria-label="Delete habit"
                  >
                    🗑️
                  </button>
                </div>

                <div className="habit-progress-section">
                  <div className="habit-progress-header">
                    <span>Weekly progress</span>
                    <span className="habit-progress-percent">
                      {percentage}% {isCompleted ? '✓ Met' : ''}
                    </span>
                  </div>
                  <div className="habit-track">
                    <div
                      className="habit-fill"
                      style={{
                        width: `${percentage}%`,
                        background: habit.color || 'var(--color-primary)',
                      }}
                    />
                  </div>
                </div>

                <div className="habit-actions">
                  <div className="habit-count-display">
                    <span className="habit-done-count">{habit.done}</span>
                    <span className="habit-target-count">/ {habit.target} times</span>
                  </div>
                  <div className="habit-btn-group">
                    <button
                      className="habit-ctrl-btn"
                      onClick={() => decrementHabit(user?.uid, habit.id, habit.done)}
                      disabled={habit.done === 0}
                      title="Subtract 1"
                    >
                      −
                    </button>
                    <button
                      className="habit-ctrl-btn"
                      onClick={() =>
                        incrementHabit(user?.uid, habit.id, habit.done, habit.target)
                      }
                      title="Add 1 done"
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddModal && (
        <div
          className="task-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="task-modal-dialog">
            <div className="task-modal-header">
              <h2 className="task-modal-title">
                <span>🎯</span> Add New Habit
              </h2>
              <button
                className="task-modal-close"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="task-modal-body">
                <div className="task-input-field">
                  <label htmlFor="habit-name">Habit Name</label>
                  <input
                    id="habit-name"
                    type="text"
                    placeholder="e.g. Read for 20 minutes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="task-input-field">
                  <label>Choose Icon</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {EMOJI_OPTIONS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setIcon(em)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-md)',
                          border: icon === em ? '2px solid var(--color-primary)' : '1px solid var(--border-medium)',
                          background: icon === em ? 'var(--color-primary-ghost)' : 'var(--bg-card)',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                        }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="task-input-field">
                  <label htmlFor="habit-target">Target days per week</label>
                  <input
                    id="habit-target"
                    type="number"
                    min="1"
                    max="7"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="task-input-field">
                  <label>Color Accent</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-full)',
                          background: c,
                          border: color === c ? '3px solid var(--text-primary)' : 'none',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="task-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !name.trim()}
                >
                  {submitting ? 'Creating...' : '＋ Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
