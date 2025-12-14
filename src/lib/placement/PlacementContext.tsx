import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import {
    PlacementIntent,
    DensityState,
    ViewportState,
    PlacementSpec
} from '../../types/placement';
import { ROUTE_INTENTS, DEFAULT_INTENT } from './route-intents';

interface PlacementContextType {
    intent: PlacementIntent;
    density: DensityState;
    viewport: ViewportState;
    spec: PlacementSpec;
    setDensity: (density: DensityState) => void;
}

const PlacementContext = createContext<PlacementContextType | undefined>(undefined);

// Helper to determine spec based on inputs
function calculatePlacementSpec(
    intent: PlacementIntent,
    density: DensityState,
    viewport: ViewportState
): PlacementSpec {
    const isMobile = viewport.isMobile;

    // Default baselines
    let blur = 40;
    let opacity = 0.6;
    let scale = 1.1;
    let motion = !viewport.reducedMotion;
    let accents = true;

    // 1. Intent Adjustments
    switch (intent) {
        case 'ambient':
            blur = 60;
            opacity = 0.5;
            break;
        case 'quiet':
            blur = 90;
            opacity = 0.8; // Darker overlay usually
            scale = 1.05;
            motion = false; // Reduce distractions
            accents = false;
            break;
        case 'minimal':
            blur = 120;
            opacity = 0.95;
            scale = 1.0;
            motion = false;
            accents = false;
            break;
        case 'cinematic':
            blur = 20;
            opacity = 0.3;
            scale = 1.2;
            accents = true;
            break;
        case 'focus-first':
            blur = 80;
            opacity = 0.7;
            accents = false; // Clean look for data
            break;
    }

    // 2. Density Overrides
    if (density === 'dense') {
        blur = Math.min(blur + 40, 150); // Cap at 150
        opacity = Math.min(opacity + 0.2, 0.95);
        motion = false; // Stop motion if dense
    } else if (density === 'sparse') {
        // Allow a bit more richness in empty states
        opacity = Math.max(opacity - 0.1, 0.2);
    }

    // 3. Viewport Overrides
    if (isMobile) {
        // Mobile often needs cleaner backgrounds for readability
        blur = Math.max(blur, 60);
        scale = 1.0; // Avoid zooming issues on mobile
    }

    return {
        blurAmount: blur,
        overlayOpacity: opacity,
        scale,
        allowMotion: motion && !viewport.reducedMotion,
        allowAccents: accents,
    };
}

export function PlacementProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    // State
    const [density, setDensity] = useState<DensityState>('balanced');
    const [viewport, setViewport] = useState<ViewportState>({
        isMobile: false,
        isPortrait: false,
        reducedMotion: false,
    });

    // Resolve Intent
    const intent = useMemo(() => {
        const path = location.pathname;
        let matchedIntent: PlacementIntent = DEFAULT_INTENT;

        // Find matching route pattern
        // We iterate specifically because we want to use matchPath which handles params
        for (const [pattern, definedIntent] of Object.entries(ROUTE_INTENTS)) {
            if (matchPath(pattern, path)) {
                matchedIntent = definedIntent;
                break; // First match wins (order in ROUTE_INTENTS matters if they overlap)
            }
        }
        return matchedIntent;
    }, [location.pathname]);

    // Handle Viewport
    useEffect(() => {
        const handleResize = () => {
            setViewport({
                isMobile: window.innerWidth < 768,
                isPortrait: window.innerHeight > window.innerWidth,
                reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            });
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate final spec
    const spec = useMemo(() =>
        calculatePlacementSpec(intent, density, viewport),
        [intent, density, viewport]
    );

    return (
        <PlacementContext.Provider value={{ intent, density, viewport, spec, setDensity }}>
            {children}
        </PlacementContext.Provider>
    );
}

export function usePlacement() {
    const context = useContext(PlacementContext);
    if (!context) {
        throw new Error('usePlacement must be used within a PlacementProvider');
    }
    return context;
}
