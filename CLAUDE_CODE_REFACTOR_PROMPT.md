# RELEVNT DESIGN SYSTEM REFACTOR
## Complete Claude Code Implementation Prompt

---

## CONTEXT

You are refactoring the Relevnt frontend application to implement a cohesive design system. Relevnt is an AI-powered career platform with the tagline: **"Authentic intelligence for real people navigating broken systems."**

The app currently has visual inconsistencies across pages (different color schemes, inconsistent component styles, mismatched typography). Your job is to unify everything under a single design system.

---

## DESIGN PHILOSOPHY

### Visual Identity: "Field Notes for the Job Hunt"
- Hand-drawn, imperfect aesthetic
- Warm ivory paper background (#F8F4ED)
- Graphite pencil line work
- Champagne gold accent (#C7A56A) - **SACRED, never changes in dark mode**
- Dark mode: Same warmth, just midnight lighting (charcoal #11100E, not pure black)

### Brand Voice
- "Be clear. Be kind. Be accountable."
- Write like talking to a smart friend
- Avoid: leverage, synergy, ecosystem, optimize, KPI
- Empty states motivate, never scold
- Errors explain and reassure, never blame

---

## FILES TO CREATE/UPDATE

### 1. Design Tokens (CREATE: `src/styles/design-tokens.css`)

```css
/* Import the full design-tokens.css file provided */
/* This becomes the single source of truth for all visual decisions */
```

Key tokens to enforce:
- `--color-bg: #F8F4ED` (ivory paper)
- `--color-ink: #1A1A1A` (soft black text)
- `--color-accent: #C7A56A` (champagne gold - NEVER CHANGE)
- `--color-graphite: #333333` (line work)
- Font stack: Fraunces (display), Source Sans 3 (body)

### 2. Tailwind Config (UPDATE: `tailwind.config.ts`)

Merge the provided config. Key additions:
- Custom color palette mapping to CSS variables
- Font families: `font-display`, `font-body`, `font-mono`
- Custom animations: `dust-float`, `fade-in-up`
- Shadow utilities: `shadow-glow`

### 3. Global Styles (UPDATE: `src/index.css` or `src/styles/globals.css`)

```css
@import './design-tokens.css';

/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Source+Sans+3:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

/* Apply base styles */
html {
  font-family: var(--font-body);
  background-color: var(--color-bg);
  color: var(--color-ink);
}
```

### 4. Components to Create

#### `src/components/ui/Icon.tsx`
Use the provided Icon component. It renders 15 hand-drawn style icons using currentColor (theme-aware) with a separate gold accent dot.

#### `src/components/ui/EmptyState.tsx`
Use the provided EmptyState component. Maps empty state types to motivational copy and appropriate icons.

#### `src/components/ui/Button.tsx`
Create button variants:
- `primary`: Gold background, dark text
- `secondary`: Outlined, graphite border
- `ghost`: Transparent, text only

#### `src/components/ui/Input.tsx`
Single input component with:
- Ivory background in light mode
- Charcoal background in dark mode
- Gold focus ring
- Error state with warm red (#B85C5C)

#### `src/components/ui/Card.tsx`
Card component with:
- Surface background
- Subtle border
- Hover shadow elevation

### 5. Copy/i18n (CREATE: `src/lib/copy.ts`)

Use the provided copy.ts file. All UI text should be pulled from this centralized file.

---

## PAGE-BY-PAGE REFACTOR INSTRUCTIONS

### Dashboard (`src/pages/Dashboard.tsx`)
- [ ] Apply `bg-bg` (ivory) background
- [ ] Use `font-display` for page title
- [ ] Replace any blue/purple colors with accent gold
- [ ] Add hero illustration slot with gold-dust effect
- [ ] Pull copy from `copy.dashboard`

### Jobs Page (`src/pages/Jobs.tsx`)
- [ ] Unify filter inputs to use new Input component
- [ ] Replace any blue buttons with gold primary buttons
- [ ] Job cards use Card component with consistent styling
- [ ] Match score badges use `badge--accent` class
- [ ] Empty state uses EmptyState component with type="jobs"
- [ ] Error states use warm messaging from `copy.errors`

### Applications Page (`src/pages/Applications.tsx`)
- [ ] Status tabs use consistent button styling (not varied colors)
- [ ] Replace "No applications yet" with EmptyState component
- [ ] Status badges use semantic colors from tokens (success/warning/error)
- [ ] Pull copy from `copy.applications`

### Resume Builder (`src/pages/ResumeBuilder.tsx`) - **CRITICAL FIX**
- [ ] **REMOVE ALL BLUE** - This page has navy/blue inputs that break consistency
- [ ] Replace blue inputs with standard Input component (ivory bg, graphite border)
- [ ] Section headers use `font-display`
- [ ] "Rewrite Professional" button uses `btn--primary` (gold)
- [ ] Pull copy from `copy.resumes`

### Voice Profile (`src/pages/VoiceProfile.tsx`)
- [ ] Style selection cards use Card component
- [ ] Selected state uses gold accent border, not varied colors
- [ ] Sliders use gold for filled portion
- [ ] Pull copy from `copy.voice`

### Settings/Preferences (`src/pages/Settings.tsx`)
- [ ] Form inputs use Input component
- [ ] Checkboxes/toggles use gold accent when checked
- [ ] Section dividers use `border-graphite-faint`
- [ ] Danger zone (delete account) uses subtle error styling, not alarming red
- [ ] Pull copy from `copy.settings`

### Learn Page (`src/pages/Learn.tsx`)
- [ ] Use EmptyState component with type="learn"
- [ ] Prepare layout for future content cards

---

## SIDEBAR NAVIGATION REFACTOR

Current: Using icon library icons with inconsistent active states

### Changes:
1. Replace icon library with custom Icon component
2. Map pages to icons:
   - Dashboard → `compass`
   - Jobs → `briefcase`
   - Applications → `paper-airplane`
   - CVs/Resumes → `scroll`
   - Learn → `book`
   - Voice → `microphone`
   - Settings → `pocket-watch`

3. Active state styling:
```css
.nav-item--active {
  color: var(--color-accent);
  background-color: var(--color-accent-glow);
}
```

4. Update sidebar background to `bg-bg-alt` (slightly darker ivory)

---

## DARK MODE IMPLEMENTATION

### Toggle Mechanism
Add theme toggle to settings and header. Store preference in localStorage.

```typescript
// src/hooks/useTheme.ts
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [theme]);
  
  return { theme, setTheme };
}
```

### Critical Dark Mode Rules
1. **Gold accent NEVER changes** - `#C7A56A` in both modes
2. Background: `#11100E` (warm charcoal, NOT pure black)
3. Text: `#F8F4ED` (ivory becomes the ink)
4. Lines/borders: `#E8E2D7` (chalk-like)

---

## ERROR STATE REFACTOR

Replace all error messages with brand voice copy.

### Before:
```tsx
<div className="text-red-500">match_jobs failed: 404 Not Found</div>
```

### After:
```tsx
<Alert variant="error">
  <Icon name="compass-cracked" size="sm" />
  <span>{copy.errors.generic}</span>
  <Button variant="ghost" onClick={retry}>{copy.errors.tryAgain}</Button>
</Alert>
```

---

## LOADING STATES

Replace spinners with themed loading states:

```tsx
<div className="flex flex-col items-center gap-4 py-12">
  <Icon name="candle" size="lg" className="text-graphite-light animate-pulse-soft" />
  <p className="text-ink-secondary">{copy.transparency.loading}</p>
</div>
```

---

## FILE STRUCTURE AFTER REFACTOR

```
src/
├── components/
│   ├── ui/
│   │   ├── Icon.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Alert.tsx
│   │   ├── EmptyState.tsx
│   │   └── index.ts (barrel export)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PageLayout.tsx
│   └── ...
├── styles/
│   ├── design-tokens.css
│   └── globals.css
├── lib/
│   ├── copy.ts
│   └── ...
├── hooks/
│   ├── useTheme.ts
│   └── ...
└── ...
```

---

## VALIDATION CHECKLIST

After refactoring each page, verify:

- [ ] No blue/purple colors visible
- [ ] All text uses `font-body` or `font-display` appropriately
- [ ] Background is ivory (#F8F4ED) in light mode
- [ ] Gold accent (#C7A56A) used for primary actions and highlights
- [ ] Focus states show gold ring
- [ ] Empty states use EmptyState component with appropriate type
- [ ] Error messages use brand voice from copy.ts
- [ ] Dark mode maintains warmth (charcoal, not black)
- [ ] Gold remains unchanged in dark mode
- [ ] Inputs have consistent styling across all pages
- [ ] Cards have consistent border radius and shadow

---

## IMPLEMENTATION ORDER

1. **Foundation** (do first)
   - [ ] Create `design-tokens.css`
   - [ ] Update `tailwind.config.ts`
   - [ ] Update global styles
   - [ ] Import fonts

2. **Core Components**
   - [ ] Create Icon component
   - [ ] Create Button component
   - [ ] Create Input component
   - [ ] Create Card component
   - [ ] Create EmptyState component
   - [ ] Create Alert component

3. **Layout**
   - [ ] Refactor Sidebar with new icons
   - [ ] Update Header styling
   - [ ] Create PageLayout wrapper

4. **Pages** (fix most broken first)
   - [ ] Resume Builder (critical - blue problem)
   - [ ] Jobs page
   - [ ] Applications page
   - [ ] Settings page
   - [ ] Voice Profile page
   - [ ] Dashboard
   - [ ] Learn page

5. **Polish**
   - [ ] Dark mode toggle
   - [ ] Loading states
   - [ ] Error states
   - [ ] Animation refinements

---

## REFERENCE FILES

The following files contain the complete implementation details:

1. `design-tokens.css` - All color, spacing, typography tokens
2. `tailwind.config.ts` - Tailwind extension with custom theme
3. `components/Icon.tsx` - Complete icon component with 15 icons
4. `components/EmptyState.tsx` - Empty state component with brand copy
5. `lib/copy.ts` - All UI text centralized

---

## FINAL NOTE

The goal is not just visual consistency — it's emotional resonance. Every pixel should feel like it was made by someone who understands how exhausting job searching is and wants to make it less painful.

When in doubt, ask: "Would a frustrated job seeker find this helpful or patronizing?"

**Voice mantra: Be clear. Be kind. Be accountable.**
