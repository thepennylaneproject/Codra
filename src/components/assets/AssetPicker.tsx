/**
 * AssetPicker - Reusable asset selection component
 */

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { assetsClient } from '../../lib/api/assets-client';
import { AssetGrid } from './AssetGrid';
import type { Asset, AssetType } from '../../types/shared';

interface AssetPickerProps {
    workspaceId: string;
    onSelect: (assets: Asset | Asset[]) => void;
    onClose: () => void;
    allowMultiple?: boolean;
    filterTypes?: AssetType[];
}

export function AssetPicker({
    workspaceId,
    onSelect,
    onClose,
    allowMultiple = false,
    filterTypes,
}: AssetPickerProps) {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            try {
                const response = await assetsClient.list({
                    workspaceId,
                    limit: 50,
                });

                // Filter by type if specified
                let filtered = response.assets;
                if (filterTypes && filterTypes.length > 0) {
                    filtered = filtered.filter(a => filterTypes.includes(a.type));
                }

                setAssets(filtered);
            } catch (error) {
                console.error('Failed to fetch assets:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, [workspaceId, filterTypes]);

    const handleAssetClick = (asset: Asset) => {
        if (allowMultiple) {
            const isSelected = selectedAssets.some(a => a.id === asset.id);
            if (isSelected) {
                setSelectedAssets(selectedAssets.filter(a => a.id !== asset.id));
            } else {
                setSelectedAssets([...selectedAssets, asset]);
            }
        } else {
            onSelect(asset);
        }
    };

    const handleConfirm = () => {
        if (allowMultiple) {
            onSelect(selectedAssets);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-4xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-100">Select Asset</h2>
                        {allowMultiple && (
                            <p className="text-sm text-zinc-400 mt-1">
                                {selectedAssets.length} selected
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-zinc-400">Loading assets...</div>
                        </div>
                    ) : assets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="text-zinc-400 mb-2">No assets found</div>
                            <p className="text-sm text-zinc-500">
                                Upload assets to your library first
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {assets.map((asset) => {
                                const isSelected = selectedAssets.some(a => a.id === asset.id);
                                return (
                                    <button
                                        key={asset.id}
                                        onClick={() => handleAssetClick(asset)}
                                        className={`group relative aspect-square rounded-lg overflow-hidden border bg-zinc-900/50 hover:bg-zinc-900 transition-all ${isSelected
                                                ? 'border-violet-500 ring-2 ring-violet-500/50'
                                                : 'border-white/10 hover:border-violet-500/50'
                                            }`}
                                    >
                                        {asset.type === 'image' ? (
                                            <img
                                                src={asset.publicUrl}
                                                alt={asset.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="text-center text-zinc-500">
                                                    <p className="text-xs capitalize">{asset.type}</p>
                                                </div>
                                            </div>
                                        )}

                                        {isSelected && allowMultiple && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                            <p className="text-xs text-white truncate">{asset.name}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer (for multiple selection) */}
                {allowMultiple && (
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedAssets.length === 0}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg transition-colors"
                        >
                            Select {selectedAssets.length > 0 && `(${selectedAssets.length})`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
