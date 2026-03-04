import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOnboardingStore, type OnboardingStep, STEP_METADATA } from './store';
import { ModeSelectionStep } from './steps/ModeSelectionStep';
import { ContextIntentStep } from './steps/ContextIntentStep';
import { ProjectImportStep } from './steps/ProjectImportStep';
import { AIPreferencesStep } from './steps/AIPreferencesStep';
import { BudgetPreferencesStep } from './steps/BudgetPreferencesStep';
import { VisualDirectionStep } from './steps/VisualDirectionStep';
import { GeneratingStep } from './steps/GeneratingStep';

/**
 * NEW PROJECT ONBOARDING
 * Consultative intake system that produces:
 * - Moodboard v1 (visual direction)
 * - Tear Sheet v1 (project brief)
 * 
 * Flow (New Project):
 * 1. Mode Selection (new project vs import vs manual)
 * 2. Context & Intent
 * 3. AI Preferences
 * 4. Visual Direction
 * 5. Tear Sheet Intent
 * 6. Generation → Redirect to Tear Sheet for confirmation
 * 
 * Flow (Import):
 * 1. Mode Selection
 * 2. Project Import
 * 3. AI Preferences
 * 4. Generation → Redirect to Tear Sheet for confirmation
 */
export const NewProjectOnboarding = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { step, profile, setStep } = useOnboardingStore();
    const stepParam = searchParams.get('step');
    const isValidStep = useMemo(() => {
        if (!stepParam) return false;
        return Object.prototype.hasOwnProperty.call(STEP_METADATA, stepParam);
    }, [stepParam]);

    useEffect(() => {
        if (searchParams.get('mode') !== 'detailed') {
            const next = new URLSearchParams(searchParams);
            next.set('mode', 'detailed');
            if (!stepParam) {
                next.set('step', 'mode');
            }
            navigate(`/new?${next.toString()}`, { replace: true });
        }
    }, [searchParams, navigate, stepParam]);

    useEffect(() => {
        if (!stepParam || !isValidStep) {
            const next = new URLSearchParams(searchParams);
            next.set('mode', 'detailed');
            next.set('step', 'mode');
            navigate(`/new?${next.toString()}`, { replace: true });
            return;
        }
        if (stepParam !== step) {
            setStep(stepParam as OnboardingStep);
        }
    }, [stepParam, step, isValidStep, navigate, searchParams, setStep]);

    useEffect(() => {
        if (!isValidStep) return;
        if (step === stepParam) return;
        const next = new URLSearchParams(searchParams);
        next.set('mode', 'detailed');
        next.set('step', step);
        navigate(`/new?${next.toString()}`, { replace: true });
    }, [step, stepParam, isValidStep, navigate, searchParams]);

    const renderStep = (): React.ReactNode => {
        switch (step) {
            case 'mode':
                return <ModeSelectionStep />;
            case 'context':
                return <ContextIntentStep />;
            case 'import':
                return <ProjectImportStep />;
            case 'ai-preferences':
                return <AIPreferencesStep />;
            case 'budget':
                return <BudgetPreferencesStep />;
            case 'visual':
                return <VisualDirectionStep />;
            case 'generating':
                return <GeneratingStep />;
            case 'complete':
                // Should redirect before reaching this, but fallback
                return <GeneratingStep />;
            default:
                return <ModeSelectionStep />;
        }
    };

    const headerLabel = profile.isImportFlow ? 'Import Project' : 'New Project';

    return (
        <div className="min-h-screen bg-[#FFFAF0] text-text-primary flex items-center justify-center p-6 md:p-12 font-sans selection:bg-zinc-300/40">
            <div className="w-full max-w-3xl">
                {/* Header - Editorial branding */}
                <div className="mb-8 flex items-center justify-between text-xs font-semibold text-text-soft">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <span className="text-text-primary">Codra</span>
                    </div>
                    <span>{headerLabel}</span>
                </div>

                {/* Step Content */}
                <main className="min-h-[500px]">
                    {renderStep()}
                </main>
            </div>
        </div>
    );
};
