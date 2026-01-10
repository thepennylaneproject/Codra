# Template Runner v1

The Template Runner is Codra's foundation layer for deterministic template execution. It provides a boring, reliable execution spine that integrates with ImagePolicy for image resolution and emits receipts for every run.

## Core Principles

1. **Deterministic and boring**: No hidden AI calls. The runner is the only place that calls governed primitives (ImagePolicy now, model routing later).

2. **Receipts always**: Every run emits a receipt, even failures. The receipt is the source of truth for observability.

3. **Templates are pure**: `template.run()` must not call external APIs, access databases, or perform I/O. The runner handles all external calls.

4. **Image decisions go through ImagePolicy**: If a template declares `imageSlots`, all image resolution goes through `executeImagePolicy()`.

---

## Template Definition

```typescript
interface TemplateDefinition {
  templateId: string; // Unique identifier
  name: string; // Human-readable name
  description?: string; // Optional description
  version: string; // Semver version
  inputsSchema?: object; // Optional JSON schema for validation
  imageSlots?: TemplateImageSlot[];
  run: (ctx: TemplateRunContext) => Promise<TemplateRunResult>;
}
```

### Example Template

```typescript
const landingPageTemplate: TemplateDefinition = {
  templateId: "landing-page",
  name: "Landing Page",
  version: "1.0.0",
  imageSlots: [
    {
      slotId: "hero",
      purpose: "hero",
      required: true,
      onFail: "fail-template",
      mode: "prefer-canonical",
      selection: { maxAssets: 1, sizeClass: "hero" },
    },
  ],
  run: async (ctx) => ({
    output: {
      title: ctx.inputs["title"] ?? "Welcome",
      heroUrl: ctx.resolvedImages["hero"]?.canonicalAssets[0]?.url,
    },
  }),
};
```

---

## Image Slots

Image slots declare what images a template needs. The runner resolves them before calling `template.run()`.

```typescript
interface TemplateImageSlot {
  slotId: string; // Unique within template
  purpose: "hero" | "background" | "texture" | "illustration" | "accent";
  required?: boolean; // Default: false
  onFail?: "continue" | "fail-template"; // Default: based on required
  mode?: ImagePolicyMode; // Override policy mode
  selection?: Partial<SelectionConstraints>;
  generation?: Partial<GenerationConfig>;
}
```

### Failure Policies

| `required`        | `onFail`                              | Behavior                              |
| ----------------- | ------------------------------------- | ------------------------------------- |
| `false` (default) | `continue` (default)                  | Slot failure doesn't fail template    |
| `true`            | `fail-template` (default if required) | Slot failure fails the template       |
| `false`           | `fail-template`                       | Explicit: slot failure fails template |
| `true`            | `continue`                            | Unusual: required but non-blocking    |

### Resolved Images

After resolution, each slot produces:

```typescript
interface ResolvedImageSlot {
  slotId: string;
  purpose: ImageSlotPurpose;
  policyMode: ImagePolicyMode; // Policy mode actually applied
  registryMode: RegistrySnapshotMode;
  registryVersion: string | number;
  success: boolean;
  canonicalAssets: ResolvedCanonicalImage[];
  generatedImages: ResolvedGeneratedImage[];
  errorCode?: string;
  errorReason?: string;
  resolverReason?: string; // Constraints that weren't satisfied
}
```

---

## API Usage

### Endpoint

```
POST /api/run-template
```

### Request

```json
{
  "templateId": "landing-page",
  "inputs": {
    "title": "My Landing Page"
  },
  "runId": "optional-client-provided-id",
  "context": {
    "availableCredits": 100,
    "hasConsent": true,
    "registry": {
      "mode": "latest"
    }
  }
}
```

| Field                        | Type                     | Required | Description                                |
| ---------------------------- | ------------------------ | -------- | ------------------------------------------ |
| `templateId`                 | string                   | Yes      | Template to execute                        |
| `inputs`                     | object                   | No       | Template-specific inputs                   |
| `runId`                      | string                   | No       | Client-provided run ID for tracing         |
| `context.availableCredits`   | number                   | Yes      | User's available credits                   |
| `context.hasConsent`         | boolean                  | Yes      | Whether user consented to generation costs |
| `context.registry.mode`      | `'pinned'` \| `'latest'` | No       | Registry snapshot mode                     |
| `context.registry.versionId` | string \| number         | No       | Specific version for pinned                |

### Response

```json
{
  "result": {
    "output": {
      "title": "My Landing Page",
      "heroUrl": "https://res.cloudinary.com/..."
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
      "canonicalAssets": [...],
      "generatedImages": []
    }
  },
  "receipt": {
    "runId": "f7a3b9c1-...",
    "templateId": "landing-page",
    "templateVersion": "1.0.0",
    "startedAt": "2026-01-08T19:15:00.000Z",
    "finishedAt": "2026-01-08T19:15:00.150Z",
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
      }
    ]
  }
}
```

### Status Codes

| Code  | Meaning                                      |
| ----- | -------------------------------------------- |
| `200` | Success (check `receipt.status` for details) |
| `400` | Malformed request (validation failed)        |
| `404` | Template not found (receipt included)        |
| `405` | Method not allowed (only POST)               |
| `500` | Internal error                               |

---

## Receipt Structure

Receipts are always present in responses. They provide observability for debugging and audit.

```typescript
interface TemplateRunReceipt {
  runId: string; // Unique run identifier
  templateId: string; // Template that was executed
  templateVersion?: string; // Version of the template
  startedAt: string; // ISO 8601 timestamp
  finishedAt: string; // ISO 8601 timestamp
  status: "success" | "failure";
  imageSlots?: ReceiptSlotSummary[];
  errors?: ReceiptError[];
}
```

### Slot Summary

Each slot in the receipt includes:

- `slotId`, `purpose`: Slot identification
- `policyMode`: The actual policy mode after `mergeWithDefaults()`
- `registryMode`, `registryVersion`: Registry snapshot used
- `success`: Whether resolution succeeded
- `canonicalCount`, `generatedCount`: Asset counts
- `errorCode`, `reason`: If failed
- `resolverReason`: Constraints that weren't met

### Error Codes

| Code                     | Description                           |
| ------------------------ | ------------------------------------- |
| `TEMPLATE_NOT_FOUND`     | Template ID doesn't exist in registry |
| `TEMPLATE_INVALID_INPUT` | Request validation failed             |
| `TEMPLATE_RUN_FAILED`    | `template.run()` threw an error       |
| `IMAGE_SLOT_FAILED`      | Slot resolution failed (non-required) |
| `IMAGE_SLOT_REQUIRED`    | Required slot resolution failed       |
| `INTERNAL_ERROR`         | Unexpected system error               |

---

## Library Usage

You can also use the runner directly from code:

```typescript
import { runTemplate } from "@/lib/templates";

const output = await runTemplate(
  "landing-page",
  { title: "Hello" },
  {
    availableCredits: 100,
    hasConsent: true,
    runId: "my-trace-id", // Optional
    registry: { mode: "latest" },
  }
);

if (output.receipt.status === "success") {
  console.log(output.result?.output);
} else {
  console.error(output.receipt.errors);
}
```

---

## Registry

Templates are registered in `src/lib/templates/registry.ts`:

```typescript
import { getTemplate, listTemplates } from "@/lib/templates";

// Get a specific template
const template = getTemplate("landing-page");

// List all templates
const templates = listTemplates();
```

### Built-in Templates

| Template ID     | Description                  | Image Slots                          |
| --------------- | ---------------------------- | ------------------------------------ |
| `landing-page`  | Landing page with hero image | `hero` (required, prefer-canonical)  |
| `notebook-card` | Card with optional texture   | `texture` (optional, canonical-only) |

---

## Future Extensions

The runner is designed for:

- **Model routing**: Templates can declare model requirements, runner handles routing
- **Cost preflight**: Estimate and gate on cost before execution
- **Replay and audit**: `runId` enables tracing and replay
- **Dynamic registry**: v2 could load templates from database/config
