/**
 * CODRA DESIGN TOKENS
 * Centralized design system tokens for visual consistency
 */

// === COLORS ===
export const colors = {
    // Brand
    brand: {
        gold: '#FF4D4D',
        goldLight: 'rgba(255, 77, 77, 0.1)',
        goldMedium: 'rgba(255, 77, 77, 0.2)',
    },

    // Ivory & Ink (Primary palette)
    ivory: {
        base: '#FFFAF0',
        warm: '#FFF8E7',
    },
    ink: {
        base: '#1A1A1A',
        light: '#5A5A5A',
        muted: '#8A8A8A',
    },

    // Semantic
    success: {
        bg: 'bg-emerald-50 dark:bg-emerald-950',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        solid: 'bg-emerald-500',
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-950',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        solid: 'bg-red-500',
    },
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-950',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        solid: 'bg-amber-500',
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-950',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        solid: 'bg-blue-500',
    },
} as const;

// === TYPOGRAPHY ===
export const typography = {
    // Font families
    fonts: {
        sans: 'font-sans',
        mono: 'font-mono',
        display: 'font-sans font-black',
    },

    // Text sizes (consistent scale)
    sizes: {
        '2xs': 'text-[9px]',
        xs: 'text-[10px]',
        sm: 'text-[11px]',
        base: 'text-sm',        // 14px
        md: 'text-base',        // 16px
        lg: 'text-lg',          // 18px
        xl: 'text-xl',          // 20px
        '2xl': 'text-2xl',      // 24px
        '3xl': 'text-3xl',      // 30px
        '4xl': 'text-4xl',      // 36px
        '5xl': 'text-5xl',      // 48px
    },

    // Tracking
    tracking: {
        tight: 'tracking-tight',
        normal: 'tracking-normal',
        wide: 'tracking-wide',
        wider: 'tracking-wider',
        widest: 'tracking-widest',
        editorial: 'tracking-[0.2em]',
    },

    // Common text styles
    styles: {
        label: 'text-[10px] font-black uppercase tracking-widest',
        caption: 'text-[10px] font-mono uppercase tracking-widest text-zinc-400',
        body: 'text-sm leading-relaxed',
        heading: 'font-black tracking-tight',
    },
} as const;

// === SPACING ===
export const spacing = {
    section: 'py-16',
    card: 'p-6',
    tight: 'p-4',
    relaxed: 'p-8',
} as const;

// === BORDERS & SHADOWS ===
export const borders = {
    soft: 'border border-[#1A1A1A]/5',
    medium: 'border border-[#1A1A1A]/10',
    strong: 'border border-[#1A1A1A]/20',
    accent: 'border border-[#FF4D4D]',
    accentSoft: 'border border-[#FF4D4D]/20',
} as const;

export const shadows = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    brand: 'shadow-xl shadow-[#FF4D4D]/10',
} as const;

// === RADII ===
export const radii = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
} as const;

// === TRANSITIONS ===
export const transitions = {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-300',
    slow: 'transition-all duration-500',
} as const;
