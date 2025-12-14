/**
 * AssetsPage - Main asset library page
 */

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { AssetLibrary } from '../components/assets/AssetLibrary';
import { AssetUploader } from '../components/assets/AssetUploader';
import type { Asset } from '../types/shared';

export function AssetsPage() {
    const [showUploader, setShowUploader] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleUploadComplete = (asset: Asset) => {
        setShowUploader(false);
        setRefreshKey(prev => prev + 1); // Trigger refresh
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Asset Library</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Upload, organize, and reuse assets across projects
                    </p>
                </div>
                <button
                    onClick={() => setShowUploader(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    Upload Asset
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <AssetLibrary key={refreshKey} />
            </div>

            {/* Upload Modal */}
            {showUploader && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-zinc-900 rounded-xl border border-white/10 p-6 max-w-2xl w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-zinc-100">Upload Asset</h2>
                            <button
                                onClick={() => setShowUploader(false)}
                                className="text-zinc-400 hover:text-zinc-100 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <AssetUploader onComplete={handleUploadComplete} />
                    </div>
                </div>
            )}
        </div>
    );
}
