import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOnboarding } from './hooks/useOnboarding';
import { StepProjectInfo } from './steps/StepProjectInfo';
import { StepAddContext } from './steps/StepAddContext';
import { StepGenerating } from './steps/StepGeneratingNew';

/**
 * STREAMLINED ONBOARDING FLOW
 * 3-step flow: Project Info → Add Context (Optional) → Generating
 * 
 * Route: /new
 * Query params: ?step=context | ?step=generating
 */
export const OnboardingFlow = () => {
    const [searchParams] = useSearchParams();
    const { setStep, reset } = useOnboarding();
    const stepParam = searchParams.get('step');
    
    // Reset store on mount for fresh start
    useEffect(() => {
        reset();
    }, []);
    
    // Sync URL step with store
    useEffect(() => {
        if (stepParam === 'context') {
            setStep('context');
        } else if (stepParam === 'generating') {
            setStep('generating');
        } else {
            setStep('project-info');
        }
    }, [stepParam, setStep]);
    
    const renderStep = () => {
        const step = stepParam || 'project-info';
        
        switch (step) {
            case 'context':
                return <StepAddContext />;
            case 'generating':
                return <StepGenerating />;
            default:
                return <StepProjectInfo />;
        }
    };
    
    return (
        <div className="min-h-screen bg-[#FFFAF0] text-text-primary flex items-center justify-center p-6 md:p-12 font-sans selection:bg-[#1A1A1A]/10">
            <div className="w-full max-w-2xl">
                {/* Header - Editorial branding (ACCENT GOVERNANCE: brand dot removed per prohibited uses) */}
                <div className="mb-12 flex items-center justify-between text-xs font-semibold text-text-soft">
                    <div className="flex items-center gap-2">
                        <span className="text-text-primary">Codra</span>
                    </div>
                    <span>New workspace</span>
                </div>
                
                {/* Step Content */}
                <main>
                    {renderStep()}
                </main>
            </div>
        </div>
    );
};
