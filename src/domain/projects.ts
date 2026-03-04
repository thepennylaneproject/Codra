import { Project } from './types';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'codra:projects';

const MOCK_PROJECTS: Project[] = [
    {
        id: '1',
        name: 'Alpha Centauri Campaign',
        description: 'Q1 Marketing Push for new colony intitiative',
        goals: ['Increase awareness by 25%', 'Drive 10k signups'],
        boundaries: ['No political messaging', 'Strict adherence to Brand v2'],
        budgetPolicy: { maxCostPerRun: 50, dailyLimit: 500, approvalRequired: true },
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        name: 'Neo-Tokyo Infrastructure',
        description: 'Urban planning assets for sector 7',
        goals: ['Visualize Sector 7 layout', 'render 3D walkthrough'],
        boundaries: ['Cyberpunk aesthetic only', 'No daylight scenes'],
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: '123',
        name: 'Sample Project',
        description: 'For testing new pipeline routes',
        goals: ['Test Spread Layout', 'Verify Tear Sheet'],
        boundaries: ['Low latency', 'High fidelity'],
        updatedAt: new Date().toISOString(),
    },
];

function loadProjectsFromStorage(): Project[] {
    if (typeof window === 'undefined') return [...MOCK_PROJECTS];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [...MOCK_PROJECTS];
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [...MOCK_PROJECTS];
        return parsed as Project[];
    } catch {
        return [...MOCK_PROJECTS];
    }
}

function saveProjectsToStorage(projects: Project[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {
        // Ignore storage failures
    }
}

async function fetchProjectsFromServer(): Promise<Project[] | null> {
    if (typeof window === 'undefined') return null;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            return null;
        }

        const response = await fetch('/.netlify/functions/projects-list', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        const body = await response.json();
        if (!body?.projects || !Array.isArray(body.projects)) {
            return null;
        }

        const projects = body.projects.map((project: Project) => ({
            ...project,
            updatedAt: project.updatedAt || new Date().toISOString(),
        })) as Project[];

        saveProjectsToStorage(projects);
        return projects;
    } catch {
        return null;
    }
}

export async function getProjects(): Promise<Project[]> {
    const remote = await fetchProjectsFromServer();
    if (remote && remote.length > 0) {
        return remote;
    }

    // Simulator network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return loadProjectsFromStorage();
}


export async function getProjectById(id: string): Promise<Project | null> {
    const projects = loadProjectsFromStorage();
    const cached = projects.find(p => p.id === id);
    if (cached) return cached;

    const remote = await fetchProjectsFromServer();
    if (remote) {
        const found = remote.find(p => p.id === id);
        if (found) return found;
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    return null;
}

export async function createProject(profile: import('./types').OnboardingProfile): Promise<Project> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate "Generating..."

    const projectName = (profile as any).projectName || (profile as any).name || (profile as any).title || 'Untitled Project';

    const newProject: Project = {
        id: crypto.randomUUID(),
        name: projectName,

        description: profile.description,
        audience: profile.audience,
        goals: profile.goals,
        boundaries: profile.boundaries,
        activeDesks: profile.selectedDesks,
        budgetPolicy: profile.budgetPolicy,
        updatedAt: new Date().toISOString(),
    };


    const projects = loadProjectsFromStorage();
    projects.push(newProject);
    saveProjectsToStorage(projects);
    return newProject;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const projects = loadProjectsFromStorage();
    const project = projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');

    Object.assign(project, updates);
    project.updatedAt = new Date().toISOString();
    saveProjectsToStorage(projects);
    return project;
}

export async function deleteProject(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const projects = loadProjectsFromStorage();
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    projects.splice(index, 1);
    saveProjectsToStorage(projects);
}

interface CreateProjectParams {
    userId: string;
    name: string;
    type: string;
    summary?: string;
}

export async function createProjectOnServer(params: CreateProjectParams): Promise<{ projectId: string }> {
    const { userId, name, type, summary } = params;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
        throw new Error('Authentication required');
    }

    // 1. Try Netlify Function first (official path)
    try {
        const response = await fetch('/.netlify/functions/projects-create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ name, type, summary }),
        });

        if (response.ok) {
            const data = await response.json();
            return { projectId: data.projectId };
        }
        
        // If 4xx error (validation), throw it (don't fallback)
        if (response.status >= 400 && response.status < 500) {
            const err = await response.json();
            throw new Error(err.error || 'Project creation failed');
        }
        
        // If 5xx error (server error/offline), fall through to client-side
        console.warn('Backend function failed or unreachable (5xx). Attempting client-side fallback.');

    } catch (err) {
        // Network errors also fall through
        console.warn('Backend function network error. Attempting client-side fallback.', err);
    }

    // 2. Client-side Fallback (Direct Supabase)
    // After migration 20260122_unify_projects_schema.sql, all projects use unified schema
    
    // Map project type to domain
    const projectDomainMap: Record<string, string> = {
        campaign: 'content_engine',
        product: 'saas',
        content: 'content_engine',
        custom: 'other',
    };
    const domain = projectDomainMap[type] || 'other';
    const summaryText = summary || name;

    // Use unified schema (title, summary, domain, primary_goal)
    const payload = {
        user_id: userId,
        title: name,
        summary: summaryText,
        domain,
        primary_goal: summaryText,
        status: 'active',
    };

    const { data: project, error } = await supabase
        .from('projects')
        .insert(payload)
        .select('id')
        .single();

    if (error) {
        // Log error details for debugging
        console.error('Failed to create project:', error);
        throw new Error(error.message || 'Failed to create project');
    }

    if (!project) {
        throw new Error('Failed to create project: No data returned');
    }
    
    return { projectId: project.id };
}
