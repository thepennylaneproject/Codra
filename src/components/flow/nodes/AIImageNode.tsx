import React, { useState } from 'react';
import { ImageNodeIcon, SettingsIcon } from '../../icons';
import { Upload } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { CustomNodeProps } from '../../../types/flow';
import { AssetPicker } from '../../assets/AssetPicker';
import type { Asset } from '../../../types/shared';

export const AIImageNode: React.FC<CustomNodeProps> = ({ data, selected }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [refImage, setRefImage] = useState<Asset | null>(null);

    const handleAssetSelect = (asset: Asset | Asset[]) => {
        const selected = Array.isArray(asset) ? asset[0] : asset;
        setRefImage(selected);
        setShowPicker(false);
        // In a real app, you would update node data here via useReactFlow
    };

    return (
        <BaseNode
            data={data}
            selected={selected}
            icon={<ImageNodeIcon size={18} color="#D81159" />}
            color="magenta"
            title="AI Image"
            inputs={[{ id: 'prompt', label: 'Prompt' }, { id: 'style', label: 'Style' }]}
            outputs={[{ id: 'image', label: 'Image' }]}
        >
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-body-xs text-text-muted mb-1">Aspect Ratio</label>
                        <select className="w-full bg-background-default border border-border-subtle rounded-lg px-2 py-1 text-body-xs text-text-primary">
                            <option value="1:1">1:1 Square</option>
                            <option value="16:9">16:9 Landscape</option>
                            <option value="9:16">9:16 Portrait</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-body-xs text-text-muted mb-1">Model</label>
                        <select className="w-full bg-background-default border border-border-subtle rounded-lg px-2 py-1 text-body-xs text-text-primary">
                            <option value="dall-e-3">DALL-E 3</option>
                            <option value="midjourney">Midjourney</option>
                        </select>
                    </div>
                </div>

                {/* Reference Image Input */}
                <div>
                    <label className="block text-body-xs text-text-muted mb-1">Reference Image</label>
                    <button
                        onClick={() => setShowPicker(true)}
                        className="w-full h-8 flex items-center justify-center gap-2 bg-background-default border border-border-subtle hover:border-brand-magenta/50 rounded-lg transition-colors text-body-xs text-text-muted hover:text-text-primary"
                    >
                        {refImage ? (
                            <span className="truncate px-2">{refImage.name}</span>
                        ) : (
                            <>
                                <Upload size={12} />
                                <span>Select Asset...</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-brand-magenta/10 border border-brand-magenta/20">
                    <SettingsIcon size={14} color="#D81159" />
                    <span className="text-body-xs text-brand-magenta">Advanced Settings</span>
                </div>
            </div>

            {showPicker && (
                <AssetPicker
                    workspaceId="placeholder-workspace-id"
                    onSelect={handleAssetSelect}
                    onClose={() => setShowPicker(false)}
                    filterTypes={['image']}
                />
            )}
        </BaseNode>
    );
};
