export interface PromptVariable {
    name: string;
    type: 'text' | 'number' | 'select' | 'boolean';
    label: string;
    defaultValue?: string;
    options?: string[]; // For select type
    required: boolean;
    description?: string;
}

export interface PromptUsage {
    promptId: string;
    model: string;
    result: 'success' | 'error';
    rating?: number;
    timestamp: Date;
    latencyMs?: number;
    cost?: number;
}

export interface PromptVersion {
    id: string;
    promptId: string;
    version: number;
    content: string;
    variables: PromptVariable[];
    changeNote: string;
    authorId: string; // User who made the change
    createdAt: Date;
}

export interface Prompt {
    id: string;
    name: string;
    description: string;
    content: string;
    variables: PromptVariable[];
    tags: string[];
    category: string;
    isPublic: boolean;
    isFavorite?: boolean;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    userId: string;

    // Stats (computed or synced)
    usageCount: number;
    averageRating?: number;

    // Versioning
    currentVersion: number;
}

export type CreatePromptInput = Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'currentVersion' | 'userId'> & { userId?: string };
export type UpdatePromptInput = Partial<Omit<CreatePromptInput, 'userId'>>;
