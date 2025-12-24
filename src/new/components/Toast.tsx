/**
 * TOAST NOTIFICATION SYSTEM
 * Provides success/error/info feedback across the application
 */

import { create } from 'zustand';
import { useEffect } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = crypto.randomUUID();
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));
        // Auto-remove after duration
        const duration = toast.duration ?? 4000;
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, duration);
        }
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
    clearAll: () => set({ toasts: [] }),
}));

// Convenience hook
export function useToast() {
    const { addToast, removeToast, clearAll } = useToastStore();

    return {
        success: (message: string, duration?: number) =>
            addToast({ type: 'success', message, duration }),
        error: (message: string, duration?: number) =>
            addToast({ type: 'error', message, duration: duration ?? 6000 }),
        info: (message: string, duration?: number) =>
            addToast({ type: 'info', message, duration }),
        warning: (message: string, duration?: number) =>
            addToast({ type: 'warning', message, duration }),
        dismiss: removeToast,
        clearAll,
    };
}

// Toast icon mapping
const TOAST_ICONS: Record<ToastType, React.ElementType> = {
    success: Check,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
};

// Toast styles
const TOAST_STYLES: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200',
};

const ICON_STYLES: Record<ToastType, string> = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-amber-500',
};

// Individual Toast component
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const Icon = TOAST_ICONS[toast.type];

    useEffect(() => {
        // Accessibility: announce toast
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = toast.message;
        document.body.appendChild(announcement);
        return () => announcement.remove();
    }, [toast.message]);

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
                animate-in slide-in-from-right-full fade-in duration-300
                ${TOAST_STYLES[toast.type]}
            `}
            role="alert"
        >
            <Icon size={18} className={ICON_STYLES[toast.type]} />
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
                onClick={onDismiss}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// Toast Container - renders all active toasts
export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm"
            aria-label="Notifications"
        >
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}
