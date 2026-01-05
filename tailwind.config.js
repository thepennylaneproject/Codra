import generated from './tailwind.config.generated.js';

const {
  fontSize: _fontSize,
  fontWeight: _fontWeight,
  spacing: _spacing,
  ...generatedExtend
} = generated.theme?.extend || {};
const generatedColors = generatedExtend.colors || {};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    ...generated.theme,
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      xl: ['24px', { lineHeight: '32px' }],
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
    },
    extend: {
      ...generatedExtend,
      colors: {
        ...generatedColors,
        desk: {
          bg: 'var(--desk-bg)',
          surface: 'var(--desk-surface)',
          border: 'var(--desk-border)',
          text: {
            primary: 'var(--desk-text-primary)',
            muted: 'var(--desk-text-muted)',
          },
        },
        shell: {
          border: 'var(--shell-border)',
          text: {
            primary: 'var(--shell-text-primary)',
            secondary: 'var(--shell-text-secondary)',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      ringColor: {
        focus: 'rgba(161, 161, 170, 0.5)',
      },
      outlineColor: {
        focus: 'var(--color-ink-400)',
      },
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'glow': '0 0 20px rgb(99 102 241 / 0.3)',
        'glow-lg': '0 0 40px rgb(99 102 241 / 0.4)',
        'glow-teal': '0 0 30px -5px var(--atmosphere-glow-color, rgba(0, 217, 217, 0.4))',
        'glow-teal-soft': '0 0 20px rgba(0, 217, 217, 0.2)',
        'glow-magenta': '0 0 30px -5px rgba(216, 17, 89, 0.4)',
        'cosmic': '0 20px 60px -15px rgba(0, 0, 0, 0.7)',
        'cosmic-sm': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'cosmic-lg': '0 25px 80px -15px rgba(0, 0, 0, 0.8)',
      },
      backgroundImage: {},
    },
  },
  plugins: [
    function focusStandard({ addComponents }) {
      addComponents({
        '.focus-standard': {
          '&:focus-visible': {
            outline: '1px solid var(--color-ink-400)',
            outlineOffset: '2px',
            boxShadow: '0 0 0 3px rgba(161, 161, 170, 0.5)',
          },
        },
      });
    },
  ],
}
