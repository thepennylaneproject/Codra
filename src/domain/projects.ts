import { Project } from './types';

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

export async function getProjects(): Promise<Project[]> {
    // Simulator network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_PROJECTS;
}


export async function getProjectById(id: string): Promise<Project | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_PROJECTS.find(p => p.id === id) || null;
}

export async function createProject(profile: import('./types').OnboardingProfile): Promise<Project> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate "Generating..."

    const newProject: Project = {
        id: crypto.randomUUID(),
        name: profile.projectName,

        description: profile.description,
        audience: profile.audience,
        goals: profile.goals,
        boundaries: profile.boundaries,
        activeDesks: profile.selectedDesks,
        budgetPolicy: profile.budgetPolicy,
        updatedAt: new Date().toISOString(),
    };


    MOCK_PROJECTS.push(newProject);
    return newProject;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const project = MOCK_PROJECTS.find(p => p.id === id);
    if (!project) throw new Error('Project not found');

    Object.assign(project, updates);
    project.updatedAt = new Date().toISOString();
    return project;
}

export async function deleteProject(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = MOCK_PROJECTS.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    MOCK_PROJECTS.splice(index, 1);
}
