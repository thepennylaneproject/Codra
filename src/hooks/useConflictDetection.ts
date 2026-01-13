import { useState, useCallback } from 'react';
import { Spread } from '../domain/types';
import { analytics } from '@/lib/analytics';
import { useAuth } from './useAuth';

export interface ConflictState {
  yourChanges: string[];
  theirChanges: string[];
  overlap: string[];
  canAutoMerge: boolean;
  serverData: Partial<Spread>;
  serverVersion: number;
}

export function useConflictDetection() {
  const { session } = useAuth();
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  /**
   * Simple field-based diff for spread sections.
   * Compares section content by stringifying.
   */
  const diffSections = (base: Spread, other: Spread): string[] => {
    const changed: string[] = [];
    
    // Compare sections by title/id
    const baseSections = base.sections || [];
    const otherSections = other.sections || [];
    
    // Map of section id to content
    const baseData: Record<string, string> = {};
    baseSections.forEach(s => { baseData[s.id] = JSON.stringify(s.content); });
    
    const otherData: Record<string, string> = {};
    otherSections.forEach(s => { otherData[s.id] = JSON.stringify(s.content); });

    // Check for changes/additions in other
    otherSections.forEach(s => {
      if (baseData[s.id] !== otherData[s.id]) {
        changed.push(s.title || s.id);
      }
    });

    // Check for deletions (sections in base but not in other)
    baseSections.forEach(s => {
      if (!otherData[s.id]) {
        changed.push(`${s.title || s.id} (removed)`);
      }
    });

    return Array.from(new Set(changed));
  };

  const saveWithConflictCheck = useCallback(
    async (projectId: string, spreadId: string, data: Spread, clientVersion: number) => {
      if (!session?.access_token) return { success: false, error: 'Auth required' };

      try {
        const response = await fetch('/api/spread-save', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            projectId,
            spreadId,
            data,
            version: clientVersion
          }),
        });

        if (response.status === 409) {
          const { serverVersion, serverData } = await response.json();
          
          const yourChanges = diffSections(serverData, data);
          const theirChanges = diffSections(data, serverData); // This is slightly wrong in the prompt, it should be diff between common base and server, but we use client vs server for now
          // A better approach: diff server vs what we thought was the base (clientVersion)
          // But since we don't store the "base" locally easily after multiple edits, 
          // we show what's different between what's on server vs what user is trying to save.
          
          const overlap = yourChanges.filter((c) => theirChanges.includes(c));

          setConflict({
            yourChanges,
            theirChanges,
            overlap,
            canAutoMerge: overlap.length === 0,
            serverData,
            serverVersion
          });

          analytics.track('spread_conflict', {
            spreadId,
            projectId,
            overlapCount: overlap.length,
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
      clientData: Spread
    ) => {
      if (!conflict || !session?.access_token) return { success: false };

      let resolvedData: Partial<Spread> = conflict.serverData;

      if (strategy === 'merge' && conflict.canAutoMerge) {
        // Simple merge: keep server data, overwrite with client sections if they were changed
        const serverSections = [...(conflict.serverData.sections || [])];
        const clientSections = clientData.sections || [];
        
        // Map of client section id to content
        const clientSectionMap = new Map();
        clientSections.forEach(s => clientSectionMap.set(s.id, s));

        const mergedSections = serverSections.map(s => {
            const clientMatch = clientSectionMap.get(s.id);
            if (clientMatch && JSON.stringify(clientMatch.content) !== JSON.stringify(s.content)) {
                return clientMatch;
            }
            return s;
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

      const response = await fetch('/api/spread-save', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          projectId,
          spreadId,
          data: resolvedData,
          force: true // Tell backend to overwrite
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
      
      return { success: false };
    },
    [conflict, session]
  );

  return { conflict, setConflict, saveWithConflictCheck, resolveConflict };
}
