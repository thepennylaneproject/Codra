/**
 * PROJECTS LIST PAGE
 * Main entry point for the Projects/Architect system
 * Shows all user projects with search, status filtering, and quick actions
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Clock, Folder } from 'lucide-react';
import { useProjects } from '../lib/api/projects/hooks';
import type { ProjectSpec } from '../types/architect';

export const ProjectsListPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: projects, isLoading, error } = useProjects();
    const [searchQuery, setSearchQuery] = useState('');

    // Client-side search filtering
    const filteredProjects = projects?.filter((project) => {
        const query = searchQuery.toLowerCase();
        return (
            project.title.toLowerCase().includes(query) ||
            project.summary.toLowerCase().includes(query)
        );
    }) || [];

    return (
        <div className="min-h-screen bg-background-default">
            {/* Header */}
            <div className="border-b border-border-subtle bg-background-elevated">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-display-md text-text-primary font-semibold">
                                Projects
                            </h1>
                            <p className="text-body-sm text-text-muted mt-1">
                                Manage your Codra projects and workflows
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/projects/new')}
                            className="flex items-center gap-2 px-6 py-3 bg-brand-magenta text-background-default text-label-md font-semibold rounded-full hover:brightness-110 transition-all glow-magenta"
                        >
                            <Plus className="w-5 h-5" />
                            New Project
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mt-6 relative max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects..."
                            className="w-full pl-12 pr-4 py-3 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-md placeholder-text-muted focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="p-6 bg-background-elevated border border-border-subtle rounded-xl animate-pulse"
                            >
                                <div className="h-6 bg-background-subtle rounded w-3/4 mb-3" />
                                <div className="h-4 bg-background-subtle rounded w-full mb-2" />
                                <div className="h-4 bg-background-subtle rounded w-5/6" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="max-w-md mx-auto text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-state-error/10 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="text-label-lg text-text-primary font-semibold mb-2">
                            Failed to load projects
                        </h3>
                        <p className="text-body-sm text-text-muted mb-6">
                            {error instanceof Error ? error.message : 'Something went wrong'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-background-subtle border border-border-subtle rounded-lg text-text-primary hover:border-border-strong transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && filteredProjects.length === 0 && !searchQuery && (
                    <div className="max-w-md mx-auto text-center py-12">
                        <div className="w-20 h-20 rounded-full bg-brand-teal/10 flex items-center justify-center mx-auto mb-4">
                            <Folder className="w-10 h-10 text-brand-teal" />
                        </div>
                        <h3 className="text-label-lg text-text-primary font-semibold mb-2">
                            No projects yet
                        </h3>
                        <p className="text-body-sm text-text-muted mb-6">
                            Get started by creating your first project. Codra will help you plan, build, and ship.
                        </p>
                        <button
                            onClick={() => navigate('/projects/new')}
                            className="px-6 py-3 bg-brand-magenta text-background-default text-label-md font-semibold rounded-full hover:brightness-110 transition-all glow-magenta inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create your first project
                        </button>
                    </div>
                )}

                {/* No Search Results */}
                {!isLoading && !error && filteredProjects.length === 0 && searchQuery && (
                    <div className="max-w-md mx-auto text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-background-subtle flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-text-muted" />
                        </div>
                        <h3 className="text-label-lg text-text-primary font-semibold mb-2">
                            No projects match "{searchQuery}"
                        </h3>
                        <p className="text-body-sm text-text-muted">
                            Try a different search term
                        </p>
                    </div>
                )}

                {/* Projects Grid */}
                {!isLoading && !error && filteredProjects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Project Card Component
interface ProjectCardProps {
    project: ProjectSpec;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const navigate = useNavigate();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-brand-teal/10 text-brand-teal border-brand-teal/30';
            case 'draft':
                return 'bg-text-muted/10 text-text-muted border-text-muted/30';
            case 'completed':
                return 'bg-state-success/10 text-state-success border-state-success/30';
            case 'archived':
                return 'bg-background-subtle text-text-muted border-border-subtle';
            default:
                return 'bg-background-subtle text-text-muted border-border-subtle';
        }
    };

    const getDomainEmoji = (domain: string) => {
        switch (domain) {
            case 'saas':
                return '💻';
            case 'site':
                return '🌐';
            case 'automation':
                return '⚡';
            case 'content_engine':
                return '✍️';
            case 'api':
                return '🔌';
            case 'mobile':
                return '📱';
            default:
                return '🎯';
        }
    };

    return (
        <button
            onClick={() => navigate(`/projects/${project.id}`)}
            className="group p-6 bg-background-elevated border border-border-subtle rounded-xl hover:border-brand-teal hover:shadow-lg transition-all text-left"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{getDomainEmoji(project.domain)}</span>
                    <span
                        className={`px-2 py-0.5 text-label-xs font-medium rounded-full border ${getStatusColor(
                            project.status
                        )}`}
                    >
                        {project.status}
                    </span>
                </div>
            </div>

            {/* Title */}
            <h3 className="text-label-lg font-semibold text-text-primary mb-2 group-hover:text-brand-teal transition-colors line-clamp-1">
                {project.title}
            </h3>

            {/* Summary */}
            <p className="text-body-sm text-text-muted line-clamp-2 mb-4">
                {project.summary}
            </p>

            {/* Footer */}
            <div className="flex items-center gap-2 text-body-xs text-text-muted">
                <Clock className="w-4 h-4" />
                <span>
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                </span>
            </div>
        </button>
    );
};
