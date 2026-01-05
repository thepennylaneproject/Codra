/**
 * CANONICAL INPUT COMPONENT
 * Consistent input styling across the application.
 */

import React, { forwardRef } from 'react';
import { radii } from '../../lib/design/tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
    optional?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, rightElement, optional, className = '', ...props }, ref) => {
        return (
            <div className={`space-y-2 ${className}`}>
                {label && (
                    <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                        {label}
                        {optional && <span className="text-text-soft font-normal text-xs">(optional)</span>}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
                            w-full px-4 py-3 ${radii.md}
                            bg-white border transition-all duration-200
                            text-text-primary placeholder-[var(--color-ink-muted)]
                            focus-standard
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${icon ? 'pl-12' : ''}
                            ${rightElement ? 'pr-12' : ''}
                            ${error
                                ? 'border-red-500/50'
                                : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                            }
                        `}
                        {...props}
                    />
                    {rightElement && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {rightElement}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="text-sm text-red-500">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
