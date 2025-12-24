/**
 * INTEGRATION DOMAIN TYPES
 * Standardized shapes for external production data.
 */

export type IntegrationStatus = 'connected' | 'disconnected' | 'pending' | 'error';

export interface ExternalError {
    id: string;
    source: 'sentry' | 'logrocket';
    message: string;
    level: 'error' | 'warning' | 'fatal';
    timestamp: string;
    culprit?: string;
    metadata?: Record<string, any>;
}

export interface ExternalIssue {
    id: string;
    source: 'linear' | 'jira' | 'github';
    title: string;
    status: string;
    priority: string;
    assignee?: string;
    url: string;
}

export interface ExternalAsset {
    id: string;
    source: 'cloudinary' | 'unsplash' | 's3';
    url: string;
    thumbnailUrl: string;
    name: string;
    format: string;
    tags: string[];
}

export interface IntegrationRegistry {
    sentry: IntegrationStatus;
    linear: IntegrationStatus;
    cloudinary: IntegrationStatus;
    github: IntegrationStatus;
}

/**
 * MOCK DATA GENERATORS
 */

export const MOCK_ERRORS: ExternalError[] = [
    {
        id: 'err_1',
        source: 'sentry',
        message: 'TypeError: Cannot read property "id" of undefined',
        level: 'error',
        timestamp: new Date().toISOString(),
        culprit: 'LyraContext.tsx',
        metadata: { browser: 'Chrome', version: '120.0' }
    },
    {
        id: 'err_2',
        source: 'sentry',
        message: 'Failed to fetch: Supabase 406 Error',
        level: 'fatal',
        timestamp: new Date().toISOString(),
        culprit: 'useSupabaseSpread.ts'
    }
];

export const MOCK_ISSUES: ExternalIssue[] = [
    {
        id: 'lin_1',
        source: 'linear',
        title: 'Refactor DeskWorkspace routing for scale',
        status: 'In Progress',
        priority: 'High',
        url: '#'
    },
    {
        id: 'lin_2',
        source: 'linear',
        title: 'Add support for Lottie animations in Art Desk',
        status: 'Backlog',
        priority: 'Medium',
        url: '#'
    }
];

export const MOCK_ASSETS: ExternalAsset[] = [
    {
        id: 'ast_1',
        source: 'cloudinary',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        name: 'Brand Hero Pattern',
        format: 'PNG',
        tags: ['minimal', 'bauhaus', 'background']
    },
    {
        id: 'ast_2',
        source: 'cloudinary',
        url: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2',
        thumbnailUrl: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2',
        name: 'Editorial Glyph Set',
        format: 'SVG',
        tags: ['icons', 'bold', 'dark']
    }
];
