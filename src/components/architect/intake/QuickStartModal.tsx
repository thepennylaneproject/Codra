import React from 'react';

interface QuickStartModalProps {
    onSelect: (template: 'saas' | 'site' | 'automation') => void;
    onClose: () => void;
}

const TEMPLATES = [
    {
        type: 'saas' as const,
        icon: '💻',
        title: 'SaaS Quick Start',
        description: 'Start with sensible defaults for a web application',
        features: ['React + TypeScript', 'Supabase backend', 'AIMLAPI integration'],
    },
    {
        type: 'site' as const,
        icon: '🌐',
        title: 'Website Quick Start',
        description: 'Launch a marketing site or portfolio quickly',
        features: ['Static site ready', 'SEO optimized', 'Fast deployment'],
    },
    {
        type: 'automation' as const,
        icon: '⚡',
        title: 'Automation Quick Start',
        description: 'Build workflows and integrations fast',
        features: ['API integrations', 'Serverless functions', 'Event-driven'],
    },
];

export const QuickStartModal: React.FC<QuickStartModalProps> = ({ onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-default/80 backdrop-blur-sm">
            <div className="bg-background-elevated border border-border-subtle rounded-2xl shadow-2xl max-w-4xl w-full mx-4 p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-display-sm text-text-primary font-semibold">
                            Quick Start Templates
                        </h2>
                        <p className="text-body-sm text-text-muted mt-1">
                            Skip the wizard and start with sensible defaults
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-text-primary transition-colors text-2xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Templates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {TEMPLATES.map((template) => (
                        <button
                            key={template.type}
                            onClick={() => onSelect(template.type)}
                            className="p-6 text-left bg-background-subtle border border-border-subtle rounded-lg hover:border-brand-teal hover:bg-brand-teal/5 transition-all group"
                        >
                            <div className="text-4xl mb-3">{template.icon}</div>
                            <h3 className="text-label-lg font-semibold text-text-primary mb-2 group-hover:text-brand-teal transition-colors">
                                {template.title}
                            </h3>
                            <p className="text-body-sm text-text-muted mb-4">{template.description}</p>
                            <ul className="space-y-1">
                                {template.features.map((feature, i) => (
                                    <li key={i} className="text-body-xs text-text-muted flex items-center gap-2">
                                        <span className="text-brand-teal">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                    <p className="text-body-sm text-text-muted">
                        You can customize everything after project creation
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-label-md text-text-muted hover:text-text-primary transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
