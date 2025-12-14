/**
 * HOW IT WORKS SECTION
 * 3-step process visualization
 */

import React from 'react';
import { Lightbulb, Workflow, Rocket } from 'lucide-react';

const STEPS = [
    {
        icon: Lightbulb,
        title: 'Describe Your Idea',
        description: 'Start with natural language. Tell Codra what you want to build, from simple scripts to complex agents.',
        color: 'brand-gold',
    },
    {
        icon: Workflow,
        title: 'Refine the Workflow',
        description: 'Our Architect agent breaks it down into executable steps. Visualise, edit, and optimize the logic flow.',
        color: 'brand-magenta',
    },
    {
        icon: Rocket,
        title: 'Deploy & Scale',
        description: 'One click to production. We handle the infrastructure, you handle the innovation.',
        color: 'brand-teal',
    },
];

export const HowItWorks: React.FC = () => {
    return (
        <section id="how-it-works" className="py-24 px-6 bg-background-elevated relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-teal/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <span className="text-label-md text-brand-teal uppercase tracking-widest mb-4 block">
                        How It Works
                    </span>
                    <h2 className="text-display-md text-text-primary font-bold mb-4">
                        From Idea to App in Minutes
                    </h2>
                    <p className="text-body-lg text-text-muted max-w-2xl mx-auto">
                        Stop wrestling with boilerplate. Focus on the logic that matters.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden md:block absolute top-[60px] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-border-strong to-transparent border-t border-dashed border-border-strong z-0" />

                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div key={index} className="relative z-10 flex flex-col items-center text-center">
                                <div className={`w-32 h-32 rounded-full bg-background-default border border-border-subtle flex items-center justify-center mb-6 shadow-xl`}>
                                    <div className={`w-20 h-20 rounded-full bg-${step.color}/10 flex items-center justify-center`}>
                                        <Icon className={`w-10 h-10 text-${step.color}`} />
                                    </div>
                                </div>
                                <h3 className="text-heading-sm text-text-primary font-bold mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-body-md text-text-muted leading-relaxed max-w-xs">
                                    {step.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
