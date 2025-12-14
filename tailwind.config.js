export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ========================
        // COSMIC VOID - Deep Space
        // ========================
        void: {
          DEFAULT: '#050608',
          soft: '#0A0E12',
          elevated: '#12171D',
        },

        // ========================
        // STARDUST - Luminous Light
        // ========================
        stardust: {
          DEFAULT: '#F8F9FA',
          warm: '#FFFDF7',
          muted: '#9CA3AF',
          dim: '#6B7280',
        },

        // ========================
        // ENERGY - Accent Spectrum
        // ========================
        energy: {
          teal: '#00D9D9',
          cyan: '#22D3EE',
          magenta: '#D81159',
          rose: '#F43F5E',
          gold: '#F4D03F',
          amber: '#F59E0B',
        },

        // ========================
        // GLOW - Luminous Effects (for backgrounds)
        // ========================
        glow: {
          teal: 'rgba(0, 217, 217, 0.5)',
          'teal-soft': 'rgba(0, 217, 217, 0.2)',
          'teal-subtle': 'rgba(0, 217, 217, 0.08)',
          magenta: 'rgba(216, 17, 89, 0.5)',
          'magenta-soft': 'rgba(216, 17, 89, 0.2)',
          gold: 'rgba(244, 208, 63, 0.5)',
          'gold-soft': 'rgba(244, 208, 63, 0.15)',
        },

        // ========================
        // GLASS - Panel Surfaces
        // ========================
        glass: {
          DEFAULT: 'var(--atmosphere-glass-tint, rgba(18, 23, 29, 0.6))',
          frosted: 'rgba(18, 23, 29, 0.8)',
          clear: 'rgba(18, 23, 29, 0.3)',
          edge: 'rgba(255, 255, 255, 0.08)',
          'edge-bright': 'rgba(255, 255, 255, 0.15)',
          panel: 'var(--surface-glass)',
          elevated: 'var(--surface-glass-soft)',
          highlight: 'rgba(255, 255, 255, 0.05)',
        },

        // ========================
        // LEGACY BRAND (for backwards compatibility)
        // ========================
        brand: {
          ink: '#0A0E12',
          cream: '#FFFDF7',
          magenta: '#D81159',
          gold: '#F4D03F',
          teal: '#00D9D9',
          charcoal: '#1A1F26',
        },
        background: {
          default: '#050608',
          elevated: '#12171D',
          subtle: '#0A0E12',
        },
        state: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#00D9D9',
        },
        surface: {
          glass: 'rgba(18, 23, 29, 0.85)',
          'glass-soft': 'rgba(18, 23, 29, 0.6)',
          chip: 'rgba(26, 31, 38, 0.95)',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.16)',
          accent: 'rgba(0, 217, 217, 0.3)',
        },
        text: {
          primary: '#F8F9FA',
          secondary: '#9CA3AF',
          muted: '#9CA3AF',
          soft: '#6B7280',
          accent: '#F4D03F',
        },
      },
      fontFamily: {
        display: [
          'Space Grotesk',
          'Clash Display',
          'sans-serif',
        ],
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        full: '999px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'cosmic-pulse': 'cosmic-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'cosmic-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 217, 217, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 217, 217, 0.4)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'glow': '0 0 20px rgb(99 102 241 / 0.3)',
        'glow-lg': '0 0 40px rgb(99 102 241 / 0.4)',
        'glow-teal': '0 0 30px -5px var(--atmosphere-glow-color, rgba(0, 217, 217, 0.4))',
        'glow-teal-soft': '0 0 20px rgba(0, 217, 217, 0.2)',
        'glow-magenta': '0 0 30px -5px rgba(216, 17, 89, 0.4)',
        'glow-gold': '0 0 30px -5px rgba(244, 208, 63, 0.4)',
        'cosmic': '0 20px 60px -15px rgba(0, 0, 0, 0.7)',
        'cosmic-sm': '0 8px 24px rgba(0, 0, 0, 0.5)',
        'cosmic-lg': '0 25px 80px -15px rgba(0, 0, 0, 0.8)',
      },
      backgroundImage: {
        // Cosmic gradients
        'gradient-cosmic': 'linear-gradient(135deg, rgba(0, 217, 217, 0.3) 0%, rgba(216, 17, 89, 0.3) 50%, rgba(244, 208, 63, 0.3) 100%)',
        'gradient-teal': 'linear-gradient(135deg, #00D9D9 0%, #14B8A6 100%)',
        'gradient-magenta': 'linear-gradient(135deg, #D81159 0%, #F43F5E 100%)',
        'gradient-energy': 'linear-gradient(135deg, #D81159 0%, #00D9D9 100%)',
        'gradient-forge': 'linear-gradient(135deg, #F4D03F 0%, #D81159 100%)',
        'gradient-dark': 'linear-gradient(to bottom, rgba(26, 31, 38, 0.5) 0%, rgba(5, 6, 8, 0.9) 100%)',
        'gradient-glass': 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 0%, transparent 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
