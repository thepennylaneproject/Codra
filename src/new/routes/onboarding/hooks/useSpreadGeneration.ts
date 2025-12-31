import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StreamlinedOnboardingData } from './useOnboarding';
import { createProject } from '../../../../domain/projects';

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
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const navigate = useNavigate();
    
    const generateSpread = async (data: StreamlinedOnboardingData) => {
        setIsGenerating(true);
        setError(null);
        setProgress(0);
        
        try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 300);
            
            // Map project type to domain type
            const domainType = 
                data.projectType === 'campaign' ? 'website' :
                data.projectType === 'product' ? 'app' :
                data.projectType === 'content' ? 'brand-identity' :
                'brand-identity';
            
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
                        accent: '#FF6B6B',
                    },
                },
                successCriteria: {
                    definitionOfDone: ['Initial setup completed', 'Ready for first task'],
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
            
            clearInterval(progressInterval);
            setProgress(100);
            
            // Store smart defaults in localStorage for settings page
            localStorage.setItem(`codra:smartDefaults:${project.id}`, JSON.stringify(SMART_DEFAULTS));
            
            // Small delay before redirect
            await new Promise(r => setTimeout(r, 500));
            
            // Redirect to workspace
            navigate(`/p/${project.id}/spread`);
            
            return {
                spreadId: crypto.randomUUID(),
                projectId: project.id,
                status: 'complete' as const,
            };
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate spread');
            setIsGenerating(false);
            throw err;
        }
    };
    
    return {
        generateSpread,
        isGenerating,
        error,
        progress,
    };
};
