import React from 'react';
import { cn } from '../../lib/utils';
import { TASTE_GOVERNOR } from '../../lib/design/taste-governor';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'panel';
    interactive?: boolean;
    goldAccent?: boolean;
    children: React.ReactNode;
}

/**
 * GLASS CARD
 * 
 * Implements "Apple-level restraint" with "Guardians soul".
 * - Subtle blur, never frosted
 * - Soft edge highlights
 * - Optional gold accent on interaction
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    variant = 'default',
    interactive = false,
    goldAccent = false,
    className,
    children,
    ...props
}) => {

    const blurClass = TASTE_GOVERNOR.glass.blurstrength === 'xl' ? 'backdrop-blur-xl' : 'backdrop-blur-lg';

    // Base styles with dynamic opacity variables for Tailwind integration
    const baseStyles = `
        relative overflow-hidden
        rounded-2xl border
        transition-all duration-200 ease-out
        ${blurClass}
    `;

    // Variant logic
    const variants = {
        default: 'bg-glass-panel border-glass-edge shadow-lg',
        elevated: 'bg-glass-elevated border-glass-edge shadow-xl',
        panel: 'bg-black/40 border-white/5 shadow-inner'
    };

    // Interaction styles
    const interactiveStyles = interactive ? `
        hover:bg-glass-highlight 
        hover:border-white/10 
        hover:shadow-2xl 
        hover:-translate-y-[1px]
        cursor-pointer
    ` : '';

    // Gold Accent Logic (Taste Governor: "Hairline only")
    const goldAccentStyles = goldAccent ? `
        before:absolute before:inset-0 before:pointer-events-none 
        before:rounded-2xl before:border before:border-brand-gold/30 
        before:opacity-0 hover:before:opacity-100 before:transition-opacity
    ` : '';

    return (
        <div
            className={cn(
                baseStyles,
                variants[variant],
                interactiveStyles,
                goldAccentStyles,
                className
            )}
            style={{
                // Enforce taste governor values if needed via inline styles
                // though prefer using tailwind classes mapped in globals.css
            }}
            {...props}
        >
            {/* Inner "Shimmer" gradient for subtle depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

            {/* Content Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
