import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingStep = 'project-info' | 'context' | 'generating' | 'complete';

export type StreamlinedProjectType = 'campaign' | 'product' | 'content' | 'custom';

export interface FileUpload {
    id: string;
    name: string;
    type: string;
    size: number;
    preview?: string;
    file: File;
}

export interface StreamlinedOnboardingData {
    projectName: string;
    projectType: StreamlinedProjectType | null;
    description: string;
    contextFiles: FileUpload[];
}

interface OnboardingFlowState {
    currentStep: OnboardingStep;
    data: StreamlinedOnboardingData;
    
    // Actions
    setStep: (step: OnboardingStep) => void;
    updateData: (updates: Partial<StreamlinedOnboardingData>) => void;
    addFile: (file: FileUpload) => void;
    removeFile: (fileId: string) => void;
    reset: () => void;
    
    // Validation
    canProceedFromProjectInfo: () => boolean;
}

const INITIAL_DATA: StreamlinedOnboardingData = {
    projectName: '',
    projectType: null,
    description: '',
    contextFiles: [],
};

export const useOnboarding = create<OnboardingFlowState>()(
    persist(
        (set, get) => ({
            currentStep: 'project-info',
            data: INITIAL_DATA,
            
            setStep: (step) => set({ currentStep: step }),
            
            updateData: (updates) => set((state) => ({
                data: { ...state.data, ...updates }
            })),
            
            addFile: (file) => set((state) => ({
                data: {
                    ...state.data,
                    contextFiles: [...state.data.contextFiles, file]
                }
            })),
            
            removeFile: (fileId) => set((state) => ({
                data: {
                    ...state.data,
                    contextFiles: state.data.contextFiles.filter(f => f.id !== fileId)
                }
            })),
            
            reset: () => set({
                currentStep: 'project-info',
                data: INITIAL_DATA
            }),
            
            canProceedFromProjectInfo: () => {
                const { data } = get();
                return !!(data.projectName.trim() && data.projectType);
            },
        }),
        {
            name: 'codra-streamlined-onboarding',
            partialize: (state) => ({
                data: state.data,
                currentStep: state.currentStep,
            }),
        }
    )
);
