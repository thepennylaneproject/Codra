# Cloudinary Upload Presets Configuration

This guide shows how to create the required upload presets in Cloudinary.

---

## Overview

Upload presets enforce metadata constraints at ingestion time ("lock at the door"). They ensure that assets are properly classified from the moment they're uploaded.

---

## Required Presets

### Raster Presets

#### 1. `preset_raster_hero`

**Settings:**
- **Name:** `preset_raster_hero`
- **Folder:** `codra/raster/hero`
- **Mode:** Signed (unsigned: false)
- **Allowed formats:** jpg, jpeg, png, webp
- **Transformation:** `f_auto,q_auto`

**Structured Metadata:**
```json
{
  "asset_class": "raster",
  "asset_role": "hero",
  "lifecycle_status": "draft",
  "funnel_stage": "awareness"
}
```

**Tags:** `raster`, `hero`, `auto-uploaded`

---

#### 2. `preset_raster_texture`

**Settings:**
- **Name:** `preset_raster_texture`
- **Folder:** `codra/raster/texture`
- **Mode:** Signed
- **Allowed formats:** jpg, jpeg, png, webp
- **Transformation:** `f_auto,q_auto`

**Structured Metadata:**
```json
{
  "asset_class": "raster",
  "asset_role": "texture",
  "lifecycle_status": "draft",
  "funnel_stage": "conversion"
}
```

**Tags:** `raster`, `texture`, `auto-uploaded`

---

#### 3. `preset_raster_background`

**Settings:**
- **Name:** `preset_raster_background`
- **Folder:** `codra/raster/background`
- **Mode:** Signed
- **Allowed formats:** jpg, jpeg, png, webp
- **Transformation:** `f_auto,q_auto`

**Structured Metadata:**
```json
{
  "asset_class": "raster",
  "asset_role": "feature_card",
  "lifecycle_status": "draft",
  "funnel_stage": "consideration"
}
```

**Tags:** `raster`, `background`, `auto-uploaded`

---

### Vector Presets

#### 4. `preset_vector_icon`

**Settings:**
- **Name:** `preset_vector_icon`
- **Folder:** `codra/vector/icon`
- **Mode:** Signed
- **Allowed formats:** svg
- **Transformation:** None (preserve SVG)

**Structured Metadata:**
```json
{
  "asset_class": "vector",
  "asset_role": "icon",
  "lifecycle_status": "draft",
  "funnel_stage": "conversion",
  "complexity": "low"
}
```

**Tags:** `vector`, `icon`, `auto-uploaded`

**Important:** Enable SVG sanitization, preserve viewBox

---

#### 5. `preset_vector_illustration`

**Settings:**
- **Name:** `preset_vector_illustration`
- **Folder:** `codra/vector/illustration`
- **Mode:** Signed
- **Allowed formats:** svg
- **Transformation:** None

**Structured Metadata:**
```json
{
  "asset_class": "vector",
  "asset_role": "spot_illustration",
  "lifecycle_status": "draft",
  "funnel_stage": "consideration",
  "complexity": "medium"
}
```

**Tags:** `vector`, `illustration`, `auto-uploaded`

---

#### 6. `preset_vector_logo`

**Settings:**
- **Name:** `preset_vector_logo`
- **Folder:** `codra/vector/mark`
- **Mode:** Signed
- **Allowed formats:** svg
- **Transformation:** None

**Structured Metadata:**
```json
{
  "asset_class": "vector",
  "asset_role": "logo",
  "lifecycle_status": "draft",
  "funnel_stage": "awareness",
  "complexity": "low"
}
```

**Tags:** `vector`, `logo`, `auto-uploaded`

---

## Creating Presets via Cloudinary UI

### Step 1: Navigate to Settings
1. Go to Cloudinary Dashboard
2. Click **Settings** (gear icon)
3. Select **Upload** tab
4. Scroll to **Upload presets**

### Step 2: Add Preset
1. Click **Add upload preset**
2. Fill in preset name (e.g., `preset_raster_hero`)
3. Set **Signing mode** to **Signed**
4. Set **Folder** (e.g., `codra/raster/hero`)

### Step 3: Configure Transformations
1. Under **Incoming transformations**:
   - For rasters: Add `f_auto,q_auto`
   - For vectors: Leave empty

### Step 4: Add Tags
1. Under **Tags**:
   - Add `raster` or `vector`
   - Add role tag (e.g., `hero`, `icon`)
   - Add `auto-uploaded`

### Step 5: Set Metadata
1. Under **Metadata**:
   - Click **Add metadata field**
   - Select structured metadata fields
   - Set default values

### Step 6: Save
1. Click **Save**
2. Repeat for all presets

---

## Creating Presets via API

Use the Cloudinary Admin API to create presets programmatically:

```typescript
import { v2 as cloudinary } from 'cloudinary';

await cloudinary.api.create_upload_preset({
  name: 'preset_raster_hero',
  unsigned: false,
  folder: 'codra/raster/hero',
  tags: ['raster', 'hero', 'auto-uploaded'],
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: 'f_auto,q_auto',
  metadata: {
    asset_class: 'raster',
    asset_role: 'hero',
    lifecycle_status: 'draft',
    funnel_stage: 'awareness',
  },
});
```

**Note:** Structured metadata fields must exist before setting defaults.

---

## Verifying Presets

Test upload with preset:

```bash
curl -X POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload \
  -F "file=@/path/to/image.jpg" \
  -F "upload_preset=preset_raster_hero" \
  -F "api_key={api_key}" \
  -F "timestamp={timestamp}" \
  -F "signature={signature}"
```

Or use Cloudinary SDK:

```typescript
await cloudinary.uploader.upload('image.jpg', {
  upload_preset: 'preset_raster_hero',
});
```

---

## Best Practices

✅ **DO:**
- Use signed presets (require authentication)
- Set `lifecycle_status: "draft"` by default
- Add descriptive tags
- Restrict allowed formats
- Test each preset after creation

❌ **DON'T:**
- Use unsigned presets for production
- Set `lifecycle_status: "approved"` on upload
- Mix rasters and vectors in same folder
- Allow unrestricted formats

---

## Troubleshooting

### "Metadata field not found"
- Run `tsx scripts/pipeline/setup-cloudinary.ts` first
- Verify field exists in Cloudinary settings

### "Upload failed: invalid preset"
- Check preset name matches exactly
- Verify preset is signed (not unsigned)
- Check API credentials

### "Wrong folder"
- Verify preset folder matches taxonomy
- Check for typos in folder path

---

## Next Steps

After creating presets:
1. Upload test assets using each preset
2. Run `npm run pipeline:enrich`
3. Verify metadata in Cloudinary Media Library

---

**Presets are your first line of defense for data quality!**
