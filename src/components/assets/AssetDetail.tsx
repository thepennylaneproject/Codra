/**
 * AssetDetail - Detail drawer/modal for asset
 */

import { X, Download, Copy, Trash2, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { assetsClient } from '../../lib/api/assets-client';
import type { Asset, AssetVersion, ImageConvertRequest } from '../../types/shared';

interface AssetDetailProps {
    asset: Asset;
    onClose: () => void;
    onDeleted: () => void;
}

export function AssetDetail({ asset, onClose, onDeleted }: AssetDetailProps) {
    const [deleting, setDeleting] = useState(false);
    const [versions, setVersions] = useState<AssetVersion[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [creatingVersion, setCreatingVersion] = useState(false);

    useEffect(() => {
        if (asset.type === 'image') {
            loadVersions();
        }
    }, [asset.id]);

    const loadVersions = async () => {
        setLoadingVersions(true);
        try {
            const list = await assetsClient.getVersions(asset.id);
            setVersions(list);
        } catch (error) {
            console.error('Failed to load versions:', error);
        } finally {
            setLoadingVersions(false);
        }
    };

    const handleCreateVersion = async (
        operation: ImageConvertRequest['operation'],
        params: ImageConvertRequest['params']
    ) => {
        setCreatingVersion(true);
        try {
            await assetsClient.createVersion(asset.id, operation, params);
            await loadVersions();
        } catch (error) {
            console.error('Failed to create version:', error);
            alert('Failed to create version');
        } finally {
            setCreatingVersion(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(asset.publicUrl);
        // Could show a toast notification here
    };

    const handleDownload = () => {
        window.open(asset.publicUrl, '_blank');
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this asset?')) return;

        setDeleting(true);
        try {
            await assetsClient.delete(asset.id);
            onDeleted();
        } catch (error) {
            console.error('Failed to delete asset:', error);
            alert('Failed to delete asset');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024)
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50">
            <div className="w-full md:max-w-3xl md:mx-4 bg-zinc-900 md:rounded-xl border-t md:border border-white/10 max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-zinc-900 z-10">
                    <h2 className="text-xl font-semibold text-zinc-100">{asset.name}</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Preview */}
                    <div className="rounded-lg overflow-hidden bg-zinc-950 border border-white/10">
                        {asset.type === 'image' ? (
                            <img
                                src={asset.publicUrl}
                                alt={asset.name}
                                className="w-full max-h-96 object-contain"
                            />
                        ) : asset.type === 'video' ? (
                            <video
                                src={asset.publicUrl}
                                controls
                                className="w-full max-h-96"
                            />
                        ) : asset.type === 'audio' ? (
                            <audio src={asset.publicUrl} controls className="w-full" />
                        ) : (
                            <div className="h-48 flex items-center justify-center text-zinc-500">
                                <div className="text-center">
                                    <p className="capitalize">{asset.type} file</p>
                                    <p className="text-sm mt-2">{asset.mimeType}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {asset.description && (
                        <div>
                            <h3 className="text-sm font-medium text-zinc-400 mb-2">Description</h3>
                            <p className="text-zinc-300">{asset.description}</p>
                        </div>
                    )}

                    {/* Metadata */}
                    <div>
                        <h3 className="text-sm font-medium text-zinc-400 mb-3">Metadata</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-zinc-500">Type</p>
                                <p className="text-zinc-300 capitalize">{asset.type}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500">Size</p>
                                <p className="text-zinc-300">{formatFileSize(asset.sizeBytes)}</p>
                            </div>
                            {asset.width && asset.height && (
                                <div>
                                    <p className="text-xs text-zinc-500">Dimensions</p>
                                    <p className="text-zinc-300">
                                        {asset.width} × {asset.height}
                                    </p>
                                </div>
                            )}
                            {asset.durationMs && (
                                <div>
                                    <p className="text-xs text-zinc-500">Duration</p>
                                    <p className="text-zinc-300">
                                        {Math.floor(asset.durationMs / 1000)}s
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-zinc-500">Created</p>
                                <p className="text-zinc-300">{formatDate(asset.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500">MIME Type</p>
                                <p className="text-zinc-300 text-sm truncate">{asset.mimeType}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {asset.tags.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-zinc-400 mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {asset.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 bg-violet-600/20 text-violet-300 rounded-full text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Versions */}
                    {asset.type === 'image' && (
                        <div>
                            <h3 className="text-sm font-medium text-zinc-400 mb-3">Versions</h3>

                            {/* Create Version Actions */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button
                                    onClick={() => handleCreateVersion('convert', { format: 'webp' })}
                                    disabled={creatingVersion}
                                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition-colors disabled:opacity-50"
                                >
                                    Convert to WebP
                                </button>
                                <button
                                    onClick={() => handleCreateVersion('thumbnail', { width: 200, height: 200, fit: 'cover' })}
                                    disabled={creatingVersion}
                                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition-colors disabled:opacity-50"
                                >
                                    Square Thumbnail
                                </button>
                                <button
                                    onClick={() => handleCreateVersion('compress', { quality: 80, format: 'webp' })}
                                    disabled={creatingVersion}
                                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition-colors disabled:opacity-50"
                                >
                                    Compress for Web
                                </button>
                                <button
                                    onClick={() => handleCreateVersion('resize', { width: 1080, height: 1350, fit: 'cover' })}
                                    disabled={creatingVersion}
                                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded transition-colors disabled:opacity-50"
                                >
                                    Instagram Portrait
                                </button>
                            </div>

                            {/* Versions List */}
                            <div className="space-y-2">
                                {versions.map((version) => (
                                    <div key={version.id} className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded border border-white/5">
                                        <div className="w-10 h-10 rounded overflow-hidden bg-black/20 flex-shrink-0">
                                            <img src={version.publicUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-zinc-300 truncate">
                                                v{version.version} • {version.width}x{version.height}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 truncate">
                                                {formatFileSize(version.sizeBytes)} • {version.mimeType}
                                            </p>
                                        </div>
                                        <a
                                            href={version.publicUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-zinc-400 hover:text-zinc-100 transition-colors"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                ))}
                                {versions.length === 0 && !loadingVersions && (
                                    <p className="text-xs text-zinc-500 italic">No alternative versions created.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Link
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        <a
                            href={asset.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open
                        </a>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors ml-auto disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
