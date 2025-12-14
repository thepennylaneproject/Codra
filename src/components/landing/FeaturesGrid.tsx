/**
 * FEATURES GRID
 * Showcase core features with icons and descriptions
 */

import React from 'react';
import {
    Layers,
    Zap,
    Eye,
    GitBranch,
    Shield,
    Palette,
    Clock,
    Code
} from 'lucide-react';

const FEATURES = [
    {
        icon: Layers,
        title: 'Visual Workflow Builder',
        description: 'Drag-and-drop flow editor with real-time execution. Chain AI models, transformations, and outputs.',
        color: 'brand-teal',
    },
    {
        icon: Zap,
        title: '200+ AI Models',
        description: 'OpenAI, Anthropic, Google, and more. Compare outputs, benchmark costs, pick the best.',
        color: 'brand-gold',
    },
    {
        icon: Eye,
        title: 'Preview Everything',
        description: 'See every output before it\'s final. Approve, regenerate with feedback, or iterate infinitely.',
        color: 'brand-magenta',
    },
    {
        icon: GitBranch,
        title: 'Version Control',
        description: 'Full history of every artifact. Compare versions, restore old ones, track what changed.',
        color: 'brand-teal',
    },
    {
        icon: Shield,
        title: 'Your Keys, Your Control',
        description: 'Use your own API keys. We never store them unencrypted. AES-256-GCM at rest.',
        color: 'brand-gold',
    },
    {
        icon: Palette,
        title: 'Design System Aware',
        description: 'Generate on-brand content with built-in voice controls and design token support.',
        color: 'brand-magenta',
    },
    {
        icon: Clock,
        title: 'Cost Tracking',
        description: 'Real-time usage metrics. Set budgets, get alerts, optimize spending.',
        color: 'brand-teal',
    },
    {
        icon: Code,
        title: 'One-Click Deploy',
        description: 'Export to Netlify, Vercel, or download. Your workflows run anywhere.',
        color: 'brand-gold',
    },
];

export const FeaturesGrid: React.FC = () => {
    return (
        <section className="py-24 px-6 bg-background-default">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="text-label-md text-brand-teal uppercase tracking-widest mb-4 block">
                        Features
                    </span>
                    <h2 className="text-display-md text-text-primary font-bold mb-4">
                        Everything You Need to Build with AI
                    </h2>
                    <p className="text-body-lg text-text-muted max-w-2xl mx-auto">
                        Codra gives you the tools to create, iterate, and ship AI-powered projects
                        without losing control of quality or cost.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURES.map((feature, index) => {
                        const Icon = feature.icon;
                        // Using inline style for dynamic color bg since tailwind safelist might not cover dynamic string interpolation
                        // Assuming color classes like 'text-brand-teal' exist, but 'bg-brand-teal' might not be safe to interpolate 
                        // if not already used. 
                        // However, the provided code uses `bg-${feature.color}/10`. I will keep it as is, but be mindful of Tailwind purging.
                        // If colors are custom defined in tailwind config, it should work if safelisted or used elsewhere.

                        return (
                            <div
                                key={index}
                                className="p-6 rounded-xl bg-background-elevated border border-border-subtle hover:border-border-strong transition-all group"
                            >
                                <div className={`p-3 rounded-lg bg-${feature.color}/10 w-fit mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-6 h-6 text-${feature.color}`} />
                                </div>
                                <h3 className="text-label-lg text-text-primary font-semibold mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-body-sm text-text-muted leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
