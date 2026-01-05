/**
 * SIMILAR PROJECTS HOOK
 * Fetches and scores similar past projects for context import
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { scoreSimilarProjects, type ProjectInput, type ScoredProject, type PastProject } from '@/lib/context-similarity';
import type { StreamlinedProjectType } from '@/new/routes/onboarding/hooks/useOnboarding';

interface UseSimilarProjectsOptions {
    enabled?: boolean;
    threshold?: number;
    limit?: number;
}

/**
 * Calculate approval rate for a project from ai_runs table
 */
async function getApprovalRate(projectId: string): Promise<number> {
    const { data, error } = await supabase
        .from('ai_runs')
        .select('satisfaction_score')
        .eq('workspace_id', projectId)
        .not('satisfaction_score', 'is', null);
    
    if (error || !data || data.length === 0) {
        return 0;
    }
    
    const approved = data.filter(run => run.satisfaction_score >= 4).length;
    return approved / data.length;
}

/**
 * Fetch user's past projects with context and approval rates
 */
async function fetchPastProjects(userId: string): Promise<PastProject[]> {
    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name, settings, description, created_at, updated_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
    
    if (error || !projects) {
        console.error('Error fetching projects:', error);
        return [];
    }
    
    // Filter projects that have meaningful context
    const projectsWithContext = projects.filter(p => 
        p.description || (p.settings && (p.settings.goals || p.settings.audience))
    );
    
    // Enrich with approval rates
    const enriched = await Promise.all(
        projectsWithContext.map(async (project) => {
            const approval_rate = await getApprovalRate(project.id);
            const settings = project.settings || {};
            
            return {
                id: project.id,
                name: project.name,
                type: settings.projectType as StreamlinedProjectType | null,
                description: project.description,
                goals: settings.goals as string[] | undefined,
                audience: settings.audience as string | undefined,
                created_at: project.created_at,
                approval_rate,
            };
        })
    );
    
    return enriched;
}

/**
 * Hook to fetch and score similar projects for context import
 */
export function useSimilarProjects(
    newProject: ProjectInput,
    options: UseSimilarProjectsOptions = {}
) {
    const { user } = useAuth();
    const { enabled = true, threshold = 0.6, limit = 5 } = options;
    
    return useQuery({
        queryKey: ['similar-projects', user?.id, newProject.name, newProject.type],
        queryFn: async (): Promise<ScoredProject[]> => {
            if (!user) return [];
            
            const pastProjects = await fetchPastProjects(user.id);
            
            // Don't show any projects if user has no past projects with context
            if (pastProjects.length === 0) {
                return [];
            }
            
            const scored = scoreSimilarProjects(newProject, pastProjects, threshold, limit);
            
            return scored;
        },
        enabled: enabled && !!user && !!newProject.name && !!newProject.type,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
