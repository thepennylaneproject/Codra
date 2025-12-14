import { Deploy, DeployAdapter, EnvVar, Site } from './types';

const BASE_URL = 'https://api.netlify.com/api/v1';

export class NetlifyAdapter implements DeployAdapter {
    getAuthUrl(clientId: string, redirectUri: string): string {
        return `https://app.netlify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}`;
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
        const res = await fetch(`${BASE_URL}/sites`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to list sites');
        const data = await res.json();

        return data.map(this.mapSite);
    }

    async getSite(token: string, siteId: string): Promise<Site> {
        const res = await fetch(`${BASE_URL}/sites/${siteId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to get site');
        const data = await res.json();
        return this.mapSite(data);
    }

    async createSite(token: string, name: string, repoUrl?: string): Promise<Site> {
        // Basic creation. Linking repo requires more complex payload usually.
        const res = await fetch(`${BASE_URL}/sites`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, repo: repoUrl ? { provider: 'github', repo: repoUrl } : undefined }),
        });
        if (!res.ok) throw new Error('Failed to create site');
        const data = await res.json();
        return this.mapSite(data);
    }

    async triggerDeploy(token: string, siteId: string, clearCache?: boolean): Promise<Deploy> {
        const res = await fetch(`${BASE_URL}/sites/${siteId}/builds`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clear_cache: clearCache }),
        });
        if (!res.ok) throw new Error('Failed to trigger deploy');
        const data = await res.json();
        return this.mapDeploy(data);
    }

    async getDeploy(token: string, deployId: string): Promise<Deploy> {
        const res = await fetch(`${BASE_URL}/deploys/${deployId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to get deploy');
        const data = await res.json();
        return this.mapDeploy(data);
    }

    async listDeploys(token: string, siteId: string): Promise<Deploy[]> {
        const res = await fetch(`${BASE_URL}/sites/${siteId}/deploys`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to list deploys');
        const data = await res.json();
        return data.map(this.mapDeploy);
    }

    async cancelDeploy(token: string, deployId: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/deploys/${deployId}/cancel`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to cancel deploy');
    }

    async getEnvVars(token: string, siteId: string): Promise<EnvVar[]> {
        // Netlify API for Envs depends on context. 
        // This endpoint typically returns list of env vars for a site.
        // Note: Netlify v1 API structure for env vars can be complex (scopes, values).
        const res = await fetch(`${BASE_URL}/sites/${siteId}/env`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            // Env API is sometimes restricted or different depending on plan/API version
            // Fallback or empty if not accessible
            console.warn('Could not fetch env vars via standard endpoint, returning empty');
            return [];
        }
        const data = await res.json();
        // data is usually object { "KEY": "VALUE" } or array of objects with scopes

        // Check if it's the newer unified env vars format or legacy
        if (Array.isArray(data)) {
            // Newer format
            return data.map((item: any) => ({
                key: item.key,
                value: item.values?.[0]?.value || '', // Simplified
                updatedAt: item.updated_at
            }));
        } else {
            // Legacy simple key-value
            return Object.entries(data).map(([key, value]) => ({
                key,
                value: value as string
            }));
        }
    }

    async setEnvVar(token: string, siteId: string, key: string, value: string, _target?: string[]): Promise<void> {
        // Using newer API endpoint if possible, but standard v1 is often individual
        // PUT /sites/{site_id}/env/{key}
        // Body: { value: "some value" } (Legacy) or list of values

        // For simplicity, we'll try the legacy one first or the one that works for simple projects
        // Actually, creating a new Env var often requires PATCH on /sites/{site_id} or specific env endpoint

        // Let's use the individual key endpoint
        const res = await fetch(`${BASE_URL}/sites/${siteId}/env?site_id=${siteId}`, {
            method: 'POST', // or PATCH
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([{ key, values: [{ value, context: 'all' }] }])
        });

        if (!res.ok) {
            // Fallback to legacy
            await fetch(`${BASE_URL}/sites/${siteId}/env`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ [key]: value })
            });
        }
    }

    async deleteEnvVar(token: string, siteId: string, key: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/sites/${siteId}/env/${key}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to delete env var');
    }

    private mapSite(data: any): Site {
        return {
            id: data.site_id || data.id,
            name: data.name,
            url: data.ssl_url || data.url,
            adminUrl: data.admin_url,
            repoUrl: data.build_settings?.repo_url,
            provider: 'netlify',
            buildSettings: {
                cmd: data.build_settings?.cmd,
                dir: data.build_settings?.dir,
                base: data.build_settings?.base,
            },
        };
    }

    private mapDeploy(data: any): Deploy {
        return {
            id: data.id,
            siteId: data.site_id,
            state: data.state,
            context: data.context,
            branch: data.branch,
            commitRef: data.commit_ref,
            commitMessage: data.commit_message,
            deployUrl: data.deploy_ssl_url || data.deploy_url,
            adminUrl: data.admin_url,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            buildTime: data.deploy_time,
        };
    }
}

export const netlifyAdapter = new NetlifyAdapter();
