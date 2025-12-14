export interface Deploy {
    id: string;
    siteId: string;
    state: 'queued' | 'building' | 'processing' | 'ready' | 'error' | 'canceled';
    context: 'production' | 'deploy-preview' | 'branch-deploy';
    branch: string;
    commitRef?: string;
    commitMessage?: string;
    deployUrl: string; // The specific deploy URL (e.g. 64b...--site.netlify.app)
    adminUrl: string; // Link to provider dashboard
    createdAt: string;
    updatedAt: string;
    buildTime?: number; // In seconds
}

export interface Site {
    id: string;
    name: string;
    url: string; // Main SSL URL
    adminUrl: string; // Link to provider dashboard
    repoUrl?: string; // Linked git repo
    provider: 'netlify' | 'vercel';
    buildSettings: {
        cmd?: string;
        dir?: string;
        base?: string; // Base directory
    };
}

export interface EnvVar {
    key: string;
    value: string; // Usually masked when reading list
    target?: string[]; // e.g. ['production', 'preview']
    updatedAt?: string;
}

export interface DeployAdapter {
    // Auth
    getAuthUrl(clientId: string, redirectUri: string): string;
    // NOTE: Token exchange usually happens backend-side or via specific flow, 
    // but for a client-side app with implicit grant or just PAT, we might just validate the token.
    validateToken(token: string): Promise<boolean>;

    // Sites
    listSites(token: string): Promise<Site[]>;
    getSite(token: string, siteId: string): Promise<Site>;
    createSite(token: string, name: string, repoUrl?: string): Promise<Site>;

    // Deploys
    triggerDeploy(token: string, siteId: string, clearCache?: boolean): Promise<Deploy>;
    getDeploy(token: string, deployId: string): Promise<Deploy>; // Renamed from getDeployStatus for clarity
    listDeploys(token: string, siteId: string): Promise<Deploy[]>;
    cancelDeploy(token: string, deployId: string): Promise<void>;

    // Environment
    getEnvVars(token: string, siteId: string): Promise<EnvVar[]>;
    setEnvVar(token: string, siteId: string, key: string, value: string, target?: string[]): Promise<void>;
    deleteEnvVar(token: string, siteId: string, key: string): Promise<void>;
}
