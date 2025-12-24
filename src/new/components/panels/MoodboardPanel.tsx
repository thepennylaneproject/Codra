/**
 * MOODBOARD PANEL
 * Displays 4-6 inspiration tiles from onboarding visual answers
 * Editable, replaceable, pinnable tiles
 */

import { useState } from 'react';
import { MoodboardImage } from '../../../domain/types';
import { Pin, RotateCcw, Plus, Image } from 'lucide-react';

// ============================================
// Types
// ============================================

interface MoodboardPanelProps {
    images: MoodboardImage[];
    editable?: boolean;
    onTogglePin?: (imageId: string) => void;
    onRegenerate?: (imageId: string) => void;
    onReplace?: (imageId: string) => void;
    onAdd?: () => void;
}

// ============================================
// Component
// ============================================

export function MoodboardPanel({
    images,
    editable = false,
    onTogglePin,
    onRegenerate,
    onAdd,
}: MoodboardPanelProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    if (images.length === 0) {
        return (
            <div className="p-6 border border-dashed border-zinc-200 rounded-lg text-center">
                <Image size={32} className="text-zinc-300 mx-auto mb-3" />
                <p className="text-sm text-zinc-400 mb-3">No visual references yet</p>
                {editable && onAdd && (
                    <button
                        onClick={onAdd}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-sm rounded transition-colors inline-flex items-center gap-2"
                    >
                        <Plus size={14} />
                        Add Reference
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Grid */}
            <div className="grid grid-cols-2 gap-2">
                {images.slice(0, 6).map(image => (
                    <div
                        key={image.id}
                        className="relative aspect-square rounded-sm overflow-hidden bg-zinc-100 group"
                        onMouseEnter={() => setHoveredId(image.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        {/* Image */}
                        <img
                            src={image.imageUrl}
                            alt={image.caption || image.role}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Caption */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                                {image.role}
                            </span>
                            {image.caption && (
                                <p className="text-xs text-white/70 mt-0.5 line-clamp-2">
                                    {image.caption}
                                </p>
                            )}
                        </div>

                        {/* Pin indicator */}
                        {image.locked && (
                            <div className="absolute top-2 left-2 p-1.5 bg-white rounded-full shadow-sm">
                                <Pin size={12} className="text-zinc-900 fill-current" />
                            </div>
                        )}

                        {/* Editable controls */}
                        {editable && hoveredId === image.id && (
                            <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onTogglePin?.(image.id)}
                                    className={`p-1.5 rounded-full transition-all ${image.locked
                                        ? 'bg-white text-zinc-900'
                                        : 'bg-white/10 text-white hover:bg-white hover:text-zinc-900'
                                        }`}
                                    title={image.locked ? 'Unpin' : 'Pin'}
                                >
                                    <Pin size={12} className={image.locked ? 'fill-current' : ''} />
                                </button>
                                <button
                                    onClick={() => onRegenerate?.(image.id)}
                                    className="p-1.5 bg-white/10 text-white hover:bg-white hover:text-zinc-900 rounded-full transition-all"
                                    title="Regenerate"
                                >
                                    <RotateCcw size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add button */}
            {editable && images.length < 6 && onAdd && (
                <button
                    onClick={onAdd}
                    className="w-full p-3 border border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-sm text-sm text-zinc-400 hover:text-zinc-600 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={14} />
                    Add Reference
                </button>
            )}
        </div>
    );
}
