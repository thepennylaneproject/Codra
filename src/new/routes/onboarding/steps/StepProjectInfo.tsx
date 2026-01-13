import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, OnboardingProjectState } from '../hooks/useOnboarding';
import { analytics } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/new/components/Toast';

const PROJECT_TYPE_OPTIONS = [
    { id: 'campaign' as const, label: 'Campaign', description: 'Full-funnel campaign production', icon: '🚀' },
    { id: 'product' as const, label: 'Product', description: 'Product or SaaS experience', icon: '🎨' },
    { id: 'content' as const, label: 'Content', description: 'Content creation project', icon: '📝' },
    { id: 'custom' as const, label: 'Custom', description: 'Bespoke production work', icon: '✨' },
];

const ONBOARDING_PROJECT_KEY = 'codra:onboardingProject';

export const StepProjectInfo = () => {
    const navigate = useNavigate();
    const { data, updateData, canProceedFromProjectInfo, startSession, setProjectId } = useOnboarding();
    const { session } = useAuth();
    const toast = useToast();
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [startTime] = useState(Date.now());
    const [isCreating, setIsCreating] = useState(false);
    const canProceed = canProceedFromProjectInfo();
    
    // Auto-focus project name input on mount and track view
    useEffect(() => {
        nameInputRef.current?.focus();
        startSession();
        analytics.track('onboarding_step_viewed', { step: 1, stepName: 'project-info' });
    }, [startSession]);
    
    const handleContinue = async () => {
        if (!canProceedFromProjectInfo() || isCreating) return;
        
        setIsCreating(true);
        
        try {
            // Call API to create project
            const response = await fetch('/.netlify/functions/projects-create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({
                    name: data.projectName,
                    type: data.projectType,
                    summary: data.description || undefined,
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create project');
            }
            
            const { projectId } = await response.json();
            
            // Store in localStorage
            const projectState: OnboardingProjectState = {
                projectId,
                projectName: data.projectName,
                step: 'context',
                createdAt: Date.now(),
            };
            localStorage.setItem(ONBOARDING_PROJECT_KEY, JSON.stringify(projectState));
            
            // Store in Zustand
            setProjectId(projectId);
            
            // Track analytics
            analytics.track('onboarding_step_completed', {
                step: 1,
                stepName: 'project-info',
                durationMs: Date.now() - startTime,
                projectType: data.projectType || undefined,
                hasDescription: !!data.description.trim(),
                projectId,
            });
            
            // Show success toast
            toast.success(`Project "${data.projectName}" created!`);
            
            // Navigate with projectId
            navigate(`/new?step=context&projectId=${projectId}`);
        } catch (error) {
            console.error('Error creating project:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create project');
            setIsCreating(false);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && canProceedFromProjectInfo() && !isCreating) {
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
                    data-tour="project-name"
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
                <div data-tour="project-type" className="grid grid-cols-2 gap-3">
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
                        data-tour="continue-button"
                        onClick={handleContinue}
                        disabled={!canProceed || isCreating}
                        variant="primary"
                        size="lg"
                        className="px-10 shadow-lg pointer-events-auto bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50"
                        aria-label="Create project"
                        title={!canProceed ? 'Project configuration incomplete' : 'Create project'}
                    >
                        {isCreating ? 'Creating...' : 'Create project'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
