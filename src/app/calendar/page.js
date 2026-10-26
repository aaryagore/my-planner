'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToTasks } from '@/lib/tasksService';
import './calendar.css';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const COLOR_OPTIONS = [
  { label: 'Indigo',  value: 'var(--color-primary)' },
  { label: 'Teal',   value: 'var(--color-accent)' },
  { label: 'Amber',  value: 'var(--color-warning)' },
  { label: 'Coral',  value: '#f87171' },
  { label: 'Purple', value: '#a78bfa' },
  { label: 'Green',  value: '#34d399' },
];

function pad(n) { return String(n).padStart(2, '0'); }
function uid() { return Math.random().toString(36).slice(2, 9); }

export default function CalendarPage() {
  const { user } = useAuth();
  const [view, setView]     = useState('day');
  const [blocks, setBlocks] = useState([]);
  const [tasks, setTasks]   = useState([]);
  const [currentHour, setCurrentHour] = useState(null);
  const [todayInfo, setTodayInfo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mStart, setMStart]       = useState(0);
  const [mDuration, setMDuration] = useState(1);
  const [mTitle, setMTitle]       = useState('');
  const [mColor, setMColor]       = useState(COLOR_OPTIONS[0].value);

  const storageKey = 'my_planner_blocks_v2_' + (user && user.uid ? user.uid : 'guest');

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) { try { setBlocks(JSON.parse(saved)); } catch (e) { console.warn(e); } }
  }, [storageKey]);

  const saveBlocks = (updated) => {
    setBlocks(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    window.dispatchEvent(new Event('schedule-slots-changed'));
  };

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentHour(now.getHours());
      const curYear = now.getFullYear();
      const curMonth = now.getMonth();
      setTodayInfo({
        now,
        curYear,
        curMonth,
        daysInMonth: new Date(curYear, curMonth + 1, 0).getDate(),
        startOffset: (new Date(curYear, curMonth, 1).getDay() + 6) % 7,
        monthName: now.toLocaleString('default', { month: 'long' }),
        todayDate: now.getDate(),
      });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const unsub = subscribeToTasks(user && user.uid ? user.uid : null, (all) =>
      setTasks(all.filter((t) => !t.completed))
    );
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [user]);

  const coveredSet = new Set();
  blocks.forEach((b) => {
    for (let i = 1; i < b.duration; i++) coveredSet.add(b.startHour + i);
  });

  const maxDurFrom = (startHour, exceptId) => {
    const next = blocks
      .filter((b) => b.id !== exceptId && b.startHour > startHour)
      .sort((a, b) => a.startHour - b.startHour)[0];
    return next ? next.startHour - startHour : 24 - startHour;
  };

  const openCreate = (hour) => {
    setEditingId(null); setMStart(hour); setMDuration(1);
    setMTitle(''); setMColor(COLOR_OPTIONS[0].value); setModalOpen(true);
  };

  const openEdit = (block) => {
    setEditingId(block.id); setMStart(block.startHour); setMDuration(block.duration);
    setMTitle(block.title); setMColor(block.color || COLOR_OPTIONS[0].value); setModalOpen(true);
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
    saveBlocks(blocks.filter((b) => b.id !== editingId));
    setModalOpen(false);
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const { curYear, curMonth, daysInMonth, startOffset, monthName, todayDate } = todayInfo || {};

  return (
    <div className='animate-fade-in'>
      <div className='page-header'>
        <div>
          <h1 className='page-title'>📅 Calendar &amp; Time Blocking</h1>
          <p className='page-subtitle'>Click any row to schedule a block. Blocks can span multiple hours.</p>
        </div>
        <div className='calendar-view-toggles'>
          <button className={'calendar-view-btn' + (view === 'day' ? ' active' : '')} onClick={() => setView('day')}>Daily Time Blocks</button>
          <button className={'calendar-view-btn' + (view === 'month' ? ' active' : '')} onClick={() => setView('month')}>Monthly Overview</button>
        </div>
      </div>

      {view === 'day' ? (
        <div className='card'>
          <div className='card-header'>
            <h2 className='card-title'>
              <span className='card-title-icon'>🕐</span>
              Today&apos;s Schedule
            </h2>
            <button className='btn btn-ghost' onClick={() => saveBlocks([])}>Clear All</button>
          </div>
          <div className='schedule-grid'>
            {HOURS.map((hour) => {
              if (coveredSet.has(hour)) return null;
              const block  = blocks.find((b) => b.startHour === hour);
              const isNow  = hour === currentHour;
              const isNight = hour >= 0 && hour <= 5;
              const rowH   = block ? block.duration * 62 - 8 : 54;
              return (
                <div key={hour} className={'schedule-row' + (isNow ? ' is-now' : '') + (isNight ? ' is-night' : '')} style={{ minHeight: rowH + 'px' }}>
                  <div className='schedule-time-col'>
                    <span className='schedule-time-label'>
                      {pad(hour)}:00
                      {isNow && <span className='now-dot' title='Now' />}
                    </span>
                    {block && block.duration > 1 && (
                      <span className='schedule-time-end'>→ {pad(hour + block.duration)}:00</span>
                    )}
                  </div>
                  <div
                    className={'schedule-slot' + (block ? ' has-block' : '')}
                    style={block ? { borderLeftColor: block.color } : {}}
                    onClick={() => block ? openEdit(block) : openCreate(hour)}
                  >
                    {block ? (
                      <div className='schedule-block-inner'>
                        <div>
                          <div className='schedule-block-title'>{block.title}</div>
                          <div className='schedule-block-meta'>
                            {block.duration} hr{block.duration > 1 ? 's' : ''} &nbsp;·&nbsp; {pad(hour)}:00 – {pad(hour + block.duration)}:00
                          </div>
                        </div>
                        <span className='schedule-color-dot' style={{ background: block.color }} />
                      </div>
                    ) : (
                      <span className='schedule-empty-hint'>+ Click to schedule</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className='card'>
          <div className='card-header'>
            <h2 className='card-title'>
              <span className='card-title-icon'>🗓️</span>
              {monthName} {curYear}
            </h2>
          </div>
          <div className='month-calendar-grid'>
            {daysOfWeek.map((d) => (
              <div key={d} className='month-day-header'>{d}</div>
            ))}
            {todayInfo && Array.from({ length: startOffset }, (_, i) => <div key={'e' + i} />)}
            {todayInfo && Array.from({ length: daysInMonth }, (_, i) => {
              const dayNum = i + 1;
              const isToday = dayNum === todayDate;
              const dayTasks = tasks.filter((t) => {
                if (!t.dueDate) return false;
                const parts = t.dueDate.split('-').map(Number);
                return parts[0] === curYear && parts[1] === curMonth + 1 && parts[2] === dayNum;
              });
              return (
                <div key={dayNum} className={'month-day-cell' + (isToday ? ' is-today' : '')}>
                  <div className='month-day-num'>{dayNum}{isToday ? ' (Today)' : ''}</div>
                  {dayTasks.map((t) => (
                    <div key={t.id} className='month-day-dot' style={{ background: t.priority === 'urgent' ? 'var(--color-danger)' : t.priority === 'important' ? 'var(--color-warning)' : 'var(--color-primary)' }} title={t.text}>{t.text}</div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className='task-modal-backdrop' onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className='task-modal-dialog block-modal'>
            <div className='task-modal-header'>
              <h2 className='task-modal-title'>
                <span>📦</span>
                {editingId ? 'Edit Block' : 'New Block — ' + pad(mStart) + ':00'}
              </h2>
              <button className='task-modal-close' onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className='task-modal-body'>
                {tasks.length > 0 && (
                  <div className='task-input-field'>
                    <label>Pick from active tasks</label>
                    <select defaultValue='' onChange={(e) => { if (e.target.value) setMTitle(e.target.value); }}>
                      <option value=''>— Choose a task —</option>
                      {tasks.map((t) => <option key={t.id} value={t.text}>{t.text}</option>)}
                    </select>
                  </div>
                )}
                <div className='task-input-field'>
                  <label htmlFor='block-title'>What are you doing?</label>
                  <input id='block-title' type='text' placeholder='e.g. Sleep, DSA Practice, Deep Work' value={mTitle} onChange={(e) => setMTitle(e.target.value)} required autoFocus />
                </div>
                <div className='block-time-row'>
                  <div className='task-input-field' style={{ flex: 1 }}>
                    <label htmlFor='block-start'>Start time</label>
                    <select id='block-start' value={mStart} onChange={(e) => { const s = Number(e.target.value); setMStart(s); setMDuration(Math.min(mDuration, maxDurFrom(s, editingId))); }}>
                      {HOURS.map((h) => <option key={h} value={h}>{pad(h)}:00</option>)}
                    </select>
                  </div>
                  <div className='task-input-field' style={{ flex: 1 }}>
                    <label htmlFor='block-dur'>Duration (hours)</label>
                    <select id='block-dur' value={mDuration} onChange={(e) => setMDuration(Number(e.target.value))}>
                      {Array.from({ length: maxDurFrom(mStart, editingId) }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n} hr{n > 1 ? 's' : ''} → {pad(mStart + n)}:00</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className='task-input-field'>
                  <label>Color</label>
                  <div className='color-swatch-row'>
                    {COLOR_OPTIONS.map((c) => (
                      <button key={c.value} type='button' title={c.label} className={'color-swatch' + (mColor === c.value ? ' selected' : '')} style={{ background: c.value }} onClick={() => setMColor(c.value)} />
                    ))}
                  </div>
                </div>
              </div>
              <div className='task-modal-footer'>
                {editingId && (
                  <button type='button' className='btn btn-secondary' onClick={handleDelete} style={{ marginRight: 'auto', color: 'var(--color-danger)' }}>Delete Block</button>
                )}
                <button type='button' className='btn btn-secondary' onClick={() => setModalOpen(false)}>Cancel</button>
                <button type='submit' className='btn btn-primary'>Save Block</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
