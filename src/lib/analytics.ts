import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

/**
 * CORE ANALYTICS WRAPPER
 * Provides a unified interface for event tracking.
 * Falls back to console logging in development or if key is missing.
 */
class Analytics {
    private initialized = false;

    init() {
        if (this.initialized) return;
        
        if (POSTHOG_KEY) {
            posthog.init(POSTHOG_KEY, {
                api_host: POSTHOG_HOST,
                autocapture: true,
                capture_pageview: true,
                persistence: 'localStorage'
            });
            this.initialized = true;
            console.log('[Analytics] PostHog initialized');
        } else {
            console.log('[Analytics] PostHog key missing. Running in mock mode.');
        }
    }

    identify(userId: string, properties?: any) {
        if (POSTHOG_KEY) {
            posthog.identify(userId, properties);
        }
        console.log(`[Analytics] Identify: ${userId}`, properties);
    }

    track(event: string, properties?: any) {
        if (POSTHOG_KEY) {
            posthog.capture(event, properties);
        }
        console.log(`[Analytics] Track: ${event}`, properties);
    }

    trackPageview() {
        if (POSTHOG_KEY) {
            posthog.capture('$pageview');
        }
    }

    reset() {
        if (POSTHOG_KEY) {
            posthog.reset();
        }
    }
}

export const analytics = new Analytics();
