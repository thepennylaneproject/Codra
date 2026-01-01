/**
 * DESK SWITCHING HOOK
 * Manages desk transitions, URL sync, and keyboard shortcuts
 */

import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductionDeskId } from '../../../../domain/types';
import { useDeskState } from './useDeskState';
import { useFlowStore } from '../../../../lib/store/useFlowStore';
import { behaviorTracker } from '../../../../lib/smart-defaults/inference-engine';
import { supabase } from '../../../../lib/supabase';
import { analytics } from '@/lib/analytics';

interface UseDeskSwitchingReturn {
  activeDesk: ProductionDeskId;
  switchDesk: (deskId: ProductionDeskId, method?: 'click' | 'keyboard') => void;
}

export function useDeskSwitching(projectId: string): UseDeskSwitchingReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getDeskState, updateDeskState } = useDeskState();
  const { setActiveDesk } = useFlowStore();
  
  // Get active desk from URL query param, default to 'write'
  const activeDesk = (searchParams.get('desk') as ProductionDeskId) || 'write';
  
  const switchDesk = useCallback(async (deskId: ProductionDeskId, method: 'click' | 'keyboard' = 'click') => {
    if (deskId === activeDesk) return;

    analytics.track('desk_switched', {
      fromDesk: activeDesk,
      toDesk: deskId,
      method,
    });

    // Track desk switch for behavior learning
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        behaviorTracker.track({
          userId,
          timestamp: new Date(),
          event: 'desk_switched',
          metadata: {
            deskId,
            previousDesk: activeDesk,
            projectId
          }
        });
      }
    } catch (err) {
      console.error('Failed to track desk switch:', err);
    }

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
          switchDesk(deskMap[e.key], 'keyboard');
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
