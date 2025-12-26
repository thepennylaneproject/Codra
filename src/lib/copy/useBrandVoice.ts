/**
 * USE BRAND VOICE
 * src/lib/copy/useBrandVoice.ts
 * 
 * React hook for brand voice management in components.
 */

import { useState, useMemo, useCallback } from 'react';
import { BrandVoiceManager, BrandVoiceConfig, ApprovedExample } from './brand-voice';

interface UseBrandVoiceReturn {
    // Config
    config: BrandVoiceConfig | null;
    isInitialized: boolean;
    
    // Initialization
    initialize: (name?: string) => void;
    
    // Personality
    setPersonality: (descriptors: string[], avoidDescriptors: string[]) => void;
    
    // Tone
    setTone: (tone: Partial<BrandVoiceConfig['tone']>) => void;
    
    // Vocabulary
    addPreferredTerm: (term: string) => void;
    addAvoidTerm: (term: string) => void;
    addBrandTerm: (generic: string, branded: string) => void;
    
    // Examples
    addApprovedExample: (category: ApprovedExample['category'], content: string, notes?: string) => string;
    addRejectedExample: (category: string, content: string, reason: string) => string;
    
    // Generation
    getPromptInstructions: () => string;
    
    // Validation
    quickCheck: (content: string) => {
        score: number;
        issues: Array<{ type: string; found: string; suggestion?: string }>;
    };
}

export function useBrandVoice(projectId: string | undefined): UseBrandVoiceReturn {
    const [updateTrigger, setUpdateTrigger] = useState(0);
    
    const manager = useMemo(() => {
        if (!projectId) return null;
        return new BrandVoiceManager(projectId);
    }, [projectId]);

    const config = useMemo(() => {
        return manager?.getConfig() || null;
    }, [manager, updateTrigger]);

    const triggerUpdate = useCallback(() => {
        setUpdateTrigger(prev => prev + 1);
    }, []);

    const initialize = useCallback((name?: string) => {
        if (!manager) return;
        manager.initialize(name);
        triggerUpdate();
    }, [manager, triggerUpdate]);

    const setPersonality = useCallback((descriptors: string[], avoidDescriptors: string[]) => {
        if (!manager) return;
        manager.setPersonality(descriptors, avoidDescriptors);
        triggerUpdate();
    }, [manager, triggerUpdate]);

    const setTone = useCallback((tone: Partial<BrandVoiceConfig['tone']>) => {
        if (!manager) return;
        manager.setTone(tone);
        triggerUpdate();
    }, [manager, triggerUpdate]);

    const addPreferredTerm = useCallback((term: string) => {
        if (!manager) return;
        manager.addPreferredTerm(term);
        triggerUpdate();
    }, [manager, triggerUpdate]);

    const addAvoidTerm = useCallback((term: string) => {
        if (!manager) return;
        manager.addAvoidTerm(term);
        triggerUpdate();
    }, [manager, triggerUpdate]);

    const addBrandTerm = useCallback((generic: string, branded: string) => {
        if (!manager) return;
        manager.addBrandTerm(generic, branded);
        triggerUpdate();
    }, [manager, triggerUpdate]);

    const addApprovedExample = useCallback((category: ApprovedExample['category'], content: string, notes?: string) => {
        if (!manager) return '';
        const id = manager.addApprovedExample(category, content, notes);
        triggerUpdate();
        return id;
    }, [manager, triggerUpdate]);

    const addRejectedExample = useCallback((category: string, content: string, reason: string) => {
        if (!manager) return '';
        const id = manager.addRejectedExample(category, content, reason);
        triggerUpdate();
        return id;
    }, [manager, triggerUpdate]);

    const getPromptInstructions = useCallback(() => {
        if (!manager) return '';
        return manager.generatePromptInstructions();
    }, [manager, updateTrigger]);

    const quickCheck = useCallback((content: string) => {
        if (!manager) return { score: 100, issues: [] };
        return manager.quickCheck(content);
    }, [manager, updateTrigger]);

    return {
        config,
        isInitialized: config !== null,
        initialize,
        setPersonality,
        setTone,
        addPreferredTerm,
        addAvoidTerm,
        addBrandTerm,
        addApprovedExample,
        addRejectedExample,
        getPromptInstructions,
        quickCheck,
    };
}
