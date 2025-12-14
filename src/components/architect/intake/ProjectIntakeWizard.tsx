/**
 * PROJECT INTAKE WIZARD
 * Multi-step form for capturing ProjectSpec
 * 
 * UX Philosophy: User First, AI Second
 * - Every field serves a purpose
 * - Quick start available for impatient users
 * - Progressive disclosure reduces overwhelm
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../../lib/store/project-store';
import { useCreateProject } from '../../../lib/api/projects/hooks';
import type {
    ProjectDomain,
    ProjectTechStack,
    ProjectConstraints,
    ProjectBrand
} from '../../../types/architect';

import { IntakeProgress } from './IntakeProgress';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { GoalsStep } from './steps/GoalsStep';
import { TechStackStep } from './steps/TechStackStep';
import { ConstraintsStep } from './steps/ConstraintsStep';
import { BrandVoiceStep } from './steps/BrandVoiceStep';
import { ReviewStep } from './steps/ReviewStep';
import { QuickStartModal } from './QuickStartModal';

const STEPS = [
    { id: 'basic', label: 'Basics', component: BasicInfoStep },
    { id: 'goals', label: 'Goals', component: GoalsStep },
    { id: 'tech', label: 'Tech Stack', component: TechStackStep },
    { id: 'constraints', label: 'Constraints', component: ConstraintsStep },
    { id: 'brand', label: 'Brand Voice', component: BrandVoiceStep },
    { id: 'review', label: 'Review', component: ReviewStep },
];

interface WizardData {
    // Basic
    title: string;
    summary: string;
    domain: ProjectDomain;

    // Goals
    primaryGoal: string;
    secondaryGoals: string[];
    targetUsers: string[];

    // Tech
    techStack: ProjectTechStack;

    // Constraints
    constraints: ProjectConstraints;

    // Brand
    brand: ProjectBrand;
}

const DEFAULT_DATA: WizardData = {
    title: '',
    summary: '',
    domain: 'saas',
    primaryGoal: '',
    secondaryGoals: [],
    targetUsers: [],
    techStack: {
        frontend: ['React', 'TypeScript'],
        backend: [],
        infra: [],
        aiProviders: ['AIMLAPI'],
    },
    constraints: {
        budgetLevel: 'medium',
        timeline: 'normal',
        complexityTolerance: 'moderate',
    },
    brand: {
        voiceTags: [],
        adjectives: [],
        bannedWords: [],
    },
};

export const ProjectIntakeWizard: React.FC = () => {
    const navigate = useNavigate();
    const { addProject, setCurrentProject } = useProjectStore();
    const createProjectMutation = useCreateProject();

    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<WizardData>(DEFAULT_DATA);
    const [showQuickStart, setShowQuickStart] = useState(false);

    const updateData = useCallback((updates: Partial<WizardData>) => {
        setData((prev) => ({ ...prev, ...updates }));
    }, []);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            const project = await createProjectMutation.mutateAsync({
                title: data.title,
                summary: data.summary,
                domain: data.domain,
                primaryGoal: data.primaryGoal,
                secondaryGoals: data.secondaryGoals,
                targetUsers: data.targetUsers,
                techStack: data.techStack,
                constraints: data.constraints,
                brand: data.brand,
            });

            addProject(project);
            setCurrentProject(project.id);
            navigate(`/projects/${project.id}`);
        } catch (err) {
            console.error('Failed to create project:', err);
        }
    };

    const handleQuickStart = async (template: 'saas' | 'site' | 'automation') => {
        const quickData: WizardData = {
            ...DEFAULT_DATA,
            domain: template,
            title: `New ${template.charAt(0).toUpperCase() + template.slice(1)} Project`,
            summary: `A new ${template} project created with quick start`,
            primaryGoal: template === 'saas'
                ? 'Build a functional MVP'
                : template === 'site'
                    ? 'Launch a professional website'
                    : 'Automate a workflow',
        };

        setData(quickData);
        setShowQuickStart(false);
        setCurrentStep(STEPS.length - 1); // Go to review
    };

    const StepComponent = STEPS[currentStep].component;
    const isLastStep = currentStep === STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <div className="min-h-screen bg-background-default">
            {/* Header */}
            <div className="border-b border-border-subtle bg-background-elevated">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-display-sm text-text-primary font-semibold">
                                Create New Project
                            </h1>
                            <p className="text-body-sm text-text-muted mt-1">
                                Tell Codra about your project so it can help you build it
                            </p>
                        </div>
                        <button
                            onClick={() => setShowQuickStart(true)}
                            className="px-4 py-2 text-label-sm text-brand-teal border border-brand-teal/30 rounded-lg hover:bg-brand-teal/10 transition-colors"
                        >
                            Quick Start →
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="max-w-4xl mx-auto px-6 py-6">
                <IntakeProgress steps={STEPS} currentStep={currentStep} />
            </div>

            {/* Step Content */}
            <div className="max-w-4xl mx-auto px-6 pb-32">
                {createProjectMutation.isError && (
                    <div className="mb-6 p-4 bg-state-error/10 border border-state-error/30 rounded-lg text-state-error">
                        {createProjectMutation.error instanceof Error
                            ? createProjectMutation.error.message
                            : 'Failed to create project'}
                    </div>
                )}

                <StepComponent
                    data={data}
                    updateData={updateData}
                />
            </div>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-background-elevated border-t border-border-subtle">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={isFirstStep}
                        className="px-6 py-2.5 text-label-md text-text-muted hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Back
                    </button>

                    <div className="text-body-sm text-text-muted">
                        Step {currentStep + 1} of {STEPS.length}
                    </div>

                    {isLastStep ? (
                        <button
                            onClick={handleSubmit}
                            disabled={createProjectMutation.isPending || !data.title || !data.primaryGoal}
                            className="px-6 py-2.5 bg-brand-magenta text-background-default text-label-md font-semibold rounded-full hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-magenta"
                        >
                            {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2.5 bg-brand-teal text-background-default text-label-md font-semibold rounded-full hover:brightness-110 transition-all"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Start Modal */}
            {showQuickStart && (
                <QuickStartModal
                    onSelect={handleQuickStart}
                    onClose={() => setShowQuickStart(false)}
                />
            )}
        </div>
    );
};
