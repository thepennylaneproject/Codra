import { useState } from 'react';
import { File, Image, FileText, Search, ExternalLink, Trash2 } from 'lucide-react';
import { UploadZone } from '../UploadZone';
import { Asset } from '../../../domain/types';
import { EmptyState } from '../EmptyState';

interface AssetRegistryPanelProps {
    assets: Asset[];
    onUpload: (files: File[]) => void;
    onDelete?: (assetId: string) => void;
}

export function AssetRegistryPanel({
    assets,
    onUpload,
    onDelete
}: AssetRegistryPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
            {/* Header / Search */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Project Assets</h3>
                    <span className="text-[10px] font-mono text-zinc-400">{assets.length} items</span>
                </div>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-rose-500 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Filter resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-1 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Upload Area */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10">
                <UploadZone
                    onUpload={onUpload}
                    className="h-32"
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filteredAssets.length > 0 ? (
                    <div className="divide-y divide-zinc-50 dark:divide-zinc-900">
                        {filteredAssets.map(asset => (
                            <div key={asset.id} className="group flex items-center gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                                    {getIconForType(asset.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate group-hover:text-rose-600 transition-colors">
                                        {asset.name}
                                    </h4>
                                    <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-tighter mt-0.5">
                                        Added 2 mins ago
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => window.open(asset.url, '_blank')}
                                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-500 transition-all"
                                    >
                                        <ExternalLink size={14} />
                                    </button>
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(asset.id)}
                                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded text-zinc-300 hover:text-rose-600 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={File}
                        title="No assets uploaded"
                        description="Upload images, documents, or other files using the upload zone above."
                    />
                )}
            </div>
        </div>
    );
}

function getIconForType(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext || '')) return <Image size={16} />;
    if (['pdf', 'doc', 'docx'].includes(ext || '')) return <FileText size={16} />;
    return <File size={16} />;
}
