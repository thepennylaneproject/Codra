# Codra — AI-powered creative workflow tool

> Part of <a href="https://thepennylaneproject.org">The Penny Lane Project</a> — technology that serves the individual.

## What This Is

Codra is an AI workflow tool that helps creatives and teams produce structured content — briefs, copy, design direction — by routing tasks through multiple AI providers with intelligent fallback and cost tracking. It is built for individuals and small teams who want AI assistance without being locked into a single provider.

## Current Status

**Alpha** — Core AI completion and project management flows work end-to-end. The workspace shell, multi-provider routing (OpenAI, Gemini, DeepSeek, Mistral, Cohere, HuggingFace, AIMLAPI), and Stripe billing integration are actively in use. Asset pipeline and coherence scan features are in active development.

## Technical Overview

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS with a custom design token system
- **Backend:** Netlify serverless functions (TypeScript, esbuild bundled)
- **Database:** Supabase (PostgreSQL + Auth)
- **AI:** Multi-provider router — AIMLAPI, OpenAI, Gemini, DeepSeek, Mistral, Cohere, HuggingFace
- **Asset Pipeline:** Cloudinary for media storage and transformation
- **Deployment:** Netlify (frontend + functions)

## Architecture

JAMstack: a Vite/React SPA served from Netlify CDN, with all data operations handled by Netlify serverless functions backed by Supabase. AI requests are routed through a provider-agnostic `AIRouter` that handles fallback, cost tracking, and per-user telemetry. The UI uses a 4-layer design token system (CSS variables → generated Tailwind config → component tokens → overrides) for strict visual consistency.

## Live Demo

<!-- Add your Netlify deployment URL here once deployed -->
**Deployment URL:** *(coming soon — see [deployment docs](docs/PHASE1_DEPLOYMENT.md) for setup)*

## Development

### Prerequisites

Copy `.env.example` to `.env.local` and fill in the required values before starting the dev server. At minimum, you need:

```bash
cp .env.example .env.local
# Edit .env.local — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at minimum
```

### Running locally

```bash
npm install
npm run dev          # Vite frontend on http://localhost:4444
```

For full backend function support (AI, billing, auth), use Netlify Dev:

```bash
npm install -g netlify-cli
netlify dev          # Proxied on http://localhost:8881
```

### Environment Variables

All required environment variables are documented in `.env.example` with placeholder values and source links. The app **will not boot** without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. AI and billing features require their respective provider keys.

See also:
- [Deployment Guide](docs/PHASE1_DEPLOYMENT.md)
- [Supabase Migration Notes](docs/SUPABASE_MIGRATIONS.md)

## License

Copyright © 2026 The Penny Lane Project. All rights reserved. See [LICENSE](LICENSE) for details.
