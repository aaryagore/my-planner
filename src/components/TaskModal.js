'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createTask } from '@/lib/tasksService';
import './TaskModal.css';

export default function TaskModal({
  isOpen,
  onClose,
  initialPriority = 'important',
  initialCategory = 'personal',
  initialIsTopThree = false,
  onTaskCreated,
}) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(initialPriority);
  const [category, setCategory] = useState(initialCategory);
  const [dueDate, setDueDate] = useState('');
  const [isTopThree, setIsTopThree] = useState(initialIsTopThree);
  const [submitting, setSubmitting] = useState(false);

  // Helper to cleanly reset all modal inputs
  const resetForm = useCallback(() => {
    setText('');
    setDescription('');
    setPriority(initialPriority || 'important');
    setCategory(initialCategory || 'personal');
    setDueDate('');
    setIsTopThree(Boolean(initialIsTopThree));
    setSubmitting(false);
  }, [initialPriority, initialCategory, initialIsTopThree]);

  // Always reset fields to fresh state every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText || submitting) return;

    setSubmitting(true);

    const taskPayload = {
      text: trimmedText,
      description: description.trim(),
      priority,
      category,
      dueDate: dueDate || null,
      isTopThree,
    };

    // Instant UI close & clean reset — never leave old data or a stuck spinner
    resetForm();
    if (onTaskCreated) onTaskCreated();
    onClose();

    // Trigger save (instant in local cache, background in cloud)
    try {
      await createTask(user?.uid, taskPayload);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  return (
    <div
      className="task-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="task-modal-dialog">
        <div className="task-modal-header">
          <h2 className="task-modal-title">
            <span>✨</span> Quick Capture Task
          </h2>
          <button
            className="task-modal-close"
            onClick={handleClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="task-modal-body">
            <div className="task-input-field">
              <label htmlFor="task-text">What needs to be done?</label>
              <input
                id="task-text"
                type="text"
                placeholder="e.g., Submit Operating Systems Assignment"
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="task-input-field">
              <label>Category</label>
              <div className="category-toggle">
                <button
                  type="button"
                  className={`category-btn${category === 'personal' ? ' active personal' : ''}`}
                  onClick={() => setCategory('personal')}
                >
                  🏠 Personal
                </button>
                <button
                  type="button"
                  className={`category-btn${category === 'academic' ? ' active academic' : ''}`}
                  onClick={() => setCategory('academic')}
                >
                  🎓 Academic
                </button>
              </div>
            </div>

            <div className="task-input-field">
              <label htmlFor="task-desc">Notes / Details (Optional)</label>
              <textarea
                id="task-desc"
                placeholder="Add any extra links, sub-steps, or requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="task-input-field">
              <label>Priority</label>
              <div className="priority-options">
                <button
                  type="button"
                  className={`priority-btn ${priority === 'urgent' ? 'selected urgent' : ''}`}
                  onClick={() => setPriority('urgent')}
                >
                  🔴 Urgent
                </button>
                <button
                  type="button"
                  className={`priority-btn ${priority === 'important' ? 'selected important' : ''}`}
                  onClick={() => setPriority('important')}
                >
                  🟡 Important
                </button>
                <button
                  type="button"
                  className={`priority-btn ${priority === 'optional' ? 'selected optional' : ''}`}
                  onClick={() => setPriority('optional')}
                >
                  🟢 Optional
                </button>
              </div>
            </div>

            <div className="task-input-field">
              <label htmlFor="task-due">Due Date (Optional)</label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <label className="task-checkbox-row">
              <input
                type="checkbox"
                checked={isTopThree}
                onChange={(e) => setIsTopThree(e.target.checked)}
              />
              <span className="task-checkbox-label">
                ⭐ Pin to Today&apos;s Top 3 Priorities
              </span>
            </label>
          </div>

          <div className="task-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !text.trim()}
            >
              {submitting ? 'Adding...' : '＋ Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
