/**
 * AssetLibrary - Main library component with grid/list view
 */

import { useState, useEffect } from 'react';
import { Search, Grid3x3, List, Filter } from 'lucide-react';
import { assetsClient } from '../../lib/api/assets-client';
import { AssetGrid } from './AssetGrid';
import { AssetDetail } from './AssetDetail';
import type { Asset, AssetType, AssetListFilters } from '../../types/shared';

export function AssetLibrary() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState<AssetType | 'all'>('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Get current workspace from URL or context
    // For now, using first project - in real app, get from context
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch first workspace
        const fetchWorkspace = async () => {
            // This would come from your project store/context
            // For now, just a placeholder
            setWorkspaceId('placeholder-workspace-id');
        };
        fetchWorkspace();
    }, []);

    useEffect(() => {
        if (!workspaceId) return;

        const fetchAssets = async () => {
            setLoading(true);
            setError(null);
            try {
                const filters: AssetListFilters = {
                    workspaceId,
                    search: search || undefined,
                    type: selectedType !== 'all' ? selectedType : undefined,
                    tags: selectedTags.length > 0 ? selectedTags : undefined,
                    page,
                    limit: 20,
                };

                const response = await assetsClient.list(filters);
                setAssets(response.assets);
                setHasMore(response.hasMore);
            } catch (err: any) {
                console.error('Failed to fetch assets:', err);
                setError(err.message || 'Failed to load assets');
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, [workspaceId, search, selectedType, selectedTags, page]);

    const handleAssetClick = (asset: Asset) => {
        setSelectedAsset(asset);
    };

    const handleAssetDeleted = () => {
        setSelectedAsset(null);
        // Refresh list
        setPage(1);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search and Filters */}
            <div className="px-6 py-4 space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search assets..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded transition-colors ${viewMode === 'grid'
                                ? 'bg-violet-600 text-white'
                                : 'text-zinc-400 hover:text-zinc-100'
                                }`}
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded transition-colors ${viewMode === 'list'
                                ? 'bg-violet-600 text-white'
                                : 'text-zinc-400 hover:text-zinc-100'
                                }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-4 h-4 text-zinc-400" />
                    {(['all', 'image', 'video', 'audio', 'doc', 'other'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedType === type
                                ? 'bg-violet-600 text-white'
                                : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-100 border border-white/10'
                                }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Asset Grid/List */}
            <div className="flex-1 overflow-auto px-6 pb-6">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="text-red-400 mb-2 font-medium">Unable to load assets</div>
                        <p className="text-sm text-zinc-500 max-w-md">
                            {error}
                        </p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-zinc-400">Loading assets...</div>
                    </div>
                ) : assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="text-zinc-400 mb-2">No assets found</div>
                        <p className="text-sm text-zinc-500">
                            Upload your first asset to get started
                        </p>
                    </div>
                ) : (
                    <AssetGrid
                        assets={assets}
                        viewMode={viewMode}
                        onAssetClick={handleAssetClick}
                    />
                )}

                {/* Pagination */}
                {!error && hasMore && (
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-zinc-100 hover:bg-zinc-800 transition-colors"
                        >
                            Load More
                        </button>
                    </div>
                )}
            </div>

            {/* Asset Detail Drawer */}
            {selectedAsset && (
                <AssetDetail
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                    onDeleted={handleAssetDeleted}
                />
            )}
        </div>
    );
}
