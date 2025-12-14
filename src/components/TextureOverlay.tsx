/**
 * TEXTURE OVERLAY
 * Subtle texture layers for visual depth and studio aesthetic
 * Film grain, circuits, and organic patterns
 */

import React from 'react';
import { cn } from '../lib/utils';
import TEXTURE_CIRCLES from '../assets/codra/image/texture/circles/896x1600@1x.webp';
import TEXTURE_CIRCUITS from '../assets/codra/image/texture/circuits/896x1600@1x.webp';

interface TextureOverlayProps {
  type?: 'grain' | 'circuits' | 'circles' | 'noise';
  intensity?: 'light' | 'medium' | 'heavy';
  className?: string;
}

/**
 * Film grain texture - very subtle
 */
const GrainTexture = ({ intensity = 'light' }: { intensity: string }) => (
  <div
    className={cn(
      'absolute inset-0 pointer-events-none',
      intensity === 'light' && 'opacity-15',
      intensity === 'medium' && 'opacity-25',
      intensity === 'heavy' && 'opacity-40'
    )}
    style={{
      backgroundImage:
        'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' result=\'noise\' /%3E%3C/filter%3E%3Crect width=\'400\' height=\'400\' fill=\'white\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
      mixBlendMode: 'overlay'
    }}
  />
);

/**
 * Circuit pattern - geometric lines
 */
const CircuitTexture = ({ intensity = 'light' }: { intensity: string }) => (
  <div
    className={cn(
      'absolute inset-0 pointer-events-none',
      intensity === 'light' && 'opacity-10',
      intensity === 'medium' && 'opacity-15',
      intensity === 'heavy' && 'opacity-25'
    )}
    style={{
      backgroundImage: `url(${TEXTURE_CIRCUITS})`,
      backgroundSize: 'cover',
      mixBlendMode: 'overlay'
    }}
  />
);

/**
 * Concentric circles - from brand assets
 */
const CirclesTexture = ({ intensity = 'light' }: { intensity: string }) => (
  <div
    className={cn(
      'absolute inset-0 pointer-events-none',
      intensity === 'light' && 'opacity-[0.08]',
      intensity === 'medium' && 'opacity-[0.12]',
      intensity === 'heavy' && 'opacity-[0.20]'
    )}
    style={{
      backgroundImage: `url(${TEXTURE_CIRCLES})`,
      backgroundSize: 'cover',
      mixBlendMode: 'overlay'
    }}
  />
);

/**
 * Noise/static texture
 */
const NoiseTexture = ({ intensity = 'light' }: { intensity: string }) => (
  <div
    className={cn(
      'absolute inset-0 pointer-events-none',
      intensity === 'light' && 'opacity-[0.05]',
      intensity === 'medium' && 'opacity-[0.10]',
      intensity === 'heavy' && 'opacity-[0.15]'
    )}
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.99' numOctaves='1' result='noise'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23ffffff' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      mixBlendMode: 'soft-light'
    }}
  />
);

export const TextureOverlay: React.FC<TextureOverlayProps> = ({
  type = 'grain',
  intensity = 'light',
  className = ''
}) => {
  return (
    <div className={cn('relative', className)}>
      {type === 'grain' && <GrainTexture intensity={intensity} />}
      {type === 'circuits' && <CircuitTexture intensity={intensity} />}
      {type === 'circles' && <CirclesTexture intensity={intensity} />}
      {type === 'noise' && <NoiseTexture intensity={intensity} />}
    </div>
  );
};

/**
 * Convenience component for adding texture to any element
 */
export const withTexture = (
  Component: React.ComponentType<any>,
  textureType: 'grain' | 'circuits' | 'circles' | 'noise' = 'grain',
  intensity: 'light' | 'medium' | 'heavy' = 'light'
) => {
  return (props: any) => (
    <div className="relative">
      <Component {...props} />
      <TextureOverlay type={textureType} intensity={intensity} />
    </div>
  );
};

export default TextureOverlay;
