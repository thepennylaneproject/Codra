/**
 * PROGRESS DOT & SPINNER COMPONENTS
 * ==============================================
 * Progress indicators with coral accent (GOVERNED)
 *
 * ACCENT GOVERNANCE:
 * - Uses coral accent ONLY for active/animating states
 * - PERMITTED USE: active-progress
 * - Inactive dots use neutral colors (NOT accent)
 */

import { transitions } from '../../lib/design/tokens';

interface ProgressDotProps {
    /** Whether this step is active */
    active: boolean;
    /** Whether this step is completed */
    completed?: boolean;
    /** Dot size */
    size?: 'sm' | 'md' | 'lg';
    /** Additional classes */
    className?: string;
}

const DOT_SIZES = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
};

/**
 * ProgressDot - Step indicator dot
 * Active state uses coral fill (GOVERNED)
 */
export function ProgressDot({ active, completed = false, size = 'md', className = '' }: ProgressDotProps) {
    return (
        <div
            data-component="ProgressDot"
            data-accent-usage={active ? 'active-progress' : undefined}
            className={`
                ${DOT_SIZES[size]}
                rounded-full
                ${transitions.fast}
                ${
                    active
                        ? 'bg-[var(--progress-active)] shadow-sm shadow-[var(--progress-active-bg)]'
                        : completed
                        ? 'bg-[var(--color-ink-light)]'
                        : 'bg-[var(--color-border)] border border-[var(--color-border-strong)]'
                }
                ${className}
            `}
            role="progressbar"
            aria-valuenow={active ? 50 : completed ? 100 : 0}
            aria-valuemin={0}
            aria-valuemax={100}
        />
    );
}

/**
 * ProgressDot.Group - Container for multiple dots
 */
ProgressDot.Group = function ProgressDotGroup({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-2 ${className}`} role="group">
            {children}
        </div>
    );
};

interface ProgressSpinnerProps {
    /** Spinner size */
    size?: 'sm' | 'md' | 'lg';
    /** Additional classes */
    className?: string;
}

const SPINNER_SIZES = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
};

/**
 * ProgressSpinner - Loading spinner with coral accent (GOVERNED)
 * Always active, uses coral fill
 */
export function ProgressSpinner({ size = 'md', className = '' }: ProgressSpinnerProps) {
    return (
        <div
            data-component="ProgressSpinner"
            data-accent-usage="active-progress"
            className={`
                ${SPINNER_SIZES[size]}
                rounded-full
                border-[var(--progress-active-bg)]
                border-t-[var(--progress-active)]
                animate-spin
                ${className}
            `}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
}

interface ProgressBarProps {
    /** Progress value (0-100) */
    value: number;
    /** Bar size */
    size?: 'sm' | 'md' | 'lg';
    /** Show percentage label */
    showLabel?: boolean;
    /** Additional classes */
    className?: string;
}

const BAR_HEIGHTS = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
};

/**
 * ProgressBar - Horizontal progress bar with coral fill (GOVERNED)
 */
export function ProgressBar({ value, size = 'md', showLabel = false, className = '' }: ProgressBarProps) {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--color-ink-light)]">Progress</span>
                    <span className="text-xs font-medium text-[var(--color-ink-light)]">{Math.round(clampedValue)}%</span>
                </div>
            )}
            <div
                className={`
                    w-full ${BAR_HEIGHTS[size]}
                    bg-[var(--progress-active-bg)]
                    rounded-full
                    overflow-hidden
                `}
                role="progressbar"
                aria-valuenow={clampedValue}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    data-component="ProgressBar"
                    data-accent-usage="active-progress"
                    className={`
                        h-full
                        bg-[var(--progress-active)]
                        ${transitions.fast}
                        rounded-full
                    `}
                    style={{ width: `${clampedValue}%` }}
                />
            </div>
        </div>
    );
}

export default ProgressDot;
