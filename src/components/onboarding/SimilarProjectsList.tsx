/**
 * SIMILAR PROJECTS LIST
 * Container component displaying similar past projects for context import
 */

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSimilarProjects } from '@/hooks/useSimilarProjects';
import { SimilarProjectCard } from './SimilarProjectCard';
import { analytics } from '@/lib/analytics';
import type { ProjectInput } from '@/lib/context-similarity';

interface SimilarProjectsListProps {
    newProject: ProjectInput;
    onImport: (context: ImportedContext) => void;
}

export interface ImportedContext {
    projectId: string;
    projectName: string;
    description: string;
    goals?: string[];
    audience?: string;
    matchScore: number;
}

export const SimilarProjectsList = ({ newProject, onImport }: SimilarProjectsListProps) => {
    const { data: projects, isLoading } = useSimilarProjects(newProject);
    const [isDismissed, setIsDismissed] = useState(false);
    const [hasTrackedShown, setHasTrackedShown] = useState(false);
    
    // Track when projects are shown
    useEffect(() => {
        if (projects && projects.length > 0 && !hasTrackedShown && !isDismissed) {
            analytics.track('similar_projects_shown', {
                count: projects.length,
                step: 2,
                hasProjects: true,
            });
            setHasTrackedShown(true);
        }
    }, [projects, hasTrackedShown, isDismissed]);
    
    // Don't show if loading, dismissed, or no projects found
    if (isLoading) {
        return (
            <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded-lg p-4 mb-6">
                <div className="h-6 w-48 bg-[#1A1A1A]/5 rounded animate-pulse mb-3" />
                <div className="space-y-2">
                    <div className="h-16 bg-white border border-[#1A1A1A]/5 rounded" />
                    <div className="h-16 bg-white border border-[#1A1A1A]/5 rounded" />
                </div>
            </div>
        );
    }
    
    if (isDismissed || !projects || projects.length === 0) {
        return null;
    }
    
    const handleImport = (project: typeof projects[0]) => {
        onImport({
            projectId: project.id,
            projectName: project.name,
            description: project.description || '',
            goals: project.goals,
            audience: project.audience,
            matchScore: project.matchScore,
        });
    };
    
    return (
        <div className="bg-[#FFFAF0] border border-[#1A1A1A]/10 rounded-lg p-4 mb-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-sm font-medium text-text-primary mb-1">
                        Similar projects
                    </h3>
                    <p className="text-xs text-text-soft">
                        Import context from similar projects to reduce setup time
                    </p>
                </div>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="p-1 hover:bg-[#1A1A1A]/5 rounded transition-colors flex-shrink-0"
                    aria-label="Close suggestions"
                >
                    <X size={16} className="text-text-soft" />
                </button>
            </div>
            
            {/* Project Cards */}
            <div className="space-y-2">
                {projects.map(project => (
                    <SimilarProjectCard
                        key={project.id}
                        project={project}
                        onImport={() => handleImport(project)}
                    />
                ))}
            </div>
        </div>
    );
};
