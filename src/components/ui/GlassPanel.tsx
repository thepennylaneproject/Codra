/**
 * GLASS PANEL
 * Premium glass morphism container
 * Part of the Cosmic Cockpit Elegance design system
 */

import React from 'react';
import { cn } from '../../lib/utils';

type GlassPanelVariant = 'primary' | 'elevated' | 'floating';
type GlowColor = 'none' | 'teal' | 'magenta' | 'gold';

interface GlassPanelProps {
    variant?: GlassPanelVariant;
    glow?: GlowColor;
    className?: string;
    children: React.ReactNode;
    /** Whether to show the top edge highlight */
    edgeHighlight?: boolean;
    /** Additional wrapper props */
    as?: 'div' | 'section' | 'article' | 'aside';
}

const variantStyles: Record<GlassPanelVariant, string> = {
    primary: `
    bg-glass
    backdrop-blur-[12px]
    border border-glass-edge
    shadow-xl shadow-black/40
  `,
    elevated: `
    bg-glass-frosted
    backdrop-blur-[8px]
    border border-white/[0.12]
    shadow-2xl shadow-black/50
  `,
    floating: `
    bg-glass-clear
    backdrop-blur-[16px]
    border-t border-glass-edge-bright
    border-x border-b border-glass-edge
    shadow-cosmic
  `,
};

const glowStyles: Record<GlowColor, string> = {
    none: '',
    teal: 'ring-1 ring-energy-teal/20 shadow-glow-teal',
    magenta: 'ring-1 ring-energy-magenta/20 shadow-glow-magenta',
    gold: 'ring-1 ring-energy-gold/20 shadow-glow-gold',
};

export const GlassPanel: React.FC<GlassPanelProps> = ({
    variant = 'primary',
    glow = 'none',
    className,
    children,
    edgeHighlight = true,
    as: Component = 'div',
}) => {
    return (
        <Component
            className={cn(
                'relative rounded-2xl overflow-hidden',
                variantStyles[variant],
                glowStyles[glow],
                className
            )}
        >
            {/* Inner highlight gradient */}
            {edgeHighlight && (
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            )}

            {/* Inner gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative">{children}</div>
        </Component>
    );
};

// Convenience exports for common use cases
export const GlassPanelPrimary: React.FC<Omit<GlassPanelProps, 'variant'>> = (props) => (
    <GlassPanel variant="primary" {...props} />
);

export const GlassPanelElevated: React.FC<Omit<GlassPanelProps, 'variant'>> = (props) => (
    <GlassPanel variant="elevated" {...props} />
);

export const GlassPanelFloating: React.FC<Omit<GlassPanelProps, 'variant'>> = (props) => (
    <GlassPanel variant="floating" {...props} />
);

export default GlassPanel;
