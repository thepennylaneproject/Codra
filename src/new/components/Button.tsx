/**
 * SHARED BUTTON COMPONENT
 * Consistent button styling across the application
 */

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { radii, transitions } from '../../lib/design/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
    primary: 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200',
    secondary: 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700',
    ghost: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    accent: 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
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
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`
                    inline-flex items-center justify-center font-semibold
                    ${radii.md}
                    ${transitions.fast}
                    ${VARIANT_STYLES[variant]}
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
        return (
            <button
                ref={ref}
                className={`
                    inline-flex items-center justify-center
                    ${radii.md}
                    ${transitions.fast}
                    ${VARIANT_STYLES[variant]}
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
