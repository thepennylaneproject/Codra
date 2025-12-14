/**
 * AssetUploader - Upload component with drag-drop
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Tag } from 'lucide-react';
import { assetsClient } from '../../lib/api/assets-client';
import type { Asset, AssetType } from '../../types/shared';

interface AssetUploaderProps {
    onComplete: (asset: Asset) => void;
}

export function AssetUploader({ onComplete }: AssetUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get current workspace - in real app, from context
    const workspaceId = 'placeholder-workspace-id';

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setName(selectedFile.name);
        setError(null);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const getAssetType = (mimeType: string): AssetType => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.includes('document') || mimeType.includes('pdf')) return 'doc';
        return 'other';
    };

    const handleAddTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleUpload = async () => {
        if (!file || !name) {
            setError('Please select a file and provide a name');
            return;
        }

        setUploading(true);
        setProgress(0);
        setError(null);

        try {
            // Extract image dimensions if applicable
            let width: number | undefined;
            let height: number | undefined;

            if (file.type.startsWith('image/')) {
                const img = new Image();
                const url = URL.createObjectURL(file);
                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        width = img.width;
                        height = img.height;
                        URL.revokeObjectURL(url);
                        resolve(null);
                    };
                    img.onerror = reject;
                    img.src = url;
                });
            }

            setProgress(30);

            // Upload using the complete flow
            const asset = await assetsClient.upload(file, {
                workspaceId,
                name,
                description: description || undefined,
                type: getAssetType(file.type),
                width,
                height,
                tags: tags.length > 0 ? tags : undefined,
            });

            setProgress(100);
            onComplete(asset);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Drag-drop area */}
            {!file ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-white/20 hover:border-white/30'
                        }`}
                >
                    <Upload className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                    <p className="text-zinc-300 mb-2">
                        Drag and drop a file here, or
                    </p>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-violet-400 hover:text-violet-300 underline"
                    >
                        browse to upload
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="border border-white/20 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-zinc-100 font-medium">{file.name}</p>
                        <p className="text-sm text-zinc-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                    <button
                        onClick={() => setFile(null)}
                        className="text-zinc-400 hover:text-zinc-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {file && (
                <>
                    {/* Name input */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            Asset Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            placeholder="Enter asset name"
                        />
                    </div>

                    {/* Description input */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                            rows={3}
                            placeholder="Add a description"
                        />
                    </div>

                    {/* Tags input */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            <Tag className="w-3 h-3 inline mr-1" />
                            Tags
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                className="flex-1 px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                placeholder="Add tags"
                            />
                            <button
                                onClick={handleAddTag}
                                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="flex items-center gap-1 px-2 py-1 bg-violet-600/20 text-violet-300 rounded text-sm"
                                    >
                                        {tag}
                                        <button
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-violet-100"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Progress bar */}
                    {uploading && (
                        <div className="space-y-2">
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-violet-600 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-zinc-400 text-center">
                                Uploading... {progress}%
                            </p>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Upload button */}
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !name}
                        className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg transition-colors"
                    >
                        {uploading ? 'Uploading...' : 'Upload Asset'}
                    </button>
                </>
            )}
        </div>
    );
}
