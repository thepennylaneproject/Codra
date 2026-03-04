import { useState, useCallback } from 'react';
import { ProjectSpecification } from '../domain/types';
import { analytics } from '@/lib/analytics';
import { useAuth } from './useAuth';
import isEqual from 'lodash.isequal';

export interface ConflictState {
  yourChanges: string[];
  theirChanges: string[];
  overlap: string[];
  canAutoMerge: boolean;
  serverData: Partial<ProjectSpecification>;
  serverVersion: number;
  baseData?: ProjectSpecification; // ARCH-011: Store base for context
}

export function useConflictDetection() {
  const { session } = useAuth();
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  /**
   * Helper to identify changed sections between two revisions
   */
  const getChangedSections = (base: ProjectSpecification | undefined, current: Partial<ProjectSpecification>): string[] => {
    if (!base) return [];
    
    const changed: string[] = [];
    const baseSections = base.sections || [];
    const currentSections = current.sections || [];
    
    // Map by ID
    const baseMap = new Map(baseSections.map(s => [s.id, s]));
    const currentMap = new Map(currentSections.map(s => [s.id, s]));
    
    // Check for modifications and additions
    currentSections.forEach(s => {
        const baseSection = baseMap.get(s.id);
        if (!baseSection) {
            changed.push(s.title || 'New Section');
        } else if (!isEqual(baseSection.content, s.content)) {
            changed.push(s.title || s.id);
        }
    });

    // Check for deletions
    baseSections.forEach(s => {
        if (!currentMap.has(s.id)) {
            changed.push(`${s.title || s.id} (removed)`);
        }
    });

    return Array.from(new Set(changed));
  };

  const saveWithConflictCheck = useCallback(
    async (
        projectId: string, 
        spreadId: string, 
        data: ProjectSpecification, 
        clientVersion: number,
        baseData?: ProjectSpecification // ARCH-011: Require base data for 3-way diff
    ) => {
      if (!session?.access_token) return { success: false, error: 'Auth required' };

      try {
        const response = await fetch('/api/specification-save', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            projectId,
            specificationId: spreadId,
            data,
            version: clientVersion
          }),
        });

        if (response.status === 409) {
          const { serverVersion, serverData } = await response.json();
          
          // ARCH-011: 3-Way Merge Logic
          // 1. Your Changes: Base -> Client (What you did)
          // 2. Their Changes: Base -> Server (What they did)
          // 3. Overlap: Intersection
          
          const yourChanges = getChangedSections(baseData, data);
          const theirChanges = getChangedSections(baseData, serverData);
          
          // If we don't have baseData (legacy case), we fall back to Client vs Server
          // stored in 'theirChanges' variable name but conceptually is just "Difference"
          // This ensures backward compatibility if caller doesn't provide baseData immediately
          if (!baseData) {
               // Fallback: Naive diff
               const naiveDiff = getChangedSections(serverData as ProjectSpecification, data);
               setConflict({
                yourChanges: naiveDiff,
                theirChanges: ['Unknown (Missing Base)'],
                overlap: naiveDiff,
                canAutoMerge: false,
                serverData,
                serverVersion
              });
              return { success: false, conflict: true, serverVersion, serverData };
          }
          
          // Calculate true overlap
          const overlap = yourChanges.filter(c => theirChanges.includes(c));

          setConflict({
            yourChanges,
            theirChanges,
            overlap,
            canAutoMerge: overlap.length === 0,
            serverData,
            serverVersion,
            baseData
          });

          analytics.track('spread_conflict', {
            spreadId,
            projectId,
            overlapCount: overlap.length,
            autoMergePossible: overlap.length === 0
          });

          return { success: false, conflict: true, serverVersion, serverData };
        }

        if (response.ok) {
          const result = await response.json();
          setConflict(null);
          return { success: true, conflict: false, version: result.version };
        }

        const error = await response.json();
        return { success: false, conflict: false, error: error.error || 'Save failed' };
      } catch (error) {
        console.error('Save error', error);
        return { success: false, conflict: false, error: 'Network error' };
      }
    },
    [session]
  );

  const resolveConflict = useCallback(
    async (
      strategy: 'merge' | 'mine' | 'theirs',
      projectId: string,
      spreadId: string,
      clientData: ProjectSpecification
    ) => {
      if (!conflict || !session?.access_token) return { success: false };

      let resolvedData: Partial<ProjectSpecification> = conflict.serverData;

      if (strategy === 'merge' && conflict.canAutoMerge) {
        // Safe 3-way merge:
        // Take Server Data as baseline
        // Apply Client Changes (which are known non-overlapping)
        // Since we know they don't overlap, we can just overlay client sections 
        // that differ from Base onto Server.
        
        const baseSections = conflict.baseData?.sections || [];
        const baseMap = new Map(baseSections.map(s => [s.id, s]));
        
        const serverSections = [...(conflict.serverData.sections || [])];
        
        const clientSections = clientData.sections || [];
        
        // Start with Server Sections
        const mergedSections = [...serverSections];
        
        // Apply Client changes
        clientSections.forEach(cSection => {
            const baseSection = baseMap.get(cSection.id);
            
            // If Client changed this section (vs Base)
            const clientChanged = !baseSection || !isEqual(baseSection.content, cSection.content);
            
            if (clientChanged) {
                // Find index in merged (Server) array
                const idx = mergedSections.findIndex(s => s.id === cSection.id);
                if (idx >= 0) {
                    // Update existing
                    mergedSections[idx] = cSection;
                } else {
                    // Append new
                    mergedSections.push(cSection);
                }
            }
        });
        
        resolvedData = {
          ...conflict.serverData,
          sections: mergedSections,
        };
      } else if (strategy === 'mine') {
        resolvedData = clientData;
      } else if (strategy === 'theirs') {
        resolvedData = conflict.serverData;
      }

      // ARCH-012: Robust Force Save
      // Send force=true to bypass version check
      const response = await fetch('/api/specification-save', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          projectId,
          specificationId: spreadId,
          data: resolvedData,
          force: true,
          // Explicitly send the current server version we are overwriting/merging on top of
          version: conflict.serverVersion 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setConflict(null);
        analytics.track('spread_conflict_resolved', {
          spreadId,
          projectId,
          strategy,
        });
        return { success: true, version: result.version };
      }
      
      return { success: false, error: 'Failed to resolve conflict' };
    },
    [conflict, session]
  );

  return { conflict, setConflict, saveWithConflictCheck, resolveConflict };
}
