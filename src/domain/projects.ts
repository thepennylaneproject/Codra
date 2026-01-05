import { Project } from './types';

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

export async function getProjects(): Promise<Project[]> {
    // Simulator network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return loadProjectsFromStorage();
}


export async function getProjectById(id: string): Promise<Project | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const projects = loadProjectsFromStorage();
    return projects.find(p => p.id === id) || null;
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
