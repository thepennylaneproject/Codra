import { Deploy, DeployAdapter, EnvVar, Site } from './types';

const BASE_URL = 'https://api.vercel.com/v9'; // Vercel API versioning usually v6-v9 depending on endpoint

export class VercelAdapter implements DeployAdapter {
    getAuthUrl(clientId: string, redirectUri: string): string {
        return `https://vercel.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
    }

    async validateToken(token: string): Promise<boolean> {
        try {
            const res = await fetch(`${BASE_URL}/user`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.ok;
        } catch {
            return false;
        }
    }

    async listSites(token: string): Promise<Site[]> {
        const res = await fetch(`${BASE_URL}/projects`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to list sites');
        const data = await res.json();
        return data.projects.map(this.mapProject);
    }

    async getSite(token: string, siteId: string): Promise<Site> {
        const res = await fetch(`${BASE_URL}/projects/${siteId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to get site');
        const data = await res.json();
        return this.mapProject(data);
    }

    async createSite(token: string, name: string, repoUrl?: string): Promise<Site> {
        const res = await fetch(`${BASE_URL}/projects`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, gitRepository: repoUrl ? { type: 'github', repo: repoUrl } : undefined }),
        });
        if (!res.ok) throw new Error('Failed to create site');
        const data = await res.json();
        return this.mapProject(data);
    }

    async triggerDeploy(token: string, siteId: string, clearCache?: boolean): Promise<Deploy> {
        const res = await fetch(`${BASE_URL}/deployments`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                project: siteId,
                forceNew: clearCache ? 1 : undefined
                // Vercel deployment triggering via API often requires file upload or git ref.
                // Triggering a redeploy of existing usually works via /deployments with simplified check
                // If this fails, we might need to use the specialized deploy hook or git trigger.
            }),
        });

        // NOTE: Creating a deployment via API V13 usually requires body with files/target.
        // For Vercel, simply "triggering" a build from existing repo is slightly different.
        // We will assume for this MVP that we are redeploying the latest or using the forced deployment endpoint.

        if (!res.ok) {
            // Graceful fallback or error
            throw new Error('Failed to trigger deploy: Vercel requires a specific commit/files for standard deploy calls.');
        }
        const data = await res.json();
        return this.mapDeployment(data);
    }

    async getDeploy(token: string, deployId: string): Promise<Deploy> {
        const res = await fetch(`https://api.vercel.com/v13/deployments/${deployId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to get deploy');
        const data = await res.json();
        return this.mapDeployment(data);
    }

    async listDeploys(token: string, siteId: string): Promise<Deploy[]> {
        const res = await fetch(`${BASE_URL}/deployments?projectId=${siteId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to list deploys');
        const data = await res.json();
        return data.deployments.map(this.mapDeployment);
    }

    async cancelDeploy(token: string, deployId: string): Promise<void> {
        const res = await fetch(`https://api.vercel.com/v12/deployments/${deployId}/cancel`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to cancel deploy');
    }

    async getEnvVars(token: string, siteId: string): Promise<EnvVar[]> {
        const res = await fetch(`${BASE_URL}/projects/${siteId}/env`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.envs.map((env: any) => ({
            key: env.key,
            value: env.value, // Usually encrypted/masked unless decrypted=true passed
            target: env.target, // ['production', 'preview', 'development']
            updatedAt: env.updatedAt
        }));
    }

    async setEnvVar(token: string, siteId: string, key: string, value: string, target?: string[]): Promise<void> {
        const res = await fetch(`${BASE_URL}/projects/${siteId}/env`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                key,
                value,
                target: target || ['production', 'preview', 'development'],
                type: 'encrypted'
            }),
        });
        if (!res.ok) throw new Error('Failed to set env var');
    }

    async deleteEnvVar(token: string, siteId: string, key: string): Promise<void> {
        // Vercel deletes by ID, not key. We need to find the ID first.
        // For this MVP, we'll try to get the list, find ID, then delete.
        // Note: getEnvVars mapped result doesn't have ID. We might need to fetch raw.

        const rawRes = await fetch(`${BASE_URL}/projects/${siteId}/env`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const rawData = await rawRes.json();
        const env = rawData.envs.find((e: any) => e.key === key);

        if (env) {
            const res = await fetch(`${BASE_URL}/projects/${siteId}/env/${env.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to delete env var');
        }
    }

    private mapProject(data: any): Site {
        return {
            id: data.id,
            name: data.name,
            // Vercel projects don't have a single URL, usually it's array of latest deployments or targets.
            // We'll use the one from targets -> production if available
            url: data.targets?.production?.url ? `https://${data.targets.production.url}` : '',
            adminUrl: `https://vercel.com/dashboard/projects/${data.id}`,
            repoUrl: data.link?.repo,
            provider: 'vercel',
            buildSettings: {
                cmd: data.buildCommand,
                dir: data.rootDirectory,
                base: data.rootDirectory
            }
        };
    }

    private mapDeployment(data: any): Deploy {
        return {
            id: data.id,
            siteId: data.projectId || data.project?.id, // Vercel responses vary slightly
            state: data.readyState.toLowerCase(), // QUEUED, BUILDING, READY, ERROR -> lowercase
            context: data.target || 'production',
            branch: data.meta?.githubCommitRef || data.gitSource?.ref,
            commitRef: data.meta?.githubCommitSha || data.gitSource?.sha,
            commitMessage: data.meta?.githubCommitMessage || data.gitSource?.message,
            deployUrl: `https://${data.url}`,
            adminUrl: `https://vercel.com/dashboard/deployments/${data.id}`,
            createdAt: new Date(data.createdAt).toISOString(),
            updatedAt: new Date(data.createdAt).toISOString(), // Vercel create/update typically close
            buildTime: (data.ready - data.created) / 1000 // Approximate if available
        };
    }
}

export const vercelAdapter = new VercelAdapter();
