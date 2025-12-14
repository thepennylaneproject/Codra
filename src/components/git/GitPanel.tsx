import React, { useEffect, useState } from 'react';
import { GitHubConnect } from './GitHubConnect';
import { RepoSelector } from './RepoSelector';
import { gitHubAdapter, Repository } from '../../lib/git/github';


export const GitPanel: React.FC = () => {
    const [token, setToken] = useState<string | null>(null);
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

    useEffect(() => {
        // Check for token in URL query params if redirected from callback (simple implementation)
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get('token');

        if (tokenParam) {
            setToken(tokenParam);
            // Initialize adapter
            gitHubAdapter.initialize(tokenParam);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Check localStorage
            const savedToken = localStorage.getItem('github_token');
            if (savedToken) {
                setToken(savedToken);
                gitHubAdapter.initialize(savedToken);
            }
        }
    }, []);

    useEffect(() => {
        if (token) {
            localStorage.setItem('github_token', token);
        }
    }, [token]);

    const handleRepoSelect = (repo: Repository) => {
        setSelectedRepo(repo);
        // In a real implementation, this would trigger opening the repo contents in the file tree
        // For now, just logging or setting state
        console.log("Selected repo:", repo);
    };

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-[#f3f4e6]">GitHub Integration</h2>
                    <p className="text-sm text-[#9ca3af]">
                        Connect your GitHub account to browse and edit repositories directly.
                    </p>
                </div>
                <GitHubConnect />
            </div>
        );
    }

    if (selectedRepo) {
        return (
            <div className="flex flex-col h-full bg-[#070a0e]">
                <div className="p-4 border-b border-[rgba(243,244,230,0.09)] flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-[#f3f4e6]">{selectedRepo.name}</h2>
                        <p className="text-xs text-[#9ca3af]">{selectedRepo.full_name}</p>
                    </div>
                    <button
                        onClick={() => setSelectedRepo(null)}
                        className="text-xs text-[#4e808d] hover:text-[#f3f4e6]"
                    >
                        Change
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-center text-[#6b7280] text-sm p-8 text-center">
                    <p>Repository loaded. <br />File explorer integration coming in next iteration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#070a0e] flex flex-col">
            <div className="p-4 border-b border-[rgba(243,244,230,0.09)]">
                <h2 className="font-semibold text-[#f3f4e6]">Select Repository</h2>
            </div>
            <RepoSelector onSelect={handleRepoSelect} />
        </div>
    );
};
