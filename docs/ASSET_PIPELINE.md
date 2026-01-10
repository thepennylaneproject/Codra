# Asset Ingestion, Enrichment, and Resolution Pipeline

**Version:** 1.0
**Status:** Production-Ready
**Last Updated:** 2026-01-10

---

## Executive Summary

This is a **deterministic, AI-assisted asset management system** using Cloudinary as the System of Record. It implements a complete pipeline for:

- **Ingesting** assets with structured metadata
- **Enriching** them via AI analysis and deterministic rules
- **Resolving** them via template-based slot descriptors
- **Validating** lifecycle gates before promotion

> **Core Principle:** "Ingest locally, enrich globally, resolve deterministically."

---

## Table of Contents

1. [Architecture](#architecture)
2. [Asset Taxonomy](#asset-taxonomy)
3. [Folder Structure & Upload Presets](#folder-structure--upload-presets)
4. [Enrichment Engine](#enrichment-engine)
5. [Deterministic Resolver](#deterministic-resolver)
6. [Lifecycle Management](#lifecycle-management)
7. [CLI Tools](#cli-tools)
8. [Cost Controls](#cost-controls)
9. [Deployment](#deployment)

---

## Architecture

### System Components

```
┌────────────────┐
│   Cloudinary   │  ← System of Record (source of truth)
│ (Structured    │
│  Metadata)     │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Enrichment    │  ← AI + Rules (one-time per asset)
│    Engine      │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Asset         │  ← Read-only cache (JSON)
│  Registry      │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Resolver      │  ← Deterministic asset selection
└────────────────┘
```

### Data Flow

1. **Upload:** Assets uploaded to Cloudinary with upload presets → metadata locked at the door
2. **Enrich:** AI analyzes images → deterministic rules derive energy/palette → write back to Cloudinary
3. **Validate:** Check completeness → promote `draft` → `approved`
4. **Generate:** Export registry JSON (read-only cache)
5. **Resolve:** Templates request assets via slot descriptors → resolver returns best match

---

## Asset Taxonomy

### Core Metadata Fields (ALL Assets)

| Field              | Type     | Required | Description                              |
| ------------------ | -------- | -------- | ---------------------------------------- |
| `asset_class`      | enum     | ✓        | `raster` \| `vector` (immutable)         |
| `asset_role`       | enum     | ✓        | `hero`, `icon`, `texture`, etc.          |
| `role_variant`     | string   |          | e.g., `hero_marketing`, `icon_nav`       |
| `placement`        | set      |          | Where used: `homepage`, `pricing`, etc.  |
| `funnel_stage`     | enum     | ✓        | `awareness`, `consideration`, etc.       |
| `lifecycle_status` | enum     | ✓        | `draft`, `approved`, `deprecated`        |
| `energy`           | enum     |          | `low`, `medium`, `high` (deterministic)  |
| `palette_mode`     | enum     |          | `light`, `dark`, `neutral`               |
| `tone`             | string   |          | e.g., `professional`, `bold`, `calm`     |
| `palette_primary`  | string   |          | Hex color (e.g., `#1A5FB4`)              |
| `usage_notes`      | string   |          | Brief description of ideal use cases     |

### Vector-Only Extensions

| Field            | Type    | Required (Vectors) | Description                          |
| ---------------- | ------- | ------------------ | ------------------------------------ |
| `vector_type`    | enum    |                    | `stroke`, `filled`, `mixed`          |
| `complexity`     | enum    |                    | `low`, `medium`, `high`              |
| `is_themable`    | boolean |                    | Can adapt to color themes            |
| `is_invertible`  | boolean |                    | Works in dark mode                   |

### System Fields

| Field                 | Type    | Description                          |
| --------------------- | ------- | ------------------------------------ |
| `enrichment_version`  | integer | Schema version (forward compat)      |
| `enriched_at`         | date    | ISO timestamp                        |
| `content_hash`        | string  | SHA-256 hash (for cache deduplication) |

---

## Folder Structure & Upload Presets

### Canonical Folder Topology

```
codra/
  raster/
    hero/
    background/
    texture/
    photography/
  vector/
    icon/
    illustration/
    ui/
    pattern/
    mark/
```

> **Rule:** Vectors and rasters NEVER co-exist in the same folder.

### Upload Presets

Upload presets enforce metadata at ingestion time ("lock at the door").

| Preset Name                 | Folder                  | Enforced Metadata                                              |
| --------------------------- | ----------------------- | -------------------------------------------------------------- |
| `preset_raster_hero`        | `codra/raster/hero`     | `asset_class=raster`, `asset_role=hero`, `lifecycle_status=draft` |
| `preset_raster_texture`     | `codra/raster/texture`  | `asset_class=raster`, `asset_role=texture`                       |
| `preset_vector_icon`        | `codra/vector/icon`     | `asset_class=vector`, `asset_role=icon`, `complexity=low`        |
| `preset_vector_illustration`| `codra/vector/illustration` | `asset_class=vector`, `asset_role=spot_illustration`           |

#### Raster Presets Include:
- `f_auto,q_auto` (automatic format/quality)
- sRGB color space
- Minimum resolution checks

#### Vector Presets Include:
- SVG sanitization (strip scripts)
- Preserve viewBox
- Prevent auto-rasterization

---

## Enrichment Engine

### How It Works

1. **Fetch** asset metadata from Cloudinary
2. **Derive** cheap metadata (aspect ratio, transparency) — no AI
3. **Check cache** by content hash (idempotency)
4. **Analyze** with AI (single call per unique image)
5. **Map** AI output → structured metadata via deterministic rules
6. **Write back** to Cloudinary structured metadata
7. **Cache** result for future runs

### Cost Controls (MANDATORY)

| Control                   | Implementation                                  |
| ------------------------- | ----------------------------------------------- |
| **Idempotency**           | Skip if `enrichment_version >= 1`              |
| **Content Hash Cache**    | SHA-256 hash → reuse results for duplicate images |
| **Single-Call Policy**    | One AI request per asset (no chained calls)    |
| **Cheap-First Cascade**   | Derive aspect/transparency from file metadata  |
| **Rate Limiting**         | Max requests/minute (default: 10)              |
| **Concurrency Control**   | Max parallel AI calls (default: 3)             |
| **Exponential Backoff**   | Retry on 429 with 2s, 4s, 8s, 16s delays       |

### Deterministic Mapping Rules

#### Energy Derivation

```typescript
// High energy indicators
if (tags.includes('gradient-heavy') || tags.includes('3d') || tags.includes('glow')) {
  energy = 'high';
}

// Low energy indicators
if (tags.includes('minimal') || tags.includes('line-art') || tags.includes('spacious')) {
  energy = 'low';
}

// Default
energy = 'medium';
```

#### Palette Mode Derivation

```typescript
// Brightness-based
if (primaryColorBrightness > 180) paletteMode = 'light';
else if (primaryColorBrightness < 80) paletteMode = 'dark';
else paletteMode = 'neutral';
```

> **Critical:** Energy and palette are **never recomputed** at runtime. They are persisted during enrichment.

---

## Deterministic Resolver

### Slot Descriptor (Template Contract)

Templates request assets via slot descriptors:

```typescript
{
  asset_role: 'hero',
  role_variant?: 'marketing',
  energy?: 'high',
  palette_mode?: 'light',
  aspect_ratio?: 'landscape',
  resolution?: { min_width: 1920 }
}
```

### Resolution Algorithm

#### 1. Filter Candidates
- `lifecycle_status = 'approved'` (MANDATORY)
- Match `asset_role` and optional `role_variant`
- Match `placement`, `tone`, `tags` (if specified)

#### 2. Rank Candidates

**Raster Ranking** (strict order):
1. **Energy match** (100 points exact, 50 close, 0 mismatch)
2. **Palette mode match** (100 points exact, 60 neutral, 0 mismatch)
3. **Aspect ratio match** (0-100 based on distance from ideal)
4. **Resolution match** (0-100 based on meeting constraints)
5. **Crop penalty** (deduct for >20% crop required)
6. **Lexical tie-breaker** (sort by `public_id` for determinism)

**Vector Ranking**:
1. **Role-specific scoring** (icons prefer low complexity + themable)
2. **Palette mode** (less critical, invertible vectors score high)
3. **Complexity preference** (simpler is better)

#### 3. Return Best Match

```typescript
{
  success: true,
  asset: { public_id, cloudinary_url, metadata },
  reason: "Selected from 12 approved hero assets; exact energy match (high); ...",
  confidence: 'exact' | 'close' | 'fallback' | 'none',
  matched_criteria: ['asset_role: hero', 'energy: high', ...],
  unmet_criteria: ['aspect_ratio: excessive crop (35%)'],
  candidates_considered: 12
}
```

### Slot Materialization (Cache)

Pre-compute common slot patterns:

```typescript
{
  "hero:marketing:high:light": "codra/raster/hero/hero-marketing-001",
  "icon:nav:low:dark": "codra/vector/icon/icon-nav-arrow",
  ...
}
```

**Benefits:**
- O(1) lookup for common patterns
- Rebuild nightly or on asset changes
- Reduces resolver compute overhead

---

## Lifecycle Management

### Lifecycle States

```
draft → approved → deprecated
  ↑        ↓
  └────────┘ (can return to draft for edits)
```

### Validation Gates

An asset may be promoted to `approved` ONLY if:

✅ All required core metadata fields present
✅ `enrichment_version >= 1`
✅ Energy and palette_mode set (deterministic)
✅ Vector-specific fields present (if applicable)

### Promotion Process

1. **Validate** asset metadata
2. **Check** eligibility (`canPromoteToApproved`)
3. **Update** `lifecycle_status = 'approved'` in Cloudinary
4. **Regenerate** registry index

### Resolver Behavior

- **Draft:** Ignored by resolver
- **Approved:** Available for resolution
- **Deprecated:** Completely excluded

---

## CLI Tools

### 1. Setup Cloudinary

Create structured metadata fields in Cloudinary.

```bash
tsx scripts/pipeline/setup-cloudinary.ts
```

**Run once** to initialize the taxonomy.

---

### 2. Enrich Assets

Run AI enrichment on draft assets.

```bash
tsx scripts/pipeline/enrich-assets.ts [options]

Options:
  --folder <folder>      Cloudinary folder (default: codra)
  --limit <n>            Process only N assets
  --concurrency <n>      AI API concurrency (default: 3)
  --rpm <n>              Requests per minute (default: 10)
  --skip-enriched        Skip already enriched assets (default: true)
  --dry-run              Preview without executing
```

**Example:**
```bash
# Enrich all draft raster assets
tsx scripts/pipeline/enrich-assets.ts --folder codra/raster --concurrency 3 --rpm 10
```

---

### 3. Generate Registry Index

Export registry JSON from Cloudinary (read-only cache).

```bash
tsx scripts/pipeline/generate-index.ts [options]

Options:
  --folder <folder>           Cloudinary folder (default: codra)
  --output <path>             Output file (default: ./out/asset-registry.json)
  --max <n>                   Max assets (default: 500)
  --include-deprecated        Include deprecated assets
  --materialize-slots         Generate slot mappings
```

**Example:**
```bash
# Generate registry + slot mappings
tsx scripts/pipeline/generate-index.ts --materialize-slots
```

**Output:**
- `./out/asset-registry.json` (full registry)
- `./out/asset-registry-slots.json` (slot mappings)

---

### 4. Validate Assets

Check asset metadata completeness and report issues.

```bash
tsx scripts/pipeline/validate-assets.ts [options]

Options:
  --input <path>    Input registry (default: ./out/asset-registry.json)
  --report          Generate detailed validation report
```

**Example:**
```bash
tsx scripts/pipeline/validate-assets.ts --report
```

**Output:**
- Console summary
- `./out/asset-registry-validation-report.json` (if --report)

---

## Cost Controls

### AI API Cost Estimation

**Claude 3 Haiku** (recommended model):
- Input: ~1,000 tokens/image (base64 encoding)
- Output: ~200 tokens/response
- **Total:** ~1,200 tokens/image

**Pricing** (as of 2026):
- Haiku: $0.25 / 1M input tokens, $1.25 / 1M output tokens
- **Cost per image:** ~$0.00035 (< $0.001)

**For 1,000 images:**
- AI cost: ~$0.35
- Cloudinary API calls: Free (within limits)

### Cache Efficiency

With content hash caching:
- **Duplicate images:** 0 AI calls
- **Already enriched:** 0 AI calls
- **Only new/changed images:** 1 AI call each

**Example:**
- Upload 100 images
- 20 are duplicates → 80 AI calls
- Re-run enrichment → 0 AI calls (all cached)

---

## Deployment

### 1. Development Setup

```bash
# Install dependencies
npm install

# Setup Cloudinary structured metadata
tsx scripts/pipeline/setup-cloudinary.ts

# Enrich assets
tsx scripts/pipeline/enrich-assets.ts --limit 10

# Generate registry
tsx scripts/pipeline/generate-index.ts

# Validate
tsx scripts/pipeline/validate-assets.ts --report
```

### 2. Production Workflow

```bash
# Nightly cron job: Regenerate registry
0 2 * * * tsx scripts/pipeline/generate-index.ts --materialize-slots

# On asset upload: Trigger enrichment
# (webhook from Cloudinary → enrichment job)

# CI/CD: Validate before deploy
tsx scripts/pipeline/validate-assets.ts
```

### 3. Application Integration

```typescript
import { AssetResolver } from './src/pipeline/resolver';
import { loadRegistryFromFile } from './src/pipeline/registry/index-generator';

// Load registry once at startup
const { assets } = await loadRegistryFromFile('./out/asset-registry.json');
const resolver = new AssetResolver(assets);

// Resolve asset in template
const result = resolver.resolve({
  asset_role: 'hero',
  energy: 'high',
  palette_mode: 'light',
  aspect_ratio: 'landscape',
});

if (result.success) {
  const imageUrl = result.asset!.cloudinary_url;
  // Use imageUrl in template
}
```

---

## Best Practices

### DO:
✅ Use upload presets to lock metadata at ingestion
✅ Run enrichment incrementally (`--skip-enriched`)
✅ Regenerate registry nightly
✅ Validate before promoting to approved
✅ Use slot materialization for common patterns

### DON'T:
❌ Skip validation gates
❌ Manually edit structured metadata (use CLI tools)
❌ Compute energy/palette at runtime (use persisted values)
❌ Mix rasters and vectors in the same folder
❌ Promote draft assets without enrichment

---

## Troubleshooting

### "No approved assets found"
- Check `lifecycle_status` in Cloudinary
- Run validation: `tsx scripts/pipeline/validate-assets.ts`
- Promote eligible drafts manually in Cloudinary UI

### "Enrichment failed: rate limit"
- Reduce `--concurrency` and `--rpm`
- Check Anthropic API rate limits
- Enable cache to skip already-enriched assets

### "Excessive crop penalty"
- Upload additional asset variants with different aspect ratios
- Or relax `aspect_ratio` constraint in slot descriptor

---

## Maintenance

### Weekly:
- Review validation reports
- Check cache hit rate
- Monitor AI API costs

### Monthly:
- Audit deprecated assets (archive or delete)
- Review unmet slot patterns (upload missing assets)
- Prune stale cache entries

### Quarterly:
- Update enrichment rules (bump `enrichment_version`)
- Re-enrich all assets with new rules
- Review taxonomy (add new roles/variants if needed)

---

## Support

For issues or questions:
- Check validation reports first
- Review logs from CLI tools
- Inspect Cloudinary structured metadata directly

---

**End of Documentation**
