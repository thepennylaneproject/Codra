import { Octokit } from "octokit";

export interface Repository {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    private: boolean;
    default_branch: string;
    updated_at: string | null;
}

export interface FileContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    type: 'file' | 'dir' | 'submodule' | 'symlink';
    content?: string; // base64 encoded for files
}

export interface Branch {
    name: string;
    commit: {
        sha: string;
        url: string;
    };
}

export interface Commit {
    sha: string;
    message: string;
    author: {
        name: string;
        email: string;
        date: string;
    };
}

export class GitHubAdapter {
    private octokit: Octokit | null = null;

    constructor() { }

    initialize(token: string) {
        this.octokit = new Octokit({ auth: token });
    }

    isAuthenticated(): boolean {
        return !!this.octokit;
    }

    async listRepos(): Promise<Repository[]> {
        if (!this.octokit) throw new Error("Not authenticated");
        // List repos for authenticated user, including private ones
        const response = await this.octokit.rest.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 50,
            affiliation: 'owner,collaborator,organization_member'
        });

        return response.data.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            private: repo.private,
            default_branch: repo.default_branch,
            updated_at: repo.updated_at
        }));
    }

    async getContents(owner: string, repo: string, path: string = '', ref?: string): Promise<FileContent[]> {
        if (!this.octokit) throw new Error("Not authenticated");

        try {
            const response = await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path,
                ref,
            });

            if (Array.isArray(response.data)) {
                return response.data.map((item: any) => ({
                    name: item.name,
                    path: item.path,
                    sha: item.sha,
                    size: item.size,
                    type: item.type,
                }));
            } else {
                // It's a single file
                const item = response.data as any;
                return [{
                    name: item.name,
                    path: item.path,
                    sha: item.sha,
                    size: item.size,
                    type: item.type,
                    content: item.content // base64
                }];
            }
        } catch (error) {
            console.error("Error getting contents:", error);
            throw error;
        }
    }

    async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<string> {
        if (!this.octokit) throw new Error("Not authenticated");
        const response = await this.octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref,
        });

        const data = response.data as any;
        if (data.content && data.encoding === 'base64') {
            return atob(data.content.replace(/\n/g, ''));
        }
        throw new Error("Could not decode file content");
    }

    async createOrUpdateFile(owner: string, repo: string, path: string, content: string, message: string, sha?: string, branch?: string): Promise<void> {
        if (!this.octokit) throw new Error("Not authenticated");

        // Content must be base64 encoded
        const contentBase64 = btoa(content);

        await this.octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message,
            content: contentBase64,
            sha, // Required if updating
            branch
        });
    }

    async listBranches(owner: string, repo: string): Promise<Branch[]> {
        if (!this.octokit) throw new Error("Not authenticated");
        const response = await this.octokit.rest.repos.listBranches({
            owner,
            repo,
        });
        return response.data.map((b: any) => ({
            name: b.name,
            commit: { sha: b.commit.sha, url: b.commit.url }
        }));
    }

    async createBranch(owner: string, repo: string, name: string, fromSha: string): Promise<void> {
        if (!this.octokit) throw new Error("Not authenticated");
        await this.octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${name}`,
            sha: fromSha
        });
    }

    async createPR(owner: string, repo: string, title: string, body: string, head: string, base: string) {
        if (!this.octokit) throw new Error("Not authenticated");
        const response = await this.octokit.rest.pulls.create({
            owner,
            repo,
            title,
            body,
            head,
            base
        });
        return response.data;
    }
}

export const gitHubAdapter = new GitHubAdapter();
