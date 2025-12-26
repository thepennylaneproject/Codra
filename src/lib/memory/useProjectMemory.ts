/**
 * USE PROJECT MEMORY
 * src/lib/memory/useProjectMemory.ts
 * 
 * React hook for accessing context and session memory in components.
 */

import { useState, useMemo, useCallback } from 'react';
import { ContextManager, ContextPriority } from './context-manager';
import { SessionMemory, SessionDecision } from './session-memory';

interface UseProjectMemoryReturn {
    // Context Manager
    addContext: (key: string, value: string, priority?: ContextPriority) => string;
    addCriticalInstruction: (key: string, instruction: string) => string;
    getActiveContext: () => string;
    removeContext: (id: string) => boolean;
    
    // Session Memory
    recordDecision: (
        type: SessionDecision['type'],
        category: SessionDecision['category'],
        description: string,
        originalValue?: string,
        newValue?: string
    ) => string;
    recordGeneration: (
        taskId: string,
        taskTitle: string,
        outputSummary: string,
        wasSuccessful: boolean,
        tokensUsed?: number
    ) => string;
    hasGeneratedSimilar: (taskTitle: string) => boolean;
    getSessionSummary: () => string;
    
    // Combined Context for AI
    getFullContext: () => string;
    
    // Usage Stats
    usageStats: {
        current: number;
        max: number;
        percentage: number;
        level: 'low' | 'medium' | 'high' | 'critical';
    };
    sessionStats: {
        decisionsCount: number;
        generationsCount: number;
        successRate: number;
        sessionDurationMinutes: number;
    };
}

export function useProjectMemory(projectId: string | undefined): UseProjectMemoryReturn {
    const [updateTrigger, setUpdateTrigger] = useState(0);
    
    // Memoize managers to prevent recreation
    const contextManager = useMemo(() => {
        if (!projectId) return null;
        return new ContextManager(projectId);
    }, [projectId]);

    const sessionMemory = useMemo(() => {
        if (!projectId) return null;
        return new SessionMemory(projectId);
    }, [projectId]);

    // Trigger re-render when memory changes
    const triggerUpdate = useCallback(() => {
        setUpdateTrigger(prev => prev + 1);
    }, []);

    // Context Manager methods
    const addContext = useCallback((key: string, value: string, priority: ContextPriority = 'normal') => {
        if (!contextManager) return '';
        const id = contextManager.addContext(key, value, priority);
        triggerUpdate();
        return id;
    }, [contextManager, triggerUpdate]);

    const addCriticalInstruction = useCallback((key: string, instruction: string) => {
        if (!contextManager) return '';
        const id = contextManager.addCriticalInstruction(key, instruction);
        triggerUpdate();
        return id;
    }, [contextManager, triggerUpdate]);

    const getActiveContext = useCallback(() => {
        if (!contextManager) return '';
        return contextManager.getActiveContext();
    }, [contextManager, updateTrigger]);

    const removeContext = useCallback((id: string) => {
        if (!contextManager) return false;
        const result = contextManager.removeContext(id);
        triggerUpdate();
        return result;
    }, [contextManager, triggerUpdate]);

    // Session Memory methods
    const recordDecision = useCallback((
        type: SessionDecision['type'],
        category: SessionDecision['category'],
        description: string,
        originalValue?: string,
        newValue?: string
    ) => {
        if (!sessionMemory) return '';
        const id = sessionMemory.recordDecision(type, category, description, originalValue, newValue);
        triggerUpdate();
        return id;
    }, [sessionMemory, triggerUpdate]);

    const recordGeneration = useCallback((
        taskId: string,
        taskTitle: string,
        outputSummary: string,
        wasSuccessful: boolean,
        tokensUsed?: number
    ) => {
        if (!sessionMemory) return '';
        const id = sessionMemory.recordGeneration(taskId, taskTitle, outputSummary, wasSuccessful, tokensUsed);
        triggerUpdate();
        return id;
    }, [sessionMemory, triggerUpdate]);

    const hasGeneratedSimilar = useCallback((taskTitle: string) => {
        if (!sessionMemory) return false;
        return sessionMemory.hasGeneratedSimilar(taskTitle) !== null;
    }, [sessionMemory, updateTrigger]);

    const getSessionSummary = useCallback(() => {
        if (!sessionMemory) return '';
        return sessionMemory.getSessionSummary();
    }, [sessionMemory, updateTrigger]);

    // Combined context for AI prompts
    const getFullContext = useCallback(() => {
        const sections: string[] = [];
        
        if (contextManager) {
            sections.push(contextManager.getActiveContext());
        }
        
        if (sessionMemory) {
            const sessionSummary = sessionMemory.getSessionSummary();
            if (sessionSummary) {
                sections.push('\n---\n');
                sections.push(sessionSummary);
            }
        }
        
        return sections.join('\n');
    }, [contextManager, sessionMemory, updateTrigger]);

    // Stats
    const usageStats = useMemo(() => {
        if (!contextManager) {
            return { current: 0, max: 8000, percentage: 0, level: 'low' as const };
        }
        const stats = contextManager.getUsageStats();
        return {
            ...stats,
            level: contextManager.getUsageLevel(),
        };
    }, [contextManager, updateTrigger]);

    const sessionStats = useMemo(() => {
        if (!sessionMemory) {
            return { decisionsCount: 0, generationsCount: 0, successRate: 100, sessionDurationMinutes: 0 };
        }
        return sessionMemory.getStats();
    }, [sessionMemory, updateTrigger]);

    return {
        addContext,
        addCriticalInstruction,
        getActiveContext,
        removeContext,
        recordDecision,
        recordGeneration,
        hasGeneratedSimilar,
        getSessionSummary,
        getFullContext,
        usageStats,
        sessionStats,
    };
}
