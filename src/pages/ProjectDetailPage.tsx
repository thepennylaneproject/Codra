/**
 * PROJECT DETAIL PAGE
 * Individual project view with tabs for Overview, Tasks, Prompts, Flows, Assets
 * Shows project spec highlights and provides quick access to related tools
 * Includes Codra Briefing for mid-project onboarding
 */

import React, { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { ChevronLeft, Settings, ExternalLink } from 'lucide-react';
import { useProject } from '../lib/api/projects/hooks';
import type { ProjectSpec } from '../types/architect';
import type { GeneratedTheme } from '../types/design';
import { NamingRegistryPanel } from '../components/architect/naming/NamingRegistryPanel';
import { DesignConsole } from '../components/architect/design-console/DesignConsole';
import { useProjectStore } from '../lib/store/project-store';

// Briefing imports
import { useBriefingState, type NextAction } from '../lib/briefing';
import {
    BriefingSnapshot,
    BriefingTour,
    BriefingUpdateBanner,
    NextStepsPanel,
} from '../components/briefing';

type TabId = 'overview' | 'naming' | 'design' | 'tasks' | 'prompts' | 'flows' | 'assets';

export const ProjectDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: project, isLoading, error } = useProject(id || null);
    const updateProject = useProjectStore((state) => state.updateProject);
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    // Briefing state for mid-project onboarding
    const briefing = useBriefingState({
        projectId: id || '',
        project,
    });

    const handleSaveTheme = (theme: GeneratedTheme) => {
        if (project) {
            updateProject(project.id, { theme });
        }
    };

    // Handle next action clicks
    const handleNextActionClick = useCallback((action: NextAction) => {
        switch (action.type) {
            case 'claim_task':
                setActiveTab('tasks');
                break;
            case 'create_flow':
            case 'run_flow':
                navigate(`/flow?projectId=${id}`);
                break;
            case 'generate_asset':
                setActiveTab('assets');
                break;
            case 'review':
                setActiveTab('overview');
                break;
        }
    }, [navigate, id]);

    // Handle jump to next task from snapshot
    const handleJumpToNextTask = useCallback(() => {
        briefing.dismissSnapshot();
        if (briefing.nextActions.length > 0) {
            handleNextActionClick(briefing.nextActions[0]);
        } else {
            setActiveTab('tasks');
        }
    }, [briefing, handleNextActionClick]);

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-default">
                <div className="border-b border-border-subtle bg-background-elevated">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="animate-pulse">
                            <div className="h-8 bg-background-subtle rounded w-64 mb-2" />
                            <div className="h-4 bg-background-subtle rounded w-96" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error / Not Found State
    if (error || !project) {
        return (
            <div className="min-h-screen bg-background-default flex items-center justify-center">
                <div className="max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-state-error/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <h3 className="text-label-lg text-text-primary font-semibold mb-2">
                        {error ? 'Failed to load project' : 'Project not found'}
                    </h3>
                    <p className="text-body-sm text-text-muted mb-6">
                        {error
                            ? error instanceof Error
                                ? error.message
                                : 'Something went wrong'
                            : 'This project may have been deleted or you do not have access.'}
                    </p>
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-teal text-background-default rounded-full hover:brightness-110 transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-default">
            {/* Header */}
            <div className="border-b border-border-subtle bg-background-elevated">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Breadcrumb */}
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-2 text-body-sm text-text-muted hover:text-text-primary transition-colors mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Projects
                    </Link>

                    {/* Title Row */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-display-sm text-text-primary font-semibold">
                                    {project.title}
                                </h1>
                                <StatusBadge status={project.status} />
                            </div>
                            <p className="text-body-md text-text-muted">{project.summary}</p>
                        </div>

                        <button className="p-2 rounded-lg hover:bg-background-subtle text-text-muted hover:text-text-primary transition-colors">
                            <Settings className="w-5  h-5" />
                        </button>
                    </div>

                    {/* Tabs - with data-tour attributes for briefing tour */}
                    <div className="flex gap-6 mt-6" data-tour="project-tabs">
                        {(
                            [
                                { id: 'overview', label: 'Overview' },
                                { id: 'design', label: 'Design' },
                                { id: 'naming', label: 'Naming' },
                                { id: 'tasks', label: 'Tasks' },
                                { id: 'prompts', label: 'Prompts' },
                                { id: 'flows', label: 'Flows' },
                                { id: 'assets', label: 'Assets' },
                            ] as { id: TabId; label: string }[]
                        ).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                data-tour={`tab-${tab.id}`}
                                className={`pb-3 px-1 text-label-md font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-brand-teal text-brand-teal'
                                    : 'border-transparent text-text-muted hover:text-text-primary hover:border-border-subtle'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Update Banner - shows when project changed since last visit */}
            {briefing.shouldShowUpdateBanner && (
                <BriefingUpdateBanner
                    changes={[]}
                    onShowSummary={() => {
                        briefing.dismissUpdateBanner();
                        setActiveTab('overview');
                    }}
                    onDismiss={briefing.dismissUpdateBanner}
                />
            )}

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'overview' && (
                    <OverviewTab
                        project={project}
                        nextActions={briefing.nextActions}
                        onNextActionClick={handleNextActionClick}
                        isNonTechnical={briefing.isNonTechnical}
                    />
                )}
                {activeTab === 'design' && <DesignConsole initialTheme={project.theme} onSave={handleSaveTheme} />}
                {activeTab === 'naming' && <NamingRegistryPanel projectId={project.id} />}
                {activeTab === 'tasks' && <ComingSoonTab feature="Tasks" />}
                {activeTab === 'prompts' && <ComingSoonTab feature="Prompts" />}
                {activeTab === 'flows' && <ComingSoonTab feature="Flows" />}
                {activeTab === 'assets' && <ComingSoonTab feature="Assets" />}
            </div>

            {/* Briefing Snapshot - orientation overlay for mid-project entry */}
            {briefing.shouldShowSnapshot && (
                <BriefingSnapshot
                    project={project}
                    phase={briefing.projectPhase}
                    stats={briefing.projectStats}
                    lastActivityAt={project.updatedAt}
                    onShowMeAround={() => {
                        briefing.dismissSnapshot();
                        briefing.startTour();
                    }}
                    onJumpToNextTask={handleJumpToNextTask}
                    onDismiss={briefing.dismissSnapshot}
                />
            )}

            {/* Briefing Tour - 3-anchor guided context */}
            {briefing.shouldShowTour && (
                <BriefingTour
                    mostActiveTab="overview"
                    suggestedAction={briefing.nextActions[0]}
                    onComplete={briefing.completeTour}
                    onSkip={briefing.skipTour}
                />
            )}
        </div>
    );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getStatusColor = (s: string) => {
        switch (s) {
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

    return (
        <span
            className={`px-3 py-1 text-label-sm font-medium rounded-full border ${getStatusColor(
                status
            )}`}
        >
            {status}
        </span>
    );
};

// Overview Tab Component
interface OverviewTabProps {
    project: ProjectSpec;
    nextActions: NextAction[];
    onNextActionClick: (action: NextAction) => void;
    isNonTechnical?: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
    project,
    nextActions,
    onNextActionClick,
    isNonTechnical = false,
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
                {/* Project Spec Highlights */}
                <div className="p-6 bg-background-elevated border border-border-subtle rounded-xl">
                    <h3 className="text-label-lg font-semibold text-text-primary mb-4">
                        Project Details
                    </h3>

                    {/* Primary Goal */}
                    <div className="mb-6">
                        <h4 className="text-label-sm font-medium text-text-muted mb-2">
                            Primary Goal
                        </h4>
                        <p className="text-body-md text-text-primary">{project.primaryGoal}</p>
                    </div>

                    {/* Secondary Goals */}
                    {project.secondaryGoals && project.secondaryGoals.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-label-sm font-medium text-text-muted mb-2">
                                Secondary Goals
                            </h4>
                            <ul className="space-y-2">
                                {project.secondaryGoals.map((goal, i) => (
                                    <li key={i} className="flex items-start gap-2 text-body-sm text-text-primary">
                                        <span className="text-brand-teal mt-0.5">•</span>
                                        <span>{goal}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Target Users */}
                    {project.targetUsers && project.targetUsers.length > 0 && (
                        <div>
                            <h4 className="text-label-sm font-medium text-text-muted mb-2">
                                Target Users
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {project.targetUsers.map((user, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-brand-teal/10 text-brand-teal rounded-full text-label-sm"
                                    >
                                        {user}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tech Stack */}
                {project.techStack && (
                    <div className="p-6 bg-background-elevated border border-border-subtle rounded-xl">
                        <h3 className="text-label-lg font-semibold text-text-primary mb-4">
                            Tech Stack
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {project.techStack.frontend && project.techStack.frontend.length > 0 && (
                                <TechStackSection title="Frontend" items={project.techStack.frontend} />
                            )}
                            {project.techStack.backend && project.techStack.backend.length > 0 && (
                                <TechStackSection title="Backend" items={project.techStack.backend} />
                            )}
                            {project.techStack.infra && project.techStack.infra.length > 0 && (
                                <TechStackSection title="Infrastructure" items={project.techStack.infra} />
                            )}
                            {project.techStack.aiProviders && project.techStack.aiProviders.length > 0 && (
                                <TechStackSection
                                    title="AI Providers"
                                    items={project.techStack.aiProviders}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Constraints */}
                {project.constraints && (
                    <div className="p-6 bg-background-elevated border border-border-subtle rounded-xl">
                        <h3 className="text-label-lg font-semibold text-text-primary mb-4">
                            Constraints
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <h4 className="text-label-sm font-medium text-text-muted mb-1">Budget</h4>
                                <p className="text-body-md text-text-primary capitalize">
                                    {project.constraints.budgetLevel}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-label-sm font-medium text-text-muted mb-1">Timeline</h4>
                                <p className="text-body-md text-text-primary capitalize">
                                    {project.constraints.timeline}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-label-sm font-medium text-text-muted mb-1">Complexity</h4>
                                <p className="text-body-md text-text-primary capitalize">
                                    {project.constraints.complexityTolerance}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Brand Voice */}
                {project.brand && (
                    <div className="p-6 bg-background-elevated border border-border-subtle rounded-xl">
                        <h3 className="text-label-lg font-semibold text-text-primary mb-4">
                            Brand Voice
                        </h3>
                        {project.brand.voiceTags && project.brand.voiceTags.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-label-sm font-medium text-text-muted mb-2">Voice Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {project.brand.voiceTags.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-brand-magenta/10 text-brand-magenta rounded text-label-xs"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {project.brand.adjectives && project.brand.adjectives.length > 0 && (
                            <div>
                                <h4 className="text-label-sm font-medium text-text-muted mb-2">Adjectives</h4>
                                <div className="flex flex-wrap gap-2">
                                    {project.brand.adjectives.map((adj, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-brand-magenta/10 text-brand-magenta rounded text-label-xs"
                                        >
                                            {adj}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
                {/* Next Steps - Dynamic suggestions from briefing */}
                <NextStepsPanel
                    actions={nextActions}
                    onActionClick={onNextActionClick}
                    isNonTechnical={isNonTechnical}
                />

                {/* Quick Actions */}
                <div className="p-6 bg-background-elevated border border-border-subtle rounded-xl">
                    <h3 className="text-label-lg font-semibold text-text-primary mb-4">
                        Quick Actions
                    </h3>
                    <div className="space-y-2">
                        <Link
                            to={`/studio?projectId=${project.id}`}
                            className="flex items-center justify-between px-4 py-3 bg-background-subtle rounded-lg hover:bg-background-default transition-colors group"
                        >
                            <span className="text-body-sm text-text-primary">Open in Studio</span>
                            <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-brand-teal" />
                        </Link>
                        <Link
                            to={`/prompts?projectId=${project.id}`}
                            className="flex items-center justify-between px-4 py-3 bg-background-subtle rounded-lg hover:bg-background-default transition-colors group"
                        >
                            <span className="text-body-sm text-text-primary">View Prompts</span>
                            <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-brand-teal" />
                        </Link>
                        <Link
                            to={`/flow?projectId=${project.id}`}
                            className="flex items-center justify-between px-4 py-3 bg-background-subtle rounded-lg hover:bg-background-default transition-colors group"
                        >
                            <span className="text-body-sm text-text-primary">View Flows</span>
                            <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-brand-teal" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Tech Stack Section Component
const TechStackSection: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
    return (
        <div>
            <h4 className="text-label-sm font-medium text-text-muted mb-2">{title}</h4>
            <div className="flex flex-wrap gap-1">
                {items.map((item, i) => (
                    <span
                        key={i}
                        className="px-2 py-0.5 bg-background-subtle text-text-primary rounded text-label-xs"
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
};

// Coming Soon Tab Component
const ComingSoonTab: React.FC<{ feature: string }> = ({ feature }) => {
    return (
        <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 rounded-full bg-background-subtle flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚧</span>
            </div>
            <h3 className="text-label-lg text-text-primary font-semibold mb-2">
                {feature} Coming Soon
            </h3>
            <p className="text-body-sm text-text-muted">
                This feature is under construction and will be available in a future update.
            </p>
        </div>
    );
};
