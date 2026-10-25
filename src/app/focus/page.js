'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks } from '@/lib/tasksService';
import './focus.css';

const MODES = {
  focus: { label: '🎯 Focus', duration: 25 * 60, color: 'var(--color-primary)' },
  shortBreak: { label: '☕ Short Break', duration: 5 * 60, color: 'var(--color-accent)' },
  longBreak: { label: '🌴 Long Break', duration: 15 * 60, color: 'var(--color-warning)' },
};

export default function FocusPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [completedSessions, setCompletedSessions] = useState([]);
  const timerRef = useRef(null);

  const focusStorageKey = `my_planner_focus_${user?.uid || 'guest'}`;

  useEffect(() => {
    const saved = localStorage.getItem(focusStorageKey);
    if (saved) {
      try {
        setCompletedSessions(JSON.parse(saved));
      } catch (e) {
        console.warn(e);
      }
    } else {
      setCompletedSessions([]);
    }
  }, [focusStorageKey]);

  // Subscribe to real tasks to link to sessions
  useEffect(() => {
    const unsubscribe = subscribeToTasks(user?.uid, (allTasks) => {
      setTasks(allTasks.filter((t) => !t.completed));
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  // Audio chime synthesized via standard browser Web Audio API ($0, no network assets required)
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

  // Timer interval loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playChime();

            // Record session
            if (mode === 'focus') {
              const currentTask = tasks.find((t) => t.id === selectedTaskId);
              const sessionRecord = {
                id: Date.now(),
                taskTitle: currentTask ? currentTask.text : 'General Focus Session',
                durationMins: 25,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setCompletedSessions((prev) => {
                const updated = [sessionRecord, ...prev];
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
  }, [isRunning, mode, selectedTaskId, tasks]);

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].duration);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Circular progress calculations
  const totalDuration = MODES[mode].duration;
  const progressRatio = (totalDuration - timeLeft) / totalDuration;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const totalFocusMinutes = completedSessions.reduce((acc, s) => acc + s.durationMins, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⏱️ Focus Timer</h1>
          <p className="page-subtitle">
            Timed deep work blocks paired with restorative breaks.
          </p>
        </div>
      </div>

      <div className="focus-layout">
        {/* Main Timer Display */}
        <div className="focus-timer-card">
          {/* Mode pills */}
          <div className="timer-mode-pills">
            {Object.keys(MODES).map((mKey) => (
              <button
                key={mKey}
                className={`timer-mode-btn ${mode === mKey ? 'active' : ''}`}
                onClick={() => switchMode(mKey)}
              >
                {MODES[mKey].label}
              </button>
            ))}
          </div>

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
                  stroke: MODES[mode].color,
                }}
              />
            </svg>
            <div className="timer-center-content">
              <div className="timer-time-digits">{timeFormatted}</div>
              <div className="timer-status-label">
                {isRunning ? 'Session Active' : 'Ready to Focus'}
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

          {/* Controls */}
          <div className="timer-controls">
            <button
              className="timer-action-btn"
              onClick={resetTimer}
              title="Reset timer"
              aria-label="Reset timer"
            >
              ↺
            </button>
            <button
              className={`btn btn-primary timer-start-btn`}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? '❚❚ Pause' : '▶ Start'}
            </button>
            <button
              className="timer-action-btn"
              onClick={() => setTimeLeft(0)}
              title="Skip to end"
              aria-label="Skip to end"
            >
              ⏭
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
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Total Time
                  </div>
                  <div className="session-stat-number">{totalFocusMinutes}m</div>
                </div>
              </div>
              <div className="session-stat-card">
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Sessions
                  </div>
                  <div className="session-stat-number">{completedSessions.length}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <span className="card-title-icon">📝</span>
                Completed Sessions
              </h2>
            </div>

            {completedSessions.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-5)' }}>
                <p className="empty-state-text">
                  Complete your first 25-minute session to log it here.
                </p>
              </div>
            ) : (
              <div className="session-history-list">
                {completedSessions.map((session) => (
                  <div className="session-history-item" key={session.id}>
                    <div>
                      <div className="session-history-title">{session.taskTitle}</div>
                      <div className="session-history-time">Finished at {session.timestamp}</div>
                    </div>
                    <span className="badge badge-accent">+{session.durationMins}m</span>
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
