/**
 * useUnsavedChanges Hook
 * 
 * Tracks dirty state and provides unsaved changes warnings
 * for both browser navigation and in-app navigation.
 */

import { useEffect, useCallback, useState } from 'react';

export interface UseUnsavedChangesOptions {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Optional message for the browser beforeunload dialog */
  message?: string;
  /** Enable browser beforeunload warning */
  enableBeforeUnload?: boolean;
}

export interface UseUnsavedChangesReturn {
  /** Whether the unsaved changes dialog should be shown */
  showDialog: boolean;
  /** Function to request navigation (will show dialog if dirty) */
  requestNavigation: (callback: () => void) => void;
  /** Confirm leaving without saving */
  confirmLeave: () => void;
  /** Cancel navigation and stay on page */
  cancelLeave: () => void;
  /** Save and then leave */
  saveAndLeave: (saveCallback: () => Promise<void>) => Promise<void>;
}

export function useUnsavedChanges(
  options: UseUnsavedChangesOptions
): UseUnsavedChangesReturn {
  const { isDirty, message = 'You have unsaved changes. Are you sure you want to leave?', enableBeforeUnload = true } = options;

  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Browser beforeunload warning
  useEffect(() => {
    if (!enableBeforeUnload || !isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages, but we set it anyway
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message, enableBeforeUnload]);

  const requestNavigation = useCallback((callback: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => callback);
      setShowDialog(true);
    } else {
      callback();
    }
  }, [isDirty]);

  const confirmLeave = useCallback(() => {
    setShowDialog(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  const cancelLeave = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  const saveAndLeave = useCallback(async (saveCallback: () => Promise<void>) => {
    try {
      await saveCallback();
      setShowDialog(false);
      if (pendingNavigation) {
        pendingNavigation();
        setPendingNavigation(null);
      }
    } catch (error) {
      // Keep dialog open if save fails
      console.error('Failed to save before leaving:', error);
    }
  }, [pendingNavigation]);

  return {
    showDialog,
    requestNavigation,
    confirmLeave,
    cancelLeave,
    saveAndLeave,
  };
}
