# Assets in Templates

This document explains how templates declare image needs and how the Template Runner resolves them deterministically via ImagePolicy.

## Overview

Templates can declare **image slots** that specify what images they need. The runner resolves these slots before calling `template.run()`, ensuring:

1. **No hardcoded URLs**: Templates never contain direct Cloudinary URLs
2. **Deterministic resolution**: ImagePolicy governs all image decisions
3. **Full observability**: Receipts capture every selection/generation decision

---

## Defining Image Slots

Add `imageSlots` to your template definition:

```typescript
const productShowcaseTemplate: TemplateDefinition = {
  templateId: "product-showcase",
  name: "Product Showcase",
  version: "1.0.0",
  imageSlots: [
    {
      slotId: "hero",
      purpose: "hero",
      required: true,
      onFail: "fail-template",
      mode: "prefer-canonical",
      selection: {
        maxAssets: 1,
        sizeClass: "hero",
        purpose: "hero",
        aspect: "landscape",
      },
      generation: {
        enabled: false,
      },
    },
    {
      slotId: "textureOverlay",
      purpose: "texture",
      required: false,
      onFail: "continue",
      mode: "canonical-only",
      selection: {
        maxAssets: 1,
        sizeClass: "texture",
        purpose: "bg_texture",
        variant: "dark",
      },
    },
  ],
  run: async (ctx) => {
    // Access resolved images via ctx.resolvedImages
    const hero = ctx.resolvedImages["hero"];
    const texture = ctx.resolvedImages["textureOverlay"];
    // ...
  },
};
```

### Image Slot Properties

| Property     | Type                                                                | Required | Description                                               |
| ------------ | ------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `slotId`     | `string`                                                            | Yes      | Unique identifier within the template                     |
| `purpose`    | `'hero' \| 'background' \| 'texture' \| 'illustration' \| 'accent'` | Yes      | Semantic purpose                                          |
| `required`   | `boolean`                                                           | No       | If true, slot failure fails the template (default: false) |
| `onFail`     | `'continue' \| 'fail-template'`                                     | No       | What to do on failure (default: based on `required`)      |
| `mode`       | `ImagePolicyMode`                                                   | No       | Override policy mode                                      |
| `selection`  | `Partial<SelectionConstraints>`                                     | No       | Override selection constraints                            |
| `generation` | `Partial<GenerationConfig>`                                         | No       | Override generation config                                |

### Failure Policies

| `required` | `onFail`                  | Behavior                                       |
| ---------- | ------------------------- | ---------------------------------------------- |
| `false`    | `continue` (default)      | Template succeeds even if slot fails           |
| `true`     | `fail-template` (default) | Template fails if slot fails                   |
| `false`    | `fail-template`           | Explicit: optional slot that blocks on failure |
| `true`     | `continue`                | Unusual: required but non-blocking             |

---

## How ImagePolicy is Applied

For each slot, the runner:

1. **Builds a policy** by merging slot overrides with defaults via `mergeWithDefaults()`
2. **Calls `executeImagePolicy()`** with the merged policy and run context
3. **Records the result** in `resolvedImages[slotId]`

```
Slot Definition
      ↓
mergeWithDefaults({ mode, selection, generation })
      ↓
executeImagePolicy(mergedPolicy, context)
      ↓
PolicyResult → ResolvedImageSlot
      ↓
Available in template.run() and receipt
```

### Policy Modes

| Mode               | Behavior                                                 |
| ------------------ | -------------------------------------------------------- |
| `canonical-only`   | Only select from registry, never generate                |
| `prefer-canonical` | Try canonical first, fall back to generation if allowed  |
| `generate-ok`      | May generate immediately, but should try canonical first |

If no `mode` is specified, the slot defaults to `canonical-only` (the safest option).

---

## Resolved Output

After resolution, each slot produces a `ResolvedImageSlot`:

```typescript
interface ResolvedImageSlot {
  slotId: string;
  purpose: "hero" | "background" | "texture" | "illustration" | "accent";
  policyMode: "canonical-only" | "prefer-canonical" | "generate-ok";
  registryMode: "pinned" | "latest";
  registryVersion: string | number;
  success: boolean;
  canonicalAssets: ResolvedCanonicalImage[];
  generatedImages: ResolvedGeneratedImage[];
  errorCode?: string;
  errorReason?: string;
  resolverReason?: string;
}

interface ResolvedCanonicalImage {
  source: "canonical";
  assetId: string;
  cloudinaryPublicId: string;
  url: string;
  reason: string;
}

interface ResolvedGeneratedImage {
  source: "generated";
  provider: string;
  model: string;
  url: string;
  width: number;
  height: number;
  format: string;
  reason: string;
}
```

### Accessing in Templates

```typescript
run: async (ctx) => {
  const heroSlot = ctx.resolvedImages["hero"];

  if (heroSlot.success) {
    const image = heroSlot.canonicalAssets[0] ?? heroSlot.generatedImages[0];
    return {
      output: {
        heroUrl: image.url,
        heroSource: image.source,
      },
    };
  }

  return {
    output: { heroUrl: null },
  };
};
```

---

## Receipt Structure

Every template run emits a receipt that includes per-slot outcomes:

```json
{
  "receipt": {
    "runId": "abc123",
    "templateId": "product-showcase",
    "templateVersion": "1.0.0",
    "startedAt": "2026-01-08T19:00:00.000Z",
    "finishedAt": "2026-01-08T19:00:00.150Z",
    "status": "success",
    "imageSlots": [
      {
        "slotId": "hero",
        "purpose": "hero",
        "policyMode": "prefer-canonical",
        "registryMode": "latest",
        "registryVersion": 42,
        "success": true,
        "canonicalCount": 1,
        "generatedCount": 0
      },
      {
        "slotId": "textureOverlay",
        "purpose": "texture",
        "policyMode": "canonical-only",
        "registryMode": "latest",
        "registryVersion": 42,
        "success": false,
        "canonicalCount": 0,
        "generatedCount": 0,
        "errorCode": "NO_CANONICAL_MATCH",
        "reason": "No assets matched selection constraints",
        "resolverReason": "purpose:bg_texture; variant:dark"
      }
    ]
  }
}
```

### What the Receipt Captures

| Field                              | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `slotId`, `purpose`                | Slot identification                         |
| `policyMode`                       | The actual mode after `mergeWithDefaults()` |
| `registryMode`, `registryVersion`  | Registry snapshot used                      |
| `success`                          | Whether resolution succeeded                |
| `canonicalCount`, `generatedCount` | Asset counts                                |
| `errorCode`, `reason`              | If failed                                   |
| `resolverReason`                   | Constraints that weren't satisfied          |

---

## Example Run Output

Request:

```json
{
  "templateId": "product-showcase",
  "inputs": {
    "productName": "Codra Pro",
    "tagline": "Design, governed"
  },
  "context": {
    "availableCredits": 100,
    "hasConsent": true,
    "registry": { "mode": "latest" }
  }
}
```

Response:

```json
{
  "result": {
    "output": {
      "ok": true,
      "templateId": "product-showcase",
      "runId": "f7a3b9c1-2d4e-5f6a-7b8c-9d0e1f2a3b4c",
      "productName": "Codra Pro",
      "tagline": "Design, governed",
      "images": {
        "hero": {
          "url": "https://res.cloudinary.com/codra/image/upload/v1/hero/codra-dark.png",
          "source": "canonical",
          "publicId": "hero/codra-dark"
        },
        "textureOverlay": null
      },
      "slotMetadata": {
        "hero": {
          "success": true,
          "policyMode": "prefer-canonical",
          "registryVersion": 42,
          "assetCount": 1
        },
        "textureOverlay": {
          "success": false,
          "policyMode": "canonical-only",
          "registryVersion": 42,
          "assetCount": 0
        }
      }
    }
  },
  "resolvedImages": {
    "hero": {
      "slotId": "hero",
      "purpose": "hero",
      "policyMode": "prefer-canonical",
      "registryMode": "latest",
      "registryVersion": 42,
      "success": true,
      "canonicalAssets": [
        {
          "source": "canonical",
          "assetId": "asset-123",
          "cloudinaryPublicId": "hero/codra-dark",
          "url": "https://res.cloudinary.com/codra/image/upload/v1/hero/codra-dark.png",
          "reason": "Matched hero purpose with landscape aspect"
        }
      ],
      "generatedImages": []
    },
    "textureOverlay": {
      "slotId": "textureOverlay",
      "purpose": "texture",
      "policyMode": "canonical-only",
      "registryMode": "latest",
      "registryVersion": 42,
      "success": false,
      "canonicalAssets": [],
      "generatedImages": [],
      "errorCode": "NO_CANONICAL_MATCH",
      "errorReason": "No assets matched selection constraints",
      "resolverReason": "purpose:bg_texture; variant:dark"
    }
  },
  "receipt": {
    "runId": "f7a3b9c1-2d4e-5f6a-7b8c-9d0e1f2a3b4c",
    "templateId": "product-showcase",
    "templateVersion": "1.0.0",
    "startedAt": "2026-01-08T19:00:00.000Z",
    "finishedAt": "2026-01-08T19:00:00.150Z",
    "status": "success",
    "imageSlots": [
      {
        "slotId": "hero",
        "purpose": "hero",
        "policyMode": "prefer-canonical",
        "registryMode": "latest",
        "registryVersion": 42,
        "success": true,
        "canonicalCount": 1,
        "generatedCount": 0
      },
      {
        "slotId": "textureOverlay",
        "purpose": "texture",
        "policyMode": "canonical-only",
        "registryMode": "latest",
        "registryVersion": 42,
        "success": false,
        "canonicalCount": 0,
        "generatedCount": 0,
        "errorCode": "NO_CANONICAL_MATCH",
        "reason": "No assets matched selection constraints",
        "resolverReason": "purpose:bg_texture; variant:dark"
      }
    ]
  }
}
```

---

## Error Codes

| Code                          | Description                             |
| ----------------------------- | --------------------------------------- |
| `TEMPLATE_NOT_FOUND`          | Template ID doesn't exist               |
| `TEMPLATE_INVALID_INPUT`      | Request validation failed               |
| `TEMPLATE_RUN_FAILED`         | `template.run()` threw an error         |
| `IMAGE_SLOT_FAILED`           | Slot resolution failed (non-required)   |
| `IMAGE_SLOT_REQUIRED`         | Required slot resolution failed         |
| `NO_CANONICAL_MATCH`          | No assets matched selection constraints |
| `GENERATION_DISABLED`         | Generation not enabled for this policy  |
| `GENERATION_CONSENT_REQUIRED` | User consent required for generation    |
| `GENERATION_BUDGET_EXCEEDED`  | Insufficient credits for generation     |

---

## Best Practices

1. **Use `canonical-only` for branding assets**: Logos, product images, brand textures should come from the curated registry.

2. **Use `prefer-canonical` for flexible content**: Hero images, illustrations where generation is acceptable as fallback.

3. **Mark truly required slots as `required: true`**: This prevents templates from running with missing critical images.

4. **Keep optional slots as `onFail: 'continue'`**: Let templates degrade gracefully when optional images aren't available.

5. **Don't hardcode URLs**: Always use `ctx.resolvedImages[slotId]` to access images.

6. **Check slot success before using**: Always check `slot.success` before accessing assets.

---

## Related Documentation

- [Template Runner](./template-runner.md) - Core runner documentation
- [ImagePolicy Types](../image-policy/types.ts) - Policy type definitions
- [ImagePolicy Errors](../image-policy/errors.ts) - Error types and codes
