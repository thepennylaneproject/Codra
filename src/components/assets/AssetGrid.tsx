/**
 * AssetGrid - Grid/list view for assets
 */

import { FileImage, FileVideo, FileAudio, FileText, File } from 'lucide-react';
import type { Asset } from '../../types/shared';

interface AssetGridProps {
    assets: Asset[];
    viewMode: 'grid' | 'list';
    onAssetClick: (asset: Asset) => void;
}

function getAssetIcon(type: Asset['type']) {
    switch (type) {
        case 'image':
            return FileImage;
        case 'video':
            return FileVideo;
        case 'audio':
            return FileAudio;
        case 'doc':
            return FileText;
        default:
            return File;
    }
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function AssetGrid({ assets, viewMode, onAssetClick }: AssetGridProps) {
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {assets.map((asset) => {
                    const Icon = getAssetIcon(asset.type);
                    return (
                        <button
                            key={asset.id}
                            onClick={() => onAssetClick(asset)}
                            className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 hover:border-violet-500/50 transition-all"
                        >
                            {/* Preview */}
                            {asset.type === 'image' ? (
                                <img
                                    src={asset.publicUrl}
                                    alt={asset.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Icon className="w-12 h-12 text-zinc-600" />
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-sm font-medium text-white truncate">
                                        {asset.name}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        {formatFileSize(asset.sizeBytes)}
                                    </p>
                                </div>
                            </div>

                            {/* Tags badge */}
                            {asset.tags.length > 0 && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
                                    {asset.tags.length} tag{asset.tags.length !== 1 ? 's' : ''}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    // List view
    return (
        <div className="space-y-2">
            {assets.map((asset) => {
                const Icon = getAssetIcon(asset.type);
                return (
                    <button
                        key={asset.id}
                        onClick={() => onAssetClick(asset)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 hover:border-violet-500/50 transition-all text-left"
                    >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
                            {asset.type === 'image' ? (
                                <img
                                    src={asset.publicUrl}
                                    alt={asset.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Icon className="w-8 h-8 text-zinc-600" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-zinc-100 truncate">{asset.name}</h3>
                            {asset.description && (
                                <p className="text-sm text-zinc-400 truncate mt-1">
                                    {asset.description}
                                </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                                <span className="capitalize">{asset.type}</span>
                                <span>•</span>
                                <span>{formatFileSize(asset.sizeBytes)}</span>
                                {asset.width && asset.height && (
                                    <>
                                        <span>•</span>
                                        <span>
                                            {asset.width} × {asset.height}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        {asset.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {asset.tags.slice(0, 3).map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400"
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {asset.tags.length > 3 && (
                                    <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
                                        +{asset.tags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
