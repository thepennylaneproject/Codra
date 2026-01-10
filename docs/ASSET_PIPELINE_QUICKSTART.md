# Asset Pipeline Quick Start

Get up and running with the asset pipeline in 5 minutes.

---

## Prerequisites

- Cloudinary account with API credentials
- Anthropic API key (for AI enrichment)
- Node.js 18+ with TypeScript

---

## Step 1: Configure Environment

Create `.env.local`:

```bash
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Or use connection string
# CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Anthropic (for enrichment)
ANTHROPIC_API_KEY=your_anthropic_key
```

---

## Step 2: Initialize Cloudinary

Create structured metadata fields:

```bash
tsx scripts/pipeline/setup-cloudinary.ts
```

**Expected output:**
```
✓ Created successfully: asset_class
✓ Created successfully: asset_role
...
✓ Setup complete!
```

---

## Step 3: Upload Assets

### Option A: Via Cloudinary UI

1. Go to Media Library
2. Upload with preset `preset_raster_hero` or `preset_vector_icon`
3. Assets are tagged as `draft` automatically

### Option B: Programmatically

```typescript
import { v2 as cloudinary } from 'cloudinary';

await cloudinary.uploader.upload('path/to/image.jpg', {
  upload_preset: 'preset_raster_hero',
  folder: 'codra/raster/hero',
});
```

---

## Step 4: Enrich Assets

Run AI enrichment on uploaded assets:

```bash
tsx scripts/pipeline/enrich-assets.ts --folder codra --concurrency 3
```

**What happens:**
- Fetches draft raster assets from Cloudinary
- Analyzes each with Claude 3 Haiku
- Derives energy, palette_mode deterministically
- Writes metadata back to Cloudinary
- Caches results for future runs

**Example output:**
```
[Enrichment] Processing assets...

✓ hero-001.jpg (12 tags)
✓ hero-002.jpg (15 tags)
⊙ hero-003.jpg (cached)

Summary:
  Enriched (AI): 2
  Cached: 1
  Duration: 45.3s
```

---

## Step 5: Validate & Promote

Check which assets are ready for approval:

```bash
tsx scripts/pipeline/validate-assets.ts --report
```

**Output:**
```
Validation Summary:
  Total assets: 10
  Valid: 10
  Can promote: 8

Draft Assets: 8
  Ready for approval: 8
  Pending enrichment: 0
```

**Promote manually** in Cloudinary UI:
1. Select asset
2. Edit metadata
3. Change `lifecycle_status` from `draft` to `approved`

---

## Step 6: Generate Registry

Export asset registry as JSON:

```bash
tsx scripts/pipeline/generate-index.ts --materialize-slots
```

**Output:**
- `./out/asset-registry.json` (full registry)
- `./out/asset-registry-slots.json` (slot mappings)

---

## Step 7: Use Resolver

Integrate into your application:

```typescript
import { AssetResolver } from './src/pipeline/resolver';
import { loadRegistryFromFile } from './src/pipeline/registry/index-generator';

// Load once at startup
const { assets } = await loadRegistryFromFile('./out/asset-registry.json');
const resolver = new AssetResolver(assets);

// Resolve in template
const result = resolver.resolve({
  asset_role: 'hero',
  energy: 'high',
  palette_mode: 'light',
});

if (result.success) {
  console.log(`Selected: ${result.asset!.public_id}`);
  console.log(`Reason: ${result.reason}`);
  console.log(`URL: ${result.asset!.cloudinary_url}`);
}
```

---

## Complete Example Workflow

```bash
# 1. Setup (once)
tsx scripts/pipeline/setup-cloudinary.ts

# 2. Upload assets (via UI or programmatically)
# ...

# 3. Enrich all new assets
tsx scripts/pipeline/enrich-assets.ts --skip-enriched

# 4. Validate
tsx scripts/pipeline/validate-assets.ts

# 5. Promote to approved (manually in Cloudinary UI)
# ...

# 6. Generate registry
tsx scripts/pipeline/generate-index.ts --materialize-slots

# 7. Deploy registry JSON with your app
```

---

## NPM Scripts (Optional)

Add to `package.json`:

```json
{
  "scripts": {
    "pipeline:setup": "tsx scripts/pipeline/setup-cloudinary.ts",
    "pipeline:enrich": "tsx scripts/pipeline/enrich-assets.ts",
    "pipeline:index": "tsx scripts/pipeline/generate-index.ts --materialize-slots",
    "pipeline:validate": "tsx scripts/pipeline/validate-assets.ts --report"
  }
}
```

Usage:
```bash
npm run pipeline:setup
npm run pipeline:enrich
npm run pipeline:validate
npm run pipeline:index
```

---

## Troubleshooting

### "Missing Cloudinary credentials"
- Check `.env.local` exists and has correct values
- Try using `CLOUDINARY_URL` connection string format

### "ANTHROPIC_API_KEY not found"
- Add to `.env.local`
- Get key from: https://console.anthropic.com/

### "No assets found"
- Verify folder path: `--folder codra`
- Check assets uploaded with correct preset

---

## Next Steps

- Read full documentation: [`docs/ASSET_PIPELINE.md`](./ASSET_PIPELINE.md)
- Customize taxonomy: [`src/pipeline/config/taxonomy.ts`](../src/pipeline/config/taxonomy.ts)
- Adjust enrichment rules: [`src/pipeline/enrichment/rules.ts`](../src/pipeline/enrichment/rules.ts)
- Extend resolver ranking: [`src/pipeline/resolver/ranking.ts`](../src/pipeline/resolver/ranking.ts)

---

**Happy asset managing! 🎨**
