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

export interface OnboardingProjectState {
    projectId: string | null;
    projectName: string;
    step: OnboardingStep;
    createdAt: number;
}

interface OnboardingFlowState {
    currentStep: OnboardingStep;
    data: StreamlinedOnboardingData;
    sessionStartTime: number | null;
    projectId: string | null;
    
    // Actions
    setStep: (step: OnboardingStep) => void;
    updateData: (updates: Partial<StreamlinedOnboardingData>) => void;
    addFile: (file: FileUpload) => void;
    removeFile: (fileId: string) => void;
    reset: () => void;
    startSession: () => void;
    setProjectId: (id: string | null) => void;
    
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
            sessionStartTime: null,
            projectId: null,
            
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
                data: INITIAL_DATA,
                sessionStartTime: null,
                projectId: null,
            }),

            startSession: () => {
                if (!get().sessionStartTime) {
                    set({ sessionStartTime: Date.now() });
                }
            },
            
            setProjectId: (id) => set({ projectId: id }),
            
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
                projectId: state.projectId,
            }),
        }
    )
);
