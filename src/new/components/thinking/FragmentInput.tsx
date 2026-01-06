/**
 * Fragment Input
 *
 * Where you type your thoughts.
 * Not a command line. Not a chat.
 * Just a place to put down what you're thinking.
 */

import React, { useState, useCallback, useRef, KeyboardEvent } from 'react';

interface FragmentInputProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
}

export function FragmentInput({
  onSubmit,
  placeholder = 'What are you thinking about?',
}: FragmentInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [value, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (without shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);

      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    },
    []
  );

  return (
    <div className="fragment-input">
      <textarea
        ref={textareaRef}
        className="fragment-input__textarea thinking-input"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
      />
      <div className="fragment-input__hint">
        Press <kbd>Enter</kbd> to place thought • <kbd>Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}

// Styles
const styles = `
.fragment-input {
  max-width: 600px;
}

.fragment-input__textarea {
  width: 100%;
  min-height: 44px;
  max-height: 200px;
  overflow-y: auto;
}

.fragment-input__hint {
  font-size: var(--text-xs);
  color: var(--ink-placeholder);
  margin-top: var(--space-2);
}

.fragment-input__hint kbd {
  font-family: var(--font-mono);
  background: var(--chrome-bg-inset);
  padding: 1px 4px;
  border-radius: 2px;
  font-size: var(--text-xs);
}
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
