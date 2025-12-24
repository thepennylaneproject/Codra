# Codra 4-Layer Z-Axis Architecture

## Overview

This document describes the implementation of the strict 4-layer Z-axis stack for the Codra dashboard, enabling a fixed background texture, theme-able color overlay, and glassmorphism effects on all UI content cards.

## Architecture Layers

### Layer 1: Fixed Background Texture (z-0)
- **CSS Variable**: `--theme-bg-image`
- **Position**: `fixed inset-0`
- **Purpose**: Provides the base texture that remains static during scroll
- **Properties**:
  - `background-image: var(--theme-bg-image)`
  - `background-size: cover`
  - `background-position: center`
  - `pointer-events: none`

### Layer 2: Theme Color Overlay (z-1)
- **CSS Variable**: `--theme-overlay-color`
- **Position**: `fixed inset-0`
- **Purpose**: Applies theme-specific color tinting
- **Properties**:
  - `background-color: var(--theme-overlay-color)`
  - `mix-blend-mode: overlay`
  - `pointer-events: none`

### Layer 3: Cosmic Wake Canvas (z-2)
- **Position**: `fixed inset-0`
- **Purpose**: Interactive particle system and ambient effects
- **Components**: CosmicWakeCanvas, ambient dust particles
- **Properties**:
  - `pointer-events: none` (for ambient effects)
  - `pointer-events: auto` (for interactive particles)

### Layer 4: UI Content Layer (z-10)
- **Position**: `relative`
- **Purpose**: Main scrollable application content
- **Properties**:
  - `overflow-y: auto`
  - All UI cards use glassmorphism effect
  - Content scrolls while layers 1-3 remain fixed

## CSS Variables

### Core Variables (design-tokens.css)

```css
:root {
  /* Brand Anchor - MUST remain gold */
  --brand-accent: #D4AF37;

  /* Theme Variables (Default: Cyber Cyan) */
  --theme-bg-image: url('/src/assets/backgrounds/texture_cyan_circuit.jpg');
  --theme-overlay-color: rgba(0, 255, 255, 0.25);
  
  /* Glassmorphism Variables - Photonic Glass */
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: 1px solid rgba(255, 255, 255, 0.1);
  --glass-blur: blur(16px);
  
  /* Z-Index Layers (Fixed) */
  --z-layer-bg: 0;
  --z-layer-overlay: 1;
  --z-layer-canvas: 2;
  --z-layer-content: 10;
}
```

## Photonic Glass Styling

### CSS Classes

#### `.glass` (Base Glass Panel)
```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.02);
}
```

#### `.glass-photonic` (Design Tokens)
```css
.glass-photonic {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-xl);
}
```

### React Components

#### GlassCard Component
```tsx
import { GlassCard } from '@/components/common/GlassCard';

<GlassCard className="p-6">
  {/* Content */}
</GlassCard>
```

#### GlassPanel Component
```tsx
import { GlassPanel } from '@/components/ui/GlassPanel';

<GlassPanel className="p-6">
  {/* Content */}
</GlassPanel>
```

## Implementation Files

### Modified Files
1. **`src/app/design-tokens.css`**
   - Added 4-layer architecture CSS variables
   - Added glassmorphism variables
   - Updated `.glass-photonic` class

2. **`src/index.css`**
   - Updated `.glass`, `.glass-frosted`, `.glass-clear` classes
   - All glass variants now use standardized variables

3. **`src/components/common/CosmicBackground.tsx`**
   - Refactored to strict 4-layer architecture
   - Wrapped all layers in `.codra-app-wrapper` container
   - Fixed layers 1-3 with proper z-index
   - Made layer 4 scrollable with `overflow-y: auto`

### Component Structure
```tsx
<div className="codra-app-wrapper">
  {/* Layer 1: Background */}
  <div style={{ backgroundImage: 'var(--theme-bg-image)', zIndex: 0 }} />
  
  {/* Layer 2: Overlay */}
  <div style={{ backgroundColor: 'var(--theme-overlay-color)', zIndex: 1 }} />
  
  {/* Layer 3: Canvas */}
  <div style={{ zIndex: 2 }}>
    <CosmicWakeCanvas />
  </div>
  
  {/* Layer 4: Content */}
  <div style={{ zIndex: 10 }}>
    {children}
  </div>
</div>
```

## Theme Configuration

### Available Themes
Themes are defined in `index.css` using data attributes:

1. **Cyber Cyan** (`data-theme="cyber-cyan"`)
   - Background: `texture_cyan_circuit.jpg`
   - Overlay: `rgba(0, 255, 255, 0.15)`

2. **Deep Space Purple** (`data-theme="deep-space-purple"`)
   - Background: `texture_deep_space.jpg`
   - Overlay: `rgba(88, 28, 135, 0.2)`

3. **Midas Touch** (`data-theme="midas-touch"`)
   - Background: `texture_midas_wave.jpg`
   - Overlay: `rgba(180, 130, 50, 0.12)`

4. **Stealth Noir** (`data-theme="stealth-noir"`)
   - Background: `texture_stealth_noir.jpg`
   - Overlay: `rgba(40, 40, 45, 0.15)`

### Switching Themes
Themes can be switched by changing the `data-theme` attribute on the root element:

```javascript
document.documentElement.setAttribute('data-theme', 'deep-space-purple');
```

## Verification Checklist

- [x] Background texture is fixed and covers entire viewport
- [x] Background does not scroll with content
- [x] Color overlay applies with mix-blend-mode
- [x] Particle canvas layer is properly positioned
- [x] UI content scrolls independently
- [x] Glass panels use photonic glass effect
- [x] Backdrop blur works across browsers (webkit-backdrop-filter)
- [x] CSS variables are properly defined
- [x] Z-index layers are strictly enforced

## Browser Compatibility

The implementation includes:
- Standard `backdrop-filter` for modern browsers
- `-webkit-backdrop-filter` for Safari support
- Fallback background colors for browsers without backdrop-filter support

## Best Practices

1. **Always use CSS variables** for theme properties
2. **Apply glass classes** to all UI cards and panels
3. **Test scrolling behavior** to ensure layers 1-3 remain fixed
4. **Maintain z-index hierarchy** - never override layer z-indices
5. **Use GlassCard or GlassPanel components** for consistent styling
6. **Keep brand gold accent** (#D4AF37) constant across themes

## Troubleshooting

### Background scrolls with content
- Ensure layers 1-3 use `position: fixed`
- Check that `.codra-app-wrapper` is the outermost container

### Glass effect not visible
- Verify `--glass-bg` and `--glass-blur` variables are defined
- Check that backdrop-filter is supported in the browser
- Ensure there's content behind the glass panel to blur

### Theme not applying
- Check `data-theme` attribute is set correctly
- Verify theme CSS variables are defined in `index.css`
- Ensure background images exist at specified paths
