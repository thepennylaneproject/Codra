import React, { useState } from 'react';
import type { ProjectTechStack } from '../../../../types/architect';

interface TechStackStepProps {
    data: {
        techStack: ProjectTechStack;
    };
    updateData: (updates: Partial<{ techStack: ProjectTechStack }>) => void;
}

const POPULAR_TECH = {
    frontend: ['React', 'Vue', 'Svelte', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Next.js', 'Vite'],
    backend: ['Node.js', 'Python', 'Supabase', 'Firebase', 'PostgreSQL', 'Express', 'FastAPI'],
    infra: ['Netlify', 'Vercel', 'AWS', 'Cloudflare', 'Heroku', 'Railway'],
    aiProviders: ['AIMLAPI', 'OpenAI', 'Anthropic', 'DeepSeek', 'Replicate', 'HuggingFace'],
};

export const TechStackStep: React.FC<TechStackStepProps> = ({ data, updateData }) => {
    const [customInputs, setCustomInputs] = useState({
        frontend: '',
        backend: '',
        infra: '',
        aiProviders: '',
    });

    const toggleTech = (category: keyof ProjectTechStack, tech: string) => {
        const current = data.techStack[category] || [];
        const updated = current.includes(tech)
            ? current.filter((t) => t !== tech)
            : [...current, tech];

        updateData({
            techStack: { ...data.techStack, [category]: updated },
        });
    };

    const addCustomTech = (category: keyof ProjectTechStack) => {
        const value = customInputs[category].trim();
        if (value) {
            const current = data.techStack[category] || [];
            if (!current.includes(value)) {
                updateData({
                    techStack: { ...data.techStack, [category]: [...current, value] },
                });
            }
            setCustomInputs({ ...customInputs, [category]: '' });
        }
    };

    const isTechSelected = (category: keyof ProjectTechStack, tech: string) => {
        return (data.techStack[category] || []).includes(tech);
    };

    const renderTechCategory = (
        category: keyof ProjectTechStack,
        label: string,
        emoji: string
    ) => (
        <div>
            <label className="block text-label-md text-text-primary mb-3">
                {emoji} {label}
            </label>

            {/* Popular choices */}
            <div className="flex flex-wrap gap-2 mb-3">
                {POPULAR_TECH[category].map((tech) => (
                    <button
                        key={tech}
                        onClick={() => toggleTech(category, tech)}
                        className={`px-3 py-1.5 rounded-full text-label-sm transition-all ${isTechSelected(category, tech)
                                ? 'bg-brand-teal text-background-default'
                                : 'bg-background-subtle border border-border-subtle text-text-muted hover:border-brand-teal hover:text-text-primary'
                            }`}
                    >
                        {tech}
                    </button>
                ))}
            </div>

            {/* Custom tech */}
            {(data.techStack[category] || []).filter(
                (t) => !POPULAR_TECH[category].includes(t)
            ).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(data.techStack[category] || [])
                            .filter((t) => !POPULAR_TECH[category].includes(t))
                            .map((tech) => (
                                <span
                                    key={tech}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-magenta/10 text-brand-magenta rounded-full text-label-sm"
                                >
                                    {tech}
                                    <button
                                        onClick={() => toggleTech(category, tech)}
                                        className="hover:text-brand-magenta/70 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                    </div>
                )}

            {/* Add custom */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={customInputs[category]}
                    onChange={(e) =>
                        setCustomInputs({ ...customInputs, [category]: e.target.value })
                    }
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTech(category)}
                    placeholder="Add custom technology..."
                    className="flex-1 px-3 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-primary text-body-sm placeholder-text-muted focus:outline-none focus:border-brand-teal"
                />
                <button
                    onClick={() => addCustomTech(category)}
                    className="px-4 py-2 bg-background-subtle border border-border-subtle rounded-lg text-text-muted hover:text-text-primary hover:border-border-strong transition-colors text-body-sm"
                >
                    + Add
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="text-body-sm text-text-muted">
                Select your tech stack. This helps Codra generate context-aware code and suggestions.
            </div>

            {renderTechCategory('frontend', 'Frontend', '🎨')}
            {renderTechCategory('backend', 'Backend', '⚙️')}
            {renderTechCategory('infra', 'Infrastructure', '☁️')}
            {renderTechCategory('aiProviders', 'AI Providers', '🤖')}
        </div>
    );
};
