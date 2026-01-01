import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Prompt, PromptVersion, CreatePromptInput, UpdatePromptInput } from '../../types/prompt';

interface PromptState {
    prompts: Prompt[];
    versions: Record<string, PromptVersion[]>; // promptId -> versions
    isLoading: boolean;
    error: string | null;

    // Filters
    searchQuery: string;
    selectedCategory: string | null;
    selectedTags: string[];

    // Actions
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string | null) => void;
    toggleTag: (tag: string) => void;

    addPrompt: (input: CreatePromptInput) => Prompt;
    updatePrompt: (id: string, input: UpdatePromptInput) => void;
    deletePrompt: (id: string) => void;
    createVersion: (promptId: string, content: string, changeNote: string) => void;

    getPrompt: (id: string) => Prompt | undefined;
    getVersions: (promptId: string) => PromptVersion[];
}

// Mock Data
const MOCK_PROMPTS: Prompt[] = [
    {
        id: '1',
        name: 'Code Refactor Expert',
        description: 'Refactors code for performance and readability',
        content: 'You are an expert software engineer. Refactor the following code to improve performance and readability:\n\n{{code}}',
        variables: [
            { name: 'code', type: 'text', label: 'Code to Refactor', required: true }
        ],
        tags: ['coding', 'refactor', 'optimization'],
        category: 'Development',
        isPublic: true,
        isFavorite: true,
        createdAt: new Date('2023-10-01'),
        updatedAt: new Date('2023-10-05'),
        userId: 'user-1',
        usageCount: 42,
        averageRating: 4.8,
        currentVersion: 1
    },
    {
        id: '2',
        name: 'Email Professional',
        description: 'Drafts professional emails based on bullet points',
        content: 'Draft a professional email to {{recipient}} regarding {{subject}}. Key points:\n{{points}}',
        variables: [
            { name: 'recipient', type: 'text', label: 'Recipient Name', required: true },
            { name: 'subject', type: 'text', label: 'Email Subject', required: true },
            { name: 'points', type: 'text', label: 'Key Points', required: true }
        ],
        tags: ['email', 'write', 'business'],
        category: 'Productivity',
        isPublic: false,
        createdAt: new Date('2023-11-12'),
        updatedAt: new Date('2023-11-12'),
        userId: 'user-1',
        usageCount: 15,
        averageRating: 4.5,
        currentVersion: 1
    }
];

export const usePromptStore = create<PromptState>((set, get) => ({
    prompts: MOCK_PROMPTS,
    versions: {},
    isLoading: false,
    error: null,

    searchQuery: '',
    selectedCategory: null,
    selectedTags: [],

    setSearchQuery: (query) => set({ searchQuery: query }),
    setSelectedCategory: (category) => set({ selectedCategory: category }),
    toggleTag: (tag) => set((state) => {
        const isSelected = state.selectedTags.includes(tag);
        return {
            selectedTags: isSelected
                ? state.selectedTags.filter(t => t !== tag)
                : [...state.selectedTags, tag]
        };
    }),

    addPrompt: (input) => {
        const newPrompt: Prompt = {
            ...input,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: input.userId || 'user-1', // Use provided userId or mock user
            usageCount: 0,
            currentVersion: 1,
            tags: input.tags || [],
            variables: input.variables || []
        };
        set((state) => ({ prompts: [newPrompt, ...state.prompts] }));
        return newPrompt;
    },

    updatePrompt: (id, input) => set((state) => ({
        prompts: state.prompts.map(p =>
            p.id === id
                ? { ...p, ...input, updatedAt: new Date() }
                : p
        )
    })),

    deletePrompt: (id) => set((state) => ({
        prompts: state.prompts.filter(p => p.id !== id)
    })),

    createVersion: (promptId, content, changeNote) => set((state) => {
        // In a real app, we'd fetch the current state of the prompt to snapshot it
        const prompt = state.prompts.find(p => p.id === promptId);
        if (!prompt) return {};

        const newVersion: PromptVersion = {
            id: uuidv4(),
            promptId,
            version: prompt.currentVersion + 1,
            content,
            variables: prompt.variables, // Snapshot current variables
            changeNote,
            authorId: 'user-1',
            createdAt: new Date()
        };

        const currentVersions = state.versions[promptId] || [];

        // Also update the prompt's content and version
        const updatedPrompts = state.prompts.map(p =>
            p.id === promptId
                ? { ...p, content, currentVersion: p.currentVersion + 1, updatedAt: new Date() }
                : p
        );

        return {
            prompts: updatedPrompts,
            versions: {
                ...state.versions,
                [promptId]: [newVersion, ...currentVersions]
            }
        };
    }),

    getPrompt: (id) => get().prompts.find(p => p.id === id),
    getVersions: (promptId) => get().versions[promptId] || []
}));
