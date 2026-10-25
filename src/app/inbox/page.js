'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToTasks,
  toggleTaskComplete,
  deleteTask,
} from '@/lib/tasksService';
import TaskModal from '@/components/TaskModal';
import LinkifiedText from '@/components/LinkifiedText';
import './inbox.css';

const priorityBadge = (p) => {
  const map = {
    urgent: { className: 'badge badge-danger', label: '🔴 Urgent' },
    important: { className: 'badge badge-warning', label: '🟡 Important' },
    optional: { className: 'badge badge-accent', label: '🟢 Optional' },
  };
  const b = map[p] || map.important;
  return <span className={b.className}>{b.label}</span>;
};

export default function InboxPage() {
  const { user, isConfigured } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'top3'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToTasks(user?.uid, (updatedTasks) => {
      setTasks(updatedTasks);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'top3') return t.isTopThree && !t.completed;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📥 Inbox</h1>
          <p className="page-subtitle">
            {activeCount === 0
              ? 'All caught up! No active tasks.'
              : `${activeCount} active task${activeCount === 1 ? '' : 's'} to focus on.`}
            {!isConfigured && ' (Running in local demo mode)'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          ＋ Quick capture
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="inbox-controls">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({tasks.length})
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            className={`filter-tab ${filter === 'top3' ? 'active' : ''}`}
            onClick={() => setFilter('top3')}
          >
            ⭐ Top 3
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({tasks.length - activeCount})
          </button>
        </div>
      </div>

      {/* Task list or Empty state */}
      {filteredTasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📥</div>
            <h3 className="empty-state-title">
              {filter === 'completed'
                ? 'No completed tasks yet'
                : 'No tasks found in this view'}
            </h3>
            <p className="empty-state-text">
              {filter === 'completed'
                ? 'Check off tasks as you finish them to see your completed archive.'
                : 'Capture thoughts, to-dos, or assignment deadlines to keep your mind clear.'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              ＋ Add your first task
            </button>
          </div>
        </div>
      ) : (
        <div className="tasks-container">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? 'is-completed' : ''}`}
            >
              <button
                type="button"
                className={`task-checkbox-btn ${task.completed ? 'checked' : ''}`}
                onClick={() =>
                  toggleTaskComplete(user?.uid, task.id, task.completed)
                }
                title={task.completed ? 'Mark incomplete' : 'Mark completed'}
                aria-label="Toggle task completion"
              >
                {task.completed && '✓'}
              </button>

              <div className="task-details">
                <div className="task-title">
                  <LinkifiedText text={task.text} />
                </div>
                {task.description && (
                  <div className="task-note">
                    <LinkifiedText text={task.description} />
                  </div>
                )}
                <div className="task-meta-row">
                  {priorityBadge(task.priority)}
                  {task.isTopThree && (
                    <span className="task-pin-badge">⭐ Top 3</span>
                  )}
                  {task.dueDate && (
                    <span className="task-due-badge">
                      📅 Due: {task.dueDate}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="task-delete-btn"
                onClick={() => deleteTask(user?.uid, task.id)}
                title="Delete task"
                aria-label="Delete task"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick capture modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
