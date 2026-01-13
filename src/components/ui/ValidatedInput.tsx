/**
 * ValidatedInput Component
 * 
 * Input with real-time validation states:
 * - idle: gray border
 * - focus: blue border
 * - error: red border + error message
 * - valid: green border + checkmark
 */

import { useState, forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

export type ValidationState = 'idle' | 'focus' | 'valid' | 'error';

export interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  required?: boolean;
  error?: string | null;
  isValid?: boolean;
  onChange?: (value: string) => void;
  helperText?: string;
}

const borderClasses: Record<ValidationState, string> = {
  idle: 'border-zinc-200',
  focus: 'border-blue-500 ring-2 ring-blue-100',
  error: 'border-red-500 ring-2 ring-red-100',
  valid: 'border-emerald-500 ring-2 ring-emerald-100',
};

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  function ValidatedInput(
    { label, required, error, isValid, onChange, helperText, className = '', id, ...props },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);

    // Determine validation state
    let state: ValidationState = 'idle';
    if (error) {
      state = 'error';
    } else if (isValid) {
      state = 'valid';
    } else if (isFocused) {
      state = 'focus';
    }

    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-zinc-600"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-3 py-2 text-sm rounded-lg border transition-all duration-150
              outline-none
              ${borderClasses[state]}
              ${className}
            `}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={state === 'error'}
            aria-describedby={error ? errorId : undefined}
            {...props}
          />
          {state === 'valid' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Check size={16} className="text-emerald-500" />
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-600 flex items-center gap-1">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-zinc-500">{helperText}</p>
        )}
      </div>
    );
  }
);
