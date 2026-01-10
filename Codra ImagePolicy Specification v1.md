# Codra ImagePolicy Specification v1.0

**Status:** Draft (v1)
**Purpose:** Govern how templates and workflows select canonical assets and/or generate images, with explicit control over visual entropy, costs, and provenance.

---

## 1) Core Principle

Codra treats visuals as two distinct domains:

- **Visual infrastructure:** canonical, curated, queryable assets (stable, reusable)
- **Visual entropy:** generated images (exploratory, variable, opt-in)

Codra MUST NOT silently cross the boundary between these domains.

---

## 2) Policy Placement

Every template or workflow that may involve images MUST declare an `imagePolicy`.

If absent, Codra MUST:

- either fail with a policy_missing error, or
- use a strict global default of `canonical-only` (recommended)

No implicit generation is allowed.

---

## 3) Data Model

### 3.1 ImagePolicy object

```json
{
  "mode": "canonical-only | prefer-canonical | generate-ok",
  "registrySnapshot": "pinned | latest",
  "selection": {
    "maxAssets": 3,
    "dedupe": true,
    "minWidth": 0,
    "minHeight": 0,
    "allowedFormats": ["png", "jpg", "webp", "svg"],
    "aspect": "any | square | portrait | landscape | panorama",
    "sizeClass": "any | icon | small | card | hero | texture",
    "purpose": "any | hero | bg_texture | illustration | icon",
    "requiredTags": [],
    "forbiddenTags": [],
    "product": "any | codra | relevnt | mythos | embr | passagr | other",
    "variant": "any | light | dark | mono | accent"
  },
  "generation": {
    "enabled": false,
    "maxGenerations": 0,
    "allowedProviders": [],
    "allowedModels": [],
    "output": {
      "count": 1,
      "width": 1024,
      "height": 1024,
      "transparentBackground": false,
      "format": "png | jpg | webp"
    },
    "promptRules": {
      "mustInclude": [],
      "mustNotInclude": [],
      "stylePreset": "optional string identifier"
    }
  },
  "budget": {
    "maxCredits": null,
    "requireConsent": true
  },
  "provenance": {
    "attachToReceipt": true,
    "storeGenerations": "none | ephemeral | retained",
    "retentionDays": 30
  },
  "promotion": {
    "allowPromotion": false,
    "requiresHumanApproval": true,
    "requiredFields": ["purpose", "product", "variant", "tags"]
  }
}
```

Notes:

- `registrySnapshot` controls reproducibility.

  - `pinned`: resolver uses the template’s pinned registry version
  - `latest`: resolver uses the latest registry version

- `generation.enabled` MUST be false unless mode is `generate-ok`.

---

## 4) Policy Modes (Behavior)

### 4.1 canonical-only

- Resolver may ONLY select from canonical registry.
- If no match is found, return:

  - `no_canonical_match`
  - include a “why” explanation and the unmet constraints

- Generation is forbidden.

### 4.2 prefer-canonical

- Resolver first attempts canonical selection.
- If no match is found, Codra MAY generate only if:

  - `generation.enabled === true`
  - budget/consent rules are satisfied

- If generation is disabled, behave like canonical-only.

### 4.3 generate-ok

- Codra may generate images immediately, but SHOULD still attempt canonical first unless template explicitly sets `selection.maxAssets = 0`.
- Must respect budgets and consent gates.

---

## 5) Deterministic Asset Resolver

The resolver is a pure function:

**Inputs**

- template metadata
- imagePolicy
- selection constraints
- canonical registry snapshot (pinned or latest)

**Output**

```json
{
  "assets": [
    {
      "source": "canonical",
      "assetId": "string",
      "cloudinaryPublicId": "string",
      "url": "string",
      "reason": "string"
    }
  ],
  "reason": "string",
  "registryVersion": "string or int",
  "unmetConstraints": []
}
```

Rules:

- Selection MUST be deterministic given identical inputs.
- If multiple matches exist, ranking is deterministic (tie-breakers must be defined, ex: largest resolution, closest aspect ratio, most tag overlap, newest).
- Resolver MUST produce a human-readable `reason`.

---

## 6) Generation Contract

When generation is permitted:

Codra MUST produce a generation record:

```json
{
  "source": "generated",
  "provider": "string",
  "model": "string",
  "promptHash": "string",
  "createdAt": "iso",
  "output": {
    "url": "string",
    "width": 0,
    "height": 0,
    "format": "string",
    "transparentBackground": false
  },
  "reason": "string"
}
```

Rules:

- Generation MUST be gated by budget and consent if `budget.requireConsent === true`.
- Generation outputs are never treated as canonical automatically.

---

## 7) Retention Policy

Generated images retention is policy-controlled:

- `none`: do not store
- `ephemeral`: store temporarily, expires after retentionDays
- `retained`: store indefinitely but marked `generated`

No retention mode implies promotion.

---

## 8) Promotion Rules

Promotion is an explicit workflow, never automatic.

If `promotion.allowPromotion === true`, Codra may offer a promotion action, but MUST require:

- human approval
- completion of required metadata fields
- insertion into canonical registry via regeneration/re-enrichment pipeline
- provenance preserved (origin: generated)

Promotion produces:

- a registry event
- a new registry version (or overlay entry) depending on your registry strategy

---

## 9) Receipts and Observability

Every run that touches images MUST attach receipt metadata when `provenance.attachToReceipt === true`:

- imagePolicy used (normalized form)
- registry version used
- canonical assets selected (ids + reasons)
- generated outputs (provider/model + promptHash + reasons)
- credit spend estimate vs actual for generation calls (if applicable)

---

## 10) Error Shapes (Stable)

- `policy_missing`
- `no_canonical_match`
- `generation_disabled`
- `generation_consent_required`
- `generation_budget_exceeded`
- `promotion_not_allowed`
- `promotion_missing_fields`

Each error MUST include:

- a short message
- details: unmet constraints, next action suggestion

---

## 11) Recommended Defaults (Global)

Default global ImagePolicy (strict, sustainable):

- mode: canonical-only
- registrySnapshot: pinned for templates, latest for ad-hoc exploration
- selection.maxAssets: 3
- generation.enabled: false
- retention: ephemeral 30 days
- promotion: allowPromotion false

---

End of spec.
