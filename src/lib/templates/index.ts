/**
 * src/lib/templates/index.ts
 * 
 * Main export file for the Template Runner module.
 */

// Types
export type {
  // Core types
  TemplateDefinition,
  TemplateImageSlot,
  TemplateRunContext,
  TemplateRunResult,
  TemplateRunReceipt,
  
  // Image slot types
  ImageSlotPurpose,
  ImageSlotFailurePolicy,
  ResolvedImageSlot,
  ResolvedCanonicalImage,
  ResolvedGeneratedImage,
  
  // Receipt types
  ReceiptSlotSummary,
  ReceiptError,
  
  // Runner types
  RunTemplateOptions,
  RunTemplateOutput,
  RegistryConfig,
  
  // Error codes
  TemplateErrorCode,
} from './types';

// Runner
export { runTemplate } from './runner';

// Registry
export {
  getTemplate,
  listTemplates,
  hasTemplate,
  getTemplateCount,
  registerTemplate,
  unregisterTemplate,
} from './registry';
