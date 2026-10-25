'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks, createTask, toggleTaskComplete } from '@/lib/tasksService';
import Link from 'next/link';

const DEFAULT_PROJECTS = [
  { id: 'proj-1', title: 'Academic / Coursework', icon: '🎓', color: 'var(--color-primary)' },
  { id: 'proj-2', title: 'Personal Growth & Health', icon: '🌱', color: 'var(--color-accent)' },
  { id: 'proj-3', title: 'Portfolio / Web App', icon: '💻', color: 'var(--color-warning)' },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState('proj-1');
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToTasks(user?.uid, (allTasks) => {
      setTasks(allTasks);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    await createTask(user?.uid, {
      text: newTaskText.trim(),
      priority: 'important',
      projectId: selectedProjectId,
    });
    setNewTaskText('');
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📁 Project Hub</h1>
          <p className="page-subtitle">
            Group related tasks and break large milestones into actionable steps.
          </p>
        </div>
        <Link href="/inbox" className="btn btn-secondary">
          View All Tasks
        </Link>
      </div>

      {/* Projects selection cards */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProjectId;
          return (
            <div
              key={proj.id}
              className="card"
              onClick={() => setSelectedProjectId(proj.id)}
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? proj.color : 'var(--border-light)',
                borderWidth: isSelected ? '2px' : '1px',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-card)',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: '1.6rem' }}>{proj.icon}</span>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>
                    {proj.title}
                  </h3>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                    Active Workspace
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Project Tasks Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>{selectedProject.icon}</span> {selectedProject.title} Tasks
          </h2>
          <span className="badge badge-accent">In Progress</span>
        </div>

        {/* Quick add task inside project */}
        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          <input
            type="text"
            placeholder={`＋ Add a new task to ${selectedProject.title}...`}
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem var(--space-4)',
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={!newTaskText.trim()}>
            Add
          </button>
        </form>

        {/* Tasks list */}
        {tasks.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-5)' }}>
            <p className="empty-state-text">No tasks created yet. Add one above to get started!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: task.completed ? 'var(--bg-input)' : 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  opacity: task.completed ? 0.6 : 1,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleTaskComplete(user?.uid, task.id, task.completed)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: '1.5px solid var(--border-medium)',
                    background: task.completed ? 'var(--color-success)' : 'transparent',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  {task.completed && '✓'}
                </button>
                <span
                  style={{
                    flex: 1,
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  }}
                >
                  {task.text}
                </span>
                {task.priority && (
                  <span className={`badge badge-${task.priority === 'urgent' ? 'danger' : 'warning'}`}>
                    {task.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
