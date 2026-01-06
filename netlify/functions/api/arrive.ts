/**
 * Netlify Function: Arrive
 * Wires project context, fragments, and inferred shadow into debate.
 */

import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { AIRouter } from '../../../src/lib/ai/router';
import { AimlApiProvider } from '../../../src/lib/ai/providers/aimlapi';
import { DeepSeekProvider } from '../../../src/lib/ai/providers/deepseek';
import { GeminiProvider } from '../../../src/lib/ai/providers/gemini';
import { OpenAIProvider } from '../../../src/lib/ai/providers/openai';
import { MistralProvider } from '../../../src/lib/ai/providers/mistral';
import { CohereProvider } from '../../../src/lib/ai/providers/cohere';
import { HuggingFaceProvider } from '../../../src/lib/ai/providers/huggingface';
import type { AIMessage } from '../../../src/lib/ai/types';
import {
  conductDebate,
  createAIAdversary,
  createAICritic,
  createAIExplorer,
  createAISynthesizer,
  createAIVerifier,
  DebateOrchestratorError,
  type DebateOptions,
  estimateDebateCost,
} from '../../../src/lib/thinking/debate';
import { synthesizeLocally, synthesisToShadowProject } from '../../../src/lib/thinking/shadow-synthesizer';
import type { CostEstimate, DebateConsent, DebateModelPlan, DebateModelUsage, Fragment, ShadowProject } from '../../../src/lib/thinking/types';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const userSecret = process.env.SUPABASE_USER_SECRET || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface ArriveRequest {
  projectId: string;
  fragments: FragmentInput[];
  shadow?: ShadowProjectInput;
  model?: string;
  provider?: string;
  timeoutMs?: number;
  consent?: DebateConsentInput;
}

interface FragmentInput {
  id: string;
  content: string;
  timestamp: string | number | Date;
  type: Fragment['type'];
  strength: Fragment['strength'];
  mentionCount: number;
  relatedFragments?: string[];
  confidence: number;
}

interface ShadowProjectInput {
  id: string;
  inferredType: ShadowProject['inferredType'];
  coreBeliefs: string[];
  constraints: string[];
  anxieties: string[];
  aesthetics: string[];
  antiPatterns: string[];
  openQuestions: string[];
  readinessScore: number;
  lastUpdated: string | number | Date;
}

interface DebateConsentInput {
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  estimateHash?: string;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return jsonError(405, { code: 'method_not_allowed', message: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonError(500, { code: 'config_error', message: 'Supabase is not configured' });
  }

  try {
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError(401, { code: 'unauthorized', message: 'Unauthorized' });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return jsonError(401, { code: 'invalid_token', message: 'Invalid token' });
    }

    const body = parseRequest(event.body);
    if (!body.projectId) {
      return jsonError(400, { code: 'missing_input', message: 'projectId is required' });
    }

    const fragments = parseFragments(body.fragments);

    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .eq('id', body.projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !projectData) {
      return jsonError(404, { code: 'not_found', message: 'Project not found' });
    }

    const shadow = resolveShadow(fragments, body.shadow, body.projectId);
    const modelPlan = buildModelPlan(body);
    const estimate = estimateDebateCost(shadow, fragments, { modelPlan });
    const consent = buildConsent(body, estimate);
    const modelUsage: DebateModelUsage[] = [];

    const router = await buildRouter(user.id, body.provider);
    const debateOptions: DebateOptions = buildDebateOptions(router, modelUsage, body, consent, modelPlan);

    const timeoutMs = typeof body.timeoutMs === 'number' ? body.timeoutMs : 20000;
    const proposal = await withTimeout(
      conductDebate(shadow, fragments, { ...debateOptions, modelUsage }),
      timeoutMs
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ proposal }),
    };
  } catch (error) {
    if (isApiRequestError(error)) {
      return jsonError(400, {
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (isDebateOrchestratorError(error)) {
      return jsonError(400, {
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (isTimeoutError(error)) {
      return jsonError(504, { code: 'timeout', message: error.message });
    }

    return jsonError(500, { code: 'internal_error', message: 'Unexpected error' });
  }
};

function parseRequest(body: string | null): ArriveRequest {
  if (!body) {
    throw new ApiRequestError('missing_body', 'Request body is required');
  }

  try {
    return JSON.parse(body) as ArriveRequest;
  } catch {
    throw new ApiRequestError('invalid_json', 'Request body is not valid JSON');
  }
}

function buildConsent(
  body: ArriveRequest,
  estimate: CostEstimate
): DebateConsent {
  if (!body.consent?.approved) {
    throw new ApiRequestError('consent_required', 'Debate consent is required', {
      estimate,
      next: 'resubmit_with_consent',
    });
  }

  if (!body.consent.estimateHash) {
    throw new ApiRequestError('consent_invalid', 'consent.estimateHash is required', {
      estimate,
      next: 'resubmit_with_consent',
    });
  }

  if (body.consent.estimateHash !== estimate.estimateHash) {
    throw new ApiRequestError('consent_invalid', 'Consent estimate hash mismatch', {
      estimate,
      expectedHash: estimate.estimateHash,
      providedHash: body.consent.estimateHash,
      next: 'resubmit_with_consent',
    });
  }

  return {
    approved: true,
    approvedAt: body.consent.approvedAt,
    approvedBy: body.consent.approvedBy,
    estimateHash: body.consent.estimateHash,
  };
}

function parseFragments(input: FragmentInput[]): Fragment[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ApiRequestError('missing_fragments', 'fragments are required');
  }

  return input.map((fragment, index) => {
    if (!fragment || typeof fragment !== 'object') {
      throw new ApiRequestError('invalid_fragment', 'Fragment must be an object', { index });
    }

    if (!fragment.id || !fragment.content) {
      throw new ApiRequestError('invalid_fragment', 'Fragment id and content are required', { index });
    }

    const timestamp = new Date(fragment.timestamp);
    if (Number.isNaN(timestamp.getTime())) {
      throw new ApiRequestError('invalid_fragment', 'Fragment timestamp is invalid', { index });
    }

    return {
      id: String(fragment.id),
      content: String(fragment.content),
      timestamp,
      type: fragment.type,
      strength: fragment.strength,
      mentionCount: Number(fragment.mentionCount),
      relatedFragments: Array.isArray(fragment.relatedFragments) ? fragment.relatedFragments : [],
      confidence: Number(fragment.confidence),
    };
  });
}

function resolveShadow(
  fragments: Fragment[],
  providedShadow: ShadowProjectInput | undefined,
  projectId: string
): ShadowProject {
  const synthesis = synthesizeLocally(fragments);
  const shadowId = providedShadow?.id || projectId;
  const shadow = synthesisToShadowProject(synthesis, shadowId);

  if (!providedShadow) {
    return shadow;
  }

  return {
    ...shadow,
    inferredType: providedShadow.inferredType,
    coreBeliefs: providedShadow.coreBeliefs,
    constraints: providedShadow.constraints,
    anxieties: providedShadow.anxieties,
    aesthetics: providedShadow.aesthetics,
    antiPatterns: providedShadow.antiPatterns,
    openQuestions: providedShadow.openQuestions,
    readinessScore: providedShadow.readinessScore,
    lastUpdated: new Date(providedShadow.lastUpdated),
  };
}

function buildDebateOptions(
  router: AIRouter,
  modelUsage: DebateModelUsage[],
  body: ArriveRequest,
  consent: DebateConsent,
  modelPlan: DebateModelPlan[]
): DebateOptions {
  const model = body.model || 'gpt-4o';
  const provider = body.provider;

  const createComplete = (role: DebateModelUsage['role']) => {
    return async (systemPrompt: string, userPrompt: string) => {
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const result = await router.complete({
        model,
        messages,
        provider,
      });

      modelUsage.push({
        role,
        provider: result.provider,
        model: result.model,
        tokensUsed: result.usage.totalTokens,
        cost: result.cost,
      });

      return result.content;
    };
  };

  return {
    explorer: createAIExplorer(createComplete('explorer')),
    critic: createAICritic(createComplete('critic')),
    adversary: createAIAdversary(createComplete('adversary')),
    synthesizer: createAISynthesizer(createComplete('synthesizer')),
    verifier: createAIVerifier(createComplete('verifier')),
    consent,
    modelPlan,
  };
}

function buildModelPlan(body: ArriveRequest): DebateModelPlan[] {
  const model = body.model;
  const provider = body.provider;
  const roles = ['explorer', 'critic', 'adversary', 'synthesizer', 'verifier'] as const;
  return roles.map((role) => ({
    role,
    model,
    provider,
  }));
}

async function buildRouter(userId: string, provider?: string): Promise<AIRouter> {
  const router = new AIRouter({
    primaryProvider: provider || 'aimlapi',
    fallbackProviders: ['openai', 'deepseek', 'gemini', 'mistral', 'cohere', 'huggingface'],
  });

  const registrations = [
    registerProvider('aimlapi', userId, (key) => router.registerProvider(new AimlApiProvider(key))),
    registerProvider('deepseek', userId, (key) => router.registerProvider(new DeepSeekProvider(key))),
    registerProvider('gemini', userId, (key) => router.registerProvider(new GeminiProvider(key))),
    registerProvider('openai', userId, (key) => router.registerProvider(new OpenAIProvider(key))),
    registerProvider('mistral', userId, (key) => router.registerProvider(new MistralProvider(key))),
    registerProvider('cohere', userId, (key) => router.registerProvider(new CohereProvider(key))),
    registerProvider('huggingface', userId, (key) => router.registerProvider(new HuggingFaceProvider(key))),
  ];

  const results = await Promise.all(registrations);
  const registeredCount = results.filter(Boolean).length;

  if (registeredCount === 0) {
    throw new ApiRequestError('no_credentials', 'No active AI credentials found');
  }

  return router;
}

async function registerProvider(
  provider: string,
  userId: string,
  register: (key: string) => void
): Promise<boolean> {
  try {
    const key = await getCredentialForProvider(userId, provider);
    register(key);
    return true;
  } catch {
    return false;
  }
}

async function getCredentialForProvider(userId: string, provider: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('api_credentials')
    .select('encrypted_key, iv, auth_tag')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('environment', process.env.NODE_ENV || 'development')
    .single();

  if (error || !data) {
    throw new Error(`No credentials found for provider: ${provider}`);
  }

  const crypto = require('crypto');
  const decryptionKey = crypto
    .createHash('sha256')
    .update(`${userId}:${userSecret}`)
    .digest();

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    decryptionKey,
    Buffer.from(data.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(data.auth_tag, 'hex'));

  let decrypted = decipher.update(data.encrypted_key, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

function jsonError(statusCode: number, error: ApiError) {
  return {
    statusCode,
    headers,
    body: JSON.stringify({ error }),
  };
}

class ApiRequestError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.details = details;
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

function isDebateOrchestratorError(error: unknown): error is DebateOrchestratorError {
  return error instanceof DebateOrchestratorError;
}

function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new ApiRequestError('invalid_timeout', 'timeoutMs must be a positive number');
  }

  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(`Debate timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}
