/**
 * ConfirmDialog Component
 * 
 * A reusable confirmation dialog for irreversible actions.
 * Supports customizable title, message, and button labels.
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  secondaryMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  secondaryMessage,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the confirm button when dialog opens
    confirmButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }

      // Trap focus within dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const confirmButtonClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50"
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-4">
                {variant === 'danger' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2
                    id="confirm-dialog-title"
                    className="text-lg font-semibold text-zinc-900"
                  >
                    {title}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600">{message}</p>
                  {secondaryMessage && (
                    <p className="mt-2 text-xs text-zinc-500">{secondaryMessage}</p>
                  )}
                </div>
                <button
                  onClick={onCancel}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} className="text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-zinc-50 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="px-4 py-2"
              >
                {cancelLabel}
              </Button>
              <button
                ref={confirmButtonRef}
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${confirmButtonClass}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * UnsavedChangesDialog Component
 * 
 * Specialized dialog for handling unsaved changes when navigating away.
 */
export interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSaveAndLeave: () => void;
  onLeaveWithoutSaving: () => void;
  onKeepEditing: () => void;
}

export function UnsavedChangesDialog({
  isOpen,
  onSaveAndLeave,
  onLeaveWithoutSaving,
  onKeepEditing,
}: UnsavedChangesDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onKeepEditing();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onKeepEditing]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50"
          onClick={onKeepEditing}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-dialog-title"
        >
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    id="unsaved-dialog-title"
                    className="text-lg font-semibold text-zinc-900"
                  >
                    Unsaved Changes
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    You have unsaved changes. Leave without saving?
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-zinc-50 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button
                variant="ghost"
                onClick={onKeepEditing}
                className="px-4 py-2 order-3 sm:order-1"
              >
                Keep Editing
              </Button>
              <Button
                variant="secondary"
                onClick={onLeaveWithoutSaving}
                className="px-4 py-2 order-2"
              >
                Leave Without Saving
              </Button>
              <button
                onClick={onSaveAndLeave}
                className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors order-1 sm:order-3"
              >
                Save & Leave
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
