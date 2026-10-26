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

const PRIORITY_BADGE = {
  urgent: { className: 'badge badge-danger', label: '🔴 Urgent' },
  important: { className: 'badge badge-warning', label: '🟡 Important' },
  optional: { className: 'badge badge-accent', label: '🔵 Optional' },
};

const CATEGORY_CONFIG = {
  personal: {
    key: 'personal',
    label: 'Personal',
    icon: '🏠',
    className: 'category-chip personal',
    badgeClass: 'personal-tag',
  },
  academic: {
    key: 'academic',
    label: 'Academic',
    icon: '🎓',
    className: 'category-chip academic',
    badgeClass: 'academic-tag',
  },
};

function PriorityBadge({ priority }) {
  const b = PRIORITY_BADGE[priority] || PRIORITY_BADGE.important;
  return <span className={b.className}>{b.label}</span>;
}

function TaskItem({ task, onToggle, onDelete }) {
  const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.personal;

  return (
    <div className={`task-item ${task.category === 'academic' ? 'task-academic' : 'task-personal'} ${task.completed ? 'is-completed' : ''}`}>
      <button
        type="button"
        className={`task-checkbox-btn ${task.completed ? 'checked' : ''}`}
        onClick={onToggle}
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
          <span className={cat.className}>
            {cat.icon} {cat.label}
          </span>
          <PriorityBadge priority={task.priority} />
          {task.isTopThree && <span className="task-pin-badge">⭐ Top 3</span>}
          {task.dueDate && <span className="task-due-badge">📅 {task.dueDate}</span>}
        </div>
      </div>

      <button
        type="button"
        className="task-delete-btn"
        onClick={onDelete}
        title="Delete task"
        aria-label="Delete task"
      >
        🗑️
      </button>
    </div>
  );
}

function CategorySection({ config, tasks, onAddTask, user }) {
  return (
    <div className={`category-section-card ${config.key}`}>
      <div className="category-section-header">
        <div className="category-section-title-wrap">
          <span className="category-section-icon">{config.icon}</span>
          <div>
            <h2 className="category-section-title">{config.label}</h2>
            <span className="category-section-subtitle">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        </div>
        <button
          className={`btn-subtle-add ${config.key}`}
          onClick={() => onAddTask(config.key)}
          title={`Add ${config.label} task`}
        >
          ＋ Add {config.label}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="category-empty-state">
          <p className="category-empty-text">No active {config.label.toLowerCase()} tasks</p>
          <button
            type="button"
            className="category-empty-btn"
            onClick={() => onAddTask(config.key)}
          >
            ＋ Add {config.label} task
          </button>
        </div>
      ) : (
        <div className="tasks-container">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTaskComplete(user?.uid, task.id, task.completed)}
              onDelete={() => deleteTask(user?.uid, task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  const { user, isConfigured } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active');
  const [domainFilter, setDomainFilter] = useState('all');
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

  const handleOpenModal = (category = 'personal') => {
    setModalCategory(category);
    setIsModalOpen(true);
  };

  const statusFiltered = tasks.filter((t) => {
    if (statusFilter === 'active') return !t.completed;
    if (statusFilter === 'completed') return t.completed;
    if (statusFilter === 'top3') return t.isTopThree && !t.completed;
    return true;
  });

  const filteredTasks = domainFilter === 'all'
    ? statusFiltered
    : statusFiltered.filter((t) => (t.category || 'personal') === domainFilter);

  const activeTasks = tasks.filter((t) => !t.completed);
  const activePersonal = activeTasks.filter((t) => (t.category || 'personal') === 'personal').length;
  const activeAcademic = activeTasks.filter((t) => (t.category || 'personal') === 'academic').length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const personalTasks = statusFiltered.filter((t) => (t.category || 'personal') === 'personal');
  const academicTasks = statusFiltered.filter((t) => (t.category || 'personal') === 'academic');

  const isGroupedView = domainFilter === 'all' && statusFilter !== 'completed';

  return (
    <div className="animate-fade-in inbox-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📥 Task Management</h1>
          <p className="page-subtitle">
            <span className="summary-pill personal-pill">🏠 {activePersonal} Personal</span>
            <span className="summary-separator">•</span>
            <span className="summary-pill academic-pill">🎓 {activeAcademic} Academic</span>
            {!isConfigured && <span className="demo-badge">Demo Mode</span>}
          </p>
        </div>
        <div className="header-action-group">
          <button
            className="btn btn-outline"
            onClick={() => handleOpenModal('academic')}
          >
            🎓 + Academic
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleOpenModal(domainFilter === 'academic' ? 'academic' : 'personal')}
          >
            ＋ Quick Capture
          </button>
        </div>
      </div>

      <div className="inbox-controls-wrapper">
        <div className="domain-switcher">
          <button
            className={`domain-tab ${domainFilter === 'all' ? 'active' : ''}`}
            onClick={() => setDomainFilter('all')}
          >
            <span className="domain-tab-title">All Domains</span>
            <span className="domain-tab-count">{statusFiltered.length}</span>
          </button>
          <button
            className={`domain-tab personal ${domainFilter === 'personal' ? 'active' : ''}`}
            onClick={() => setDomainFilter('personal')}
          >
            <span className="domain-tab-title">🏠 Personal</span>
            <span className="domain-tab-count">{personalTasks.length}</span>
          </button>
          <button
            className={`domain-tab academic ${domainFilter === 'academic' ? 'active' : ''}`}
            onClick={() => setDomainFilter('academic')}
          >
            <span className="domain-tab-title">🎓 Academic</span>
            <span className="domain-tab-count">{academicTasks.length}</span>
          </button>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active ({activeTasks.length})
          </button>
          <button
            className={`filter-tab ${statusFilter === 'top3' ? 'active' : ''}`}
            onClick={() => setStatusFilter('top3')}
          >
            ⭐ Top 3
          </button>
          <button
            className={`filter-tab ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Done ({completedCount})
          </button>
          <button
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({tasks.length})
          </button>
        </div>
      </div>

      {statusFiltered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📥</div>
            <h3 className="empty-state-title">
              {statusFilter === 'completed' ? 'No completed tasks yet' : 'No tasks in this view'}
            </h3>
            <p className="empty-state-text">
              {statusFilter === 'completed'
                ? 'Check off tasks as you finish them to see your completed archive.'
                : 'Keep your personal life and academic deadlines organized.'}
            </p>
            <div className="empty-state-actions">
              <button
                className="btn btn-outline"
                onClick={() => handleOpenModal('academic')}
              >
                🎓 Add Academic Task
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleOpenModal('personal')}
              >
                🏠 Add Personal Task
              </button>
            </div>
          </div>
        </div>
      ) : isGroupedView ? (
        <div className="domains-split-grid">
          <CategorySection
            config={CATEGORY_CONFIG.personal}
            tasks={personalTasks}
            onAddTask={handleOpenModal}
            user={user}
          />
          <CategorySection
            config={CATEGORY_CONFIG.academic}
            tasks={academicTasks}
            onAddTask={handleOpenModal}
            user={user}
          />
        </div>
      ) : (
        <div className="card filtered-list-card">
          <div className="filtered-list-header">
            <span className="filtered-list-title">
              {domainFilter === 'personal' && '🏠 Personal Tasks'}
              {domainFilter === 'academic' && '🎓 Academic Tasks'}
              {domainFilter === 'all' && statusFilter === 'completed' && '✓ Completed Archive'}
            </span>
            <span className="filtered-list-badge">{filteredTasks.length}</span>
          </div>
          <div className="tasks-container">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleTaskComplete(user?.uid, task.id, task.completed)}
                onDelete={() => deleteTask(user?.uid, task.id)}
              />
            ))}
          </div>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        initialCategory={modalCategory}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
