# Asset Pipeline System

**Production-ready asset ingestion, enrichment, and resolution pipeline**

---

## 📁 Directory Structure

```
src/pipeline/
├── types/
│   ├── metadata.ts          # Asset taxonomy & structured metadata schema
│   └── slot.ts              # Slot descriptor types & resolution contracts
├── config/
│   ├── cloudinary.ts        # Cloudinary client & configuration
│   └── taxonomy.ts          # Folder structure, presets, AI prompts
├── enrichment/
│   ├── engine.ts            # Main enrichment orchestrator
│   ├── ai-enricher.ts       # AI analysis with rate limiting
│   ├── cache.ts             # Content hash cache (idempotency)
│   └── rules.ts             # Deterministic mapping rules
├── resolver/
│   ├── index.ts             # Main resolver (deterministic asset selection)
│   └── ranking.ts           # Ranking algorithms for raster & vector
├── registry/
│   ├── index-generator.ts   # Registry JSON generator from Cloudinary
│   └── slot-materializer.ts # Slot key pre-computation
└── validation/
    └── lifecycle.ts         # Validation gates & promotion logic
```

---

## 🚀 Quick Start

### 1. Setup Cloudinary
```bash
npm run pipeline:setup
```

### 2. Enrich Assets
```bash
npm run pipeline:enrich
```

### 3. Validate Assets
```bash
npm run pipeline:validate
```

### 4. Generate Registry
```bash
npm run pipeline:index
```

---

## 📖 Core Concepts

### Cloudinary as System of Record
- All metadata stored in Cloudinary structured metadata
- Local JSON files are **read-only caches**
- Single source of truth for asset inventory

### Deterministic Resolution
- Same slot descriptor → same asset (always)
- No runtime AI calls
- Explicit ranking with stable tie-breakers

### Cost Controls
- Idempotency via content hash
- Single AI call per unique image
- Rate limiting & exponential backoff
- Cheap-first cascade (derive from file metadata)

### Lifecycle Management
- `draft` → `approved` → `deprecated`
- Validation gates before promotion
- Resolvers ignore draft & deprecated

---

## 🔧 Key Components

### EnrichmentEngine
Orchestrates AI-assisted enrichment with:
- Content hash caching
- Rate limiting (requests/minute)
- Concurrency control
- Deterministic rule mapping

**Usage:**
```typescript
import { EnrichmentEngine } from './enrichment/engine';

const engine = new EnrichmentEngine({
  aiEnricherOptions: {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    maxConcurrency: 3,
    maxRequestsPerMinute: 10,
  },
  skipIfEnriched: true,
});

await engine.initialize();
const results = await engine.enrichAssets(inputs);
await engine.finalize();
```

### AssetResolver
Deterministic asset selection:
- Filter by lifecycle & role
- Rank by energy, palette, aspect, resolution
- Return best match with confidence score

**Usage:**
```typescript
import { AssetResolver } from './resolver';

const resolver = new AssetResolver(assets);

const result = resolver.resolve({
  asset_role: 'hero',
  energy: 'high',
  palette_mode: 'light',
  aspect_ratio: 'landscape',
});

if (result.success) {
  console.log(result.asset!.cloudinary_url);
}
```

### RegistryIndexGenerator
Exports Cloudinary assets to JSON:
- Fetches structured metadata
- Filters by lifecycle status
- Sorts deterministically

**Usage:**
```typescript
import { generateRegistryIndex } from './registry/index-generator';

const result = await generateRegistryIndex({
  folder: 'codra',
  outputPath: './out/asset-registry.json',
  includeDeprecated: false,
});
```

---

## 📝 Type Definitions

### AssetMetadata
Complete asset metadata with all taxonomy fields.

```typescript
interface AssetMetadata {
  // Core fields
  public_id: string;
  cloudinary_url: string;
  asset_class: 'raster' | 'vector';
  asset_role: 'hero' | 'icon' | 'texture' | ...;
  lifecycle_status: 'draft' | 'approved' | 'deprecated';
  energy: 'low' | 'medium' | 'high';
  palette_mode: 'light' | 'dark' | 'neutral';

  // Vector-specific
  vector_type?: 'stroke' | 'filled' | 'mixed';
  complexity?: 'low' | 'medium' | 'high';
  is_themable?: boolean;
  is_invertible?: boolean;

  // System fields
  enrichment_version: number;
  enriched_at?: string;
  content_hash?: string;
}
```

### SlotDescriptor
Template request contract.

```typescript
interface SlotDescriptor {
  asset_role: AssetRole;
  role_variant?: string;
  energy?: Energy;
  palette_mode?: PaletteMode;
  aspect_ratio?: 'square' | 'landscape' | 'portrait' | 'panorama';
  resolution?: {
    min_width?: number;
    min_height?: number;
  };
}
```

---

## 🛠️ Configuration

### Upload Presets
Defined in `config/taxonomy.ts`:
- `preset_raster_hero` → `codra/raster/hero`
- `preset_raster_texture` → `codra/raster/texture`
- `preset_vector_icon` → `codra/vector/icon`
- `preset_vector_illustration` → `codra/vector/illustration`

### Structured Metadata Schema
Defined in `types/metadata.ts`:
- 30+ structured metadata fields
- Cloudinary-compatible definitions
- Validation rules

---

## 🧪 Testing

### Test Resolver
```typescript
import { AssetResolver } from './resolver';
import registry from './test-fixtures/registry.json';

const resolver = new AssetResolver(registry.assets);

test('resolves hero with high energy', () => {
  const result = resolver.resolve({
    asset_role: 'hero',
    energy: 'high',
  });

  expect(result.success).toBe(true);
  expect(result.confidence).toBe('exact');
});
```

### Test Enrichment Rules
```typescript
import { deriveEnergy, derivePaletteMode } from './enrichment/rules';

test('derives high energy from gradient tags', () => {
  const energy = deriveEnergy({
    tags: ['gradient-heavy', '3d', 'glow'],
    has_gradient: true,
    has_3d: true,
  });

  expect(energy).toBe('high');
});
```

---

## 📚 Documentation

- **Full Pipeline Docs:** [`/docs/ASSET_PIPELINE.md`](../../docs/ASSET_PIPELINE.md)
- **Quick Start:** [`/docs/ASSET_PIPELINE_QUICKSTART.md`](../../docs/ASSET_PIPELINE_QUICKSTART.md)

---

## 🔐 Security

- Never commit `.env.local` (contains API keys)
- Use structured metadata (not context) for taxonomy
- Validate inputs before writing to Cloudinary
- Sanitize SVGs in vector upload presets

---

## 🚦 Production Checklist

- [ ] Cloudinary structured metadata fields created
- [ ] Upload presets configured
- [ ] All assets enriched (no drafts pending)
- [ ] Validation passing (0 errors)
- [ ] Registry generated and deployed
- [ ] Slot materializer run for performance
- [ ] Cache directory configured and writable
- [ ] Monitoring in place (AI API costs, cache hit rate)

---

## 🤝 Contributing

When extending the pipeline:
1. Update type definitions first
2. Add validation rules
3. Update enrichment logic if needed
4. Test with real Cloudinary assets
5. Update documentation

---

## 📄 License

Part of Codra project. Internal use only.

---

**Built with TypeScript, Cloudinary, and Anthropic Claude**
