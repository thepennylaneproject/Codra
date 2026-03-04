import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOnboarding, OnboardingProjectState } from './hooks/useOnboarding';
import { StepProjectInfo } from './steps/StepProjectInfo';
import { StepAddContext } from './steps/StepAddContext';
import { StepGenerating } from './steps/StepGeneratingNew';
import { ResumeProjectDialog } from './components/ResumeProjectDialog';
import { useToast } from '@/new/components/Toast';
import { loadGenerationSession } from './utils/generationSession';

const ONBOARDING_PROJECT_KEY = 'codra:onboardingProject';

/**
 * STREAMLINED ONBOARDING FLOW
 * 3-step flow: Project Info → Add Context (Optional) → Generating
 * 
 * Route: /new
 * Query params: ?step=context&projectId=xxx | ?step=generating&projectId=xxx
 * 
 * Project Lifecycle:
 * - Project is created at END of Step 1 (after name/type/summary submitted)
 * - projectId stored in localStorage + Zustand for resumability
 * - On mount, checks for existing project and offers resume
 */
export const OnboardingFlow = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { reset, setProjectId } = useOnboarding();
    const toast = useToast();
    const stepParam = searchParams.get('step');
    const projectIdParam = searchParams.get('projectId');
    const modeParam = searchParams.get('mode');
    
    // Resume dialog state
    const [showResumeDialog, setShowResumeDialog] = useState(false);
    const [savedProject, setSavedProject] = useState<OnboardingProjectState | null>(null);
    
    // Normalize URL to ensure step is present
    useEffect(() => {
        if (!stepParam) {
            const nextParams = new URLSearchParams();
            if (modeParam) nextParams.set('mode', modeParam);
            nextParams.set('step', 'project-info');
            navigate(`/new?${nextParams.toString()}`, { replace: true });
        }
    }, [stepParam, modeParam, navigate]);

    // Check for existing project on mount (only on initial load, not step changes)
    useEffect(() => {
        // Only check when on the start step
        if (stepParam && stepParam !== 'project-info') return;
        
        try {
            const saved = localStorage.getItem(ONBOARDING_PROJECT_KEY);
            if (saved) {
                const projectState: OnboardingProjectState = JSON.parse(saved);
                // Validate saved state has required fields
                if (projectState.projectId && projectState.projectName) {
                    setSavedProject(projectState);
                    setShowResumeDialog(true);
                }
            }
        } catch (e) {
            // Invalid localStorage data, clear it
            localStorage.removeItem(ONBOARDING_PROJECT_KEY);
        }
    }, [stepParam]);
    
    // Validate projectId from URL when on context or generating steps
    useEffect(() => {
        if ((stepParam === 'context' || stepParam === 'generating') && !projectIdParam) {
            // Missing projectId in URL - redirect to start
            toast.error('Missing project ID. Please start over.');
            const nextParams = new URLSearchParams();
            if (modeParam) nextParams.set('mode', modeParam);
            nextParams.set('step', 'project-info');
            navigate(`/new?${nextParams.toString()}`, { replace: true });
        }
    }, [stepParam, projectIdParam, navigate, modeParam, toast]);
    
    // Handle resume: navigate to saved step with projectId
    const handleResume = () => {
        if (!savedProject) return;
        if (!savedProject.projectId) {
            toast.error('Missing project ID. Please start over.');
            handleCreateNew();
            return;
        }
        
        setProjectId(savedProject.projectId);
        setShowResumeDialog(false);
        
        // Navigate to the saved step
        const step = savedProject.step || 'context';
        const nextParams = new URLSearchParams();
        if (modeParam) nextParams.set('mode', modeParam);
        nextParams.set('step', step);
        nextParams.set('projectId', savedProject.projectId);
        if (step === 'generating') {
            const session = loadGenerationSession(savedProject.projectId);
            if (session?.id) {
                nextParams.set('generationSessionId', session.id);
                if (session.skippedContext) {
                    nextParams.set('skipContext', '1');
                }
            }
        }
        navigate(`/new?${nextParams.toString()}`);
        toast.success(`Resuming "${savedProject.projectName}"`);
    };
    
    // Handle create new: clear localStorage and reset store
    const handleCreateNew = () => {
        localStorage.removeItem(ONBOARDING_PROJECT_KEY);
        reset();
        setShowResumeDialog(false);
        setSavedProject(null);
    };
    
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
        <>
            {/* Resume Dialog */}
            {showResumeDialog && savedProject && (
                <ResumeProjectDialog
                    projectName={savedProject.projectName}
                    onResume={handleResume}
                    onCreate={handleCreateNew}
                />
            )}
            
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
        </>
    );
};
