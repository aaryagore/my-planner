'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks } from '@/lib/tasksService';
import { subscribeToHabits } from '@/lib/habitsService';
import LinkifiedText from '@/components/LinkifiedText';

export default function ReviewPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [reflection, setReflection] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('my_planner_daily_reflection');
    if (saved) setReflection(saved);
  }, []);

  useEffect(() => {
    const unsubTasks = subscribeToTasks(user?.uid, (allTasks) => setTasks(allTasks));
    const unsubHabits = subscribeToHabits(user?.uid, (allHabits) => setHabits(allHabits));
    return () => {
      if (typeof unsubTasks === 'function') unsubTasks();
      if (typeof unsubHabits === 'function') unsubHabits();
    };
  }, [user?.uid]);

  const handleSaveReflection = (e) => {
    e.preventDefault();
    localStorage.setItem('my_planner_daily_reflection', reflection);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const completedTasks = tasks.filter((t) => t.completed);
  const activeTasks = tasks.filter((t) => !t.completed);
  const habitsMet = habits.filter((h) => h.done >= h.target).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Review & Retrospective</h1>
          <p className="page-subtitle">
            Reflect on your accomplishments, celebrate consistency, and plan tomorrow.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-success)' }}>
            {completedTasks.length}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
            TASKS COMPLETED
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-primary)' }}>
            {habitsMet} / {habits.length || 0}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
            HABIT TARGETS MET
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-warning)' }}>
            {activeTasks.length}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
            PENDING IN INBOX
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Daily Reflection Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🌙</span> End-of-Day Reflection
            </h2>
            {savedNotice && <span className="badge badge-accent">Saved!</span>}
          </div>

          <form onSubmit={handleSaveReflection}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
              Take two minutes to jot down what worked well today and what you want to adjust tomorrow.
            </p>

            <textarea
              rows={6}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What went well today? What was a challenge? What is the main priority for tomorrow?"
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                background: 'var(--bg-input)',
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: 'var(--font-size-sm)',
                resize: 'vertical',
                marginBottom: 'var(--space-4)',
              }}
            />

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Reflection Note
            </button>
          </form>
        </div>

        {/* Completed Tasks Highlight */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-title-icon">🏆</span> Completed Archive
            </h2>
            <span className="badge badge-accent">{completedTasks.length} Done</span>
          </div>

          {completedTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
              <p className="empty-state-text">
                Check off items in your inbox or dashboard to see your finished accomplishments here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {completedTasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <span style={{ color: 'var(--color-success)', fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', flex: 1 }}>
                    <LinkifiedText text={task.text} />
                  </span>
                  {task.priority && (
                    <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                      {task.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
