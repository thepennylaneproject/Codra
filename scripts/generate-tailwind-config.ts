import fs from 'fs';
import path from 'path';
import { tokens } from '../src/lib/design-tokens';

const normalizeFont = (font: string) => font.trim().replace(/^['"]|['"]$/g, '');

const spacing = {
  ...tokens.spacing.scale,
  ...tokens.spacing.semantic,
};

const config = {
  theme: {
    extend: {
      colors: {
      void: {
        DEFAULT: tokens.colors.cosmic.void,
        soft: tokens.colors.cosmic.voidSoft,
        elevated: tokens.colors.cosmic.voidElevated,
      },
      stardust: {
        DEFAULT: tokens.colors.cosmic.stardust,
        warm: tokens.colors.cosmic.stardustWarm,
        muted: tokens.colors.cosmic.stardustMuted,
        dim: tokens.colors.cosmic.stardustDim,
      },
      energy: {
        teal: tokens.colors.energy.teal,
        cyan: tokens.colors.energy.cyan,
        magenta: tokens.colors.energy.magenta,
        rose: tokens.colors.energy.rose,
        gold: tokens.colors.energy.gold,
        amber: tokens.colors.energy.amber,
      },
      glow: {
        teal: tokens.colors.glow.teal,
        'teal-soft': tokens.colors.glow.tealSoft,
        'teal-subtle': tokens.colors.glow.tealSubtle,
        magenta: tokens.colors.glow.magenta,
        'magenta-soft': tokens.colors.glow.magentaSoft,
        gold: tokens.colors.glow.gold,
        'gold-soft': tokens.colors.glow.goldSoft,
      },
      glass: {
        DEFAULT: tokens.colors.glass.bg,
        frosted: tokens.colors.glass.frosted,
        clear: tokens.colors.glass.clear,
        edge: tokens.colors.glass.edge,
        'edge-bright': tokens.colors.glass.edgeBright,
        panel: tokens.colors.surface.glass,
        elevated: tokens.colors.surface.glassSoft,
        highlight: tokens.colors.glass.highlight,
      },
      brand: {
        ink: tokens.colors.brand.ink,
        cream: tokens.colors.brand.cream,
        magenta: tokens.colors.brand.magenta,
        gold: tokens.colors.brand.gold,
        teal: tokens.colors.brand.teal,
        charcoal: tokens.colors.brand.charcoal,
        coral: tokens.colors.brand.coral,
        ivory: tokens.colors.brand.ivory,
        violet: tokens.colors.brand.violet,
      },
      background: {
        default: tokens.colors.background.default,
        elevated: tokens.colors.background.elevated,
        subtle: tokens.colors.background.subtle,
      },
      state: {
        success: tokens.colors.state.success,
        warning: tokens.colors.state.warning,
        error: tokens.colors.state.error,
        info: tokens.colors.state.info,
      },
      surface: {
        glass: tokens.colors.surface.glass,
        'glass-soft': tokens.colors.surface.glassSoft,
        chip: tokens.colors.surface.chip,
      },
      border: {
        subtle: tokens.colors.border.subtle,
        strong: tokens.colors.border.strong,
        accent: tokens.colors.border.accent,
      },
      text: {
        primary: tokens.colors.text.primary,
        secondary: tokens.colors.text.muted,
        muted: tokens.colors.text.muted,
        soft: tokens.colors.text.soft,
        accent: tokens.colors.accent.primary,
      },
    },
    fontFamily: {
      display: tokens.typography.fontFamily.display.split(',').map(normalizeFont),
      sans: tokens.typography.fontFamily.base.split(',').map(normalizeFont),
      mono: tokens.typography.fontFamily.mono.split(',').map(normalizeFont),
    },
    fontSize: tokens.typography.fontSize,
    fontWeight: {
      normal: tokens.typography.fontWeight.regular,
      medium: tokens.typography.fontWeight.medium,
      semibold: tokens.typography.fontWeight.semibold,
    },
    lineHeight: tokens.typography.lineHeight,
    spacing,
    borderRadius: tokens.borders.radius,
    zIndex: tokens.zIndex,
    },
  },
};

const output = `/* Auto-generated from src/lib/design-tokens.ts. Do not edit directly. */\nexport default ${JSON.stringify(
  config,
  null,
  2
)};\n`;

const outputPath = path.resolve('tailwind.config.generated.js');
fs.writeFileSync(outputPath, output, 'utf8');
