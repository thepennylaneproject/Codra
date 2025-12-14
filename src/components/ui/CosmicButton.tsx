/**
 * COSMIC BUTTON
 * Luminous button variants with cosmic styling
 * Part of the Cosmic Cockpit Elegance design system
 */

import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CosmicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Show loading spinner */
    loading?: boolean;
    /** Icon to show before text */
    leftIcon?: React.ReactNode;
    /** Icon to show after text */
    rightIcon?: React.ReactNode;
}

const baseStyles = `
  relative inline-flex items-center justify-center gap-2
  font-medium transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-void
`;

const variantStyles: Record<ButtonVariant, string> = {
    primary: `
    bg-gradient-to-r from-energy-teal to-teal-500
    text-void
    shadow-lg shadow-energy-teal/25
    hover:shadow-xl hover:shadow-energy-teal/30
    hover:brightness-110
    focus-visible:ring-energy-teal/50
  `,
    secondary: `
    bg-white/[0.06]
    border border-white/[0.12]
    text-stardust
    hover:bg-white/[0.1]
    hover:border-white/[0.2]
    focus-visible:ring-white/20
  `,
    ghost: `
    bg-transparent
    text-stardust-muted
    hover:text-stardust
    hover:bg-white/[0.06]
    focus-visible:ring-white/10
  `,
    danger: `
    bg-gradient-to-r from-energy-rose to-pink-600
    text-white
    shadow-lg shadow-energy-rose/25
    hover:shadow-xl hover:shadow-energy-rose/30
    hover:brightness-110
    focus-visible:ring-energy-rose/50
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 rounded-lg',
    md: 'text-sm px-4 py-2 rounded-xl',
    lg: 'text-base px-6 py-3 rounded-xl',
};

export const CosmicButton: React.FC<CosmicButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...props
}) => {
    return (
        <button
            className={cn(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {/* Inner highlight for primary/danger */}
            {(variant === 'primary' || variant === 'danger') && (
                <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                    <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                ) : (
                    leftIcon
                )}
                {children}
                {rightIcon}
            </span>
        </button>
    );
};

// Special Glow Button for hero CTAs
export const GlowButton: React.FC<CosmicButtonProps> = ({
    className,
    children,
    ...props
}) => (
    <button
        className={cn(
            'relative group px-8 py-4 rounded-2xl',
            'bg-gradient-to-r from-energy-teal via-teal-500 to-energy-teal',
            'text-void font-semibold text-lg',
            'shadow-[0_0_40px_-10px_rgba(0,217,217,0.5)]',
            'hover:shadow-[0_0_60px_-10px_rgba(0,217,217,0.7)]',
            'transition-all duration-300',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
        )}
        {...props}
    >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-energy-cyan via-teal-400 to-energy-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_100%] animate-shimmer" />

        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-3">
            {children}
        </span>
    </button>
);

export default CosmicButton;
