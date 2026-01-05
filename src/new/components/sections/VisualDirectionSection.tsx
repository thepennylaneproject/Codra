/**
 * VISUAL DIRECTION SECTION
 * Interactive moodboard grid with style sync capabilities
 */

import { ExternalLink, RefreshCw, Pin, Lock, Unlock } from 'lucide-react';
import { MoodboardImage } from '../../../domain/types';
import { Button } from '@/components/ui/Button';

interface VisualDirectionSectionProps {
    content: any;
    isEditing?: boolean;
    onUpdate?: (content: any) => void;
}

export function VisualDirectionSection({ content, isEditing, onUpdate }: VisualDirectionSectionProps) {
    const traits = (content.personalityTraits as string[]) || [];
    const images = (content.inspirationImages as MoodboardImage[]) || [];

    const handleToggleLock = (imgId: string) => {
        if (!onUpdate) return;
        const newImages = images.map(img =>
            img.id === imgId ? { ...img, locked: !img.locked } : img
        );
        onUpdate({ ...content, inspirationImages: newImages });
    };

    return (
        <div className="space-y-6">
            {/* Personality Traits */}
            {traits.length > 0 && (
                <div>
                    <span className="block text-xs tracking-wide text-zinc-400 mb-2 font-semibold">
                        Personality
                    </span>
                    <div className="flex flex-wrap gap-1">
                        {traits.map((trait, i) => (
                            <span key={i} className="px-3 py-1 text-xs bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-full border border-purple-100 dark:border-purple-500/20">
                                {trait}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Moodboard Grid */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <span className="block text-xs text-zinc-400 font-semibold">Moodboard</span>
                    <Button className="flex items-center gap-1 text-xs text-indigo-500 font-semibold hover:opacity-80 transition-opacity">
                        <RefreshCw size={12} />
                        Regenerate Non-Locked
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((img) => (
                        <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                            <img
                                src={img.imageUrl}
                                alt={img.caption || img.role}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        onClick={() => handleToggleLock(img.id)}
                                        className="p-1 glass-panel border-0 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                                        title={img.locked ? "Unlock" : "Lock"}
                                    >
                                        {img.locked ? <Lock size={14} /> : <Unlock size={14} />}
                                    </Button>
                                    <Button className="p-1 glass-panel border-0 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors">
                                        <ExternalLink size={14} />
                                    </Button>
                                </div>

                                <div className="space-y-1">
                                    <span className="inline-block px-1 py-0 bg-indigo-500 text-xs font-semibold text-white rounded">
                                        {img.role}
                                    </span>
                                    <p className="text-xs text-white/90 font-medium line-clamp-2">
                                        {img.caption || "Aesthetic Reference"}
                                    </p>
                                </div>
                            </div>

                            {/* Lock Indicator (Visible when locked or hovered) */}
                            {img.locked && (
                                <div className="absolute top-2 left-2 p-1 bg-indigo-500 text-white rounded-md shadow-lg">
                                    <Lock size={10} />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add More Slot */}
                    {isEditing && (
                        <Button className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 hover:border-indigo-300 hover:text-indigo-400 transition-all group">
                            <Pin size={24} className="mb-2 group-hover:rotate-45 transition-transform" />
                            <span className="text-xs font-semibold">Add Reference</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
