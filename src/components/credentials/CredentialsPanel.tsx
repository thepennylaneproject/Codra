/**
 * CredentialsPanel Component
 * Integrates secure credential management into the Admin Console
 * Shows quota usage, alerts, and credential lifecycle management
 */

import React, { useState, useEffect } from 'react';
import { CredentialsAdapter, type Credential, type QuotaInfo } from '@/lib/api/credentials';

interface CredentialItemProps {
  credential: Credential;
  quotaInfo?: QuotaInfo;
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
  onRotate: (id: string) => void;
  isLoading: boolean;
}

/**
 * Individual credential row with status and quota
 */
function CredentialItem({
  credential,
  quotaInfo,
  onTest,
  onDelete,
  onRotate,
  isLoading,
}: CredentialItemProps) {
  return (
    <div className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      {/* Header: Provider + Masked Key */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <div>
            <p className="font-medium text-zinc-100">{credential.provider}</p>
            <p className="text-xs text-zinc-500">
              {credential.maskedKey} • {credential.environment}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {credential.testStatus === 'success' && (
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Valid" />
          )}
          {credential.testStatus === 'failed' && (
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Invalid" />
          )}
          {!credential.testStatus && (
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" title="Unknown" />
          )}
        </div>
      </div>

      {/* Quota Display */}
      {quotaInfo && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Usage: {quotaInfo.usage.requests} requests</span>
            <span className={`font-semibold ${quotaInfo.status === 'exceeded'
              ? 'text-red-400'
              : quotaInfo.status === 'critical'
                ? 'text-orange-400'
                : quotaInfo.status === 'warning'
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }`}>
              {quotaInfo.percentageUsed}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${quotaInfo.status === 'exceeded'
                ? 'bg-red-500'
                : quotaInfo.status === 'critical'
                  ? 'bg-orange-500'
                  : quotaInfo.status === 'warning'
                    ? 'bg-yellow-500'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
              style={{ width: `${Math.min(quotaInfo.percentageUsed, 100)}%` }}
            />
          </div>

          {/* Quota alert */}
          {quotaInfo.status !== 'ok' && (
            <div
              className={`text-xs px-2 py-1.5 rounded ${quotaInfo.status === 'exceeded'
                ? 'bg-red-950 text-red-300'
                : 'bg-yellow-950 text-yellow-300'
                }`}
            >
              {quotaInfo.status === 'exceeded'
                ? '⚠️ Quota exceeded'
                : quotaInfo.status === 'critical'
                  ? '⚠️ Quota critical'
                  : '⚠️ Quota warning'}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-zinc-800">
        <button
          onClick={() => onTest(credential.id)}
          disabled={isLoading}
          className="flex-1 px-2 py-1 text-xs rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 transition-colors text-zinc-300"
        >
          {isLoading ? 'Testing...' : 'Test'}
        </button>
        <button
          onClick={() => onRotate(credential.id)}
          disabled={isLoading}
          className="flex-1 px-2 py-1 text-xs rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 transition-colors text-zinc-300"
          title="Rotate to new key"
        >
          Rotate
        </button>
        <button
          onClick={() => onDelete(credential.id)}
          disabled={isLoading}
          className="flex-1 px-2 py-1 text-xs rounded bg-zinc-900 hover:bg-red-950 disabled:opacity-50 transition-colors text-red-400 hover:text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/**
 * Form to add new credential
 */
function AddCredentialForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (
    provider: string,
    key: string,
    env: string,
    name?: string
  ) => Promise<void>;
  isLoading: boolean;
}) {
  const [provider, setProvider] = useState('aimlapi');
  const [apiKey, setApiKey] = useState('');
  const [environment, setEnvironment] = useState('development');
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    try {
      await onSubmit(provider, apiKey, environment, name || undefined);
      setApiKey('');
      setName('');
      setProvider('aimlapi');
      setEnvironment('development');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add credential');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      <h3 className="font-semibold text-zinc-100">Add Credential</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          >
            <option value="aimlapi">aimlapi</option>
            <option value="deepseek">DeepSeek</option>
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="deepai">DeepAI</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Environment
          </label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          Name (optional)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Main API Key"
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">
          API Key *
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk_... or api_..."
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
        <p className="text-xs text-zinc-500 mt-1">
          🔒 Encrypted server-side. Never stored in plaintext.
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-950 border border-red-800 rounded text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 rounded font-medium text-sm text-white transition-all"
      >
        {isLoading ? 'Adding...' : 'Add Credential'}
      </button>
    </form>
  );
}

/**
 * Main CredentialsPanel
 */
export function CredentialsPanel() {
  // const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [quotaMap, setQuotaMap] = useState<Record<string, QuotaInfo>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testingId, setTestingId] = useState<string>();
  const [error, setError] = useState<string>();
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>(
    'development'
  );

  // Load credentials
  useEffect(() => {
    loadCredentials();
  }, [environment]);

  const loadCredentials = async () => {
    try {
      setIsLoading(true);
      const creds = await CredentialsAdapter.getCredentials(environment);
      setCredentials(creds);

      // Load quota info for each credential
      const quotaData: Record<string, QuotaInfo> = {};
      for (const cred of creds) {
        try {
          quotaData[cred.id] = await CredentialsAdapter.getQuotaInfo(cred.id);
        } catch (err) {
          console.error(`Failed to load quota for ${cred.id}:`, err);
        }
      }
      setQuotaMap(quotaData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCredential = async (
    provider: string,
    apiKey: string,
    env: string,
    name?: string
  ) => {
    try {
      setIsLoading(true);
      await CredentialsAdapter.createCredential(provider as any, apiKey, env as any, {
        name,
      });
      await loadCredentials();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async (credentialId: string) => {
    try {
      setTestingId(credentialId);
      await CredentialsAdapter.testCredential(credentialId);
      await loadCredentials(); // Refresh to show test status
    } finally {
      setTestingId(undefined);
    }
  };

  const handleDelete = async (credentialId: string) => {
    if (!window.confirm('Delete this credential?')) return;

    try {
      setIsLoading(true);
      await CredentialsAdapter.deleteCredential(credentialId);
      await loadCredentials();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRotate = async (credentialId: string) => {
    const newKey = window.prompt('Enter new API key:');
    if (!newKey) return;

    try {
      setIsLoading(true);
      await CredentialsAdapter.rotateKey(credentialId, newKey);
      await loadCredentials();
    } finally {
      setIsLoading(false);
    }
  };

  // Count critical quotas
  const criticalQuotas = Object.values(quotaMap).filter(
    (q) => q.status === 'critical' || q.status === 'exceeded'
  );

  return (
    <div className="space-y-6">
      {/* Alert Banner for Critical Quotas */}
      {criticalQuotas.length > 0 && (
        <div className="px-4 py-3 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-sm text-red-300">
            ⚠️ {criticalQuotas.length} credential{criticalQuotas.length !== 1 ? 's' : ''} approaching or exceeding quota limits
          </p>
        </div>
      )}

      {/* Environment Selector */}
      <div className="flex gap-2">
        {(['development', 'staging', 'production'] as const).map((env) => (
          <button
            key={env}
            onClick={() => setEnvironment(env)}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${environment === env
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
          >
            {env.charAt(0).toUpperCase() + env.slice(1)}
          </button>
        ))}
      </div>

      {/* Add Credential Form */}
      <AddCredentialForm onSubmit={handleAddCredential} isLoading={isLoading} />

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 bg-red-950 border border-red-800 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Credentials List */}
      {credentials.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          No credentials configured for {environment}
        </div>
      ) : (
        <div className="grid gap-4">
          {credentials.map((credential) => (
            <CredentialItem
              key={credential.id}
              credential={credential}
              quotaInfo={quotaMap[credential.id]}
              onTest={handleTest}
              onDelete={handleDelete}
              onRotate={handleRotate}
              isLoading={testingId === credential.id || isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
