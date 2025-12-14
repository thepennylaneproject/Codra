import React from 'react';
import type { ProjectDomain } from '../../../../types/architect';

interface BasicInfoStepProps {
    data: {
        title: string;
        summary: string;
        domain: ProjectDomain;
    };
    updateData: (updates: Partial<{ title: string; summary: string; domain: ProjectDomain }>) => void;
}

const DOMAINS: { value: ProjectDomain; label: string; description: string; icon: string }[] = [
    { value: 'saas', label: 'SaaS App', description: 'Web application with users and subscriptions', icon: '💻' },
    { value: 'site', label: 'Website', description: 'Marketing site, portfolio, or blog', icon: '🌐' },
    { value: 'automation', label: 'Automation', description: 'Workflows, integrations, or bots', icon: '⚡' },
    { value: 'content_engine', label: 'Content Engine', description: 'AI-powered content generation', icon: '✍️' },
    { value: 'api', label: 'API / Backend', description: 'REST/GraphQL API or microservice', icon: '🔌' },
    { value: 'mobile', label: 'Mobile App', description: 'iOS, Android, or cross-platform', icon: '📱' },
    { value: 'other', label: 'Other', description: 'Something else entirely', icon: '🎯' },
];

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ data, updateData }) => {
    return (
        <div className="space-y-8">
            {/* Title */}
            <div>
                <label className="block text-label-md text-text-primary mb-2">
                    Project Name <span className="text-brand-magenta">*</span>
                </label>
                <input
                    type="text"
                    value={data.title}
                    onChange={(e) => updateData({ title: e.target.value })}
                    placeholder="e.g., Relevnt, Portfolio Site, Email Automator"
                    className="w-full px-4 py-3 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-md placeholder-text-muted focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                />
                <p className="mt-2 text-body-sm text-text-muted">
                    Pick something memorable. You can always change it later.
                </p>
            </div>

            {/* Summary */}
            <div>
                <label className="block text-label- md text-text-primary mb-2">
                    One-Line Summary <span className="text-brand-magenta">*</span>
                </label>
                <textarea
                    value={data.summary}
                    onChange={(e) => updateData({ summary: e.target.value })}
                    placeholder="e.g., An AI-powered career platform that helps job seekers compete with AI-powered hiring systems"
                    rows={2}
                    className="w-full px-4 py-3 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-md placeholder-text-muted focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 resize-none"
                />
                <p className="mt-2 text-body-sm text-text-muted">
                    This helps Codra understand the vibe. Keep it under 150 characters.
                </p>
            </div>

            {/* Domain Selection */}
            <div>
                <label className="block text-label-md text-text-primary mb-4">
                    What are you building?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {DOMAINS.map((domain) => (
                        <button
                            key={domain.value}
                            onClick={() => updateData({ domain: domain.value })}
                            className={`p-4 text-left rounded-lg border transition-all ${data.domain === domain.value
                                    ? 'bg-brand-teal/10 border-brand-teal text-text-primary'
                                    : 'bg-background-subtle border-border-subtle text-text-muted hover:border-border-strong hover:text-text-primary'
                                }`}
                        >
                            <div className="text-2xl mb-2">{domain.icon}</div>
                            <div className="text-label-sm font-medium">{domain.label}</div>
                            <div className="text-body-sm text-text-muted mt-1">{domain.description}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
