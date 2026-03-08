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

## Development

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:4444` via Vite (proxied through Netlify Dev on `:8881` for full function support).

## License

All rights reserved. © The Penny Lane Project.
