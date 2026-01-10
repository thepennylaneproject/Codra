/**
 * src/lib/templates/__tests__/runner.test.ts
 * 
 * Unit tests for the Template Runner.
 * Mocks ImagePolicy for determinism.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runTemplate } from '../runner';
import type { RunTemplateOptions, TemplateDefinition } from '../types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock the registry
vi.mock('../registry', () => ({
  getTemplate: vi.fn(),
}));

// Mock the image-policy module
vi.mock('../../image-policy', () => ({
  mergeWithDefaults: vi.fn((partial) => ({
    mode: partial?.mode ?? 'canonical-only',
    registrySnapshot: partial?.registrySnapshot ?? 'pinned',
    selection: {
      maxAssets: 3,
      dedupe: true,
      minWidth: 0,
      minHeight: 0,
      allowedFormats: ['png', 'jpg', 'webp', 'svg'],
      aspect: 'any',
      sizeClass: 'any',
      purpose: 'any',
      requiredTags: [],
      forbiddenTags: [],
      product: 'any',
      variant: 'any',
      ...partial?.selection,
    },
    generation: {
      enabled: false,
      maxGenerations: 0,
      allowedProviders: [],
      allowedModels: [],
      output: { count: 1, width: 1024, height: 1024, transparentBackground: false, format: 'png' },
      promptRules: { mustInclude: [], mustNotInclude: [] },
      ...partial?.generation,
    },
    budget: { maxCredits: null, requireConsent: true },
    provenance: { attachToReceipt: true, storeGenerations: 'ephemeral', retentionDays: 30 },
    promotion: { allowPromotion: false, requiresHumanApproval: true, requiredFields: [] },
  })),
  executeImagePolicy: vi.fn(),
  isImagePolicyError: vi.fn().mockReturnValue(false),
}));

// Import mocked modules
import { getTemplate } from '../registry';
import { executeImagePolicy } from '../../image-policy';

const mockGetTemplate = vi.mocked(getTemplate);
const mockExecuteImagePolicy = vi.mocked(executeImagePolicy);

// =============================================================================
// TEST DATA
// =============================================================================

const baseOptions: RunTemplateOptions = {
  availableCredits: 100,
  hasConsent: true,
  registry: { mode: 'latest' },
};

const mockLandingPageTemplate: TemplateDefinition = {
  templateId: 'landing-page',
  name: 'Landing Page',
  version: '1.0.0',
  imageSlots: [
    {
      slotId: 'hero',
      purpose: 'hero',
      required: true,
      onFail: 'fail-template',
      mode: 'prefer-canonical',
      selection: { maxAssets: 1 },
    },
  ],
  run: async (ctx) => ({
    output: {
      ok: true,
      templateId: ctx.templateId,
      title: ctx.inputs['title'] ?? 'Default Title',
    },
  }),
};

const mockNotebookCardTemplate: TemplateDefinition = {
  templateId: 'notebook-card',
  name: 'Notebook Card',
  version: '1.0.0',
  imageSlots: [
    {
      slotId: 'texture',
      purpose: 'texture',
      required: false,
      onFail: 'continue',
      mode: 'canonical-only',
    },
  ],
  run: async (ctx) => ({
    output: {
      ok: true,
      templateId: ctx.templateId,
      hasTexture: !!ctx.resolvedImages['texture']?.success,
    },
  }),
};

const mockSimpleTemplate: TemplateDefinition = {
  templateId: 'simple',
  name: 'Simple Template',
  version: '1.0.0',
  run: async (ctx) => ({
    output: {
      ok: true,
      templateId: ctx.templateId,
      runId: ctx.runId,
    },
  }),
};

// =============================================================================
// TESTS
// =============================================================================

describe('runTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // TEMPLATE_NOT_FOUND
  // -------------------------------------------------------------------------
  describe('template not found', () => {
    it('should return TEMPLATE_NOT_FOUND receipt for unknown template', async () => {
      mockGetTemplate.mockReturnValue(null);

      const result = await runTemplate('unknown-template', {}, baseOptions);

      expect(result.result).toBeNull();
      expect(result.resolvedImages).toBeNull();
      expect(result.receipt.status).toBe('failure');
      expect(result.receipt.templateId).toBe('unknown-template');
      expect(result.receipt.errors).toHaveLength(1);
      expect(result.receipt.errors![0].code).toBe('TEMPLATE_NOT_FOUND');
      expect(result.receipt.errors![0].message).toContain('unknown-template');
    });

    it('should always have receipt timestamps', async () => {
      mockGetTemplate.mockReturnValue(null);

      const result = await runTemplate('missing', {}, baseOptions);

      expect(result.receipt.startedAt).toBeDefined();
      expect(result.receipt.finishedAt).toBeDefined();
      expect(new Date(result.receipt.startedAt).getTime()).toBeLessThanOrEqual(
        new Date(result.receipt.finishedAt).getTime()
      );
    });
  });

  // -------------------------------------------------------------------------
  // INPUT VALIDATION
  // -------------------------------------------------------------------------
  describe('input validation', () => {
    it('should reject non-string templateId', async () => {
      const result = await runTemplate(123 as unknown as string, {}, baseOptions);

      expect(result.result).toBeNull();
      expect(result.receipt.status).toBe('failure');
      expect(result.receipt.errors![0].code).toBe('TEMPLATE_INVALID_INPUT');
    });

    it('should reject non-number availableCredits', async () => {
      const result = await runTemplate('test', {}, {
        ...baseOptions,
        availableCredits: 'not a number' as unknown as number,
      });

      expect(result.result).toBeNull();
      expect(result.receipt.status).toBe('failure');
      expect(result.receipt.errors![0].code).toBe('TEMPLATE_INVALID_INPUT');
    });

    it('should reject non-boolean hasConsent', async () => {
      const result = await runTemplate('test', {}, {
        ...baseOptions,
        hasConsent: 'yes' as unknown as boolean,
      });

      expect(result.result).toBeNull();
      expect(result.receipt.status).toBe('failure');
      expect(result.receipt.errors![0].code).toBe('TEMPLATE_INVALID_INPUT');
    });
  });

  // -------------------------------------------------------------------------
  // SIMPLE TEMPLATE EXECUTION
  // -------------------------------------------------------------------------
  describe('simple template (no image slots)', () => {
    it('should execute template without image slots', async () => {
      mockGetTemplate.mockReturnValue(mockSimpleTemplate);

      const result = await runTemplate('simple', { foo: 'bar' }, baseOptions);

      expect(result.receipt.status).toBe('success');
      expect(result.result).not.toBeNull();
      expect(result.result!.output.ok).toBe(true);
      expect(result.result!.output.templateId).toBe('simple');
    });

    it('should use provided runId', async () => {
      mockGetTemplate.mockReturnValue(mockSimpleTemplate);

      const result = await runTemplate('simple', {}, {
        ...baseOptions,
        runId: 'custom-run-id-123',
      });

      expect(result.receipt.runId).toBe('custom-run-id-123');
      expect(result.result!.output.runId).toBe('custom-run-id-123');
    });

    it('should generate runId if not provided', async () => {
      mockGetTemplate.mockReturnValue(mockSimpleTemplate);

      const result = await runTemplate('simple', {}, baseOptions);

      expect(result.receipt.runId).toBeDefined();
      expect(result.receipt.runId.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // IMAGE SLOT RESOLUTION
  // -------------------------------------------------------------------------
  describe('image slot resolution', () => {
    it('should resolve image slots via executeImagePolicy', async () => {
      mockGetTemplate.mockReturnValue(mockLandingPageTemplate);
      mockExecuteImagePolicy.mockResolvedValue({
        success: true,
        canonicalAssets: [
          {
            source: 'canonical',
            assetId: 'hero-asset-1',
            cloudinaryPublicId: 'hero/asset-1',
            url: 'https://example.com/hero.png',
            reason: 'Matched hero purpose',
          },
        ],
        generatedImages: [],
        receipt: {
          id: 'receipt-1',
          runId: 'test-run',
          policy: {} as unknown as import('../../image-policy').ImagePolicy,
          registryVersion: 42,
          canonicalAssets: [],
          generatedOutputs: [],
          creditEstimate: 0,
          creditActual: 0,
          createdAt: new Date().toISOString(),
        },
      });

      const result = await runTemplate('landing-page', { title: 'My Page' }, baseOptions);

      expect(mockExecuteImagePolicy).toHaveBeenCalledTimes(1);
      expect(result.receipt.status).toBe('success');
      expect(result.resolvedImages).not.toBeNull();
      expect(result.resolvedImages!['hero']).toBeDefined();
      expect(result.resolvedImages!['hero'].success).toBe(true);
      expect(result.resolvedImages!['hero'].canonicalAssets).toHaveLength(1);
    });

    it('should include policy snapshot info in receipt', async () => {
      mockGetTemplate.mockReturnValue(mockLandingPageTemplate);
      mockExecuteImagePolicy.mockResolvedValue({
        success: true,
        canonicalAssets: [
          {
            source: 'canonical',
            assetId: 'hero-1',
            cloudinaryPublicId: 'hero/1',
            url: 'https://example.com/hero.png',
            reason: 'Match',
          },
        ],
        generatedImages: [],
        receipt: {
          id: 'receipt-1',
          runId: 'test',
          policy: {} as unknown as import('../../image-policy').ImagePolicy,
          registryVersion: 99,
          canonicalAssets: [],
          generatedOutputs: [],
          creditEstimate: 0,
          creditActual: 0,
          createdAt: new Date().toISOString(),
        },
      });

      const result = await runTemplate('landing-page', {}, baseOptions);

      expect(result.receipt.imageSlots).toHaveLength(1);
      expect(result.receipt.imageSlots![0].slotId).toBe('hero');
      expect(result.receipt.imageSlots![0].policyMode).toBe('prefer-canonical');
      expect(result.receipt.imageSlots![0].registryVersion).toBe(99);
    });
  });

  // -------------------------------------------------------------------------
  // REQUIRED SLOT FAILURE
  // -------------------------------------------------------------------------
  describe('required slot failure', () => {
    it('should fail template when required slot fails', async () => {
      mockGetTemplate.mockReturnValue(mockLandingPageTemplate);
      mockExecuteImagePolicy.mockResolvedValue({
        success: false,
        canonicalAssets: [],
        generatedImages: [],
        errorCode: 'NO_CANONICAL_MATCH',
        errorDetails: {
          message: 'No canonical assets matched the selection constraints',
          unmetConstraints: ['purpose:hero', 'sizeClass:hero'],
        },
      });

      const result = await runTemplate('landing-page', {}, baseOptions);

      expect(result.receipt.status).toBe('failure');
      expect(result.result).toBeNull();
      expect(result.receipt.errors).toBeDefined();
      expect(result.receipt.errors!.some(e => e.code === 'IMAGE_SLOT_REQUIRED')).toBe(true);
      expect(result.resolvedImages!['hero'].success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // OPTIONAL SLOT FAILURE
  // -------------------------------------------------------------------------
  describe('optional slot failure', () => {
    it('should continue when optional slot fails', async () => {
      mockGetTemplate.mockReturnValue(mockNotebookCardTemplate);
      mockExecuteImagePolicy.mockResolvedValue({
        success: false,
        canonicalAssets: [],
        generatedImages: [],
        errorCode: 'NO_CANONICAL_MATCH',
        errorDetails: {
          message: 'No match',
        },
      });

      const result = await runTemplate('notebook-card', {}, baseOptions);

      expect(result.receipt.status).toBe('success');
      expect(result.result).not.toBeNull();
      expect(result.result!.output.hasTexture).toBe(false);
      expect(result.resolvedImages!['texture'].success).toBe(false);
    });

    it('should capture slot failure in receipt even when template succeeds', async () => {
      mockGetTemplate.mockReturnValue(mockNotebookCardTemplate);
      mockExecuteImagePolicy.mockResolvedValue({
        success: false,
        canonicalAssets: [],
        generatedImages: [],
        errorCode: 'NO_CANONICAL_MATCH',
        errorDetails: { message: 'No texture found' },
      });

      const result = await runTemplate('notebook-card', {}, baseOptions);

      expect(result.receipt.imageSlots).toHaveLength(1);
      expect(result.receipt.imageSlots![0].success).toBe(false);
      expect(result.receipt.imageSlots![0].errorCode).toBe('NO_CANONICAL_MATCH');
    });
  });

  // -------------------------------------------------------------------------
  // TEMPLATE RUN FAILURE
  // -------------------------------------------------------------------------
  describe('template run failure', () => {
    it('should capture template.run() errors in receipt', async () => {
      const failingTemplate: TemplateDefinition = {
        templateId: 'failing',
        name: 'Failing Template',
        version: '1.0.0',
        run: async () => {
          throw new Error('Template exploded!');
        },
      };
      mockGetTemplate.mockReturnValue(failingTemplate);

      const result = await runTemplate('failing', {}, baseOptions);

      expect(result.receipt.status).toBe('failure');
      expect(result.result).toBeNull();
      expect(result.receipt.errors!.some(e => e.code === 'TEMPLATE_RUN_FAILED')).toBe(true);
      expect(result.receipt.errors!.find(e => e.code === 'TEMPLATE_RUN_FAILED')!.message).toContain('Template exploded!');
    });
  });

  // -------------------------------------------------------------------------
  // RECEIPT ALWAYS PRESENT
  // -------------------------------------------------------------------------
  describe('receipt always present', () => {
    it('should always include receipt on success', async () => {
      mockGetTemplate.mockReturnValue(mockSimpleTemplate);

      const result = await runTemplate('simple', {}, baseOptions);

      expect(result.receipt).toBeDefined();
      expect(result.receipt.runId).toBeDefined();
      expect(result.receipt.templateId).toBe('simple');
      expect(result.receipt.templateVersion).toBe('1.0.0');
    });

    it('should always include receipt on failure', async () => {
      mockGetTemplate.mockReturnValue(null);

      const result = await runTemplate('missing', {}, baseOptions);

      expect(result.receipt).toBeDefined();
      expect(result.receipt.runId).toBeDefined();
      expect(result.receipt.templateId).toBe('missing');
    });

    it('should always include receipt on validation failure', async () => {
      const result = await runTemplate('', {}, baseOptions);

      expect(result.receipt).toBeDefined();
      expect(result.receipt.status).toBe('failure');
    });
  });
});
