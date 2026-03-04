import { ProjectToolId } from './types';

export interface ModelMatch {
    modelId: string;
    providerId: string;
    tier: 'economy' | 'premium' | 'experimental';
    reason: string;
}

/**
 * SMART MODEL ROUTING
 * Maps production tasks to the optimal model based on desk identity and task scope.
 */
export function selectModelForTask(
    deskId: ProjectToolId, 
    taskTitle: string,
    isSmartModeEnabled: boolean = true
): ModelMatch {
    const highCreativityDesks: ProjectToolId[] = ['design', 'copy'];
    const technicalDesks: ProjectToolId[] = ['code', 'data'];
    
    const isCreative = highCreativityDesks.includes(deskId);
    const isTechnical = technicalDesks.includes(deskId);

    if (!isSmartModeEnabled) {
        return { 
            modelId: 'gpt-4o', 
            providerId: 'openai', 
            tier: 'premium',
            reason: 'Standard production default'
        };
    }

    if (isTechnical) {
        return { 
            modelId: 'claude-sonnet-4-20250514', 
            providerId: 'aimlapi', 
            tier: 'premium',
            reason: 'Optimized for complex reasoning and technical precision'
        };
    }

    if (isCreative) {
        if (taskTitle.toLowerCase().includes('system') || taskTitle.toLowerCase().includes('framework')) {
            return { 
                modelId: 'gpt-4o', 
                providerId: 'openai', 
                tier: 'premium',
                reason: 'Premium creative intelligence for architectural tasks'
            };
        }
        return { 
            modelId: 'claude-sonnet-4-20250514', 
            providerId: 'aimlapi', 
            tier: 'premium',
            reason: 'High-fidelity creative generation'
        };
    }

    return { 
        modelId: 'gpt-4o-mini', 
        providerId: 'openai', 
        tier: 'economy',
        reason: 'Economy routing for utility and administrative tasks'
    };
}
