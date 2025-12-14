import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, LayoutGrid, List } from 'lucide-react';
import { usePromptStore } from '../../lib/store/promptStore';
import { PromptCard } from './PromptCard';


export const PromptLibrary: React.FC = () => {
    const navigate = useNavigate();
    const {
        prompts,
        searchQuery, setSearchQuery,
        selectedCategory, setSelectedCategory,
        selectedTags, toggleTag,
        deletePrompt, addPrompt
    } = usePromptStore();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Derived state for filtered prompts
    const filteredPrompts = prompts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
        const matchesTags = selectedTags.length > 0
            ? selectedTags.every(t => p.tags.includes(t))
            : true;

        return matchesSearch && matchesCategory && matchesTags;
    });

    const categories = Array.from(new Set(prompts.map(p => p.category)));
    const allTags = Array.from(new Set(prompts.flatMap(p => p.tags)));

    const handleEdit = (id: string) => {
        navigate(`/prompts/${id}`);
    };

    const handleFork = (id: string) => {
        const prompt = prompts.find(p => p.id === id);
        if (prompt) {
            addPrompt({
                ...prompt,
                name: `${prompt.name} (Copy)`,
                isPublic: false
            });
        }
    };

    return (
        <div className="flex h-full bg-background-base text-text-primary">
            {/* Sidebar Filters */}
            <aside className="w-64 border-r border-border-subtle flex flex-col p-4 bg-surface-sidebar">
                <div className="mb-6">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Categories</h2>
                    <div className="space-y-1">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === null ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 text-text-muted'
                                }`}
                        >
                            All Prompts
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === cat ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 text-text-muted'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-2 py-1 rounded-full text-xs border transition-colors ${selectedTags.includes(tag)
                                    ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                                    : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
                                    }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-border-subtle flex items-center justify-between px-6 bg-surface-card/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search prompts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-background-input border border-border-input rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-card border border-border-subtle hover:bg-white/5 transition-colors">
                            <Filter className="w-4 h-4 text-text-muted" />
                            <span className="text-sm font-medium">Filter</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-surface-card rounded-lg p-1 border border-border-subtle">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/prompts/new')}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            New Prompt
                        </button>
                    </div>
                </header>

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredPrompts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-60">
                            <Search className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No prompts found</p>
                            <p className="text-sm">Try adjusting your filters or search query</p>
                        </div>
                    ) : (
                        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                            {filteredPrompts.map(prompt => (
                                <PromptCard
                                    key={prompt.id}
                                    prompt={prompt}
                                    onEdit={handleEdit}
                                    onFork={handleFork}
                                    onDelete={deletePrompt}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
