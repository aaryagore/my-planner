'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createTask } from '@/lib/tasksService';
import { parseVoiceTask } from '@/lib/voiceParser';
import './VoiceTaskBar.css';

export default function VoiceTaskBar({ onTaskCreated, placeholder = 'Add a task or click "Add task by voice"...' }) {
  const { user } = useAuth();
  const [typedText, setTypedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speechError, setSpeechError] = useState(null);
  const [pendingTask, setPendingTask] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const recognitionRef = useRef(null);
  const textInputRef = useRef(null);

  // Initialize SpeechRecognition safely
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const startVoiceInput = () => {
    setSpeechError(null);
    setLiveTranscript('');

    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setSpeechError(
        'Voice input is not supported by your current browser. You can type your task in the box beside.'
      );
      if (textInputRef.current) textInputRef.current.focus();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setLiveTranscript(transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError(
            'Microphone access was denied. Please allow microphone permissions in your browser or type your task.'
          );
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech was detected. Please try speaking again.');
        } else {
          setSpeechError(`Voice error: ${event.error}. You can still type your task.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setLiveTranscript((latestTranscript) => {
          if (latestTranscript && latestTranscript.trim().length > 0) {
            handleProcessTranscript(latestTranscript);
          }
          return '';
        });
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setSpeechError('Could not start microphone. You can type your task instead.');
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const handleProcessTranscript = (spokenText) => {
    const parsed = parseVoiceTask(spokenText);
    setPendingTask(parsed);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!typedText.trim()) return;
    const parsed = parseVoiceTask(typedText);
    setPendingTask(parsed);
    setTypedText('');
  };

  const handleConfirmSave = async () => {
    if (!pendingTask || !pendingTask.text.trim()) return;
    setIsSaving(true);
    try {
      await createTask(user?.uid, {
        text: pendingTask.text.trim(),
        description: pendingTask.description || '',
        category: pendingTask.category || 'personal',
        priority: pendingTask.priority || 'important',
        dueDate: pendingTask.dueDate || null,
        isTopThree: Boolean(pendingTask.isTopThree),
      });

      setPendingTask(null);
      if (typeof onTaskCreated === 'function') {
        onTaskCreated();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelConfirmation = () => {
    setPendingTask(null);
  };

  return (
    <div className="voice-task-bar-container">
      {/* Primary Voice + Text Bar */}
      <div className={`voice-task-bar ${isListening ? 'is-listening' : ''}`}>
        {/* Prominent Microphone Voice Button */}
        <button
          type="button"
          className={`btn-voice-capture ${isListening ? 'listening' : ''}`}
          onClick={isListening ? stopVoiceInput : startVoiceInput}
          aria-label={isListening ? 'Stop listening' : 'Add task by voice'}
          title="Speak your task (e.g. 'Remind me to print my notes tomorrow at 5pm')"
        >
          <span className="voice-mic-icon">
            {isListening ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </span>
          <span className="voice-btn-label">
            {isListening ? 'Listening...' : 'Add task by voice'}
          </span>
        </button>

        {/* Text Entry Beside the Microphone */}
        <form className="voice-text-form" onSubmit={handleTextSubmit}>
          <input
            ref={textInputRef}
            type="text"
            className="voice-text-input"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder={isListening ? 'Listening to your voice...' : placeholder}
            disabled={isListening}
          />
          <button
            type="submit"
            className="btn-text-add"
            disabled={!typedText.trim() || isListening}
            aria-label="Add typed task"
          >
            Add
          </button>
        </form>
      </div>

      {/* Live Listening Feedback Banner */}
      {isListening && (
        <div className="voice-live-indicator" role="status" aria-live="polite">
          <div className="voice-pulse-ring"></div>
          <div className="voice-listening-info">
            <span className="voice-listening-title">Listening... Speak now</span>
            <span className="voice-listening-hint">
              Try: &ldquo;Remind me to print my notes tomorrow&rdquo; or &ldquo;Urgent buy groceries today&rdquo;
            </span>
            {liveTranscript && (
              <div className="voice-live-text">&ldquo;{liveTranscript}&rdquo;</div>
            )}
          </div>
          <button
            type="button"
            className="btn-stop-listening"
            onClick={stopVoiceInput}
          >
            Done speaking
          </button>
        </div>
      )}

      {/* Error or Notice Banner */}
      {speechError && (
        <div className="voice-error-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="voice-error-text">{speechError}</span>
          <button
            type="button"
            className="voice-error-dismiss"
            onClick={() => setSpeechError(null)}
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* Confirmation Modal: Review, Edit, Save, or Cancel */}
      {pendingTask && (
        <div className="task-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-task-title">
          <div className="task-confirm-card">
            <div className="task-confirm-header">
              <div className="task-confirm-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Confirm Task Details
              </div>
              <button
                type="button"
                className="task-confirm-close"
                onClick={handleCancelConfirmation}
                aria-label="Cancel"
              >
                ✕
              </button>
            </div>

            <p className="task-confirm-desc">
              We parsed the details from your input. Review or edit before saving:
            </p>

            <div className="task-confirm-body">
              {/* Task Title */}
              <div className="confirm-field">
                <label htmlFor="confirm-task-text">Task</label>
                <input
                  id="confirm-task-text"
                  type="text"
                  className="confirm-input"
                  value={pendingTask.text}
                  onChange={(e) =>
                    setPendingTask({ ...pendingTask, text: e.target.value })
                  }
                  autoFocus
                />
              </div>

              {/* Category Selection */}
              <div className="confirm-field">
                <label>Category</label>
                <div className="confirm-toggle-group">
                  <button
                    type="button"
                    className={`confirm-toggle-btn ${pendingTask.category === 'personal' ? 'active personal' : ''}`}
                    onClick={() =>
                      setPendingTask({ ...pendingTask, category: 'personal' })
                    }
                  >
                    Personal
                  </button>
                  <button
                    type="button"
                    className={`confirm-toggle-btn ${pendingTask.category === 'academic' ? 'active academic' : ''}`}
                    onClick={() =>
                      setPendingTask({ ...pendingTask, category: 'academic' })
                    }
                  >
                    Academic
                  </button>
                </div>
              </div>

              {/* Priority & Due Date Row */}
              <div className="confirm-row">
                <div className="confirm-field">
                  <label htmlFor="confirm-task-priority">Priority</label>
                  <select
                    id="confirm-task-priority"
                    className="confirm-select"
                    value={pendingTask.priority}
                    onChange={(e) =>
                      setPendingTask({ ...pendingTask, priority: e.target.value })
                    }
                  >
                    <option value="urgent">High / Urgent</option>
                    <option value="important">Normal</option>
                    <option value="optional">Low / Optional</option>
                  </select>
                </div>

                <div className="confirm-field">
                  <label htmlFor="confirm-task-due">Due Date</label>
                  <input
                    id="confirm-task-due"
                    type="date"
                    className="confirm-input"
                    value={pendingTask.dueDate || ''}
                    onChange={(e) =>
                      setPendingTask({
                        ...pendingTask,
                        dueDate: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>

              {/* Notes / Time Details */}
              <div className="confirm-field">
                <label htmlFor="confirm-task-notes">Notes or Time Details</label>
                <input
                  id="confirm-task-notes"
                  type="text"
                  className="confirm-input"
                  placeholder="Optional notes or time (e.g. 17:00)"
                  value={pendingTask.description || ''}
                  onChange={(e) =>
                    setPendingTask({
                      ...pendingTask,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              {/* Top 3 Checkbox */}
              <label className="confirm-checkbox-label">
                <input
                  type="checkbox"
                  checked={pendingTask.isTopThree}
                  onChange={(e) =>
                    setPendingTask({
                      ...pendingTask,
                      isTopThree: e.target.checked,
                    })
                  }
                />
                <span>Pin to Today&apos;s Top 3 priorities</span>
              </label>
            </div>

            {/* Actions */}
            <div className="task-confirm-actions">
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={handleCancelConfirmation}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-save"
                onClick={handleConfirmSave}
                disabled={isSaving || !pendingTask.text.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
