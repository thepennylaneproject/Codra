/**
 * TAB INDICATOR COMPONENT
 * ==============================================
 * Active tab indicator with coral accent (GOVERNED)
 *
 * ACCENT GOVERNANCE:
 * - Uses coral accent ONLY for active tab state
 * - 2px bottom border underline
 * - PERMITTED USE: active-tab
 * - Hover states use neutral colors (NOT accent)
 */

import { transitions } from '../../lib/design/tokens';
import { Button } from '@/components/ui/Button';

interface TabIndicatorProps {
    /** Whether this tab is active */
    active: boolean;
    /** Tab label */
    children: React.ReactNode;
    /** Click handler */
    onClick?: () => void;
    /** Additional classes */
    className?: string;
}

/**
 * TabIndicator - Shows active state with coral underline
 */
export function TabIndicator({ active, children, onClick, className = '' }: TabIndicatorProps) {
    return (
        <Button
            onClick={onClick}
            data-component="TabIndicator"
            data-accent-usage={active ? 'active-tab' : undefined}
            className={`
                relative px-4 py-2
                text-sm font-medium
                ${transitions.fast}
                ${
                    active
                        ? 'text-text-primary border-b-[var(--tab-active-border-width)] border-[var(--tab-active-border)]'
                        : 'text-text-secondary border-b-2 border-transparent hover:text-text-primary hover:bg-[var(--tab-hover-bg)]'
                }
                ${className}
            `}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
        >
            {children}
        </Button>
    );
}

/**
 * TabIndicator.Group - Container for tab indicators
 */
TabIndicator.Group = function TabIndicatorGroup({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            role="tablist"
            className={`
                flex items-center gap-1
                border-b border-[var(--color-border)]
                ${className}
            `}
        >
            {children}
        </div>
    );
};

/**
 * TabPanel - Content for a tab
 */
TabIndicator.Panel = function TabPanel({
    active,
    children,
    className = '',
}: {
    active: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    if (!active) return null;

    return (
        <div role="tabpanel" className={className}>
            {children}
        </div>
    );
};

export default TabIndicator;
