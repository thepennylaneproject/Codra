/**
 * HERO SECTION
 * Landing page hero with beautiful background imagery
 * Gold/teal energy flow aesthetic
 */

import React from 'react';
import { cn } from '../../lib/utils';
import { Logo } from '../Logo';

import HERO_PRIMARY from '../../assets/codra/image/hero/primary/1600x896@1x.webp';
import TEXTURE_CIRCLES from '../../assets/codra/image/texture/circles/896x1600@1x.webp';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  cta?: {
    text: string;
    onClick: () => void;
  };
  secondaryCta?: {
    text: string;
    onClick: () => void;
  };
  backgroundImage?: string;
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Build Beautifully',
  subtitle = 'Deploy Intelligently',
  cta,
  secondaryCta,
  backgroundImage = HERO_PRIMARY,
  className = ''
}) => {
  return (
    <section
      className={cn(
        'relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden',
        className
      )}
    >
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: 'brightness(0.5) contrast(1.1)'
        }}
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background-default/80 via-background-default/60 to-background-default" />

      {/* Texture Overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${TEXTURE_CIRCLES})`,
          backgroundSize: 'cover',
          mixBlendMode: 'overlay'
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8 px-6 text-center max-w-4xl">
        {/* Logo */}
        <div className="mb-4">
          <Logo size="lg" variant="icon" />
        </div>

        {/* Main Headline */}
        <div className="space-y-4">
          <h1 className="text-display-lg text-cream font-black leading-tight tracking-tight">
            {title}
          </h1>
          <p className="text-heading-md text-text-muted font-semibold">
            {subtitle}
          </p>
        </div>

        {/* Tagline */}
        <p className="text-body-lg text-text-soft max-w-2xl leading-relaxed mt-4">
          The Creative Automation Studio for designers, developers, and makers.
          Orchestrate AI workflows with unprecedented clarity and control.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          {cta && (
            <button
              onClick={cta.onClick}
              className="px-8 py-4 bg-gradient-forge rounded-full text-label-md font-bold text-background-default hover:shadow-2xl hover:scale-105 transition-all glow-magenta"
            >
              {cta.text}
            </button>
          )}

          {secondaryCta && (
            <button
              onClick={secondaryCta.onClick}
              className="px-8 py-4 border-2 border-brand-gold text-brand-gold rounded-full text-label-md font-bold hover:bg-brand-gold/10 hover:shadow-lg transition-all"
            >
              {secondaryCta.text}
            </button>
          )}
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-3 justify-center mt-12">
          {[
            { icon: '⚡', text: '200+ AI Models' },
            { icon: '🎯', text: 'Precise Control' },
            { icon: '🚀', text: 'One-Click Deploy' },
            { icon: '💎', text: 'Enterprise Ready' }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="px-4 py-2 rounded-full border border-border-subtle bg-background-elevated/50 backdrop-blur-sm flex items-center gap-2"
            >
              <span className="text-lg">{feature.icon}</span>
              <span className="text-body-sm text-text-primary font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 z-10 flex flex-col items-center gap-3 animate-bounce">
        <p className="text-body-sm text-text-muted">Scroll to explore</p>
        <svg
          className="w-6 h-6 text-brand-gold"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
