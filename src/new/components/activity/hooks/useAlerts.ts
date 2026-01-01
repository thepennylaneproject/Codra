/**
 * USE ALERTS
 * Hook for managing alert queue and auto-dismissal
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface Alert {
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    details?: string;
    dismissedAt?: number;
}

const AUTO_DISMISS_DELAY = 10000; // 10 seconds

export function useAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Add a new alert
    const addAlert = useCallback((alert: Omit<Alert, 'id'>) => {
        const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newAlert: Alert = { ...alert, id };

        setAlerts(prev => [...prev, newAlert]);

        // Set auto-dismiss timer
        const timer = setTimeout(() => {
            dismissAlert(id);
        }, AUTO_DISMISS_DELAY);

        timersRef.current.set(id, timer);

        return id;
    }, []);

    // Dismiss an alert
    const dismissAlert = useCallback((id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));

        // Clear timer
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, []);

    // Get active alert (most recent)
    const activeAlert = alerts.length > 0 ? alerts[alerts.length - 1] : null;

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            timersRef.current.forEach(timer => clearTimeout(timer));
            timersRef.current.clear();
        };
    }, []);

    return {
        alerts,
        activeAlert,
        addAlert,
        dismissAlert,
    };
}
