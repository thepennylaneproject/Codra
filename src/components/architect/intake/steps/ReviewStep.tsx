import React from 'react';
import type { ProjectDomain, ProjectTechStack, ProjectConstraints, ProjectBrand } from '../../../../types/architect';

interface ReviewStepProps {
    data: {
        title: string;
        summary: string;
        domain: ProjectDomain;
        primaryGoal: string;
        secondaryGoals: string[];
        targetUsers: string[];
        techStack: ProjectTechStack;
        constraints: ProjectConstraints;
        brand: ProjectBrand;
    };
}

const DOMAIN_LABELS: Record<ProjectDomain, string> = {
    saas: 'SaaS App',
    site: 'Website',
    automation: 'Automation',
    content_engine: 'Content Engine',
    api: 'API / Backend',
    mobile: 'Mobile App',
    other: 'Other',
};

export const ReviewStep: React.FC<ReviewStepProps> = ({ data }) => {
    const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({
        title,
        children,
    }) => (
        <div className="p-4 bg-background-subtle rounded-lg border border-border-subtle">
            <h3 className="text-label-md font-semibold text-text-primary mb-3">{title}</h3>
            {children}
        </div>
    );

    const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <div className="mb-2 last:mb-0">
            <span className="text-body-sm text-text-muted">{label}: </span>
            <span className="text-body-sm text-text-primary">{value}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="text-body-md text-text-muted">
                Review your project details before creating it.
            </div>

            {/* Basic Info */}
            <SectionCard title="📝 Basic Information">
                <InfoRow label="Project Name" value={data.title || '—'} />
                <InfoRow label="Summary" value={data.summary || '—'} />
                <InfoRow label="Domain" value={DOMAIN_LABELS[data.domain]} />
            </SectionCard>

            {/* Goals */}
            <SectionCard title="🎯 Goals">
                <div className="mb-2">
                    <span className="text-body-sm text-text-muted">Primary Goal: </span>
                    <p className="text-body-sm text-text-primary mt-1">
                        {data.primaryGoal || '—'}
                    </p>
                </div>
                {data.secondaryGoals.length > 0 && (
                    <div className="mb-2">
                        <span className="text-body-sm text-text-muted">Secondary Goals:</span>
                        <ul className="mt-1 space-y-1">
                            {data.secondaryGoals.map((goal, i) => (
                                <li key={i} className="text-body-sm text-text-primary pl-4">
                                    • {goal}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {data.targetUsers.length > 0 && (
                    <div>
                        <span className="text-body-sm text-text-muted">Target Users: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {data.targetUsers.map((user, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-brand-teal/10 text-brand-teal rounded text-label-xs"
                                >
                                    {user}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Tech Stack */}
            <SectionCard title="🛠️ Tech Stack">
                {data.techStack.frontend && data.techStack.frontend.length > 0 && (
                    <div className="mb-3">
                        <span className="text-body-sm text-text-muted">Frontend: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {data.techStack.frontend.map((tech, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-background-elevated border border-border-subtle text-text-primary rounded text-label-xs"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {data.techStack.backend && data.techStack.backend.length > 0 && (
                    <div className="mb-3">
                        <span className="text-body-sm text-text-muted">Backend: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {data.techStack.backend.map((tech, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-background-elevated border border-border-subtle text-text-primary rounded text-label-xs"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {data.techStack.infra && data.techStack.infra.length > 0 && (
                    <div className="mb-3">
                        <span className="text-body-sm text-text-muted">Infrastructure: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {data.techStack.infra.map((tech, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-background-elevated border border-border-subtle text-text-primary rounded text-label-xs"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {data.techStack.aiProviders && data.techStack.aiProviders.length > 0 && (
                    <div>
                        <span className="text-body-sm text-text-muted">AI Providers: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {data.techStack.aiProviders.map((tech, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-background-elevated border border-border-subtle text-text-primary rounded text-label-xs"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Constraints */}
            <SectionCard title="⚙️ Constraints">
                <InfoRow
                    label="Budget"
                    value={
                        data.constraints.budgetLevel === 'low'
                            ? 'Bootstrap'
                            : data.constraints.budgetLevel === 'medium'
                                ? 'Moderate'
                                : 'Invest'
                    }
                />
                <InfoRow
                    label="Timeline"
                    value={
                        data.constraints.timeline === 'rush'
                            ? 'Fast Track'
                            : data.constraints.timeline === 'normal'
                                ? 'Steady'
                                : 'Long-term'
                    }
                />
                <InfoRow
                    label="Complexity"
                    value={
                        data.constraints.complexityTolerance === 'simple'
                            ? 'Keep it Simple'
                            : data.constraints.complexityTolerance === 'moderate'
                                ? 'Balanced'
                                : 'Sophisticated'
                    }
                />
                {data.constraints.maxMonthlyAICost && (
                    <InfoRow label="Max Monthly AI Cost" value={`$${data.constraints.maxMonthlyAICost}`} />
                )}
            </SectionCard>

            {/* Brand Voice */}
            <SectionCard title="🎨 Brand Voice">
                {data.brand.voiceTags.length > 0 && (
                    <div className="mb-3">
                        <span className="text-body-sm text-text-muted">Voice Tags: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {data.brand.voiceTags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-brand-magenta/10 text-brand-magenta rounded text-label-xs"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {data.brand.adjectives.length > 0 && (
                    <div className="mb-3">
                        <span className="text-body-sm text-text-muted">Adjectives: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {data.brand.adjectives.map((adj, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-brand-magenta/10 text-brand-magenta rounded text-label-xs"
                                >
                                    {adj}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {data.brand.bannedWords.length > 0 && (
                    <div className="mb-3">
                        <span className="text-body-sm text-text-muted">Banned Words: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {data.brand.bannedWords.map((word, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-state-error/10 text-state-error rounded text-label-xs line-through"
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {data.brand.toneNotes && (
                    <div>
                        <span className="text-body-sm text-text-muted">Tone Notes: </span>
                        <p className="text-body-sm text-text-primary mt-1">{data.brand.toneNotes}</p>
                    </div>
                )}
            </SectionCard>
        </div>
    );
};
