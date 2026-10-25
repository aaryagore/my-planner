'use client';

/**
 * LinkifiedText
 * Automatically detects web URLs (http, https, www.) in any string
 * and turns them into secure, clickable links that open in a new tab.
 */
export default function LinkifiedText({ text, className = '' }) {
  if (!text) return null;

  // Regex to match URLs starting with http://, https://, or www.
  const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (/^(https?:\/\/|www\.)[^\s]+$/i.test(part)) {
          let cleanUrl = part;
          let trailingPunct = '';

          // Separate trailing sentence punctuation (.,;:!?)
          const punctMatch = part.match(/([.,;:!?)>]+)$/);
          if (punctMatch) {
            const punct = punctMatch[1];
            if (
              punct.endsWith('.') ||
              punct.endsWith(',') ||
              punct.endsWith(';') ||
              punct.endsWith('!') ||
              punct.endsWith('?')
            ) {
              cleanUrl = part.slice(0, -1);
              trailingPunct = part.slice(-1);
            }
          }

          const href = cleanUrl.startsWith('www.') ? `https://${cleanUrl}` : cleanUrl;

          return (
            <span key={i} style={{ display: 'inline' }}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="task-inline-link"
                title={`Open link: ${href}`}
                onClick={(e) => e.stopPropagation()}
              >
                {cleanUrl}
              </a>
              {trailingPunct}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}
