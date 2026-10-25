'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks } from '@/lib/tasksService';
import './focus.css';

const DEFAULT_DURATIONS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

const MODE_META = {
  focus: { label: '🎯 Focus', color: 'var(--color-primary)' },
  shortBreak: { label: '☕ Short Break', color: 'var(--color-accent)' },
  longBreak: { label: '🌴 Long Break', color: 'var(--color-warning)' },
};

const PRESETS = {
  focus: [15, 25, 30, 45, 50, 60, 90],
  shortBreak: [3, 5, 10, 15],
  longBreak: [10, 15, 20, 30],
};

export default function FocusPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('focus');
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [completedSessions, setCompletedSessions] = useState([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputVal, setCustomInputVal] = useState('25');
  const timerRef = useRef(null);

  const focusStorageKey = `my_planner_focus_${user?.uid || 'guest'}`;
  const timerSettingsKey = `my_planner_timer_settings_${user?.uid || 'guest'}`;

  // Load custom timer settings
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(timerSettingsKey);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const loadedDurations = {
          focus: Number(parsed.focus) || 25,
          shortBreak: Number(parsed.shortBreak) || 5,
          longBreak: Number(parsed.longBreak) || 15,
        };
        setDurations(loadedDurations);
        setTimeLeft(loadedDurations.focus * 60);
        setCustomInputVal(String(loadedDurations.focus));
      }
    } catch (e) {
      console.warn('Failed to load custom timer settings:', e);
    }
  }, [timerSettingsKey]);

  // Load completed focus sessions
  useEffect(() => {
    try {
      const saved = localStorage.getItem(focusStorageKey);
      if (saved) {
        setCompletedSessions(JSON.parse(saved));
      } else {
        setCompletedSessions([]);
      }
    } catch (e) {
      console.warn(e);
      setCompletedSessions([]);
    }
  }, [focusStorageKey]);

  // Subscribe to real tasks
  useEffect(() => {
    const unsubscribe = subscribeToTasks(user?.uid, (allTasks) => {
      setTasks(allTasks.filter((t) => !t.completed));
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  // Web Audio chime on completion ($0 budget, instant)
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn('Web Audio note:', e);
    }
  };

  // Timer countdown loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playChime();

            // Record completed session
            if (mode === 'focus') {
              const currentTask = tasks.find((t) => t.id === selectedTaskId);
              const sessionRecord = {
                id: Date.now(),
                taskTitle: currentTask ? currentTask.text : 'General Focus Session',
                durationMins: durations.focus,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setCompletedSessions((prevSessions) => {
                const updated = [sessionRecord, ...prevSessions];
                try {
                  localStorage.setItem(focusStorageKey, JSON.stringify(updated));
                  window.dispatchEvent(new Event('focus-sessions-changed'));
                } catch (e) {
                  console.warn(e);
                }
                return updated;
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, selectedTaskId, tasks, durations.focus, focusStorageKey]);

  // Switch between Focus, Short Break, Long Break
  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    const targetMins = durations[newMode] || DEFAULT_DURATIONS[newMode];
    setTimeLeft(targetMins * 60);
    setCustomInputVal(String(targetMins));
  };

  // Apply a new duration (in minutes) to the current mode
  const applyDuration = (mins) => {
    const validMins = Math.max(1, Math.min(180, Number(mins) || 25));
    const updated = { ...durations, [mode]: validMins };
    setDurations(updated);
    try {
      localStorage.setItem(timerSettingsKey, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setIsRunning(false);
    setTimeLeft(validMins * 60);
    setCustomInputVal(String(validMins));
  };

  // Quick adjust +/- minutes
  const adjustMinutes = (deltaMinutes) => {
    const currentMins = Math.max(1, Math.round(timeLeft / 60));
    const newMins = Math.max(1, Math.min(180, currentMins + deltaMinutes));
    applyDuration(newMins);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const targetMins = durations[mode] || DEFAULT_DURATIONS[mode];
    setTimeLeft(targetMins * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Circular progress calculations
  const totalDuration = (durations[mode] || 25) * 60;
  const progressRatio = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(1, Math.max(0, progressRatio)));

  const totalFocusMinutes = completedSessions.reduce((acc, s) => acc + (s.durationMins || 25), 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⏱️ Focus Timer</h1>
          <p className="page-subtitle">
            Customizable deep work blocks paired with restorative breaks.
          </p>
        </div>
      </div>

      <div className="focus-layout">
        {/* Main Timer Card */}
        <div className="focus-timer-card">
          {/* Mode pills */}
          <div className="timer-mode-pills">
            {Object.keys(MODE_META).map((mKey) => (
              <button
                key={mKey}
                className={`timer-mode-btn ${mode === mKey ? 'active' : ''}`}
                onClick={() => switchMode(mKey)}
              >
                {MODE_META[mKey].label}
              </button>
            ))}
          </div>

          {/* Quick Duration Presets & Customizer */}
          <div className="timer-duration-bar">
            {PRESETS[mode].map((presetMins) => (
              <button
                key={presetMins}
                type="button"
                className={`duration-chip ${durations[mode] === presetMins && !showCustomInput ? 'active' : ''}`}
                onClick={() => {
                  setShowCustomInput(false);
                  applyDuration(presetMins);
                }}
              >
                {presetMins}m
              </button>
            ))}

            <button
              type="button"
              className={`duration-chip ${showCustomInput ? 'active' : ''}`}
              onClick={() => setShowCustomInput(!showCustomInput)}
              title="Set custom duration in minutes"
            >
              ⚙️ Custom
            </button>
          </div>

          {/* Expandable Custom Duration Input */}
          {showCustomInput && (
            <div className="custom-duration-box">
              <span className="custom-duration-label">Minutes:</span>
              <button
                type="button"
                className="custom-step-btn"
                onClick={() => {
                  const val = Math.max(1, (Number(customInputVal) || 25) - 5);
                  setCustomInputVal(String(val));
                  applyDuration(val);
                }}
              >
                −5
              </button>
              <input
                type="number"
                min="1"
                max="180"
                className="custom-duration-input"
                value={customInputVal}
                onChange={(e) => setCustomInputVal(e.target.value)}
                onBlur={() => applyDuration(customInputVal)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyDuration(customInputVal);
                }}
              />
              <button
                type="button"
                className="custom-step-btn"
                onClick={() => {
                  const val = Math.min(180, (Number(customInputVal) || 25) + 5);
                  setCustomInputVal(String(val));
                  applyDuration(val);
                }}
              >
                +5
              </button>
              <button
                type="button"
                className="custom-duration-set-btn"
                onClick={() => applyDuration(customInputVal)}
              >
                Set
              </button>
            </div>
          )}

          {/* Circular Countdown */}
          <div className="timer-circle-wrapper">
            <svg className="timer-svg" viewBox="0 0 260 260">
              <circle
                className="timer-bg-circle"
                cx="130"
                cy="130"
                r={radius}
              />
              <circle
                className="timer-progress-circle"
                cx="130"
                cy="130"
                r={radius}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                  stroke: MODE_META[mode].color,
                }}
              />
            </svg>
            <div className="timer-center-content">
              <div className="timer-time-digits">{timeFormatted}</div>
              <div className="timer-status-label">
                {isRunning ? 'Session Active' : `${durations[mode]} min ${MODE_META[mode].label.split(' ')[1]}`}
              </div>
            </div>
          </div>

          {/* Task Link */}
          <div className="focus-task-selector">
            <div className="focus-task-label">LINK TO ACTIVE TASK</div>
            <select
              className="focus-task-select"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            >
              <option value="">No task linked (General focus)</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.text}
                </option>
              ))}
            </select>
          </div>

          {/* Controls: +/- adjustments & playback */}
          <div className="timer-controls">
            <button
              className="timer-action-btn"
              onClick={() => adjustMinutes(-5)}
              title="Subtract 5 minutes"
              aria-label="Subtract 5 minutes"
              disabled={isRunning}
            >
              -5m
            </button>

            <button
              className="timer-action-btn"
              onClick={resetTimer}
              title="Reset timer"
              aria-label="Reset timer"
            >
              ↺
            </button>

            <button
              className="btn btn-primary timer-start-btn"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? '❚❚ Pause' : '▶ Start'}
            </button>

            <button
              className="timer-action-btn"
              onClick={() => setTimeLeft(0)}
              title="Complete session early"
              aria-label="Complete session early"
            >
              ⏭
            </button>

            <button
              className="timer-action-btn"
              onClick={() => adjustMinutes(5)}
              title="Add 5 minutes"
              aria-label="Add 5 minutes"
              disabled={isRunning}
            >
              +5m
            </button>
          </div>
        </div>

        {/* Side Panel: Daily Focus Statistics & Completed Sessions */}
        <div className="focus-side-card">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-title-icon">📊</span>
                Today&apos;s Focus
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="session-stat-card">
                <div>
                  <div className="session-stat-number">{completedSessions.length}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Sessions
                  </div>
                </div>
              </div>
              <div className="session-stat-card">
                <div>
                  <div className="session-stat-number">{totalFocusMinutes}m</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Total Minutes
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-title-icon">📜</span>
                Recent Sessions
              </h2>
            </div>
            {completedSessions.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-5)' }}>
                <p className="empty-state-text">
                  No sessions recorded today. Select a task and press Start!
                </p>
              </div>
            ) : (
              <div className="session-history-list">
                {completedSessions.slice(0, 6).map((session) => (
                  <div className="session-history-item" key={session.id}>
                    <div>
                      <div className="session-history-title">{session.taskTitle}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        {session.durationMins || 25} minutes
                      </div>
                    </div>
                    <div className="session-history-time">{session.timestamp}</div>
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
