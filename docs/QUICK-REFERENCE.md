# 4-Layer Architecture - Quick Reference

## Layer Structure

```
┌─────────────────────────────────────┐
│ Layer 4 (z-10) - UI Content        │ ← SCROLLABLE
│ • Glass panels                      │
│ • Main content                      │
│ • overflow-y: auto                  │
├─────────────────────────────────────┤
│ Layer 3 (z-2) - Cosmic Canvas      │ ← FIXED
│ • Particle effects                  │
│ • Ambient animations                │
├─────────────────────────────────────┤
│ Layer 2 (z-1) - Color Overlay      │ ← FIXED
│ • Theme tinting                     │
│ • mix-blend-mode: overlay           │
├─────────────────────────────────────┤
│ Layer 1 (z-0) - Background Texture │ ← FIXED
│ • Theme background image            │
│ • position: fixed                   │
└─────────────────────────────────────┘
```

## Essential CSS Variables

```css
/* Background & Overlay */
--theme-bg-image: url('/src/assets/backgrounds/texture_cyan_circuit.jpg');
--theme-overlay-color: rgba(0, 255, 255, 0.25);

/* Glass Effect */
--glass-bg: rgba(255, 255, 255, 0.03);
--glass-border: 1px solid rgba(255, 255, 255, 0.1);
--glass-blur: blur(16px);

/* Z-Index */
--z-layer-bg: 0;
--z-layer-overlay: 1;
--z-layer-canvas: 2;
--z-layer-content: 10;
```

## Component Usage

### React Components
```tsx
// Option 1: GlassPanel (recommended for sections)
import { GlassPanel } from '@/components/ui/GlassPanel';
<GlassPanel className="p-6">Content</GlassPanel>

// Option 2: GlassCard (recommended for cards)
import { GlassCard } from '@/components/common/GlassCard';
<GlassCard variant="default" hoverEffect>Content</GlassCard>
```

### CSS Classes
```tsx
// Direct usage
<div className="glass-photonic p-6 rounded-xl">Content</div>

// Or simpler
<div className="glass p-6 rounded-xl">Content</div>
```

## Theme Switching

```javascript
// Switch theme
document.documentElement.setAttribute('data-theme', 'cyber-cyan');

// Available themes:
// - 'cyber-cyan'
// - 'deep-space-purple'
// - 'midas-touch'
// - 'stealth-noir'
```

## Common Patterns

### Stat Card
```tsx
<GlassPanel className="p-5">
  <div className="flex items-center gap-3">
    <Icon className="w-6 h-6 text-energy-teal" />
    <h3 className="text-sm text-stardust-muted">Label</h3>
  </div>
  <div className="text-2xl font-bold text-stardust">Value</div>
</GlassPanel>
```

### Content Panel
```tsx
<GlassPanel className="p-6">
  <h2 className="text-xl font-semibold text-stardust mb-4">Title</h2>
  <p className="text-stardust-muted">Description...</p>
</GlassPanel>
```

### Interactive Card
```tsx
<GlassCard 
  className="p-4" 
  hoverEffect 
  activeBorder
  onClick={handleClick}
>
  Content
</GlassCard>
```

## Color Tokens

```css
/* Text Colors */
--stardust: #F8F9FA;           /* Primary text */
--stardust-muted: #9CA3AF;     /* Secondary text */
--stardust-dim: #6B7280;        /* Tertiary text */

/* Accent Colors */
--energy-teal: #00D9D9;         /* Primary accent */
--energy-cyan: #22D3EE;         /* Hover states */
--brand-gold: #D4AF37;          /* Brand constant */
```

## Tailwind Classes

```tsx
/* Text */
text-stardust          // Primary white text
text-stardust-muted    // Muted gray text
text-stardust-dim      // Dim gray text
text-energy-teal       // Teal accent
text-brand-gold        // Gold accent

/* Glass Effects */
glass                  // Base glass
glass-photonic         // Photonic glass
glass-frosted          // Frosted variant
glass-clear            // Clear variant
```

## Do's and Don'ts

### ✅ DO
- Use glass panels for all UI cards
- Keep brand gold (#D4AF37) constant
- Test in multiple themes
- Use CSS variables
- Apply backdrop-filter

### ❌ DON'T
- Use solid gray backgrounds (bg-gray-800)
- Override z-index layers
- Add overflow to nested elements
- Use hardcoded colors
- Forget Safari prefix (-webkit-backdrop-filter)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Background scrolls | Ensure layers 1-3 use `position: fixed` |
| No glass effect | Check backdrop-filter browser support |
| Text unreadable | Use `text-stardust` instead of dark colors |
| Layout breaks | Verify parent has proper height (h-full) |

## File Locations

```
src/
├── app/
│   ├── design-tokens.css      # CSS variables
│   └── globals.css            # Global styles
├── index.css                  # Theme presets & utilities
├── components/
│   ├── common/
│   │   ├── CosmicBackground.tsx  # 4-layer wrapper
│   │   └── GlassCard.tsx         # Glass card component
│   ├── ui/
│   │   └── GlassPanel.tsx        # Glass panel component
│   └── layout/
│       └── AppShell.tsx          # Main app shell
└── docs/
    ├── 4-LAYER-ARCHITECTURE.md     # Full documentation
    ├── IMPLEMENTATION-SUMMARY.md   # Implementation guide
    └── GLASS-PANEL-MIGRATION.md    # Migration guide
```

## Code Snippets

### Custom Glass Panel
```tsx
<div className="glass-photonic p-6 rounded-xl">
  <h3 className="text-lg font-semibold text-stardust mb-2">
    Custom Panel
  </h3>
  <p className="text-sm text-stardust-muted">
    Custom content with photonic glass effect
  </p>
</div>
```

### Custom Theme Variables
```css
:root {
  --custom-overlay: rgba(255, 100, 200, 0.2);
  --custom-bg: url('/path/to/image.jpg');
}
```

---

**Last Updated:** December 2025  
**Version:** 1.0.0
