import React, { useEffect, useState } from 'react';
import { gitHubAdapter, Repository } from '../../lib/git/github';
import { GitBranch, Lock, Search } from 'lucide-react';

interface RepoSelectorProps {
    onSelect: (repo: Repository) => void;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({ onSelect }) => {
    const [repos, setRepos] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadRepos();
    }, []);

    const loadRepos = async () => {
        if (!gitHubAdapter.isAuthenticated()) return;
        setLoading(true);
        try {
            const list = await gitHubAdapter.listRepos();
            setRepos(list);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredRepos = repos.filter(r => r.full_name.toLowerCase().includes(filter.toLowerCase()));

    if (loading) {
        return <div className="p-4 text-[#9ca3af] text-sm">Loading repositories...</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-[rgba(243,244,230,0.09)]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" size={14} />
                    <input
                        type="text"
                        placeholder="Search repositories..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-[#070a0e] border border-[rgba(243,244,230,0.09)] rounded-md pl-9 pr-3 py-1.5 text-sm text-[#f3f4e6] focus:outline-none focus:border-[#4e808d]"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredRepos.map(repo => (
                    <button
                        key={repo.id}
                        onClick={() => onSelect(repo)}
                        className="w-full text-left px-4 py-3 border-b border-[rgba(243,244,230,0.05)] hover:bg-[rgba(243,244,230,0.05)] transition-colors group"
                    >
                        <div className="flex items-start justify-between mb-1">
                            <span className="font-medium text-[#f3f4e6] group-hover:text-[#4e808d] transition-colors">{repo.name}</span>
                            {repo.private && <Lock size={12} className="text-[#6b7280] mt-1" />}
                        </div>
                        <p className="text-xs text-[#9ca3af] truncate mb-2">{repo.description || 'No description'}</p>
                        <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                            <span className="flex items-center gap-1">
                                <GitBranch size={12} />
                                {repo.default_branch}
                            </span>
                            <span>{new Date(repo.updated_at || '').toLocaleDateString()}</span>
                        </div>
                    </button>
                ))}

                {filteredRepos.length === 0 && (
                    <div className="p-8 text-center text-[#6b7280] text-sm">
                        No repositories found
                    </div>
                )}
            </div>
        </div>
    );
};
