/**
 * Netlify Function: Run Template
 * 
 * API endpoint for executing templates via the Template Runner.
 * Always returns a receipt, even for failures.
 */

import { Handler } from '@netlify/functions';
import { runTemplate, type RunTemplateOptions } from '../../../src/lib/templates';

// =============================================================================
// TYPES
// =============================================================================

interface RunTemplateRequest {
  templateId: string;
  inputs?: Record<string, unknown>;
  runId?: string;
  context: {
    availableCredits: number;
    hasConsent: boolean;
    registry?: {
      mode: 'pinned' | 'latest';
      versionId?: string | number;
    };
  };
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// CORS HEADERS
// =============================================================================

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// =============================================================================
// HELPERS
// =============================================================================

function jsonError(statusCode: number, error: ApiError) {
  return {
    statusCode,
    headers,
    body: JSON.stringify({ error }),
  };
}

function jsonSuccess(statusCode: number, data: Record<string, unknown>) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(data),
  };
}

/**
 * Parse and validate the request body.
 */
function parseRequest(body: string | null): RunTemplateRequest {
  if (!body) {
    throw new RequestError('MISSING_BODY', 'Request body is required');
  }
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new RequestError('INVALID_JSON', 'Request body is not valid JSON');
  }
  
  if (typeof parsed !== 'object' || parsed === null) {
    throw new RequestError('INVALID_BODY', 'Request body must be an object');
  }
  
  const req = parsed as Record<string, unknown>;
  
  // Validate templateId
  if (typeof req.templateId !== 'string' || !req.templateId.trim()) {
    throw new RequestError('INVALID_TEMPLATE_ID', 'templateId must be a non-empty string');
  }
  
  // Validate context
  if (typeof req.context !== 'object' || req.context === null) {
    throw new RequestError('INVALID_CONTEXT', 'context is required and must be an object');
  }
  
  const context = req.context as Record<string, unknown>;
  
  if (typeof context.availableCredits !== 'number') {
    throw new RequestError('INVALID_CREDITS', 'context.availableCredits must be a number');
  }
  
  if (typeof context.hasConsent !== 'boolean') {
    throw new RequestError('INVALID_CONSENT', 'context.hasConsent must be a boolean');
  }
  
  // Validate optional inputs
  if (req.inputs !== undefined && (typeof req.inputs !== 'object' || req.inputs === null)) {
    throw new RequestError('INVALID_INPUTS', 'inputs must be an object');
  }
  
  // Validate optional runId
  if (req.runId !== undefined && typeof req.runId !== 'string') {
    throw new RequestError('INVALID_RUN_ID', 'runId must be a string');
  }
  
  // Validate optional registry
  if (context.registry !== undefined) {
    if (typeof context.registry !== 'object' || context.registry === null) {
      throw new RequestError('INVALID_REGISTRY', 'context.registry must be an object');
    }
    
    const registry = context.registry as Record<string, unknown>;
    if (registry.mode !== 'pinned' && registry.mode !== 'latest') {
      throw new RequestError('INVALID_REGISTRY_MODE', "context.registry.mode must be 'pinned' or 'latest'");
    }
  }
  
  return {
    templateId: req.templateId,
    inputs: (req.inputs as Record<string, unknown>) ?? {},
    runId: req.runId as string | undefined,
    context: {
      availableCredits: context.availableCredits,
      hasConsent: context.hasConsent,
      registry: context.registry as RunTemplateRequest['context']['registry'],
    },
  };
}

/**
 * Custom error class for request validation.
 */
class RequestError extends Error {
  readonly code: string;
  
  constructor(code: string, message: string) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
  }
}

function isRequestError(error: unknown): error is RequestError {
  return error instanceof RequestError;
}

// =============================================================================
// HANDLER
// =============================================================================

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return jsonError(405, {
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method is allowed',
    });
  }
  
  try {
    // Parse and validate request
    const request = parseRequest(event.body);
    
    // Build runner options
    const options: RunTemplateOptions = {
      runId: request.runId,
      availableCredits: request.context.availableCredits,
      hasConsent: request.context.hasConsent,
      registry: request.context.registry,
    };
    
    // Run the template
    const output = await runTemplate(request.templateId, request.inputs ?? {}, options);
    
    // Determine status code based on result
    // 404 for template not found, 200 for everything else (receipt tells the story)
    const isNotFound = output.receipt.errors?.some(e => e.code === 'TEMPLATE_NOT_FOUND');
    const statusCode = isNotFound ? 404 : 200;
    
    return jsonSuccess(statusCode, {
      result: output.result,
      resolvedImages: output.resolvedImages,
      receipt: output.receipt,
    });
  } catch (error) {
    // Handle request validation errors
    if (isRequestError(error)) {
      return jsonError(400, {
        code: error.code,
        message: error.message,
      });
    }
    
    // Handle unexpected errors
    console.error('Unexpected error in run-template:', error);
    return jsonError(500, {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  }
};
