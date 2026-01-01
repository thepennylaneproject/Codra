import posthog from 'posthog-js';
import type { AnalyticsEvent } from './analytics/events';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
const DEBUG = import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

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
                autocapture: false, // We'll be explicit about what we track
                capture_pageview: true,
                capture_pageleave: true,
                persistence: 'localStorage'
            });
            this.initialized = true;
            if (DEBUG) console.log('[Analytics] PostHog initialized');
        } else {
            if (DEBUG) console.log('[Analytics) PostHog key missing. Running in mock mode.');
        }
    }

    identify(userId: string, properties?: any) {
        if (POSTHOG_KEY) {
            posthog.identify(userId, properties);
        }
        if (DEBUG) console.log(`[Analytics] Identify: ${userId}`, properties);
    }

    /**
     * Track a typed event with properties
     */
    track<T extends AnalyticsEvent>(event: T['name'], properties?: T['properties']) {
        if (POSTHOG_KEY) {
            posthog.capture(event, properties);
        }
        if (DEBUG) console.log(`[Analytics] Track: ${event}`, properties);
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
