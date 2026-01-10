# Asset Pipeline Refinements Changelog

## Version 1.1 - Production Hardening (2026-01-10)

### 1. Core vs Extended Field Split

**What Changed:**
- Formalized field classification into three tiers:
  - `CORE_REQUIRED_FIELDS`: Critical for resolution & promotion (7 fields)
  - `CORE_VECTOR_FIELDS`: Required for vectors (1 field: complexity)
  - `EXTENDED_RECOMMENDED_FIELDS`: Enhance ranking but not promotion blockers (10 fields)

**Why:**
- Prevents "asset stuck in draft" due to missing optional fields
- Clear promotion rules: missing core = error, missing extended = warning
- Assets can be approved with warnings (extended fields missing)

**Impact:**
- Faster time-to-approval for simple assets
- Clearer validation error messages
- Extended fields (tone, usage_notes) no longer block promotion

**Files Modified:**
- `src/pipeline/validation/lifecycle.ts`

---

### 2. Weight Versioning

**What Changed:**
- Created versioned weight constants:
  - `RASTER_RANKING_WEIGHTS_V1` (energy: 30%, palette: 30%, aspect: 20%, resolution: 20%)
  - `VECTOR_RANKING_WEIGHTS_V1` (role: 40%, palette: 30%, complexity: 30%)
- Added `weights_version` to RankingScore interface
- Replaced magic numbers with named constants

**Why:**
- Preserves historical determinism if weights change
- Audit trail for ranking behavior over time
- Easy rollback if new weights underperform

**Impact:**
- Same ranking behavior as before (weights unchanged)
- Future-proof for weight adjustments
- Better explainability in debugging

**Files Modified:**
- `src/pipeline/resolver/ranking.ts`

**How to Change Weights in Future:**
1. Create `RASTER_RANKING_WEIGHTS_V2` with new values
2. Update `CURRENT_RASTER_WEIGHTS = V2`
3. Increment `enrichment_version` for re-enrichment
4. Keep V1 constant for historical analysis

---

### 3. AI Short-Circuit Optimization

**What Changed:**
- Added `canDeriveAllCoreFields()` check before AI call
- New `deriveWithoutAI()` method for rule-based enrichment
- Short-circuit triggers when:
  - All core fields can be derived from file metadata + preset
  - Asset is vector (never needs AI)
  - Asset already enriched

**Why:**
- **20-30% cost reduction** for simple assets
- Vectors, icons, simple textures rarely benefit from AI
- Preset metadata + file properties often sufficient

**Impact:**
- Cost savings: ~$0.00035 saved per short-circuited asset
- Faster enrichment (no network latency)
- Same determinism guarantees

**Example Savings:**
- 1,000 assets, 30% short-circuit rate = $0.10 saved
- 10,000 assets = $1.00 saved
- Scales linearly with asset count

**Files Modified:**
- `src/pipeline/enrichment/engine.ts`

**Short-Circuit Triggers:**
- Vector assets (SVG format)
- Already enriched (has tone + palette_primary)
- Simple rasters with preset metadata (role + funnel_stage set)

**Derivation Logic:**
- Energy: from tags ('minimal' → low, 'vibrant' → high, default → medium)
- Palette mode: from transparency or tags (has_alpha → neutral, tags → dark/light, default → neutral)
- Tone: defaults to 'professional'
- Palette primary: defaults to '#1A5FB4'

---

## Migration Guide

### For Existing Installations:

**No Breaking Changes.** All refinements are backward compatible.

1. **Core vs Extended Split:**
   - Existing assets: No action needed
   - New assets: Can be approved with only core fields complete
   - Validation: Extended field warnings won't block promotion

2. **Weight Versioning:**
   - Existing rankings: Identical behavior (weights unchanged)
   - Resolution results: Same as before
   - New field: `weights_version` added to debug output

3. **AI Short-Circuit:**
   - Existing cache: Still used (idempotency preserved)
   - New enrichments: May skip AI if eligible
   - Cost impact: Immediate reduction (no re-enrichment needed)

### Testing After Upgrade:

```bash
# 1. Validate existing assets
npm run pipeline:validate

# 2. Enrich new assets (observe short-circuit logs)
npm run pipeline:enrich -- --limit 10

# 3. Test resolution (weights unchanged)
npm run pipeline:index
```

Expected logs:
```
[EnrichmentEngine] Short-circuit: deriving without AI (icon-001)
[EnrichmentEngine] Analyzing with AI: hero-complex-001
[EnrichmentEngine] Deriving without AI: texture-simple-002
```

---

## Performance Impact

### Before Refinements:
- 1,000 raster assets = $0.35 AI cost
- All assets require AI call
- Extended field missing = promotion blocked

### After Refinements:
- 1,000 raster assets = ~$0.25 AI cost (30% short-circuit)
- Simple assets skip AI
- Extended fields = warnings only

### Cost Breakdown:
| Asset Type | Before | After | Savings |
|------------|--------|-------|---------|
| Hero (complex) | $0.00035 | $0.00035 | $0 |
| Texture (simple) | $0.00035 | $0 | $0.00035 |
| Icon (vector) | $0 | $0 | $0 |
| Logo (vector) | $0 | $0 | $0 |

**Realistic Mix** (40% simple rasters, 30% complex rasters, 30% vectors):
- Before: $0.245 per 1,000 assets
- After: $0.105 per 1,000 assets
- **Savings: 57%** 🎉

---

## Future Enhancements (Not Implemented)

### Considered But Deferred:

1. **Slot Materialization Scoping**
   - Skip for now (premature optimization)
   - Add when usage patterns emerge

2. **Confidence Scoring**
   - Track AI vs rule-based derivation confidence
   - Add when quality metrics available

3. **Adaptive Weight Learning**
   - Use click-through data to tune weights
   - Requires production usage data

---

## Questions?

See updated docs:
- Main pipeline: `docs/ASSET_PIPELINE.md`
- Quick start: `docs/ASSET_PIPELINE_QUICKSTART.md`
- This changelog: `docs/PIPELINE_REFINEMENTS.md`
