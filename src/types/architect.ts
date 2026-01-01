/**
 * ARCHITECT TYPE DEFINITIONS
 * Core data model for Codra's Project Intelligence System
 * 
 * Philosophy: Every project has a "vibe" that can be captured structurally.
 * The ProjectContext gives AI everything it needs to generate contextually.
 */

// ============================================================================
// PROJECT SPEC - The Project's Identity
// ============================================================================

export type ProjectDomain =
    | 'saas'
    | 'site'
    | 'automation'
    | 'content_engine'
    | 'api'
    | 'mobile'
    | 'other';

export type BudgetLevel = 'low' | 'medium' | 'high';
export type Timeline = 'rush' | 'normal' | 'long_horizon';
export type ComplexityTolerance = 'simple' | 'moderate' | 'complex';

export interface ProjectConstraints {
    budgetLevel: BudgetLevel;
    timeline: Timeline;
    complexityTolerance: ComplexityTolerance;
    maxMonthlyAICost?: number;
    deadlineDate?: string; // ISO date
}

export interface ProjectBrand {
    voiceTags: string[];          // e.g., ["professional", "warm", "technical"]
    adjectives: string[];         // e.g., ["innovative", "trustworthy", "bold"]
    bannedWords: string[];        // Words to never use
    toneNotes?: string;           // Free-form tone guidance
}

export interface ProjectTechStack {
    frontend?: string[];          // e.g., ["React", "TypeScript", "Tailwind"]
    backend?: string[];           // e.g., ["Node.js", "Supabase"]
    infra?: string[];             // e.g., ["Netlify", "Cloudflare"]
    aiProviders?: string[];       // e.g., ["AIMLAPI", "DeepSeek"]
}

import type { GeneratedTheme } from './design';

// ... existing imports ...

export interface ProjectSpec {
    id: string;
    userId: string;

    // Identity
    title: string;
    summary: string;
    domain: ProjectDomain;

    // Goals
    primaryGoal: string;
    secondaryGoals: string[];

    // Audience
    targetUsers: string[];        // e.g., ["small business owners", "developers"]

    // Technical
    techStack: ProjectTechStack;

    // Constraints
    constraints: ProjectConstraints;

    // Brand
    brand: ProjectBrand;

    // Design
    theme?: GeneratedTheme;

    // Metadata
    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// WORKSTREAMS - High-Level Phases
// ============================================================================

export type WorkstreamStatus =
    | 'not_started'
    | 'in_progress'
    | 'blocked'
    | 'completed';

export interface ProjectWorkstream {
    id: string;
    projectId: string;

    // Identity
    title: string;                // e.g., "Design System", "Core Features"
    description: string;

    // Organization
    order: number;                // Display order
    status: WorkstreamStatus;

    // Progress
    taskCount: number;
    completedTaskCount: number;

    // AI Generation Context
    contextHints?: string[];      // Hints for AI when generating tasks

    // Metadata
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// TASKS - Concrete Deliverables
// ============================================================================

export type TaskStatus =
    | 'backlog'
    | 'ready'
    | 'in_progress'
    | 'in_review'
    | 'completed'
    | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskType =
    | 'design'           // UI/UX design work
    | 'component'        // React/code components
    | 'copy'             // Marketing/UI copy
    | 'flow'             // Automation flows
    | 'icon'             // Icon generation
    | 'illustration'     // Image generation
    | 'integration'      // API/service integration
    | 'research'         // Discovery/research tasks
    | 'other';

export interface ProjectTask {
    id: string;
    projectId: string;
    workstreamId: string;

    // Identity
    title: string;
    description: string;
    type: TaskType;

    // Organization
    status: TaskStatus;
    priority: TaskPriority;
    order: number;

    // Dependencies
    dependsOn?: string[];         // Task IDs this depends on
    blockedBy?: string[];         // Task IDs blocking this

    // AI Context
    aiContext?: {
        suggestedPrompts?: string[];
        suggestedModels?: string[];
        estimatedTokens?: number;
        estimatedCost?: number;
    };

    // Artifact tracking
    artifactIds: string[];        // Generated artifacts for this task

    // Metadata
    assignedTo?: string;          // User ID or "ai"
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

// ============================================================================
// TASK PROMPTS - AI Instructions for Tasks
// ============================================================================

export interface TaskPrompt {
    id: string;
    taskId: string;
    projectId: string;

    // Content
    systemPrompt: string;
    userPrompt: string;

    // Configuration
    suggestedModel: string;
    temperature?: number;
    maxTokens?: number;

    // Variables that can be filled in
    variables: Array<{
        name: string;
        description: string;
        defaultValue?: string;
        required: boolean;
    }>;

    // Generation tracking
    generationCount: number;
    lastGeneratedAt?: string;

    // Metadata
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// ARTIFACTS - Generated Outputs
// ============================================================================

export type ArtifactType =
    | 'icon'
    | 'illustration'
    | 'component'
    | 'page'
    | 'flow'
    | 'prompt'
    | 'copy'
    | 'code'
    | 'document';

export type ArtifactStatus =
    | 'draft'
    | 'under_review'
    | 'needs_revision'
    | 'approved'
    | 'archived';

export interface Artifact {
    id: string;
    projectId: string;
    taskId: string;

    // Identity
    name: string;
    type: ArtifactType;
    description?: string;

    // State
    status: ArtifactStatus;
    currentVersionId: string;
    versionCount: number;

    // Content reference
    contentType: 'text' | 'code' | 'image' | 'json' | 'svg';

    // Metadata
    createdAt: string;
    updatedAt: string;
    approvedAt?: string;
    approvedBy?: string;
}

export interface ArtifactVersion {
    id: string;
    artifactId: string;
    versionNumber: number;

    // Content
    content: string;              // The actual content (code, text, URL for images)
    contentHash: string;          // For deduplication

    // Generation info
    createdBy: 'agent' | 'user';
    promptUsed?: string;
    modelUsed?: string;

    // Feedback
    userFeedbackTags?: string[];  // ["too busy", "not on brand", "love this"]
    userFeedbackNote?: string;

    // Diff tracking
    diffFromPrevious?: string;    // JSON diff or description

    // Metadata
    createdAt: string;
}

// ============================================================================
// NAMING SYSTEM - Consistency Registry
// ============================================================================

export type NamingScope = 'code' | 'product' | 'write' | 'internal';
export type NamingTargetType =
    | 'component'
    | 'file'
    | 'route'
    | 'db_table'
    | 'feature'
    | 'tier'
    | 'flow'
    | 'icon';

export type CaseStyle = 'snake' | 'camel' | 'pascal' | 'kebab' | 'constant';

export interface NamingContext {
    scope: NamingScope;
    targetType: NamingTargetType;
    style: 'technical' | 'whimsical' | 'descriptive' | 'branded';
    constraints?: {
        caseStyle?: CaseStyle;
        maxLength?: number;
        prefix?: string;
        suffix?: string;
        bannedTokens?: string[];
    };
}

export interface NameRecord {
    id: string;
    projectId: string;

    // The name itself
    name: string;
    kind: NamingTargetType;

    // Context
    scope: NamingScope;
    description?: string;

    // References
    artifactId?: string;
    taskId?: string;

    // Metadata
    createdAt: string;
    createdBy: 'agent' | 'user';
}

// ============================================================================
// PROJECT CONTEXT - The Complete Picture
// ============================================================================

export interface SuccessCriteria {
    id: string;
    projectId: string;
    criterion: string;
    isMet: boolean;
    evidence?: string;
    checkedAt?: string;
}

export interface ProjectContext {
    project: ProjectSpec;
    workstreams: ProjectWorkstream[];
    tasks: ProjectTask[];
    prompts: TaskPrompt[];
    artifacts: Artifact[];
    versions: ArtifactVersion[];
    names: NameRecord[];
    successCriteria: SuccessCriteria[];
}

// ============================================================================
// API TYPES
// ============================================================================

export interface CreateProjectRequest {
    title: string;
    summary: string;
    domain: ProjectDomain;
    primaryGoal: string;
    secondaryGoals?: string[];
    targetUsers?: string[];
    techStack?: ProjectTechStack;
    constraints?: Partial<ProjectConstraints>;
    brand?: Partial<ProjectBrand>;
}

export interface CreateProjectResponse {
    success: boolean;
    project?: ProjectSpec;
    error?: string;
}

export interface DecomposeProjectRequest {
    projectId: string;
    depth?: 'workstreams' | 'tasks' | 'prompts'; // How deep to decompose
}

export interface DecomposeProjectResponse {
    success: boolean;
    workstreams?: ProjectWorkstream[];
    tasks?: ProjectTask[];
    prompts?: TaskPrompt[];
    error?: string;
}
