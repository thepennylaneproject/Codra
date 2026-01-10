/**
 * src/lib/templates/registry.ts
 * 
 * Template Registry v1 - simple in-memory registry.
 * Perfect for v1: you need motion, not a CMS.
 * 
 * Templates are pure functions. All external calls go through the runner.
 */

import type { TemplateDefinition, TemplateRunContext, TemplateRunResult } from './types';

// =============================================================================
// SAMPLE TEMPLATES
// =============================================================================

/**
 * Landing Page template.
 * 
 * One image slot (hero) with:
 * - prefer-canonical mode (try registry first, fallback to generation)
 * - maxAssets: 1 (just need one hero image)
 * - generation disabled by default
 */
const landingPageTemplate: TemplateDefinition = {
  templateId: 'landing-page',
  name: 'Landing Page',
  description: 'A simple landing page with a hero image section.',
  version: '1.0.0',
  imageSlots: [
    {
      slotId: 'hero',
      purpose: 'hero',
      required: true,
      onFail: 'fail-template',
      mode: 'prefer-canonical',
      selection: {
        maxAssets: 1,
        sizeClass: 'hero',
        role: 'hero',
      },
      generation: {
        enabled: false,
      },
    },
  ],
  run: async (ctx: TemplateRunContext): Promise<TemplateRunResult> => {
    const heroSlot = ctx.resolvedImages['hero'];
    const heroImage = heroSlot?.canonicalAssets[0] ?? heroSlot?.generatedImages[0];
    
    return {
      output: {
        ok: true,
        templateId: ctx.templateId,
        runId: ctx.runId,
        title: (ctx.inputs['title'] as string) ?? 'Welcome',
        heroImageUrl: heroImage?.url ?? null,
        notes: [
          `Resolved hero image: ${heroImage ? 'yes' : 'no'}`,
          `Policy mode: ${heroSlot?.policyMode ?? 'unknown'}`,
          `Registry version: ${heroSlot?.registryVersion ?? 'unknown'}`,
        ],
      },
    };
  },
};

/**
 * Notebook Card template.
 * 
 * One image slot (texture) with:
 * - canonical-only mode (never generate)
 * - optional (template works without texture)
 */
const notebookCardTemplate: TemplateDefinition = {
  templateId: 'notebook-card',
  name: 'Notebook Card',
  description: 'A card with an optional background texture.',
  version: '1.0.0',
  imageSlots: [
    {
      slotId: 'texture',
      purpose: 'texture',
      required: false,
      onFail: 'continue',
      mode: 'canonical-only',
      selection: {
        maxAssets: 1,
        sizeClass: 'texture',
        role: 'background-soft',
      },
    },
  ],
  run: async (ctx: TemplateRunContext): Promise<TemplateRunResult> => {
    const textureSlot = ctx.resolvedImages['texture'];
    const textureImage = textureSlot?.canonicalAssets[0];
    
    return {
      output: {
        ok: true,
        templateId: ctx.templateId,
        runId: ctx.runId,
        title: (ctx.inputs['title'] as string) ?? 'Untitled Note',
        content: (ctx.inputs['content'] as string) ?? '',
        textureUrl: textureImage?.url ?? null,
        hasTexture: !!textureImage,
        notes: [
          `Resolved texture: ${textureImage ? 'yes' : 'no'}`,
          `Slot success: ${textureSlot?.success ?? 'no slot'}`,
        ],
      },
    };
  },
};

/**
 * Product Showcase template.
 * 
 * Two image slots demonstrating different policies:
 * - hero: Required, prefer-canonical, single image for main visual
 * - textureOverlay: Optional, canonical-only, subtle background texture
 * 
 * This example shows how templates can mix slot requirements and policies.
 */
const productShowcaseTemplate: TemplateDefinition = {
  templateId: 'product-showcase',
  name: 'Product Showcase',
  description: 'A product showcase with hero image and optional texture overlay.',
  version: '1.0.0',
  imageSlots: [
    {
      slotId: 'hero',
      purpose: 'hero',
      required: true,
      onFail: 'fail-template',
      mode: 'prefer-canonical',
      selection: {
        maxAssets: 1,
        sizeClass: 'hero',
        role: 'hero',
        aspect: 'landscape',
      },
      generation: {
        // Generation disabled by default, but could be enabled with consent
        enabled: false,
      },
    },
    {
      slotId: 'textureOverlay',
      purpose: 'texture',
      required: false,
      onFail: 'continue',
      mode: 'canonical-only',
      selection: {
        maxAssets: 1,
        sizeClass: 'texture',
        role: 'background-soft',
        variant: 'dark',
      },
    },
  ],
  run: async (ctx: TemplateRunContext): Promise<TemplateRunResult> => {
    const heroSlot = ctx.resolvedImages['hero'];
    const textureSlot = ctx.resolvedImages['textureOverlay'];
    
    const heroImage = heroSlot?.canonicalAssets[0] ?? heroSlot?.generatedImages[0];
    const textureImage = textureSlot?.canonicalAssets[0];
    
    return {
      output: {
        ok: true,
        templateId: ctx.templateId,
        runId: ctx.runId,
        // Product info from inputs
        productName: (ctx.inputs['productName'] as string) ?? 'Product',
        tagline: (ctx.inputs['tagline'] as string) ?? '',
        // Resolved images (no hardcoded URLs!)
        images: {
          hero: heroImage ? {
            url: heroImage.url,
            source: heroImage.source,
            publicId: heroImage.source === 'canonical' ? heroImage.cloudinaryPublicId : null,
          } : null,
          textureOverlay: textureImage ? {
            url: textureImage.url,
            source: textureImage.source,
            publicId: textureImage.cloudinaryPublicId,
          } : null,
        },
        // Slot metadata for debugging
        slotMetadata: {
          hero: {
            success: heroSlot?.success ?? false,
            policyMode: heroSlot?.policyMode ?? 'unknown',
            registryVersion: heroSlot?.registryVersion ?? 'unknown',
            assetCount: (heroSlot?.canonicalAssets.length ?? 0) + (heroSlot?.generatedImages.length ?? 0),
          },
          textureOverlay: {
            success: textureSlot?.success ?? false,
            policyMode: textureSlot?.policyMode ?? 'unknown',
            registryVersion: textureSlot?.registryVersion ?? 'unknown',
            assetCount: textureSlot?.canonicalAssets.length ?? 0,
          },
        },
      },
    };
  },
};

// =============================================================================
// REGISTRY
// =============================================================================

/**
 * In-memory template registry.
 * Add templates here as they are developed.
 */
const TEMPLATE_REGISTRY: Map<string, TemplateDefinition> = new Map([
  ['landing-page', landingPageTemplate],
  ['notebook-card', notebookCardTemplate],
  ['product-showcase', productShowcaseTemplate],
]);

/**
 * Get a template by ID.
 * Returns null if not found.
 */
export function getTemplate(templateId: string): TemplateDefinition | null {
  return TEMPLATE_REGISTRY.get(templateId) ?? null;
}

/**
 * List all registered templates.
 */
export function listTemplates(): TemplateDefinition[] {
  return Array.from(TEMPLATE_REGISTRY.values());
}

/**
 * Check if a template exists.
 */
export function hasTemplate(templateId: string): boolean {
  return TEMPLATE_REGISTRY.has(templateId);
}

/**
 * Get count of registered templates.
 */
export function getTemplateCount(): number {
  return TEMPLATE_REGISTRY.size;
}

// =============================================================================
// REGISTRATION (for future use)
// =============================================================================

/**
 * Register a template (internal use only for v1).
 * In v2, this could support dynamic registration.
 */
export function registerTemplate(template: TemplateDefinition): void {
  if (TEMPLATE_REGISTRY.has(template.templateId)) {
    throw new Error(`Template '${template.templateId}' is already registered`);
  }
  TEMPLATE_REGISTRY.set(template.templateId, template);
}

/**
 * Unregister a template (internal use only for v1).
 */
export function unregisterTemplate(templateId: string): boolean {
  return TEMPLATE_REGISTRY.delete(templateId);
}
