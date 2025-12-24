/**
 * GOLD ACCENT
 * 
 * Wrapper component for enforcing Taste Governor rules for gold usage.
 * Only renders gold styling for permitted use cases.
 * 
 * Permitted uses:
 * - primary-cta: Main action buttons
 * - active-state: Currently selected items
 * - success-indicator: Completion/success states
 * 
 * Usage:
 * ```tsx
 * <GoldAccent usage="primary-cta" as="glow">
 *   <Button>Premium Action</Button>
 * </GoldAccent>
 * ```
 */

import React from 'react';
import { cn } from '../utils';
import { TASTE_GOVERNOR } from './taste-governor';

type GoldUsage = 'primary-cta' | 'active-state' | 'success-indicator';
type GoldStyle = 'border' | 'glow' | 'text' | 'subtle';

interface GoldAccentProps {
    /** The permitted use case for gold accent */
    usage: GoldUsage;
    /** Style variant */
    as?: GoldStyle;
    /** Additional CSS classes */
    className?: string;
    /** Content to wrap */
    children: React.ReactNode;
    /** Whether accent is currently active (for conditional styling) */
    active?: boolean;
}

/**
 * Validate that a gold usage is permitted
 */
function isPermittedUsage(usage: string): usage is GoldUsage {
    return TASTE_GOVERNOR.goldAccent.permitted.includes(usage as GoldUsage);
}

/**
 * Get CSS classes for gold accent style
 */
function getGoldClasses(style: GoldStyle, active: boolean): string {
    if (!active) return '';

    const classes: Record<GoldStyle, string> = {
        border: 'border border-[var(--gold-accent-border)] hover:border-[var(--gold-accent-primary)]',
        glow: 'shadow-[0_0_20px_var(--gold-accent-glow)]',
        text: 'text-[var(--gold-accent-text)]',
        subtle: 'ring-1 ring-[var(--gold-accent-border)] ring-opacity-50',
    };

    return classes[style];
}

export const GoldAccent: React.FC<GoldAccentProps> = ({
    usage,
    as = 'border',
    className,
    children,
    active = true,
}) => {
    // Validate usage in development
    if (process.env.NODE_ENV === 'development' && !isPermittedUsage(usage)) {
        console.warn(
            `[GoldAccent] "${usage}" is not a permitted use case. ` +
            `Allowed: ${TASTE_GOVERNOR.goldAccent.permitted.join(', ')}`
        );
    }

    // Only apply gold styling if usage is permitted and active
    const shouldApplyGold = isPermittedUsage(usage) && active;

    return (
        <span
            className={cn(
                'inline-flex',
                shouldApplyGold && getGoldClasses(as, true),
                className
            )}
            data-gold-usage={usage}
        >
            {children}
        </span>
    );
};

/**
 * Hook to check if gold accent should be applied
 */
export function useGoldAccent(usage: string): {
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
            borderColor: 'var(--gold-accent-border)',
            boxShadow: '0 0 20px var(--gold-accent-glow)',
        },
        className: 'border-[var(--gold-accent-border)]',
    };
}

/**
 * Inline style builder for gold accents
 * Use when you need more control than the component provides
 */
export function buildGoldAccentStyle(
    style: GoldStyle,
    opacity: number = 1
): React.CSSProperties {
    const baseOpacity = TASTE_GOVERNOR.goldAccent;

    switch (style) {
        case 'border':
            return {
                borderColor: `rgba(199, 167, 106, ${baseOpacity.borderOpacity * opacity})`,
                borderWidth: TASTE_GOVERNOR.goldAccent.maxBorderWidth,
            };
        case 'glow':
            return {
                boxShadow: `0 0 20px rgba(199, 167, 106, ${baseOpacity.glowOpacity * opacity})`,
            };
        case 'text':
            return {
                color: 'var(--gold-accent-text)',
            };
        case 'subtle':
            return {
                boxShadow: `0 0 0 1px rgba(199, 167, 106, ${baseOpacity.borderOpacity * 0.5 * opacity})`,
            };
        default:
            return {};
    }
}

export default GoldAccent;
