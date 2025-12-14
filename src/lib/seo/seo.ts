import { PageSEOConfig } from './types';


const DEFAULT_SEO: PageSEOConfig = {
    title: 'Codra - AI Workflow Assistant',
    description: 'Build, debug, and optimize AI workflows in one unified interface.',
    twitterCard: 'summary_large_image',
    robots: 'index, follow'
};

export const SEO_REGISTRY: Record<string, PageSEOConfig> = {
    '/': {
        title: 'Codra - Home',
        description: 'Welcome to Codra. The AI workbench for developers.',
    },
    '/dashboard': {
        title: 'Dashboard | Codra',
        description: 'Manage your projects and workflows.',
    },
    '/projects': {
        title: 'Projects | Codra',
        description: 'View and manage all your team projects.',
    },
    '/assets': {
        title: 'Asset Library | Codra',
        description: 'Manage specialized assets and manifests.',
    },
    '/assets/manifests': {
        title: 'Asset Manifests | Codra',
        description: 'Configure technical asset bundles and accessibility settings.',
    },
    '/ai': {
        title: 'AI Playground | Codra',
        description: 'Test and iterate on your prompts and models.',
    },
    '/settings/profile': {
        title: 'Profile Settings | Codra',
        description: 'Manage your personal account settings.',
    }
    // Add more routes as needed
};

export function getPageSEO(pathname: string): PageSEOConfig {
    // 1. Exact match
    if (SEO_REGISTRY[pathname]) {
        return { ...DEFAULT_SEO, ...SEO_REGISTRY[pathname] };
    }

    // 2. Pattern match (simple iteration for now, or matchPath)
    // E.g. /projects/:id
    // For now we can just return default if no specific match

    // Check for "projects detail" pattern manually or via registry keys if we used patterns
    // We can extend this logic to loop through keys and use matchPath if needed

    return DEFAULT_SEO;
}
