import { useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface AutoSaveOptions {
  delay?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing auto-save state with debouncing
 * 
 * @param value - The value to auto-save
 * @param onSave - Async function to save the value
 * @param options - Configuration options
 * @returns Current save state
 */
export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => Promise<void>,
  options: AutoSaveOptions = {}
): SaveState {
  const { delay = 1000, enabled = true, onError } = options;
  
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const savedStateTimeoutRef = useRef<NodeJS.Timeout>();
  const previousValueRef = useRef<T>(value);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (savedStateTimeoutRef.current) {
        clearTimeout(savedStateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Skip if value hasn't changed
    if (JSON.stringify(value) === JSON.stringify(previousValueRef.current)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear saved state timeout if user is still typing
    if (savedStateTimeoutRef.current) {
      clearTimeout(savedStateTimeoutRef.current);
      savedStateTimeoutRef.current = undefined;
    }

    // Set to idle immediately when user starts typing (if not already saving)
    if (saveState !== 'saving') {
      setSaveState('idle');
    }

    // Debounce the save
    timeoutRef.current = setTimeout(async () => {
      setSaveState('saving');
      
      try {
        await onSave(value);
        previousValueRef.current = value;
        retryCountRef.current = 0;
        setSaveState('saved');
        
        // Return to idle after 2 seconds
        savedStateTimeoutRef.current = setTimeout(() => {
          setSaveState('idle');
        }, 2000);
      } catch (error) {
        console.error('Auto-save error:', error);
        
        // Exponential backoff retry
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const retryDelay = Math.pow(2, retryCountRef.current) * 1000;
          
          setTimeout(async () => {
            try {
              await onSave(value);
              previousValueRef.current = value;
              retryCountRef.current = 0;
              setSaveState('saved');
              
              savedStateTimeoutRef.current = setTimeout(() => {
                setSaveState('idle');
              }, 2000);
            } catch (retryError) {
              setSaveState('error');
              if (onError) {
                onError(retryError as Error);
              }
            }
          }, retryDelay);
        } else {
          setSaveState('error');
          if (onError) {
            onError(error as Error);
          }
        }
      }
    }, delay);
  }, [value, onSave, delay, enabled, onError, saveState]);

  return saveState;
}

/**
 * Hook for manual save with state tracking
 * Useful for explicit save buttons with loading states
 */
export function useManualSave<T>(
  onSave: (value: T) => Promise<void>
): [SaveState, (value: T) => Promise<void>] {
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const save = async (value: T) => {
    setSaveState('saving');
    try {
      await onSave(value);
      setSaveState('saved');
      setTimeout(() => {
        setSaveState('idle');
      }, 2000);
    } catch (error) {
      setSaveState('error');
      throw error;
    }
  };

  return [saveState, save];
}
