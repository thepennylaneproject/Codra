import { useEffect } from 'react';
import { useOnboardingStore } from './store';
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
    const { step, profile, reset } = useOnboardingStore();

    // Reset store on mount for fresh start
    useEffect(() => {
        reset();
    }, []);

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
        <div className="min-h-screen bg-[#FFFAF0] text-[#1A1A1A] flex items-center justify-center p-6 md:p-12 font-sans selection:bg-[#FF4D4D]/20">
            <div className="w-full max-w-3xl">
                {/* Header - Editorial branding */}
                <div className="mb-8 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8A8A]">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />
                        <span className="text-[#1A1A1A]">Codra</span>
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
