import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../hooks/useOnboarding';
import { analytics } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';

const PROJECT_TYPE_OPTIONS = [
    { id: 'campaign' as const, label: 'Campaign', description: 'Full-funnel campaign production', icon: '🚀' },
    { id: 'product' as const, label: 'Product', description: 'Product or SaaS experience', icon: '🎨' },
    { id: 'content' as const, label: 'Content', description: 'Content creation project', icon: '📝' },
    { id: 'custom' as const, label: 'Custom', description: 'Bespoke production work', icon: '✨' },
];

export const StepProjectInfo = () => {
    const navigate = useNavigate();
    const { data, updateData, canProceedFromProjectInfo, startSession } = useOnboarding();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [startTime] = useState(Date.now());
    const canProceed = canProceedFromProjectInfo();
    
    // Auto-focus project name input on mount and track view
    useEffect(() => {
        nameInputRef.current?.focus();
        startSession();
        analytics.track('onboarding_step_viewed', { step: 1, stepName: 'project-info' });
    }, [startSession]);
    
    const handleContinue = () => {
        if (canProceedFromProjectInfo()) {
            analytics.track('onboarding_step_completed', {
                step: 1,
                stepName: 'project-info',
                durationMs: Date.now() - startTime,
                projectType: data.projectType || undefined,
                hasDescription: !!data.description.trim(),
            });
            navigate('/new?step=context');
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && canProceedFromProjectInfo()) {
            handleContinue();
        }
    };
    
    return (
        <div className="space-y-8 pb-28">
            {/* Step Title */}
            <div className="space-y-2">
                <h1 className="text-xl font-medium text-text-primary">
                    What are you making?
                </h1>
                <p className="text-base text-text-secondary">
                    Tell us about your project. We&apos;ll set up everything else.
                </p>
            </div>
            
            {/* Project Name Input */}
            <div className="space-y-2">
                <label 
                    htmlFor="project-name" 
                    className="block text-sm font-medium text-text-secondary"
                >
                    Project Name *
                </label>
                <input
                    ref={nameInputRef}
                    id="project-name"
                    type="text"
                    value={data.projectName}
                    onChange={(e) => updateData({ projectName: e.target.value })}
                    onKeyPress={handleKeyPress}
                    placeholder="My Awesome Project"
                    className="w-full px-4 py-3 text-base text-text-primary bg-white border border-[#1A1A1A]/10 rounded-lg focus:outline-none focus:border-[#1A1A1A]/30 transition-colors"
                />
            </div>
            
            {/* Project Type Selector */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-text-secondary">
                    Project Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {PROJECT_TYPE_OPTIONS.map((option) => (
                        <Button
                            key={option.id}
                            onClick={() => updateData({ projectType: option.id })}
                            aria-pressed={data.projectType === option.id}
                            className={`
                                relative p-4 text-left rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30
                                ${data.projectType === option.id
                                    ? 'border-[#1A1A1A] bg-[#1A1A1A]/[0.02] shadow-[inset_0_0_0_1px_rgba(26,26,26,0.2)]'
                                    : 'border-[#1A1A1A]/10 bg-white hover:border-[#1A1A1A]/20'
                                }
                            `}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl">{option.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-text-primary mb-0">
                                        {option.label}
                                    </div>
                                    <div className="text-xs text-text-secondary">
                                        {option.description}
                                    </div>
                                </div>
                            </div>
                            {data.projectType === option.id && (
                                <div className="absolute top-3 right-3 w-5 h-5 bg-[#1A1A1A] rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </Button>
                    ))}
                </div>
            </div>
            
            {/* Optional Description */}
            <div className="space-y-2">
                <label 
                    htmlFor="description" 
                    className="block text-sm font-medium text-text-secondary"
                >
                    Description (Optional)
                </label>
                <textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => updateData({ description: e.target.value })}
                    placeholder="A one-sentence description of your project..."
                    rows={2}
                    className="w-full px-4 py-3 text-base text-text-primary bg-white border border-[#1A1A1A]/10 rounded-lg focus:outline-none focus:border-[#1A1A1A]/30 transition-colors resize-none"
                />
            </div>
            
            <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
                <div className="max-w-2xl mx-auto px-6 md:px-12 py-6 flex items-center justify-end">
                    <Button
                        onClick={handleContinue}
                        disabled={!canProceed}
                        variant="primary"
                        size="lg"
                        className="px-10 shadow-lg pointer-events-auto bg-zinc-900 text-white hover:bg-zinc-800"
                        aria-label="Create project"
                        title={!canProceed ? 'Project configuration incomplete' : 'Create project'}
                    >
                        Create project
                    </Button>
                </div>
            </div>
        </div>
    );
};
