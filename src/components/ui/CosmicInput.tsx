/**
 * COSMIC INPUT
 * Luminous input with cosmic styling
 * Part of the Cosmic Cockpit Elegance design system
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface CosmicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Error message to display */
    error?: string;
    /** Left icon or element */
    leftElement?: React.ReactNode;
    /** Right icon or element */
    rightElement?: React.ReactNode;
    /** Label text */
    label?: string;
    /** Helper text */
    helperText?: string;
}

export const CosmicInput = React.forwardRef<HTMLInputElement, CosmicInputProps>(
    (
        {
            className,
            error,
            leftElement,
            rightElement,
            label,
            helperText,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `cosmic-input-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="w-full">
                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-stardust mb-2"
                    >
                        {label}
                    </label>
                )}

                {/* Input wrapper */}
                <div className="relative">
                    {/* Left element */}
                    {leftElement && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stardust-muted pointer-events-none">
                            {leftElement}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            // Base styles
                            'w-full px-4 py-3 rounded-xl',
                            'bg-white/[0.04] backdrop-blur-sm',
                            'border border-glass-edge',
                            'text-stardust placeholder:text-stardust-dim',
                            'transition-all duration-200',

                            // Focus state
                            'focus:outline-none',
                            'focus:bg-white/[0.06]',
                            'focus:border-energy-teal/50',
                            'focus:ring-2 focus:ring-energy-teal/20',

                            // Error state
                            error ? 'border-energy-rose/50 focus:border-energy-rose/50 focus:ring-energy-rose/20' : '',

                            // Padding adjustments for icons
                            leftElement ? 'pl-12' : '',
                            rightElement ? 'pr-12' : '',

                            className
                        )}
                        {...props}
                    />

                    {/* Top edge highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-xl pointer-events-none" />

                    {/* Right element */}
                    {rightElement && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stardust-muted">
                            {rightElement}
                        </div>
                    )}
                </div>

                {/* Helper text or error */}
                {(helperText || error) && (
                    <p
                        className={cn(
                            'mt-2 text-xs',
                            error ? 'text-energy-rose' : 'text-stardust-muted'
                        )}
                    >
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

CosmicInput.displayName = 'CosmicInput';

// Textarea variant
interface CosmicTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
    label?: string;
    helperText?: string;
}

export const CosmicTextarea = React.forwardRef<HTMLTextAreaElement, CosmicTextareaProps>(
    ({ className, error, label, helperText, id, ...props }, ref) => {
        const inputId = id || `cosmic-textarea-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-stardust mb-2"
                    >
                        {label}
                    </label>
                )}

                <div className="relative">
                    <textarea
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'w-full px-4 py-3 rounded-xl resize-none',
                            'bg-white/[0.04] backdrop-blur-sm',
                            'border border-glass-edge',
                            'text-stardust placeholder:text-stardust-dim',
                            'transition-all duration-200',
                            'focus:outline-none',
                            'focus:bg-white/[0.06]',
                            'focus:border-energy-teal/50',
                            'focus:ring-2 focus:ring-energy-teal/20',
                            error && 'border-energy-rose/50 focus:border-energy-rose/50 focus:ring-energy-rose/20',
                            className
                        )}
                        {...props}
                    />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-xl pointer-events-none" />
                </div>

                {(helperText || error) && (
                    <p
                        className={cn(
                            'mt-2 text-xs',
                            error ? 'text-energy-rose' : 'text-stardust-muted'
                        )}
                    >
                        {error || helperText}
                    </p>
                )}
            </div>
        );
    }
);

CosmicTextarea.displayName = 'CosmicTextarea';

export default CosmicInput;
