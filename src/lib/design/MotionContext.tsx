/**
 * MOTION CONTEXT
 * 
 * Centralized motion control with user preference support.
 * "Guardians of the Galaxy meets Apple" - slow, subtle, optional
 * 
 * Motion behavior:
 * - 'auto': Respects prefers-reduced-motion and mobile status
 * - 'on': Force enable motion (user override)
 * - 'off': Force disable motion (user override)
 * 
 * Motion is automatically suppressed when:
 * 1. User sets preference to 'off'
 * 2. User sets 'auto' AND has prefers-reduced-motion
 * 3. User sets 'auto' AND is on mobile
 * 4. Content density is 'dense' (via PlacementContext)
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { usePlacement } from '../placement/PlacementContext';
import { MOTION } from '../design-tokens';

export type MotionPreference = 'auto' | 'on' | 'off';

export interface MotionConfig {
    /** Whether motion is currently enabled (computed value) */
    enabled: boolean;
    /** Whether slow parallax drift is active */
    parallax: boolean;
    /** Whether gradient shimmer is active */
    shimmer: boolean;
    /** Current transition speed to use */
    transitionSpeed: 'instant' | 'expressive' | 'atmospheric';
    /** User's stored preference */
    preference: MotionPreference;
}

interface MotionContextType {
    motion: MotionConfig;
    /** Update user's motion preference (persisted to localStorage) */
    setMotionPreference: (preference: MotionPreference) => void;
}

const MotionContext = createContext<MotionContextType | undefined>(undefined);

const STORAGE_KEY = MOTION.preference.key;

function getStoredPreference(): MotionPreference {
    if (typeof window === 'undefined') return 'auto';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && MOTION.preference.options.includes(stored as MotionPreference)) {
        return stored as MotionPreference;
    }
    return 'auto';
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
    const { spec, viewport, density } = usePlacement();
    const [preference, setPreferenceState] = useState<MotionPreference>(() => getStoredPreference());

    // Persist preference to localStorage
    const setMotionPreference = useCallback((newPreference: MotionPreference) => {
        setPreferenceState(newPreference);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, newPreference);
        }
    }, []);

    // Compute effective motion state
    const motion = useMemo<MotionConfig>(() => {
        // Determine if motion should be enabled
        let enabled: boolean;

        if (preference === 'off') {
            enabled = false;
        } else if (preference === 'on') {
            enabled = true;
        } else {
            // 'auto' mode: respect system and context
            enabled = !viewport.reducedMotion && !viewport.isMobile && spec.allowMotion;
        }

        // Dense content always suppresses motion for usability
        if (density === 'dense') {
            enabled = false;
        }

        return {
            enabled,
            parallax: enabled && spec.allowAccents,
            shimmer: enabled,
            transitionSpeed: enabled ? 'expressive' : 'instant',
            preference,
        };
    }, [preference, viewport, spec, density]);

    // Inject CSS custom properties for motion state
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--motion-enabled', motion.enabled ? '1' : '0');
        root.style.setProperty('--motion-parallax-active', motion.parallax ? '1' : '0');
        root.style.setProperty('--motion-shimmer-active', motion.shimmer ? '1' : '0');

        // Set transition duration based on motion state
        const transitionValue = motion.enabled
            ? 'var(--motion-transition-expressive)'
            : 'var(--motion-transition-instant)';
        root.style.setProperty('--motion-current-transition', transitionValue);
    }, [motion]);

    return (
        <MotionContext.Provider value={{ motion, setMotionPreference }}>
            {children}
        </MotionContext.Provider>
    );
}

export function useMotion() {
    const context = useContext(MotionContext);
    if (!context) {
        throw new Error('useMotion must be used within a MotionProvider');
    }
    return context;
}

/**
 * Hook for checking if a specific motion type is allowed
 */
export function useMotionAllowed(type: 'parallax' | 'shimmer' | 'any'): boolean {
    const { motion } = useMotion();
    switch (type) {
        case 'parallax':
            return motion.parallax;
        case 'shimmer':
            return motion.shimmer;
        case 'any':
        default:
            return motion.enabled;
    }
}

/**
 * Get transition CSS value based on motion state
 */
export function useMotionTransition(): string {
    const { motion } = useMotion();
    return motion.enabled
        ? MOTION.transition.expressive
        : MOTION.transition.instant;
}
