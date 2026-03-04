import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StreamlinedOnboardingData } from './useOnboarding';
import { createProject } from '../../../../domain/projects';
import { storageAdapter } from '@/lib/storage/StorageKeyAdapter';
import type { AsyncOperationState } from '@/domain/async-operation';
import { updateGenerationSession } from '../utils/generationSession';

export interface GenerateSpreadRequest {
    name: string;
    type: 'campaign' | 'product' | 'content' | 'custom';
    description?: string;
    contextFiles?: File[];
}

export interface GenerateSpreadResponse {
    spreadId: string;
    projectId: string;
    status: 'generating' | 'complete' | 'error';
    estimatedSeconds?: number;
}

// Smart defaults for deferred settings
const SMART_DEFAULTS = {
    aiQuality: 'balanced',
    dataSensitivity: 'internal-not-sensitive',
    dailyBudget: 50,
    spendingStrategy: 'smart-balance',
    autonomyLevel: 'apply-with-approval',
    maxStepsBeforePause: 10,
    riskTolerance: 3,
};

export const useSpreadGeneration = () => {
    const [operation, setOperation] = useState<AsyncOperationState>({
        status: 'idle',
        operationId: null,
        phase: undefined,
        progress: 0,
        error: null,
    });
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<string>('idle');
    const navigate = useNavigate();

    const isGenerating = operation.status === 'running';

    const updateSession = (sessionId: string | undefined, updates: Partial<AsyncOperationState>) => {
        if (!sessionId) return;
        updateGenerationSession(sessionId, {
            operationId: updates.operationId ?? sessionId,
            operationStatus: updates.status,
            phase: updates.phase,
            progress: updates.progress,
        });
    };
    
    const generateSpread = async (
        data: StreamlinedOnboardingData,
        options?: { projectId?: string; generationSessionId?: string }
    ) => {
        const operationId = options?.generationSessionId || crypto.randomUUID();
        setOperation({
            status: 'running',
            operationId,
            phase: 'collecting_context',
            progress: 5,
            error: null,
        });
        setError(null);
        setProgress(5);
        setPhase('collecting_context');
        updateSession(options?.generationSessionId, {
            status: 'running',
            operationId,
            phase: 'collecting_context',
            progress: 5,
        });
        
        try {
            const tickProgress = (nextProgress: number, nextPhase?: string) => {
                setProgress(nextProgress);
                setOperation((prev) => ({
                    ...prev,
                    progress: nextProgress,
                    phase: nextPhase ?? prev.phase,
                }));
                if (nextPhase) {
                    setPhase(nextPhase);
                }
                updateSession(options?.generationSessionId, {
                    status: 'running',
                    operationId,
                    progress: nextProgress,
                    phase: nextPhase ?? undefined,
                });
            };
            
            // Map project type to domain type
            const domainType = 
                data.projectType === 'campaign' ? 'website' :
                data.projectType === 'product' ? 'app' :
                data.projectType === 'content' ? 'brand-identity' :
                'brand-identity';

            tickProgress(20, 'collecting_context');
            
            let projectId = options?.projectId;
            if (!projectId) {
                tickProgress(45, 'generating');
                // Create project with smart defaults
                const project = await createProject({
                    name: data.projectName,
                    description: data.description || `A ${data.projectType} project`,
                    summary: data.description || `${data.projectName} - ${data.projectType}`,
                    type: domainType,
                    audience: 'General',
                    audienceContext: {
                        segment: 'B2C',
                        sophistication: 'intermediate',
                    },
                    deliverables: [],
                    brandConstraints: {
                        brandName: data.projectName,
                        voiceGuidelines: 'Professional and approachable',
                        colors: {
                            primary: '#1A1A1A',
                            secondary: '#FFFAF0',
                            accent: '#71717A',
                        },
                    },
                    successCriteria: {
                        definitionOfDone: ['Initial setup completed', 'Idle for first task'],
                        stakeholders: [{ name: 'Owner', role: 'Decision maker' }],
                    },
                    guardrails: {
                        mustInclude: [],
                        mustAvoid: [],
                        autonomyLevel: SMART_DEFAULTS.autonomyLevel as any,
                    },
                    budgetPolicy: {
                        maxCostPerRun: SMART_DEFAULTS.dailyBudget,
                        dailyLimit: SMART_DEFAULTS.dailyBudget * 10,
                        approvalRequired: true,
                    },
                    moodboard: [],
                } as any);
                projectId = project.id;
            }

            tickProgress(80, 'saving');
            
            // Store smart defaults in localStorage for settings page
            storageAdapter.saveSmartDefaults(projectId, SMART_DEFAULTS);

            tickProgress(100, 'complete');
            
            // Small delay before redirect
            await new Promise(r => setTimeout(r, 500));
            
            // Redirect to workspace
            navigate(`/p/${projectId}/workspace`);

            setOperation((prev) => ({ ...prev, status: 'success', progress: 100, phase: 'complete' }));
            updateSession(options?.generationSessionId, {
                status: 'success',
                operationId,
                progress: 100,
                phase: 'complete',
            });

            return {
                spreadId: crypto.randomUUID(),
                projectId: projectId,
                status: 'complete' as const,
            };
            
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to generate workspace';
            setError(message);
            setOperation((prev) => ({ ...prev, status: 'error', error: message }));
            updateSession(options?.generationSessionId, {
                status: 'error',
                operationId,
            });
            throw err;
        }
    };

    const operationState = useMemo(() => ({
        ...operation,
        progress,
        phase,
    }), [operation, progress, phase]);
    
    return {
        generateSpread,
        isGenerating,
        error,
        progress,
        phase,
        operation: operationState,
    };
};
