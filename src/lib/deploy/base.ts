/**
 * src/lib/deploy/base.ts
 *
 * Abstract base class for deploy-platform adapters.
 *
 * Both the Netlify and Vercel adapters share a common `validateToken`
 * implementation (a lightweight GET /user call that returns whether the
 * supplied bearer token is valid). Centralising it here avoids the
 * identical try/catch block being duplicated in every concrete adapter.
 */

import type { DeployAdapter } from './types';

export abstract class BaseDeployAdapter implements DeployAdapter {
  /** The base REST API URL for the platform (e.g. "https://api.netlify.com/api/v1"). */
  protected abstract readonly baseUrl: string;

  /**
   * Validates a bearer token by hitting the platform's /user endpoint.
   * Returns `true` when the token is accepted, `false` on any error.
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ── Abstract methods that each concrete adapter must implement ─────────────

  abstract getAuthUrl(clientId: string, redirectUri: string): string;
  abstract listSites(token: string): ReturnType<DeployAdapter['listSites']>;
  abstract getSite(token: string, siteId: string): ReturnType<DeployAdapter['getSite']>;
  abstract createSite(token: string, name: string, repoUrl?: string): ReturnType<DeployAdapter['createSite']>;
  abstract triggerDeploy(token: string, siteId: string, clearCache?: boolean): ReturnType<DeployAdapter['triggerDeploy']>;
  abstract getDeploy(token: string, deployId: string): ReturnType<DeployAdapter['getDeploy']>;
  abstract listDeploys(token: string, siteId: string): ReturnType<DeployAdapter['listDeploys']>;
  abstract cancelDeploy(token: string, deployId: string): ReturnType<DeployAdapter['cancelDeploy']>;
  abstract getEnvVars(token: string, siteId: string): ReturnType<DeployAdapter['getEnvVars']>;
  abstract setEnvVar(token: string, siteId: string, key: string, value: string, target?: string[]): ReturnType<DeployAdapter['setEnvVar']>;
  abstract deleteEnvVar(token: string, siteId: string, key: string): ReturnType<DeployAdapter['deleteEnvVar']>;
}
