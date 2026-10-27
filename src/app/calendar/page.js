'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks } from '@/lib/tasksService';
import './calendar.css';

const COLOR_OPTIONS = [
  { label: 'Indigo', value: 'var(--color-primary)' },
  { label: 'Teal', value: 'var(--color-accent)' },
  { label: 'Amber', value: 'var(--color-warning)' },
  { label: 'Coral', value: '#f87171' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Emerald', value: '#10b981' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad(n) {
  return String(n).padStart(2, '0');
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function CalendarPage() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [currentHour, setCurrentHour] = useState(null);
  const [todayDateStr, setTodayDateStr] = useState('');
  const [viewMode, setViewMode] = useState('daytime'); // 'daytime' (7-22) | '24h' (0-23)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mStart, setMStart] = useState(9);
  const [mDuration, setMDuration] = useState(1);
  const [mTitle, setMTitle] = useState('');
  const [mColor, setMColor] = useState(COLOR_OPTIONS[0].value);
  const nowRowRef = useRef(null);

  const storageKey = 'my_planner_blocks_v2_' + (user?.uid || 'guest');

  // Load saved blocks
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setBlocks(JSON.parse(saved));
      } catch (e) {
        console.warn(e);
      }
    }
  }, [storageKey]);

  const saveBlocks = (updated) => {
    setBlocks(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    window.dispatchEvent(new Event('schedule-slots-changed'));
  };

  // Keep current hour and date updated in client
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentHour(now.getHours());
      setTodayDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // Subscribe to tasks for quick-insert tray
  useEffect(() => {
    const unsub = subscribeToTasks(user?.uid || null, (all) =>
      setTasks(all.filter((t) => !t.completed))
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [user?.uid]);

  const scrollToNow = () => {
    if (nowRowRef.current) {
      nowRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const coveredSet = new Set();
  blocks.forEach((b) => {
    for (let i = 1; i < b.duration; i++) {
      coveredSet.add(b.startHour + i);
    }
  });

  const maxDurFrom = (startHour, exceptId) => {
    const next = blocks
      .filter((b) => b.id !== exceptId && b.startHour > startHour)
      .sort((a, b) => a.startHour - b.startHour)[0];
    return next ? next.startHour - startHour : 24 - startHour;
  };

  const openCreate = (hour, presetTitle = '') => {
    setEditingId(null);
    setMStart(hour);
    setMDuration(1);
    setMTitle(presetTitle);
    setMColor(COLOR_OPTIONS[0].value);
    setModalOpen(true);
  };

  const openEdit = (block) => {
    setEditingId(block.id);
    setMStart(block.startHour);
    setMDuration(block.duration);
    setMTitle(block.title);
    setMColor(block.color || COLOR_OPTIONS[0].value);
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!mTitle.trim()) return;
    const end = mStart + mDuration;
    const kept = blocks.filter((b) => {
      if (b.id === editingId) return false;
      const bEnd = b.startHour + b.duration;
      return !(b.startHour < end && bEnd > mStart);
    });
    const block = {
      id: editingId || uid(),
      startHour: mStart,
      duration: Math.min(mDuration, 24 - mStart),
      title: mTitle.trim(),
      color: mColor,
    };
    saveBlocks([...kept, block].sort((a, b) => a.startHour - b.startHour));
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!editingId) return;
    saveBlocks(blocks.filter((b) => b.id !== editingId));
    setModalOpen(false);
  };

  const handleClearAll = () => {
    if (blocks.length === 0) return;
    if (window.confirm('Clear all scheduled time blocks for today?')) {
      saveBlocks([]);
    }
  };

  const hoursToDisplay =
    viewMode === 'daytime'
      ? Array.from({ length: 16 }, (_, i) => i + 7) // 7:00 to 22:00
      : Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:00



  return (
    <div className="animate-fade-in calendar-page-calm">
      {/* Calendar Header */}
      <div className="calendar-head-row">
        <div>
          <h1 className="calendar-page-title">Daily Schedule</h1>
          <p className="calendar-page-subtitle">
            {todayDateStr} · {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'} scheduled
          </p>
        </div>

        <div className="calendar-action-toolbar">
          <button
            type="button"
            className="btn-cal-action"
            onClick={scrollToNow}
            title="Scroll to current hour"
          >
            Jump to Now
          </button>

          <div className="cal-view-toggle">
            <button
              type="button"
              className={`cal-toggle-btn ${viewMode === 'daytime' ? 'active' : ''}`}
              onClick={() => setViewMode('daytime')}
            >
              Daytime (7–22)
            </button>
            <button
              type="button"
              className={`cal-toggle-btn ${viewMode === '24h' ? 'active' : ''}`}
              onClick={() => setViewMode('24h')}
            >
              All 24 Hours
            </button>
          </div>

          <button
            type="button"
            className="btn-cal-action"
            onClick={() => openCreate(Math.max(7, Math.min(22, currentHour ?? 9)))}
          >
            + Add Block
          </button>

          {blocks.length > 0 && (
            <button
              type="button"
              className="btn-cal-clear"
              onClick={handleClearAll}
              title="Clear all blocks"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Unscheduled Tasks Quick-Block Shelf */}
      {tasks.length > 0 && (
        <div className="quick-task-tray">
          <span className="quick-task-tray-label">Unscheduled Tasks:</span>
          <div className="quick-task-pills">
            {tasks.slice(0, 6).map((t) => (
              <button
                key={t.id}
                type="button"
                className="quick-task-pill"
                onClick={() => openCreate(currentHour, t.text)}
                title="Click to schedule this task into a time block"
              >
                + {t.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Timeline Grid */}
      <div className="card schedule-card">
        <div className="schedule-timeline">
          {hoursToDisplay.map((h) => {
            if (coveredSet.has(h)) return null;
            const block = blocks.find((b) => b.startHour === h);
            const isNow = currentHour === h;
            const isNight = h < 6 || h >= 22;

            return (
              <div
                key={h}
                ref={isNow ? nowRowRef : null}
                className={`schedule-row ${isNow ? 'is-now' : ''} ${isNight ? 'is-night' : ''}`}
              >
                {/* Time Indicator */}
                <div className="schedule-time-label-col">
                  <span className="time-start">{pad(h)}:00</span>
                  {isNow && <span className="now-pill">NOW</span>}
                </div>

                {/* Block or Empty Slot */}
                <div className="schedule-slot-col">
                  {block ? (
                    <button
                      type="button"
                      className="scheduled-block"
                      style={{
                        minHeight: `${block.duration * 52 - 8}px`,
                        borderLeftColor: block.color || 'var(--color-primary)',
                      }}
                      onClick={() => openEdit(block)}
                    >
                      <div className="block-info">
                        <span className="block-title">{block.title}</span>
                        <span className="block-duration">
                          {pad(block.startHour)}:00 – {pad(block.startHour + block.duration)}:00 ({block.duration} hr)
                        </span>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="empty-slot-btn"
                      onClick={() => openCreate(h)}
                      aria-label={`Schedule block at ${pad(h)}:00`}
                    >
                      <span className="empty-slot-prompt">+ Add block</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingId ? 'Edit Schedule Block' : 'Add Schedule Block'}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label htmlFor="block-title">Block Title</label>
                <input
                  id="block-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Deep Work, Lecture, Gym"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="block-start">Start Time</label>
                  <select
                    id="block-start"
                    className="form-select"
                    value={mStart}
                    onChange={(e) => {
                      const s = Number(e.target.value);
                      setMStart(s);
                      setMDuration((prev) => Math.min(prev, maxDurFrom(s, editingId)));
                    }}
                  >
                    {HOURS.map((hr) => (
                      <option key={hr} value={hr}>
                        {pad(hr)}:00
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="block-duration">Duration</label>
                  <select
                    id="block-duration"
                    className="form-select"
                    value={mDuration}
                    onChange={(e) => setMDuration(Number(e.target.value))}
                  >
                    {Array.from({ length: maxDurFrom(mStart, editingId) }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 1 ? 'hour' : 'hours'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Color Accent</label>
                <div className="color-swatches">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      className={`color-swatch-btn ${mColor === c.value ? 'selected' : ''}`}
                      style={{ background: c.value }}
                      onClick={() => setMColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                {editingId && (
                  <button
                    type="button"
                    className="btn-danger-outline"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                )}
                <div className="modal-right-buttons">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-primary">
                    Save Block
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
