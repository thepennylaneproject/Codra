import { useEffect } from 'react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useSpreadGeneration } from '../hooks/useSpreadGeneration';
import { Button } from '../../../components/Button';
import { ProgressSpinner, ProgressBar } from '../../../components/ProgressDot';

export const StepGenerating = () => {
    const { data } = useOnboarding();
    const { generateSpread, isGenerating, error, progress } = useSpreadGeneration();
    
    useEffect(() => {
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
                    Creating your Spread...
                </h1>
                <p className="text-base text-[#5A5A5A]">
                    Setting up your workspace with smart defaults
                </p>
            </div>
            
            {/* Progress Bar - coral accent (PERMITTED: active-progress) */}
            <div className="w-full max-w-xs">
                <ProgressBar value={progress} size="sm" showLabel />
            </div>
            
            {/* Helper Text */}
            <p className="text-xs text-[#8A8A8A] uppercase tracking-wider max-w-md">
                This takes just a moment. You can adjust all settings after your first Spread.
            </p>
        </div>
    );
};
