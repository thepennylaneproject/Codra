# Glass Panel Migration Guide

## Components to Update

The following components still use solid background colors and should be migrated to use the photonic glass effect:

### 1. Billing Components
- `/src/components/billing/CostTrendChart.tsx`
- `/src/components/billing/OptimizationPanel.tsx`
- `/src/components/billing/BudgetMeter.tsx`

### 2. AI Components
- `/src/components/ai/ModelRecommendation.tsx`
- `/src/components/ai/CostEstimator.tsx`

### 3. Deploy Components
- `/src/components/deploy/DeployHistory.tsx`

## Migration Pattern

### Before (Solid Background)
```tsx
<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
  {/* Content */}
</div>
```

### After (Photonic Glass)

#### Option 1: Using GlassPanel Component (Recommended)
```tsx
import { GlassPanel } from '@/components/ui/GlassPanel';

<GlassPanel className="p-4">
  {/* Content */}
</GlassPanel>
```

#### Option 2: Using GlassCard Component
```tsx
import { GlassCard } from '@/components/common/GlassCard';

<GlassCard className="p-4" variant="default">
  {/* Content */}
</GlassCard>
```

#### Option 3: Using CSS Classes Directly
```tsx
<div className="glass-photonic p-4 rounded-xl">
  {/* Content */}
</div>
```

## Step-by-Step Migration

### 1. Import the Glass Component
```tsx
import { GlassPanel } from '@/components/ui/GlassPanel';
// or
import { GlassCard } from '@/components/common/GlassCard';
```

### 2. Replace Background Classes

**Remove:**
- `bg-white`
- `dark:bg-gray-800`
- `bg-gray-800`
- `border-gray-200`
- `dark:border-gray-700`
- `shadow-sm`

**Keep:**
- Padding classes (`p-4`, `p-6`, etc.)
- Layout classes (`flex`, `grid`, etc.)
- Spacing classes (`mb-4`, `gap-2`, etc.)

### 3. Wrap Content
```tsx
<GlassPanel className="p-4">
  {/* Your existing content */}
</GlassPanel>
```

### 4. Adjust Text Colors (if needed)

If text becomes hard to read against the glass background:
- Use `text-stardust` for primary text
- Use `text-stardust-muted` for secondary text
- Use `text-stardust-dim` for tertiary text

## Example Migrations

### CostTrendChart.tsx

**Before:**
```tsx
<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
  <h3 className="text-lg font-semibold mb-4">Cost Trends</h3>
  {/* Chart content */}
</div>
```

**After:**
```tsx
import { GlassPanel } from '@/components/ui/GlassPanel';

<GlassPanel className="p-4">
  <h3 className="text-lg font-semibold mb-4 text-stardust">Cost Trends</h3>
  {/* Chart content */}
</GlassPanel>
```

### ModelRecommendation.tsx

**Before:**
```tsx
<div className={`p-4 rounded-lg border ${
  highlight 
    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
}`}>
  {/* Content */}
</div>
```

**After:**
```tsx
import { GlassCard } from '@/components/common/GlassCard';

<GlassCard 
  className="p-4" 
  activeBorder={highlight}
  hoverEffect
>
  {/* Content */}
</GlassCard>
```

## Testing Checklist

After migrating a component:

- [ ] Component renders without errors
- [ ] Glass effect is visible (frosted/blurred background)
- [ ] Text is readable against glass background
- [ ] Hover effects work (if applicable)
- [ ] Component works in all themes
- [ ] Background texture is visible through glass
- [ ] No layout shifts or spacing issues

## Tips

1. **Test in multiple themes** - Switch themes to ensure glass effect works well
2. **Check text contrast** - Ensure all text meets accessibility standards
3. **Preserve functionality** - Don't change component logic, only styling
4. **Batch similar components** - Migrate all billing components together
5. **Use design tokens** - Prefer CSS variables over hardcoded colors

## Available Glass Variants

### GlassCard Variants
- `default` - Standard glass effect
- `frosted` - Slightly more opaque
- `clear` - More transparent
- `ghost` - Transparent with no border

### GlassPanel
- Single variant with consistent styling
- Simpler API for basic panels

## When NOT to Use Glass

Some components should keep solid backgrounds:

- **Tooltips** - Need high contrast
- **Modals** - May need solid backdrop
- **Alerts/Notifications** - Need to stand out
- **Loading states** - Require clear visibility
- **High-density tables** - May impact readability

## Color Mapping

Old colors → New glass tokens:

| Old | New |
|-----|-----|
| `bg-gray-800` | `glass` |
| `border-gray-700` | `var(--glass-border)` |
| `bg-white dark:bg-gray-800` | `glass` |
| `text-gray-900 dark:text-white` | `text-stardust` |
| `text-gray-600 dark:text-gray-400` | `text-stardust-muted` |

## Performance Considerations

Glass effects use `backdrop-filter` which can impact performance:

- ✅ Fine for cards and panels (10-20 on screen)
- ⚠️ Be cautious with lists (100+ items)
- ❌ Avoid for repeated small elements (badges, chips)

For performance-critical components, consider:
- Using `glass-clear` variant (less intensive)
- Disabling glass effect on mobile
- Using solid backgrounds for list items

---

*This guide ensures consistent application of the photonic glass effect across all UI components.*
