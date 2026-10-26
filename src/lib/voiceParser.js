// ============================================================
// Natural Language Task Parser
// ============================================================
// Parses spoken phrases or typed input (e.g. "Remind me to print my notes tomorrow at 5pm")
// into structured task fields: text, dueDate, dueTime, category, priority, isTopThree.
// Completely local, private, and deterministic (no external API calls).
// ============================================================

const ACADEMIC_KEYWORDS = [
  'study', 'exam', 'quiz', 'homework', 'assignment', 'lecture', 'professor',
  'notes', 'class', 'course', 'paper', 'presentation', 'lab', 'midterm',
  'final', 'chapter', 'essay', 'syllabus', 'college', 'school', 'university',
  'math', 'physics', 'chemistry', 'biology', 'history', 'thesis', 'project report',
  'reading', 'textbook', 'grades', 'attendance', 'submission', 'submit'
];

const PERSONAL_KEYWORDS = [
  'buy', 'grocery', 'groceries', 'gym', 'workout', 'clean', 'laundry',
  'call', 'dinner', 'lunch', 'breakfast', 'cook', 'doctor', 'dentist',
  'flight', 'hotel', 'bill', 'pay', 'rent', 'mom', 'dad', 'family', 'friend',
  'car', 'walk', 'dog', 'medication', 'medicine', 'order', 'package', 'repair'
];

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseVoiceTask(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      text: '',
      description: '',
      category: 'personal',
      priority: 'important',
      dueDate: null,
      dueTime: null,
      isTopThree: false,
    };
  }

  let text = rawInput.trim();
  const lower = text.toLowerCase();

  // 1. Remove introductory conversational phrases
  const introRegex = /^(please\s+)?(remind me to|i need to|i have to|don't forget to|remember to|add task to|add a task to|add task|create task|schedule)\s+/i;
  text = text.replace(introRegex, '').trim();

  // 2. Detect Priority & Top 3
  let priority = 'important';
  let isTopThree = false;

  if (/\b(urgent|asap|critical|highest priority|emergency|immediately)\b/i.test(lower)) {
    priority = 'urgent';
    isTopThree = true;
  } else if (/\b(top 3|top priority|most important|must do)\b/i.test(lower)) {
    priority = 'urgent';
    isTopThree = true;
  } else if (/\b(optional|low priority|someday|if time permits|whenever)\b/i.test(lower)) {
    priority = 'optional';
  }

  // 3. Detect Category (Academic vs Personal)
  let category = 'personal';
  let academicScore = 0;
  let personalScore = 0;

  for (const kw of ACADEMIC_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(lower)) {
      academicScore++;
    }
  }

  for (const kw of PERSONAL_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(lower)) {
      personalScore++;
    }
  }

  if (academicScore > personalScore) {
    category = 'academic';
  } else if (/\b(academic|academics|academic task|school task)\b/i.test(lower)) {
    category = 'academic';
  } else if (/\b(personal|personal task|home task)\b/i.test(lower)) {
    category = 'personal';
  }

  // 4. Detect Due Date
  let dueDate = null;
  const now = new Date();

  if (/\bday after tomorrow\b/i.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    dueDate = formatDate(d);
    text = text.replace(/\b(on\s+)?day after tomorrow\b/gi, '');
  } else if (/\btomorrow\b/i.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    dueDate = formatDate(d);
    text = text.replace(/\b(by\s+|on\s+)?tomorrow\b/gi, '');
  } else if (/\btoday\b/i.test(text)) {
    dueDate = formatDate(now);
    text = text.replace(/\b(by\s+|on\s+)?today\b/gi, '');
  } else if (/\bthis weekend\b/i.test(text)) {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    dueDate = formatDate(d);
    text = text.replace(/\b(on\s+|by\s+)?this weekend\b/gi, '');
  } else if (/\bnext week\b/i.test(text)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    dueDate = formatDate(d);
    text = text.replace(/\b(by\s+|on\s+)?next week\b/gi, '');
  } else {
    // Check for days of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayMatch = text.match(/\b(next\s+|this\s+|on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
    if (dayMatch) {
      const targetDayName = dayMatch[2].toLowerCase();
      const targetDayIndex = days.indexOf(targetDayName);
      if (targetDayIndex !== -1) {
        const d = new Date(now);
        const currentDayIndex = d.getDay();
        let diff = (targetDayIndex - currentDayIndex + 7) % 7;
        if (diff === 0 || dayMatch[1]?.toLowerCase().includes('next')) {
          diff += 7;
        }
        d.setDate(d.getDate() + diff);
        dueDate = formatDate(d);
        text = text.replace(dayMatch[0], '');
      }
    }
  }

  // 5. Detect Time (e.g. "at 5 pm", "at 10:30 am", "at 4pm", "at 14:00")
  let dueTime = null;
  const timeMatch = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] ? timeMatch[2] : '00';
    const meridiem = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    dueTime = `${String(hours).padStart(2, '0')}:${mins}`;
    text = text.replace(timeMatch[0], '');
  } else if (/\bin the morning\b/i.test(text)) {
    dueTime = '09:00';
    text = text.replace(/\bin the morning\b/gi, '');
  } else if (/\bin the afternoon\b/i.test(text)) {
    dueTime = '14:00';
    text = text.replace(/\bin the afternoon\b/gi, '');
  } else if (/\bin the evening\b/i.test(text)) {
    dueTime = '18:00';
    text = text.replace(/\bin the evening\b/gi, '');
  } else if (/\btonight\b/i.test(text)) {
    dueTime = '20:00';
    text = text.replace(/\btonight\b/gi, '');
  }

  // 6. Clean remaining text artifact words
  text = text
    .replace(/\b(urgent|asap|critical|optional|low priority|top 3|top priority)\b/gi, '')
    .replace(/\b(academic|personal)\s+task\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Capitalize first letter
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  } else {
    text = rawInput.trim();
  }

  return {
    text,
    description: dueTime ? `Scheduled for ${dueTime}` : '',
    category,
    priority,
    dueDate,
    dueTime,
    isTopThree,
  };
}
