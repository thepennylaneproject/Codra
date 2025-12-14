/**
 * CredentialManager Component
 * Main UI for managing API credentials
 * Displays all credentials and provides form to add new ones
 */

import React, { useState, useEffect } from 'react';
import { useCredentials } from '@/lib/api/credentials/hooks';
import { CredentialCard } from './CredentialCard';
import type { EnvironmentType } from '@/lib/api/credentials/types';

export function CredentialManager() {
  const {
    credentials,
    loading,
    error,
    fetchCredentials,
    createCredential,
    deleteCredential,
    updateCredential
  } = useCredentials();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    providerId: 'aimlapi',
    environment: 'dev' as EnvironmentType,
    apiKey: '',
    accountName: ''
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Load credentials on mount
  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const response = await createCredential({
        provider: formData.providerId as any,
        provider_name: providers.find(p => p.id === formData.providerId)?.name || 'Unknown',
        environment: formData.environment,
        encrypted_key: formData.apiKey,
        label: formData.accountName || undefined,
        notes: `Created via Admin Console at ${new Date().toISOString()}`
      });

      if (response) {
        setCreateSuccess(
          `Credential created! Key Hint: ${response.key_hint}`
        );
        setFormData({
          providerId: 'aimlapi',
          environment: 'dev',
          apiKey: '',
          accountName: ''
        });
        setShowAddForm(false);

        // Clear success message after 5 seconds
        setTimeout(() => setCreateSuccess(null), 5000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create credential';
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  const providers = [
    { id: 'aimlapi', name: 'AIML API (200+ models)' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'deepai', name: 'DeepAI' },
    { id: 'github', name: 'GitHub (Personal Access Token)' },
    { id: 'vercel', name: 'Vercel' },
    { id: 'netlify', name: 'Netlify' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">API Credentials</h2>
          <p className="text-text-muted mt-1">
            Manage your encrypted API keys and quotas
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-text-primary font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Credential'}
        </button>
      </div>

      {/* Global Error */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Create Success Message */}
      {createSuccess && (
        <div className="bg-emerald-900 border border-emerald-700 text-emerald-200 p-4 rounded-lg">
          ✓ {createSuccess}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-background-subtle border border-border-subtle rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Add New Credential</h3>

          <form onSubmit={handleAddCredential} className="space-y-4">
            {/* Provider Select */}
            <div>
              <label className="block text-sm font-medium text-text-soft mb-2">
                Provider
              </label>
              <select
                value={formData.providerId}
                onChange={e =>
                  setFormData({ ...formData, providerId: e.target.value })
                }
                className="w-full bg-background-elevated border border-border-strong rounded px-3 py-2 text-text-primary focus:outline-none focus:border-indigo-500"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Environment Select */}
            <div>
              <label className="block text-sm font-medium text-text-soft mb-2">
                Environment
              </label>
              <select
                value={formData.environment}
                onChange={e =>
                  setFormData({
                    ...formData,
                    environment: e.target.value as EnvironmentType
                  })
                }
                className="w-full bg-background-elevated border border-border-strong rounded px-3 py-2 text-text-primary focus:outline-none focus:border-indigo-500"
              >
                <option value="dev">Development</option>
                <option value="staging">Staging</option>
                <option value="prod">Production</option>
              </select>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-text-soft mb-2">
                API Key
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={e =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                placeholder="Paste your API key here"
                className="w-full bg-background-elevated border border-border-strong rounded px-3 py-2 text-text-primary placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-xs text-text-soft mt-1">
                Keys are encrypted before storage. Never stored in plaintext.
              </p>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-text-soft mb-2">
                Account Name (optional)
              </label>
              <input
                type="text"
                value={formData.accountName}
                onChange={e =>
                  setFormData({ ...formData, accountName: e.target.value })
                }
                placeholder="e.g., Production Account"
                className="w-full bg-background-elevated border border-border-strong rounded px-3 py-2 text-text-primary placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Error */}
            {createError && (
              <div className="bg-red-900 border border-red-700 text-red-200 p-3 rounded text-sm">
                {createError}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !formData.apiKey.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-text-primary font-medium py-2 rounded transition-colors"
              >
                {creating ? 'Creating...' : 'Create Credential'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-background-elevated hover:bg-background-default0 text-text-primary font-medium py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Credentials List */}
      {loading ? (
        <div className="text-center py-8 text-text-muted">
          Loading credentials...
        </div>
      ) : credentials.length === 0 ? (
        <div className="bg-background-subtle border border-border-subtle rounded-lg p-8 text-center">
          <p className="text-text-muted mb-4">No credentials yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-text-primary font-medium py-2 px-4 rounded transition-colors"
          >
            Add your first credential
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {credentials.map(credential => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              onDelete={deleteCredential}
              onUpdate={updateCredential}
            />
          ))}
        </div>
      )}
    </div>
  );
}
