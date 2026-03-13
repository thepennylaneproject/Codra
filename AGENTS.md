# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Codra is a single-product JAMstack application (React 18 + Vite frontend, Netlify serverless functions backend, Supabase database/auth). Package manager is **npm** (lockfile: `package-lock.json`).

### Dev server

- `npm run dev` starts Vite on port **4444**. The `predev` hook auto-generates design tokens via `tsx scripts/generate-css-tokens.ts && tsx scripts/generate-tailwind-config.ts`.
- Backend functions require Netlify Dev (`:8881`); Vite proxies `/.netlify/functions` and `/api` to it. For frontend-only work, `npm run dev` alone is sufficient.

### Lint / Test / Build

- See `package.json` `scripts` for all commands. Key ones:
  - **Lint:** `npm run lint` (ESLint on `src/`), `npm run lint:css` (Stylelint), `npm run lint:all` (both + design lint).
  - **Test:** `npx vitest run` (14 test files, Vitest). One pre-existing failure in `src/lib/flow/__tests__/executor.test.ts` ("should handle conditions").
  - **Typecheck:** `npx tsc --noEmit` (clean pass).
  - **Build:** `npm run build`.
- ESLint reports ~844 pre-existing problems (mostly design-system rules from `eslint-plugin-codra`). These are not regressions.

### Auth & external services

- The app requires Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) to authenticate users. Without them the frontend loads but login/signup cannot complete.
- Vite exposes `VITE_*` env vars via `import.meta.env`. Make sure these are set as shell environment variables before running `npm run dev` — Vite reads them at startup.
- If signup/login silently resets the form, check the browser console for `ERR_NAME_NOT_RESOLVED` or `Failed to fetch`. This means the Supabase project URL is unreachable (wrong URL, deleted project, or network issue).
- AI features require at least one provider API key (e.g. `OPENAI_API_KEY`, `AIMLAPI_API_KEY`).
- Full env var list: see `.env.example` and the Netlify function source files under `netlify/functions/`.

### Custom ESLint plugin

- `eslint-plugin-codra` lives in `/workspace/eslint-plugin-codra` and is linked via `"file:eslint-plugin-codra"` in `package.json`. `npm install` handles this automatically.
