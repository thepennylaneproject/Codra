import { RouteIntentConfig } from '../../types/placement';

/**
 * Route Intents Mapping
 * 
 * Declares the visual intent for specific routes.
 * The Autopatcher uses this to determine how to render the background.
 * 
 * - ambient: Standard navigable areas
 * - quiet: Settings, heavy reading
 * - minimal: Editors, code, focus modes
 * - cinematic: Landing pages, showcases
 * - focus-first: Dashboards, analytics
 */
export const ROUTE_INTENTS: RouteIntentConfig = {
    // Root
    '/': 'cinematic',

    // Auth
    '/login': 'cinematic',
    '/signup': 'cinematic',
    '/onboarding': 'ambient',

    // Core App
    '/dashboard': 'focus-first',
    '/projects': 'ambient',
    '/projects/:id': 'focus-first', // Project details might be dense

    // Assets & Library
    '/assets': 'ambient',
    '/assets/*': 'quiet',
    '/prompts': 'ambient',
    '/prompts/:id': 'minimal', // Editor needs focus

    // Tools & Studio
    '/studio': 'focus-first',
    '/studio/code': 'minimal', // Code editor
    '/flow': 'minimal', // Canvas area
    '/ai': 'ambient',

    // Settings (distraction free)
    '/settings': 'quiet',
    '/settings/*': 'quiet',

    // Admin
    '/admin': 'focus-first',
    '/admin/*': 'quiet',
};

// Default fallback if no route matches
export const DEFAULT_INTENT = 'ambient';
