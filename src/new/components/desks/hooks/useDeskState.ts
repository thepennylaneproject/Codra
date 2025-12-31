/**
 * DESK STATE HOOK
 * Persists state for each desk (scroll position, input content, etc.)
 * Keyed by projectId-deskId for restoration on switch
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ProductionDeskId } from '../../../../domain/types';

export interface DeskState {
  scrollPosition: number;
  inputContent: string;
  selectedOutputId?: string;
  isExecuting: boolean;
}

interface DeskStateStore {
  // Record<"projectId-deskId", DeskState>
  states: Record<string, DeskState>;
  
  getDeskState: (projectId: string, deskId: ProductionDeskId) => DeskState;
  updateDeskState: (projectId: string, deskId: ProductionDeskId, updates: Partial<DeskState>) => void;
  resetDeskState: (projectId: string, deskId: ProductionDeskId) => void;
}

const DEFAULT_DESK_STATE: DeskState = {
  scrollPosition: 0,
  inputContent: '',
  selectedOutputId: undefined,
  isExecuting: false,
};

export const useDeskState = create<DeskStateStore>()(
  persist(
    (set, get) => ({
      states: {},
      
      getDeskState: (projectId: string, deskId: ProductionDeskId) => {
        const key = `${projectId}-${deskId}`;
        return get().states[key] || { ...DEFAULT_DESK_STATE };
      },
      
      updateDeskState: (projectId: string, deskId: ProductionDeskId, updates: Partial<DeskState>) => {
        const key = `${projectId}-${deskId}`;
        set((state) => ({
          states: {
            ...state.states,
            [key]: {
              ...DEFAULT_DESK_STATE,
              ...state.states[key],
              ...updates,
            },
          },
        }));
      },
      
      resetDeskState: (projectId: string, deskId: ProductionDeskId) => {
        const key = `${projectId}-${deskId}`;
        set((state) => {
          const newStates = { ...state.states };
          delete newStates[key];
          return { states: newStates };
        });
      },
    }),
    {
      name: 'codra-desk-states',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
