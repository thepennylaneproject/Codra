/**
 * CODRA LOGO COMPONENT
 * Beautiful concentric circle logo with gold/teal circuit aesthetic
 * Used in header, navigation, and branding
 */

import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full'; // icon only vs icon + text
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

/**
 * Logo SVG - Concentric circles with circuit nodes
 * Gold (#F4D03F) and Teal (#00D9D9) colors
 * Minimalist geometric design
 */
const LogoSVG = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer circle with glow */}
    <circle
      cx="60"
      cy="60"
      r="58"
      stroke="#F4D03F"
      strokeWidth="1"
      opacity="0.3"
    />

    {/* Concentric rings - Gold */}
    <circle cx="60" cy="60" r="50" stroke="#F4D03F" strokeWidth="2" />
    <circle cx="60" cy="60" r="42" stroke="#F4D03F" strokeWidth="1.5" opacity="0.8" />
    <circle cx="60" cy="60" r="34" stroke="#F4D03F" strokeWidth="1.5" />
    <circle cx="60" cy="60" r="26" stroke="#F4D03F" strokeWidth="2" />

    {/* Inner Teal accent circles */}
    <circle cx="60" cy="60" r="18" stroke="#00D9D9" strokeWidth="1.5" opacity="0.6" />
    <circle cx="60" cy="60" r="10" stroke="#00D9D9" strokeWidth="1" />

    {/* Circuit nodes on outer ring - Gold */}
    <circle cx="110" cy="60" r="3.5" fill="#F4D03F" />
    <circle cx="95" cy="95" r="3" fill="#F4D03F" />
    <circle cx="60" cy="110" r="3.5" fill="#F4D03F" />
    <circle cx="25" cy="95" r="3" fill="#F4D03F" />
    <circle cx="10" cy="60" r="3.5" fill="#F4D03F" />
    <circle cx="25" cy="25" r="3" fill="#F4D03F" />
    <circle cx="60" cy="10" r="3.5" fill="#F4D03F" />
    <circle cx="95" cy="25" r="3" fill="#F4D03F" />

    {/* Teal accent nodes */}
    <circle cx="85" cy="35" r="2" fill="#00D9D9" opacity="0.7" />
    <circle cx="35" cy="85" r="2" fill="#00D9D9" opacity="0.7" />

    {/* Center dot */}
    <circle cx="60" cy="60" r="2" fill="#F4D03F" />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  showText = true,
  className = ''
}) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Icon */}
      <div className={cn(sizeMap[size], 'flex-shrink-0')}>
        <LogoSVG className="w-full h-full" />
      </div>

      {/* Text */}
      {variant === 'full' && showText && (
        <div className="flex flex-col gap-0">
          <span className="text-label-lg text-cream font-bold tracking-widest">
            CODRA
          </span>
          <span className="text-body-sm text-text-muted">
            Creative Automation
          </span>
        </div>
      )}
    </div>
  );
};

export const LogoIcon: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({
  size = 'md',
  className = ''
}) => (
  <div className={cn(sizeMap[size], 'flex-shrink-0', className)}>
    <LogoSVG className="w-full h-full" />
  </div>
);

export default Logo;
