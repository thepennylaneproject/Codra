# Smart Defaults System

## Overview

The Smart Defaults System replaces 23+ onboarding questions with sensible defaults that are correct 80% of the time. Users who want control can find it in Settings after their first Spread.

## Design Philosophy

1. **If we can guess correctly 80% of the time, guessing is better than asking**
2. **Defaults are not hidden** - they're visible in Settings as "current values"
3. **Power users can override per-project**
4. **The system learns from user behavior over time** (future enhancement)

## Architecture

### Component Structure

```
src/
├── domain/
│   └── smart-defaults-types.ts        # TypeScript interfaces and types
├── lib/
│   └── smart-defaults/
│       ├── inference-engine.ts        # Static inference engine (stub)
│       ├── hooks/
│       │   ├── useAccountSettings.ts  # Account-level settings
│       │   ├── useProjectSettings.ts  # Project-level overrides
│       │   └── useEffectiveSettings.ts # Merged settings view
│       └── index.ts
└── features/
    └── settings/
        ├── SettingsPage.tsx           # Main settings view
        ├── SettingRow.tsx             # Read-only value with Change button
        ├── SettingEditor.tsx          # Modal editor
        ├── ProjectSettingsOverride.tsx # Project override panel
        ├── ProjectSettingsIndicator.tsx # Override indicator
        └── index.ts
```

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│  Account Settings (Global Defaults)                 │
│  - Stored in localStorage                           │
│  - Managed by useAccountSettings                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Project Settings (Optional Overrides)              │
│  - Stored per-project ID                            │
│  - Managed by useProjectSettings                    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  Effective Settings (Merged View)                   │
│  - Computed by useEffectiveSettings                 │
│  - Project overrides take precedence                │
└─────────────────────────────────────────────────────┘
```

## Default Values

| Setting | Default | Inference Source (Future) |
|---------|---------|---------------------------|
| AI Quality Priority | Balanced | Task type, deadline language |
| Data Sensitivity | Internal | Project name, file contents |
| Daily Budget | $50 | Account tier, historical spend |
| Spending Strategy | Smart Balance | N/A (always default) |
| Autonomy Level | Apply with Approval | N/A (safety default) |
| Max Steps Before Pause | 10 | Task complexity |
| Risk Tolerance | 3/5 | Project type |
| Visual Direction | Modern, Professional | Project type, industry |
| Theme | System (dark) | OS preference |
| Default Desk | Write | Last used, project type |

## Usage

### Reading Account Settings

```typescript
import { useAccountSettings } from '@/lib/smart-defaults';

function MyComponent() {
  const { settings, updateAISettings } = useAccountSettings();

  // Access settings
  console.log(settings.ai.qualityPriority); // 'balanced'
  console.log(settings.budget.dailyLimit);   // 50

  // Update settings
  updateAISettings({ qualityPriority: 'quality' });
}
```

### Reading Effective Settings (with Project Overrides)

```typescript
import { useEffectiveSettings } from '@/lib/smart-defaults';

function ProjectComponent({ projectId }) {
  const settings = useEffectiveSettings(projectId);

  // These are merged account + project settings
  console.log(settings.ai.qualityPriority);
  console.log(settings.hasOverrides);      // true if project has overrides
  console.log(settings.overrideCount);     // number of overrides
}
```

### Setting Project Overrides

```typescript
import { useProjectSettings } from '@/lib/smart-defaults';

function ProjectSettings({ projectId }) {
  const { updateProjectSettings, clearProjectSettings } = useProjectSettings();

  // Override a specific setting
  updateProjectSettings(projectId, {
    qualityPriority: 'quality',
    dailyBudget: 100,
  });

  // Clear all overrides
  clearProjectSettings(projectId);
}
```

### Using the Settings UI

```typescript
import { SettingsPage } from '@/features/settings';
import { ProjectSettingsOverride } from '@/features/settings';
import { ProjectSettingsIndicator } from '@/features/settings';

// Main settings page (account defaults)
<Route path="/settings" element={<SettingsPage />} />

// Project override button (add to project header)
<ProjectSettingsOverride projectId={projectId} projectName={projectName} />

// Override indicator (shows in project header)
<ProjectSettingsIndicator projectId={projectId} />
```

## Inference Engine

The inference engine is currently a static implementation that returns sensible defaults. In the future, it will be replaced with an ML-based system that learns from user behavior.

```typescript
import { inferenceEngine } from '@/lib/smart-defaults';

const context = {
  projectName: 'My Startup Landing Page',
  projectType: 'marketing-site',
  industry: 'tech',
};

const quality = inferenceEngine.inferQualityPriority(context);
const budget = inferenceEngine.inferDailyBudget(context);
const desk = inferenceEngine.inferDefaultDesk(context);
```

### Future Enhancements

1. **Behavior Tracking**: Track user preferences and choices
2. **ML Model**: Train model on user behavior patterns
3. **Context-Aware Defaults**: Adjust defaults based on:
   - Time of day
   - Project complexity
   - Historical success rates
   - User expertise level
4. **A/B Testing**: Test different default strategies

## Settings Page UI

The Settings page follows a "review and override" pattern:

```
┌─────────────────────────────────────────────────────┐
│  Settings                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  AI Behavior                                        │
│  ──────────────────────────────────────────────     │
│  Quality Priority     Balanced              [Change]│
│  Autonomy Level       Apply with Approval   [Change]│
│  Max Steps            10                    [Change]│
│                                                     │
│  Budget                                             │
│  ──────────────────────────────────────────────     │
│  Daily Limit          $50                   [Change]│
│  Strategy             Smart Balance         [Change]│
│                                                     │
│  [Reset All to Defaults]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Key UI principles:
- **Values shown as read-only text** by default
- **"Change" button** opens inline editor or modal
- **No accent color** in Settings (neutral zone)
- **Override indicator** shows when project has custom settings

## Project Overrides

Projects can override account defaults on a per-setting basis:

```typescript
interface ProjectSettings {
  qualityPriority?: 'quality' | 'balanced' | 'fast' | 'cheap';
  autonomyLevel?: 'full-auto' | 'apply-with-approval' | 'always-ask';
  dailyBudget?: number;
  dataSensitivity?: 'public' | 'internal' | 'confidential' | 'regulated';
  maxSteps?: number;
  riskTolerance?: number; // 1-5
}
```

Override indicator in project header:
```
Project: Campaign Q1  [Using custom settings]
```

## Migration Guide

### From Old Onboarding Flow

If you're migrating from the old onboarding system:

1. **Install the new settings system**:
   ```typescript
   import { useAccountSettings } from '@/lib/smart-defaults';
   ```

2. **Initialize with smart defaults**:
   - New users automatically get `SMART_DEFAULTS`
   - Existing users' settings are preserved

3. **Update onboarding**:
   - Remove 23+ question forms
   - Show defaults in Settings after first Spread
   - Let users override per-project as needed

### From Old Settings Store

The old `useSettingsStore` is still available for backward compatibility:

```typescript
// Old (deprecated)
import { useSettingsStore } from '@/lib/store/useSettingsStore';

// New (recommended)
import { useAccountSettings } from '@/lib/smart-defaults';
```

## Testing

### Unit Tests

```typescript
import { useAccountSettings } from '@/lib/smart-defaults';
import { SMART_DEFAULTS } from '@/domain/smart-defaults-types';

test('should initialize with smart defaults', () => {
  const { settings } = useAccountSettings();
  expect(settings).toEqual(SMART_DEFAULTS);
});

test('should update AI settings', () => {
  const { updateAISettings, settings } = useAccountSettings();
  updateAISettings({ qualityPriority: 'quality' });
  expect(settings.ai.qualityPriority).toBe('quality');
});
```

### Integration Tests

```typescript
test('project overrides should take precedence', () => {
  const { updateProjectSettings } = useProjectSettings();
  updateProjectSettings('project-1', { qualityPriority: 'quality' });

  const settings = useEffectiveSettings('project-1');
  expect(settings.ai.qualityPriority).toBe('quality');
  expect(settings.hasOverrides).toBe(true);
});
```

## Acceptance Criteria

✅ New users see no configuration before first Spread
✅ All defaults are visible in Settings
✅ Changing a setting immediately updates behavior
✅ Projects can override account settings
✅ Override indicator visible in project header
✅ "Reset to Defaults" restores all values
✅ No accent color in Settings UI

## What This Does NOT Cover

- Inference engine ML implementation
- User behavior tracking for learning
- Account tier differences
- Per-task setting overrides (future)
- Settings export/import (future)

## API Reference

See [API.md](./API.md) for complete API documentation.

## Support

For issues or questions:
- GitHub Issues: https://github.com/thepennylaneproject/Codra/issues
- Documentation: https://docs.codra.io/smart-defaults
