/**
 * DESK SWITCHING HOOK
 * Manages desk transitions, URL sync, and keyboard shortcuts
 */

import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductionDeskId } from '../../../../domain/types';
import { useDeskState } from './useDeskState';
import { useFlowStore } from '../../../../lib/store/useFlowStore';

interface UseDeskSwitchingReturn {
  activeDesk: ProductionDeskId;
  switchDesk: (deskId: ProductionDeskId) => void;
}

export function useDeskSwitching(projectId: string): UseDeskSwitchingReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getDeskState, updateDeskState } = useDeskState();
  const { setActiveDesk } = useFlowStore();
  
  // Get active desk from URL query param, default to 'write'
  const activeDesk = (searchParams.get('desk') as ProductionDeskId) || 'write';
  
  const switchDesk = useCallback((deskId: ProductionDeskId) => {
    if (deskId === activeDesk) return;

    // Save current desk state before switching
    // We'll save the current scroll position
    const mainElement = document.querySelector('main');
    if (mainElement) {
      updateDeskState(projectId, activeDesk, {
        scrollPosition: mainElement.scrollTop
      });
    }
    
    // Update URL query param
    setSearchParams({ desk: deskId });
    
    // Update flow store
    // Small delay to ensure URL state is synced before components re-render
    setTimeout(() => {
      setActiveDesk(deskId);
    }, 0);
  }, [projectId, activeDesk, setSearchParams, setActiveDesk, updateDeskState]);
  
  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if Cmd/Ctrl is pressed and a number key 1-4
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        // Don't trigger if user is typing in an input/textarea
        const activeElement = document.activeElement;
        const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || (activeElement as HTMLElement)?.isContentEditable;
        
        if (isInput) return;

        const deskMap: Record<string, ProductionDeskId> = {
          '1': 'write',
          '2': 'design',
          '3': 'code',
          '4': 'analyze',
        };
        
        if (deskMap[e.key]) {
          e.preventDefault();
          switchDesk(deskMap[e.key]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [switchDesk]);

  // Restore scroll position when active desk changes
  useEffect(() => {
    const state = getDeskState(projectId, activeDesk);
    const mainElement = document.querySelector('main');
    if (mainElement && state.scrollPosition !== undefined) {
      mainElement.scrollTop = state.scrollPosition;
    }
    setActiveDesk(activeDesk);
  }, [activeDesk, projectId, getDeskState, setActiveDesk]);
  
  return { activeDesk, switchDesk };
}
