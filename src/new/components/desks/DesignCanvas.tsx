/**
 * DESIGN CANVAS
 * Adapted from ArtDeskCanvas
 * Visual assets, illustrations, and design systems
 */

import { useState, useEffect } from 'react';
import { Sparkles, Maximize2, RefreshCcw, Download, Layers, Plus, Lock, Unlock } from 'lucide-react';
import { MOCK_ASSETS } from '../../../domain/integrations';
import { useImageGeneration } from '../../../hooks/useImageGeneration';
import { STYLE_PRESETS, ImageStyle, applyStyleToPrompt, generateRandomSeed } from '../../../lib/image/seed-preservation';
import { Button, IconButton } from '@/components/ui/Button';
import { useDeskState } from './hooks/useDeskState';

interface DesignCanvasProps {
    projectId: string;
    selectedModelId?: string;
    onSelectModel?: (modelId: string, providerId: string) => void;
}

export const DesignCanvas: React.FC<DesignCanvasProps> = ({ 
    projectId,
    selectedModelId = 'flux-pro', 
    onSelectModel 
}) => {
    void onSelectModel;
    const { getDeskState, updateDeskState } = useDeskState();
    const state = getDeskState(projectId, 'design');

    const [prompt, setPrompt] = useState(state.inputContent || '');
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const { generate, isLoading, result, error } = useImageGeneration();
    const [localAssets, setLocalAssets] = useState(MOCK_ASSETS);
    
    // Seed Preservation & Anti-Slop
    const [currentStyle, setCurrentStyle] = useState<ImageStyle>('organic');
    const [currentSeed, setCurrentSeed] = useState<number>(generateRandomSeed());
    const [seedLocked, setSeedLocked] = useState(false);

    useEffect(() => {
        updateDeskState(projectId, 'design', { inputContent: prompt });
    }, [prompt, projectId, updateDeskState]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const newAsset = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            url: URL.createObjectURL(file),
            thumbnailUrl: URL.createObjectURL(file),
            type: 'image' as const,
            source: 's3' as const,
            format: file.type.split('/')[1] || 'png',
            tags: ['user-upload']
        };

        setLocalAssets(prev => [newAsset, ...prev]);
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        
        const { prompt: styledPrompt, negativePrompt } = applyStyleToPrompt(prompt, currentStyle);
        
        if (!seedLocked) {
            setCurrentSeed(generateRandomSeed());
        }
        
        await generate({
            prompt: styledPrompt,
            negativePrompt,
            model: selectedModelId,
            width: 1024,
            height: 1024,
            seed: currentSeed,
        });
    };

    const onAssetDragStart = (e: React.DragEvent, assetName: string) => {
        e.dataTransfer.setData('text/plain', `[Asset Context: ${assetName}]`);
    };

    return (
        <div className="w-full h-full flex gap-8">
            {/* Context Sidebar */}
            <aside className="w-64 flex flex-col gap-6 shrink-0">
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs text-desk-text-muted font-semibold">Resource Library</h3>
                        <span className="flex items-center gap-1 text-xs font-semibold text-zinc-500">Cloudinary</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {localAssets.map(asset => (
                            <div
                                key={asset.id}
                                draggable
                                onDragStart={(e) => onAssetDragStart(e, asset.name)}
                                className="aspect-square rounded-lg border border-[var(--desk-border)] bg-[var(--desk-bg)]/50 overflow-hidden group cursor-grab active:cursor-grabbing hover:border-rose-500/50 transition-all shadow-lg"
                                title={asset.name}
                            >
                                <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100" />
                            </div>
                        ))}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => document.getElementById('art-asset-upload')?.click()}
                            leftIcon={<Plus size={16} />}
                            className="aspect-square border-dashed text-desk-text-muted hover:text-rose-500 hover:border-rose-500 hover:bg-rose-500/5 flex flex-col"
                        >
                            <input
                                type="file"
                                id="art-asset-upload"
                                className="hidden"
                                onChange={handleUpload}
                                accept="image/*"
                            />
                            <span className="text-xs font-semibold">Add</span>
                        </Button>
                    </div>
                </section>

                <section className="mt-auto">
                    <div className="p-4 rounded-xl bg-[var(--desk-bg)]/10 border border-[var(--desk-border)] border-dashed">
                        <p className="text-xs font-mono text-desk-text-muted text-center">Drag assets to prompt</p>
                    </div>
                </section>
            </aside>

            <div className="flex-1 flex flex-col gap-8 min-w-0">
                {/* Stage: 2x2 Grid or Hero */}
                <div className="flex-1 min-h-0 grid grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="group relative bg-[var(--desk-bg)]/40 rounded-3xl border border-[var(--desk-border)] overflow-hidden aspect-square flex items-center justify-center transition-all hover:border-rose-500/50"
                        >
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <RefreshCcw size={24} className="text-rose-500 animate-spin" />
                                    <p className="text-xs font-mono text-desk-text-muted">Iterating {i + 1}...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {result && i === 0 ? (
                                            <img src={result.url} alt="Generated" className="w-full h-full object-cover" />
                                        ) : (
                                            <Sparkles size={48} className="text-desk-bg" />
                                        )}
                                    </div>
                                    
                                    {error && i === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-4 text-center">
                                            <p className="text-xs text-rose-400 font-mono">{error}</p>
                                        </div>
                                    )}

                                    {/* Overlay Controls */}
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label="Maximize"
                                                    className="glass-panel border-0 bg-white/10 hover:bg-white/20"
                                                >
                                                    <Maximize2 size={14} className="text-white" />
                                                </IconButton>
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label="Download"
                                                    className="glass-panel border-0 bg-white/10 hover:bg-white/20"
                                                >
                                                    <Download size={14} className="text-white" />
                                                </IconButton>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                leftIcon={<Layers size={12} />}
                                                className="bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/40"
                                            >
                                                Promote to workspace
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Prompt Console */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                        const assetContext = e.dataTransfer.getData('text/plain');
                        setPrompt(prev => prev + (prev ? ' ' : '') + assetContext);
                    }}
                    className={`glass-panel-light bg-[var(--desk-surface)]/80 transition-all duration-300 rounded-2xl p-4 flex flex-col gap-4 shadow-2xl ${isDraggingOver ? 'border-rose-500 bg-rose-500/5 scale-[1.01]' : 'border-[var(--desk-border)]'}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Anti-Slop Style Selector */}
                            <div className="flex items-center gap-1">
                                {(Object.keys(STYLE_PRESETS) as ImageStyle[]).slice(0, 4).map((style) => {
                                    const preset = STYLE_PRESETS[style];
                                    return (
                                        <Button
                                            key={style}
                                            onClick={() => setCurrentStyle(style)}
                                            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                                                currentStyle === style
                                                    ? 'bg-rose-500 text-white'
                                                    : 'bg-[var(--desk-bg)]/50 text-desk-text-muted hover:bg-rose-500/20'
                                            }`}
                                            title={preset.description}
                                        >
                                            {preset.icon}
                                        </Button>
                                    );
                                })}
                            </div>

                            <div className="w-px h-4 bg-[var(--desk-border)]" />

                            {/* Seed Lock */}
                            <Button
                                onClick={() => setSeedLocked(!seedLocked)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    seedLocked
                                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                        : 'bg-[var(--desk-bg)]/50 text-desk-text-muted hover:bg-[var(--desk-border)]'
                                }`}
                                title={seedLocked ? `Seed locked: ${currentSeed}` : 'Lock seed for variations'}
                            >
                                {seedLocked ? <Lock size={10} /> : <Unlock size={10} />}
                                {seedLocked ? 'Locked' : 'Seed'}
                            </Button>

                            <div className="w-px h-4 bg-[var(--desk-border)]" />

                            <div className="flex items-center gap-2 text-xs font-semibold text-desk-text-muted">
                                <span>Safe Search: On</span>
                            </div>
                        </div>

                        <span className="text-xs font-mono text-desk-text-muted tracking-tight">Est. Cost: $0.12</span>
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="flex-1 relative group">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your visual intent or drag assets here..."
                                className="w-full bg-[var(--desk-bg)]/40 border border-[var(--desk-border)] rounded-xl px-4 py-3 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-all placeholder:text-desk-text-muted font-mono text-desk-text-primary"
                            />
                            <div className="absolute right-3 bottom-3 flex gap-2">
                                <IconButton
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Refresh prompt"
                                    className="bg-[var(--desk-bg)] hover:bg-[var(--desk-border)] text-desk-text-muted"
                                >
                                    <RefreshCcw size={14} />
                                </IconButton>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="md"
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="px-8 bg-[var(--desk-text-primary)] hover:bg-[var(--desk-text-primary)]/90 text-desk-surface shadow-xl shadow-white/5"
                        >
                            {isLoading ? 'Firing...' : 'Generate'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
