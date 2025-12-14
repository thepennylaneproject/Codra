/**
 * ONBOARDING WIZARD
 * Main container component for the onboarding flow
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth/AuthProvider';
import {
    onboardingStore,
    OnboardingState,
    OnboardingStep,
    STEP_CONFIG
} from '../../lib/onboarding/onboarding-store';
import { OnboardingProgress } from './OnboardingProgress';
import { WelcomeStep } from './steps/WelcomeStep';
import { ProfileStep } from './steps/ProfileStep';
import { CredentialsStep } from './steps/CredentialsStep';
import { FirstProjectStep } from './steps/FirstProjectStep';
import { SuccessStep } from './steps/SuccessStep';
import { Logo } from '../Logo';

export const OnboardingWizard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [state, setState] = useState<OnboardingState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial state
    useEffect(() => {
        async function loadState() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            const currentState = await onboardingStore.getState(user.id);

            // If already completed, redirect to dashboard
            if (currentState.currentStep === 'completed') {
                navigate('/');
                return;
            }

            setState(currentState);
            setIsLoading(false);
        }

        loadState();
    }, [user?.id, navigate]);

    const handleStepComplete = async (step: OnboardingStep, data?: Partial<OnboardingState>) => {
        if (!user?.id || !state) return;

        // Save any step-specific data
        if (data) {
            await onboardingStore.saveState(user.id, data);
        }

        // Handle Special Paths from Welcome Step
        if (step === 'welcome' && data?.preferences) {
            const { useDemoMode, wantsTour } = data.preferences;

            // IF "Quick Start" (wantsTour = false) or "Demo Mode" (useDemoMode = true)
            // We should skip the middle steps and go straight to success or completion.
            // But usually we need at least a profile? 
            // "Quick Start" description: "Jump straight in".
            // Let's skip Profile, Credentials, FirstProject.

            if (useDemoMode || (!wantsTour && !data.preferences.hasOwnCredentials)) {
                // Skip to validation/success or just complete everything
                // Let's jump to success to give them that "Done" feeling
                const nextState = await onboardingStore.completeStep(user.id, 'welcome');
                // Manually override to success
                nextState.currentStep = 'success';
                // Mark intermediates as skipped? 
                // We'll just force the UI to 'success' which will then let them "Go to Dashboard"
                await onboardingStore.saveState(user.id, { currentStep: 'success' });
                setState(nextState);
                return;
            }
        }

        // Standard flow
        const nextState = await onboardingStore.completeStep(user.id, step);
        setState(nextState);

        // If completed, redirect after celebration
        if (nextState.currentStep === 'completed') {
            setTimeout(() => navigate('/'), 2000);
        }
    };

    const handleSkip = async (step: OnboardingStep) => {
        if (!user?.id) return;
        const nextState = await onboardingStore.skipStep(user.id, step);
        setState(nextState);
    };

    const handleBack = () => {
        if (!state) return;

        const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'credentials', 'first_project', 'success'];
        const currentIndex = stepOrder.indexOf(state.currentStep);

        if (currentIndex > 0) {
            // Optimistically update local state for immediate UI feedback
            const prevStep = stepOrder[currentIndex - 1];
            setState(prev => prev ? { ...prev, currentStep: prevStep } : null);
            // Also sync to store so refresh works
            if (user?.id) {
                onboardingStore.saveState(user.id, { currentStep: prevStep });
            }
        }
    };

    if (isLoading || !state) {
        return (
            <div className="min-h-screen bg-background-default flex items-center justify-center">
                <div className="animate-pulse">
                    <Logo size="lg" variant="icon" />
                </div>
            </div>
        );
    }

    const config = STEP_CONFIG[state.currentStep];
    const stepOrder: OnboardingStep[] = ['welcome', 'profile', 'credentials', 'first_project', 'success'];

    return (
        <div className="min-h-screen bg-background-default flex flex-col relative">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-border-subtle">
                <Logo size="sm" variant="full" />
                <OnboardingProgress
                    steps={stepOrder.filter(s => s !== 'completed')}
                    currentStep={state.currentStep}
                    completedSteps={state.completedSteps}
                />
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl">
                    {/* Step Header */}
                    <div className="text-center mb-8">
                        <span className="text-4xl mb-4 block">{config.emoji}</span>
                        <h1 className="text-heading-xl text-text-primary font-bold mb-2">
                            {config.title}
                        </h1>
                        <p className="text-body-lg text-text-muted">
                            {config.description}
                        </p>
                    </div>

                    {/* Step Content */}
                    <div className="bg-background-elevated rounded-2xl border border-border-subtle p-8 shadow-sm">
                        {state.currentStep === 'welcome' && (
                            <WelcomeStep
                                onComplete={(data) => handleStepComplete('welcome', data)}
                            />
                        )}

                        {state.currentStep === 'profile' && (
                            <ProfileStep
                                initialData={state.profile}
                                onComplete={(data) => handleStepComplete('profile', { profile: data })}
                                onSkip={() => handleSkip('profile')}
                                onBack={handleBack}
                            />
                        )}

                        {state.currentStep === 'credentials' && (
                            <CredentialsStep
                                onComplete={(prefs) => handleStepComplete('credentials', { preferences: { ...state.preferences, ...prefs } })}
                                onSkip={() => handleSkip('credentials')}
                                onBack={handleBack}
                            />
                        )}

                        {state.currentStep === 'first_project' && (
                            <FirstProjectStep
                                userProfile={state.profile}
                                onComplete={(projectId) => handleStepComplete('first_project', { firstProjectId: projectId })}
                                onSkip={() => handleSkip('first_project')}
                                onBack={handleBack}
                            />
                        )}

                        {state.currentStep === 'success' && (
                            <SuccessStep
                                state={state}
                                onComplete={() => handleStepComplete('success')}
                            />
                        )}
                    </div>

                    {/* Estimated Time */}
                    {config.estimatedTime && (
                        <p className="text-center text-body-sm text-text-soft mt-4">
                            ⏱️ About {config.estimatedTime}
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
};
