/**
 * ACCENT GATE
 * 
 * Wrapper component for enforcing accent color rules.
 * Only renders accent styling for permitted use cases.
 * 
 * Permitted uses:
 * - primary-cta: Main action buttons (ONE per screen)
 * - critical-focus: Critical focus state (rare)
 * 
 * Usage:
 * ```tsx
 * <AccentGate usage="primary-cta" as="background">
 *   <Button>Primary Action</Button>
 * </AccentGate>
 * ```
 */

import React from 'react';
import { cn } from '../utils';

type AccentUsage = 'primary-cta' | 'critical-focus';
type AccentStyle = 'border' | 'background' | 'text';

const PERMITTED_USAGES: AccentUsage[] = ['primary-cta', 'critical-focus'];

interface AccentGateProps {
    /** The permitted use case for accent */
    usage: AccentUsage;
    /** Style variant */
    as?: AccentStyle;
    /** Additional CSS classes */
    className?: string;
    /** Content to wrap */
    children: React.ReactNode;
    /** Whether accent is currently active (for conditional styling) */
    active?: boolean;
}

/**
 * Validate that an accent usage is permitted
 */
function isPermittedUsage(usage: string): usage is AccentUsage {
    return PERMITTED_USAGES.includes(usage as AccentUsage);
}

/**
 * Get CSS classes for accent style
 */
function getAccentClasses(style: AccentStyle, active: boolean): string {
    if (!active) return '';

    const classes: Record<AccentStyle, string> = {
        border: 'border border-[var(--accent-border)]',
        background: 'bg-[var(--accent)] text-background-default',
        text: 'text-text-accent',
    };

    return classes[style];
}

export const AccentGate: React.FC<AccentGateProps> = ({
    usage,
    as = 'border',
    className,
    children,
    active = true,
}) => {
    // Validate usage in development
    if (process.env.NODE_ENV === 'development' && !isPermittedUsage(usage)) {
        console.warn(
            `[AccentGate] "${usage}" is not a permitted use case. ` +
            `Allowed: ${PERMITTED_USAGES.join(', ')}`
        );
    }

    // Only apply accent styling if usage is permitted and active
    const shouldApplyAccent = isPermittedUsage(usage) && active;

    return (
        <span
            className={cn(
                'inline-flex',
                shouldApplyAccent && getAccentClasses(as, true),
                className
            )}
            data-accent-usage={usage}
        >
            {children}
        </span>
    );
};

/**
 * Hook to check if accent should be applied
 */
export function useAccentGate(usage: string): {
    isPermitted: boolean;
    styles: React.CSSProperties;
    className: string;
} {
    const isPermitted = isPermittedUsage(usage);

    if (!isPermitted) {
        return {
            isPermitted: false,
            styles: {},
            className: '',
        };
    }

    return {
        isPermitted: true,
        styles: {
            borderColor: 'var(--accent-border)',
        },
        className: 'border-[var(--accent-border)]',
    };
}

/**
 * Inline style builder for accent
 * Use when you need more control than the component provides
 */
export function buildAccentStyle(
    style: AccentStyle,
    opacity: number = 1
): React.CSSProperties {
    switch (style) {
        case 'border':
            return {
                borderColor: `rgba(199, 167, 106, ${0.35 * opacity})`,
                borderWidth: '1px',
            };
        case 'background':
            return {
                backgroundColor: 'var(--accent)',
                color: 'var(--bg-default)',
            };
        case 'text':
            return {
                color: 'var(--accent)',
            };
        default:
            return {};
    }
}

// Legacy export for migration
/** @deprecated Use AccentGate instead */
export const GoldAccent = AccentGate;

/** @deprecated Use useAccentGate instead */
export const useGoldAccent = useAccentGate;

/** @deprecated Use buildAccentStyle instead */
export const buildGoldAccentStyle = buildAccentStyle;

export default AccentGate;
