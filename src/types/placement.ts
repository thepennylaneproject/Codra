
export type PlacementIntent =
    | 'ambient'      // Default: Subtle background, standard blur
    | 'quiet'        // For dense areas/forms: Higher blur, lower opacity
    | 'minimal'      // For editors/modals: Very high blur, almost solid color
    | 'cinematic'    // For landing/marketing: Clearer background, movement allowed
    | 'focus-first'; // For dashboards: Structured layout, distraction-free

export type DensityState =
    | 'sparse'       // Few elements (e.g. empty states, onboarding)
    | 'balanced'     // Standard UI density
    | 'dense';       // Data grids, complex forms, editors

export type ViewportState = {
    isMobile: boolean;
    isPortrait: boolean;
    reducedMotion: boolean;
};

export interface PlacementSpec {
    // Calculated visual values based on Intent + Density + Viewport
    blurAmount: number;     // px
    overlayOpacity: number; // 0-1
    scale: number;          // 1.0 - 1.5
    allowMotion: boolean;
    allowAccents: boolean;  // e.g. Gold borders/glows
}

export interface RouteIntentConfig {
    [routePattern: string]: PlacementIntent;
}
