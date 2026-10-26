'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToTasks,
  toggleTaskComplete,
  deleteTask,
} from '@/lib/tasksService';
import VoiceTaskBar from '@/components/VoiceTaskBar';
import TaskModal from '@/components/TaskModal';
import LinkifiedText from '@/components/LinkifiedText';
import './inbox.css';

const PRIORITY_BADGE = {
  urgent: { className: 'badge-pill priority-high', label: 'Urgent' },
  important: { className: 'badge-pill priority-normal', label: 'Normal' },
  optional: { className: 'badge-pill priority-low', label: 'Optional' },
};

function TaskRow({ task, onToggle, onDelete }) {
  const p = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.important;
  const isAcademic = task.category === 'academic';

  return (
    <div
      className={`task-row ${task.completed ? 'is-completed' : ''} ${
        isAcademic ? 'row-academic' : 'row-personal'
      }`}
    >
      <button
        type="button"
        className={`task-row-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={onToggle}
        aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
      >
        {task.completed && '✓'}
      </button>

      <div className="task-row-content">
        <div className="task-row-title">
          <LinkifiedText text={task.text} />
        </div>
        {task.description && (
          <div className="task-row-note">
            <LinkifiedText text={task.description} />
          </div>
        )}
        <div className="task-row-meta">
          <span className={`badge-pill ${isAcademic ? 'academic' : 'personal'}`}>
            {isAcademic ? 'Academic' : 'Personal'}
          </span>
          {task.priority === 'urgent' && <span className={p.className}>{p.label}</span>}
          {task.isTopThree && <span className="badge-pill top-three">Top 3</span>}
          {task.dueDate && <span className="badge-pill due">Due {task.dueDate}</span>}
        </div>
      </div>

      <button
        type="button"
        className="task-row-delete"
        onClick={onDelete}
        title="Delete task"
        aria-label="Delete task"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}

export default function InboxPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active'); // active | top3 | completed | all
  const [domainFilter, setDomainFilter] = useState('all'); // all | personal | academic
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('personal');

  useEffect(() => {
    const unsubscribe = subscribeToTasks(user?.uid, (updatedTasks) => {
      setTasks(updatedTasks);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.uid]);

  // Status Filter
  const statusFiltered = tasks.filter((t) => {
    if (statusFilter === 'active') return !t.completed;
    if (statusFilter === 'completed') return t.completed;
    if (statusFilter === 'top3') return t.isTopThree && !t.completed;
    return true;
  });

  // Domain Filter
  const filteredTasks =
    domainFilter === 'all'
      ? statusFiltered
      : statusFiltered.filter((t) => (t.category || 'personal') === domainFilter);

  const activeCount = tasks.filter((t) => !t.completed).length;
  const personalActive = tasks.filter((t) => !t.completed && (t.category || 'personal') === 'personal').length;
  const academicActive = tasks.filter((t) => !t.completed && (t.category || 'personal') === 'academic').length;
  const top3Count = tasks.filter((t) => !t.completed && t.isTopThree).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const showGrouped = domainFilter === 'all' && statusFilter === 'active';
  const personalTasks = showGrouped
    ? filteredTasks.filter((t) => (t.category || 'personal') === 'personal')
    : [];
  const academicTasks = showGrouped
    ? filteredTasks.filter((t) => (t.category || 'personal') === 'academic')
    : [];

  const handleOpenDetailedModal = (cat = 'personal') => {
    setModalCategory(cat);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in inbox-page-calm">
      {/* Page Header */}
      <div className="inbox-header-row">
        <div>
          <h1 className="inbox-title">Inbox</h1>
          <p className="inbox-subtitle">
            {activeCount === 0
              ? 'All tasks completed'
              : `${personalActive} personal · ${academicActive} academic active`}
          </p>
        </div>
        <button
          type="button"
          className="btn-detailed-add"
          onClick={() => handleOpenDetailedModal(domainFilter === 'academic' ? 'academic' : 'personal')}
        >
          + Detailed task
        </button>
      </div>

      {/* Prominent Voice & Quick Text Bar */}
      <section className="inbox-quick-bar" aria-label="Add task by voice or text">
        <VoiceTaskBar
          placeholder="Type a task or click Add task by voice..."
          onTaskCreated={() => {}}
        />
      </section>

      {/* Scannable Filters */}
      <div className="inbox-filter-bar">
        {/* Domain Tabs */}
        <div className="domain-pill-group" role="tablist" aria-label="Filter by domain">
          <button
            type="button"
            className={`domain-pill ${domainFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDomainFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`domain-pill personal ${domainFilter === 'personal' ? 'active' : ''}`}
            onClick={() => setDomainFilter('personal')}
          >
            Personal ({personalActive})
          </button>
          <button
            type="button"
            className={`domain-pill academic ${domainFilter === 'academic' ? 'active' : ''}`}
            onClick={() => setDomainFilter('academic')}
          >
            Academic ({academicActive})
          </button>
        </div>

        {/* Status Tabs */}
        <div className="status-pill-group" role="tablist" aria-label="Filter by status">
          <button
            type="button"
            className={`status-pill ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            className={`status-pill ${statusFilter === 'top3' ? 'active' : ''}`}
            onClick={() => setStatusFilter('top3')}
          >
            Top 3 ({top3Count})
          </button>
          <button
            type="button"
            className={`status-pill ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Done ({completedCount})
          </button>
          <button
            type="button"
            className={`status-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({tasks.length})
          </button>
        </div>
      </div>

      {/* Main Task List */}
      {filteredTasks.length === 0 ? (
        <div className="inbox-empty-card">
          <p className="inbox-empty-title">
            {statusFilter === 'completed' ? 'No completed tasks yet' : 'No tasks in this view'}
          </p>
          <p className="inbox-empty-hint">
            Use the voice microphone above or type a quick note to add your next task.
          </p>
        </div>
      ) : showGrouped ? (
        /* Dual-Domain Structured View */
        <div className="inbox-domain-sections">
          {/* Personal Section */}
          <div className="domain-section-block">
            <div className="domain-section-head">
              <span className="domain-section-title">Personal</span>
              <span className="domain-section-count">{personalTasks.length}</span>
            </div>
            {personalTasks.length === 0 ? (
              <div className="domain-empty-row">No active personal tasks</div>
            ) : (
              <div className="compact-task-container">
                {personalTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskComplete(user?.uid, task.id, task.completed)}
                    onDelete={() => deleteTask(user?.uid, task.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Academic Section */}
          <div className="domain-section-block">
            <div className="domain-section-head">
              <span className="domain-section-title">Academic</span>
              <span className="domain-section-count">{academicTasks.length}</span>
            </div>
            {academicTasks.length === 0 ? (
              <div className="domain-empty-row">No active academic tasks</div>
            ) : (
              <div className="compact-task-container">
                {academicTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskComplete(user?.uid, task.id, task.completed)}
                    onDelete={() => deleteTask(user?.uid, task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Unified Compact List */
        <div className="compact-task-container card">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => toggleTaskComplete(user?.uid, task.id, task.completed)}
              onDelete={() => deleteTask(user?.uid, task.id)}
            />
          ))}
        </div>
      )}

      {/* Task Modal for advanced options */}
      <TaskModal
        isOpen={isModalOpen}
        initialCategory={modalCategory}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
