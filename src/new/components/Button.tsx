/**
 * SHARED BUTTON COMPONENT
 * Consistent button styling across the application
 *
 * ACCENT GOVERNANCE:
 * - 'primary' variant uses coral accent (#FF6B6B) - PERMITTED USE: primary-cta
 * - Only ONE primary button should be visible per screen
 * - Use 'secondary' or 'ghost' for all other actions
 */

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { radii, transitions } from '../../lib/design/tokens';
import { ACCENT_CORAL, COMPONENTS } from '../../lib/design-tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

/**
 * Variant styles using design tokens
 * PRIMARY uses coral accent (GOVERNED) - marks it with data-accent-usage attribute
 */
const VARIANT_STYLES: Record<ButtonVariant, { classes: string; dataAttr?: string }> = {
    // PRIMARY CTA - Coral accent (GOVERNED)
    primary: {
        classes: 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:bg-[var(--button-primary-bg-hover)] active:bg-[var(--button-primary-bg-active)]',
        dataAttr: 'primary-cta',
    },
    // SECONDARY - Neutral ghost style
    secondary: {
        classes: 'bg-transparent text-[var(--color-ink)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-border-soft)]',
    },
    // GHOST - Minimal style
    ghost: {
        classes: 'text-[var(--color-ink-light)] hover:bg-[var(--color-border-soft)] hover:text-[var(--color-ink)]',
    },
    // DANGER - Red for destructive actions
    danger: {
        classes: 'bg-red-500 text-white hover:bg-red-600',
    },
};

const SIZE_STYLES: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'secondary', // Changed default to 'secondary' to avoid accidental accent usage
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            disabled,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const variantConfig = VARIANT_STYLES[variant];

        // Warn in development if className overrides color
        if (process.env.NODE_ENV === 'development' && className) {
            const hasColorOverride = /bg-\[|text-\[|border-\[/.test(className);
            if (hasColorOverride && variant === 'primary') {
                console.warn(
                    '[Button] Overriding primary button colors violates accent governance. ' +
                    'Use variant="secondary" or variant="ghost" instead.'
                );
            }
        }

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                data-component="Button"
                data-accent-usage={variantConfig.dataAttr}
                className={`
                    inline-flex items-center justify-center font-semibold
                    ${radii.md}
                    ${transitions.fast}
                    ${variantConfig.classes}
                    ${SIZE_STYLES[size]}
                    disabled:opacity-50 disabled:cursor-not-allowed
                    active:scale-[0.98]
                    ${className}
                `}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
                ) : leftIcon ? (
                    leftIcon
                ) : null}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = 'Button';

// === ICON BUTTON ===
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    'aria-label': string;
}

const ICON_SIZE_STYLES: Record<ButtonSize, string> = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ variant = 'ghost', size = 'md', className = '', children, ...props }, ref) => {
        const variantConfig = VARIANT_STYLES[variant];

        return (
            <button
                ref={ref}
                data-component="IconButton"
                data-accent-usage={variantConfig.dataAttr}
                className={`
                    inline-flex items-center justify-center
                    ${radii.md}
                    ${transitions.fast}
                    ${variantConfig.classes}
                    ${ICON_SIZE_STYLES[size]}
                    disabled:opacity-50 disabled:cursor-not-allowed
                    active:scale-[0.95]
                    ${className}
                `}
                {...props}
            >
                {children}
            </button>
        );
    }
);

IconButton.displayName = 'IconButton';
