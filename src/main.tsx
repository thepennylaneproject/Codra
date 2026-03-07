import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './app/globals.css';
import './lib/typography.css';
import { analytics } from './lib/analytics';

analytics.init();

// Global handler for uncaught synchronous errors and cross-origin script errors
// that fall outside React's ErrorBoundary (e.g. errors in setTimeout callbacks,
// event listeners attached outside React, or third-party scripts).
window.addEventListener('error', (event) => {
    console.error('[GlobalError]', event.message, event.error);
    analytics.track('frontend_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack ?? null,
        source: 'window.onerror',
    });
});

// Global handler for unhandled Promise rejections (async code outside React).
// Without this, rejected promises silently disappear in production.
window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    console.error('[UnhandledRejection]', message, reason);
    analytics.track('frontend_error', {
        message,
        stack: reason instanceof Error ? reason.stack ?? null : null,
        source: 'unhandledrejection',
    });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);