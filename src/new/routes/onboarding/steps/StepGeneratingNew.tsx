import { useEffect, useState } from 'react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useSpreadGeneration } from '../hooks/useSpreadGeneration';
import { Button } from '../../../components/Button';
import { ProgressSpinner, ProgressBar } from '../../../components/ProgressDot';
import { CheckCircle2 } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface SuccessProps {
    projectName: string;
    sessionStartTime: number | null;
    generationStartTime: number;
    projectType: string | null;
}

const OnboardingSuccess = ({ projectName, sessionStartTime, generationStartTime, projectType }: SuccessProps) => {
    useEffect(() => {
        const generationDuration = Date.now() - generationStartTime;
        const totalDuration = sessionStartTime ? Date.now() - sessionStartTime : generationDuration;

        analytics.track('onboarding_completed', {
            totalSteps: 3,
            totalDurationMs: totalDuration,
        });

        analytics.track('first_spread_generated', {
            spreadId: 'initial-spread', // Placeholder or get from hook if possible
            durationFromStartMs: generationDuration,
            projectType: projectType || 'custom',
        });
    }, []);

    return (
        <div className="min-h-[500px] flex flex-col items-center justify-center text-center space-y-8">
            <div className="relative">
                <div className="p-8 bg-emerald-50 rounded-full">
                    <CheckCircle2 size={48} className="text-emerald-500" />
                </div>
            </div>
            
            <div className="space-y-3">
                <h1 className="text-2xl font-medium text-[#1A1A1A]">
                    Your workspace is ready!
                </h1>
                <p className="text-base text-[#5A5A5A]">
                    Opening {projectName}...
                </p>
            </div>
            
            <p className="text-xs text-[#8A8A8A] uppercase tracking-wider">
                Redirecting automatically
            </p>
        </div>
    );
};

export const StepGenerating = () => {
    const { data, sessionStartTime } = useOnboarding();
    const { generateSpread, isGenerating, error, progress } = useSpreadGeneration();
    const [startTime] = useState(Date.now());
    
    useEffect(() => {
        analytics.track('onboarding_step_viewed', { step: 3, stepName: 'generating' });

        // Auto-start generation on mount
        if (!error && !isGenerating) {
            generateSpread(data);
        }
    }, []); // Run once on mount
    
    const handleRetry = () => {
        generateSpread(data);
    };
    
    if (error) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center text-center space-y-6">
                <div className="p-6 bg-red-50 rounded-full">
                    <span className="text-red-500 text-3xl">!</span>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-medium text-[#1A1A1A]">
                        Generation Failed
                    </h2>
                    <p className="text-base text-[#5A5A5A] max-w-md">
                        {error}
                    </p>
                </div>
                <Button
                    onClick={handleRetry}
                    variant="primary"
                    size="lg"
                >
                    Try Again
                </Button>
            </div>
        );
    }
    
    // Success state - shows briefly before redirect
    if (progress >= 100) {
        // Track completion on first success render
        // This is a bit naive but works for a simple 3-step flow
        return <OnboardingSuccess 
            projectName={data.projectName} 
            sessionStartTime={sessionStartTime} 
            generationStartTime={startTime}
            projectType={data.projectType}
        />;
    }
    
    return (
        <div className="min-h-[500px] flex flex-col items-center justify-center text-center space-y-8">
            {/* Loading Animation */}
            <div className="relative">
                {/* Outer glow ring - neutral (ACCENT GOVERNANCE: removed coral decoration) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1A1A1A]/10 to-[#1A1A1A]/5 blur-xl animate-pulse" />

                {/* Main spinner - coral accent (PERMITTED: active-progress) */}
                <div className="relative p-8 bg-white rounded-full border-2 border-[#1A1A1A]/5">
                    <ProgressSpinner size="lg" />
                </div>
            </div>
            
            {/* Status Message */}
            <div className="space-y-3">
                <h1 className="text-2xl font-medium text-[#1A1A1A]">
                    Creating your workspace...
                </h1>
                <p className="text-base text-[#5A5A5A]">
                    Setting up {data.projectName} with smart defaults
                </p>
            </div>
            
            {/* Progress Bar - coral accent (PERMITTED: active-progress) */}
            <div className="w-full max-w-xs">
                <ProgressBar value={progress} size="sm" showLabel />
            </div>
            
            {/* Helper Text */}
            <p className="text-xs text-[#8A8A8A] uppercase tracking-wider max-w-md">
                This takes just a moment. You can adjust all settings after setup.
            </p>
        </div>
    );
};

