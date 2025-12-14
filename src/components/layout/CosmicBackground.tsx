/**
 * COSMIC BACKGROUND
 * Full-page cosmic background with layered effects
 * Part of the Cosmic Cockpit Elegance design system
 */

import React from 'react';
import { cn } from '../../lib/utils';

// Background configurations for different app sections
const COSMIC_VARIANTS = {
    dashboard: {
        gradient: 'radial-gradient(ellipse at top, rgba(0, 217, 217, 0.12) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(216, 17, 89, 0.08) 0%, transparent 50%)',
        position: 'center top' as const,
        opacity: 0.4,
    },
    projects: {
        gradient: 'radial-gradient(ellipse at center, rgba(0, 217, 217, 0.08) 0%, transparent 60%)',
        position: 'center center' as const,
        opacity: 0.25,
    },
    studio: {
        gradient: 'radial-gradient(ellipse at bottom, rgba(244, 208, 63, 0.1) 0%, transparent 50%), radial-gradient(ellipse at top right, rgba(0, 217, 217, 0.08) 0%, transparent 50%)',
        position: 'bottom center' as const,
        opacity: 0.3,
    },
    playground: {
        gradient: 'radial-gradient(ellipse at center, rgba(216, 17, 89, 0.1) 0%, transparent 40%), radial-gradient(ellipse at top left, rgba(0, 217, 217, 0.12) 0%, transparent 50%)',
        position: 'center center' as const,
        opacity: 0.35,
    },
    settings: {
        gradient: 'radial-gradient(ellipse at top, rgba(0, 217, 217, 0.05) 0%, transparent 60%)',
        position: 'center center' as const,
        opacity: 0.15,
    },
    default: {
        gradient: 'radial-gradient(ellipse at top, rgba(0, 217, 217, 0.08) 0%, transparent 50%)',
        position: 'center center' as const,
        opacity: 0.2,
    },
};

export type CosmicVariant = keyof typeof COSMIC_VARIANTS;

interface CosmicBackgroundProps {
    variant?: CosmicVariant;
    className?: string;
    children: React.ReactNode;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
    variant = 'default',
    className,
    children,
}) => {
    const config = COSMIC_VARIANTS[variant];

    return (
        <div className={cn('relative min-h-screen overflow-hidden', className)}>
            {/* Base layer - deep space black - using CSS variable for guaranteed rendering */}
            <div
                className="fixed inset-0"
                style={{ backgroundColor: 'var(--void, #050608)' }}
            />

            {/* Cosmic gradient layer */}
            <div
                className="fixed inset-0 transition-opacity duration-1000 pointer-events-none"
                style={{
                    background: config.gradient,
                    opacity: config.opacity,
                }}
            />

            {/* Gradient overlay for depth */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to bottom, transparent, rgba(5, 6, 8, 0.3) 50%, rgba(5, 6, 8, 0.7))'
                }}
            />

            {/* Subtle noise texture for premium feel */}
            <div
                className="fixed inset-0 pointer-events-none mix-blend-overlay"
                style={{
                    opacity: 0.015,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Content layer */}
            <div className="relative z-10">{children}</div>
        </div>
    );
};

export default CosmicBackground;
