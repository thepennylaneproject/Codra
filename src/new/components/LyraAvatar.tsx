/**
 * LYRA AVATAR
 * Composite rendering component for the Lyra "Paper-Doll" system.
 * 
 * Layers are stacked to create a diverse and expressive character.
 * Stack order: Base -> Clothing -> Expression -> Hair -> Accessory
 */

import { useMemo } from 'react';
import { LyraAppearance } from '../../domain/types';
import { getAssetById } from '../../lib/lyra/LyraRegistry';

interface LyraAvatarProps {
    appearance: LyraAppearance;
    size?: number | string;
    className?: string;
    showGlow?: boolean;
}

export function LyraAvatar({
    appearance,
    size = '100%',
    className = '',
    showGlow = true,
}: LyraAvatarProps) {
    const { baseId, expression, layers } = appearance;

    // Resolve assets
    const base = useMemo(() => getAssetById(baseId), [baseId]);
    const hair = useMemo(() => layers.hair ? getAssetById(layers.hair) : null, [layers.hair]);
    const clothing = useMemo(() => layers.clothing ? getAssetById(layers.clothing) : null, [layers.clothing]);
    const accessory = useMemo(() => layers.accessory ? getAssetById(layers.accessory) : null, [layers.accessory]);

    // Construct expression asset URL
    // Expressions are usually small partial SVGs that overlay the base
    const expressionUrl = `/assets/lyra/expressions/${expression}.svg`;

    return (
        <div
            className={`relative flex items-center justify-center overflow-hidden rounded-full bg-zinc-100 ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Ambient Character Glow */}
            {showGlow && (
                <div className="absolute inset-0 bg-black/5 opacity-50" />
            )}

            {/* Layer Stack */}
            <div className="relative w-full h-full">
                {/* 1. Base Layer (Body/Skin) */}
                {base && (
                    <img
                        src={base.assetUrl}
                        alt="Lyra Base"
                        className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                )}

                {/* 2. Clothing Layer */}
                {clothing && (
                    <img
                        src={clothing.assetUrl}
                        alt="Lyra Clothing"
                        className="absolute inset-0 w-full h-full object-cover z-10"
                    />
                )}

                {/* 3. Expression Layer (Face) */}
                <img
                    src={expressionUrl}
                    alt={`Lyra ${expression}`}
                    className="absolute inset-0 w-full h-full object-cover z-20"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />

                {/* 4. Hair Layer */}
                {hair && (
                    <img
                        src={hair.assetUrl}
                        alt="Lyra Hair"
                        className="absolute inset-0 w-full h-full object-cover z-30"
                    />
                )}

                {/* 5. Accessory Layer */}
                {accessory && (
                    <img
                        src={accessory.assetUrl}
                        alt="Lyra Accessory"
                        className="absolute inset-0 w-full h-full object-cover z-40"
                    />
                )}
            </div>

            {/* Editorial Dust Overlay (Subtle Texture) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <filter id="noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noise)" />
                </svg>
            </div>
        </div>
    );
}
