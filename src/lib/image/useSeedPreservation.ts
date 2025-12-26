/**
 * USE SEED PRESERVATION
 * src/lib/image/useSeedPreservation.ts
 * 
 * React hook for managing image generation seeds and style presets.
 */

import { useState, useMemo, useCallback } from 'react';
import {
    SeedPreservationManager,
    GenerationSeed,
    ImageStyle,
    STYLE_PRESETS,
    applyStyleToPrompt,
    generateRandomSeed,
} from './seed-preservation';

interface UseSeedPreservationReturn {
    // Seed management
    storeSeed: (seed: Omit<GenerationSeed, 'id' | 'createdAt'>) => string;
    getSeed: (id: string) => GenerationSeed | null;
    getSeedByAssetId: (assetId: string) => GenerationSeed | null;
    getAllSeeds: () => GenerationSeed[];
    deleteSeed: (id: string) => boolean;
    
    // Regeneration helpers
    createVariation: (seedId: string, newPrompt: string) => {
        seed: number;
        prompt: string;
        style: ImageStyle;
    } | null;
    createExploration: (seedId: string) => {
        seed: number;
        prompt: string;
        style: ImageStyle;
    } | null;
    
    // Style helpers
    currentStyle: ImageStyle;
    setStyle: (style: ImageStyle) => void;
    stylePresets: typeof STYLE_PRESETS;
    applyStyle: (prompt: string, negativePrompt?: string) => {
        prompt: string;
        negativePrompt: string;
    };
    
    // Seed helpers
    generateSeed: () => number;
    
    // Counts
    seedCount: number;
}

export function useSeedPreservation(projectId: string | undefined): UseSeedPreservationReturn {
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [currentStyle, setCurrentStyle] = useState<ImageStyle>('organic');
    
    const manager = useMemo(() => {
        if (!projectId) return null;
        return new SeedPreservationManager(projectId);
    }, [projectId]);

    const triggerUpdate = useCallback(() => {
        setUpdateTrigger(prev => prev + 1);
    }, []);

    const storeSeed = useCallback((seed: Omit<GenerationSeed, 'id' | 'createdAt'>) => {
        if (!manager) return '';
        const id = manager.storeSeed(seed);
        triggerUpdate();
        return id;
    }, [manager, triggerUpdate]);

    const getSeed = useCallback((id: string) => {
        return manager?.getSeed(id) || null;
    }, [manager]);

    const getSeedByAssetId = useCallback((assetId: string) => {
        return manager?.getSeedByAssetId(assetId) || null;
    }, [manager]);

    const getAllSeeds = useCallback(() => {
        return manager?.getAllSeeds() || [];
    }, [manager, updateTrigger]);

    const deleteSeed = useCallback((id: string) => {
        if (!manager) return false;
        const deleted = manager.deleteSeed(id);
        triggerUpdate();
        return deleted;
    }, [manager, triggerUpdate]);

    const createVariation = useCallback((seedId: string, newPrompt: string) => {
        return manager?.createVariation(seedId, newPrompt) || null;
    }, [manager]);

    const createExploration = useCallback((seedId: string) => {
        return manager?.createExploration(seedId) || null;
    }, [manager]);

    const applyStyle = useCallback((prompt: string, negativePrompt?: string) => {
        return applyStyleToPrompt(prompt, currentStyle, negativePrompt);
    }, [currentStyle]);

    const seedCount = useMemo(() => {
        return manager?.getAllSeeds().length || 0;
    }, [manager, updateTrigger]);

    return {
        storeSeed,
        getSeed,
        getSeedByAssetId,
        getAllSeeds,
        deleteSeed,
        createVariation,
        createExploration,
        currentStyle,
        setStyle: setCurrentStyle,
        stylePresets: STYLE_PRESETS,
        applyStyle,
        generateSeed: generateRandomSeed,
        seedCount,
    };
}
