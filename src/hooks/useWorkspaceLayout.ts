/**
 * WORKSPACE LAYOUT STORE
 * Zustand store for managing workspace panel layout state
 * Persists per-project to localStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WorkspaceLayoutState {
  // Panel visibility
  leftDockVisible: boolean;
  rightDockVisible: boolean;

  // Panel widths (in pixels)
  leftDockWidth: number;
  rightDockWidth: number;

  // Actions
  toggleLeftDock: () => void;
  toggleRightDock: () => void;
  setLeftDockWidth: (width: number) => void;
  setRightDockWidth: (width: number) => void;
  setLeftDockVisible: (visible: boolean) => void;
  setRightDockVisible: (visible: boolean) => void;
  resetLayout: () => void;
}

// Default layout values
const DEFAULT_LEFT_WIDTH = 240;
const DEFAULT_RIGHT_WIDTH = 320;
const MIN_DOCK_WIDTH = 200;
const MAX_DOCK_WIDTH = 400;

/**
 * Clamp dock width to valid range
 */
function clampWidth(width: number): number {
  return Math.max(MIN_DOCK_WIDTH, Math.min(MAX_DOCK_WIDTH, width));
}

/**
 * Create workspace layout store for a specific project
 * Each project gets its own isolated layout state
 */
export function createWorkspaceLayoutStore(projectId: string) {
  return create<WorkspaceLayoutState>()(
    persist(
      (set) => ({
        // Initial state - default layout
        leftDockVisible: true,
        rightDockVisible: true,
        leftDockWidth: DEFAULT_LEFT_WIDTH,
        rightDockWidth: DEFAULT_RIGHT_WIDTH,

        // Toggle actions
        toggleLeftDock: () =>
          set((state) => ({ leftDockVisible: !state.leftDockVisible })),

        toggleRightDock: () =>
          set((state) => ({ rightDockVisible: !state.rightDockVisible })),

        // Width setters with validation
        setLeftDockWidth: (width: number) =>
          set({ leftDockWidth: clampWidth(width) }),

        setRightDockWidth: (width: number) =>
          set({ rightDockWidth: clampWidth(width) }),

        // Visibility setters
        setLeftDockVisible: (visible: boolean) =>
          set({ leftDockVisible: visible }),

        setRightDockVisible: (visible: boolean) =>
          set({ rightDockVisible: visible }),

        // Reset to defaults
        resetLayout: () =>
          set({
            leftDockVisible: true,
            rightDockVisible: true,
            leftDockWidth: DEFAULT_LEFT_WIDTH,
            rightDockWidth: DEFAULT_RIGHT_WIDTH,
          }),
      }),
      {
        name: `workspace-layout-${projectId}`,
        storage: createJSONStorage(() => localStorage),
      }
    )
  );
}

/**
 * Hook to use workspace layout for current project
 * Creates store instance on-demand per project
 */
const storeCache = new Map<string, ReturnType<typeof createWorkspaceLayoutStore>>();

export function useWorkspaceLayout(projectId: string) {
  // Get or create store for this project
  if (!storeCache.has(projectId)) {
    storeCache.set(projectId, createWorkspaceLayoutStore(projectId));
  }
  
  const useStore = storeCache.get(projectId)!;
  return useStore();
}

// Export constants for use in components
export { MIN_DOCK_WIDTH, MAX_DOCK_WIDTH, DEFAULT_LEFT_WIDTH, DEFAULT_RIGHT_WIDTH };
