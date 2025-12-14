/**
 * CredentialCard Component
 * Displays a single API credential with test, rotate, and delete actions
 */

import { useState } from 'react';
import { useCredentialTest, useCredentialRotation, useCredentialUsage } from '@/lib/api/credentials/hooks';
import type { ApiCredential } from '@/lib/api/credentials/types';

interface CredentialCardProps {
  credential: ApiCredential;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<ApiCredential>) => Promise<void | ApiCredential>;
}

export function CredentialCard({
  credential,
  onDelete,
  onUpdate
}: CredentialCardProps) {
  const [showRotateForm, setShowRotateForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { testing, testResults, testError, testCredential } = useCredentialTest();
  const { rotating, rotationError, rotateCredential } = useCredentialRotation();
  const { usage } = useCredentialUsage(credential.id);

  const testResult = testResults[credential.id];

  const handleTest = async () => {
    try {
      await testCredential(credential.id);
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const handleRotate = async () => {
    if (!newApiKey.trim()) return;
    try {
      await rotateCredential(credential.id, newApiKey);
      setNewApiKey('');
      setShowRotateForm(false);
    } catch (error) {
      console.error('Rotation failed:', error);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(credential.id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      await onUpdate(credential.id, { is_active: !credential.is_active });
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  // Status badge colors
  const statusColors: Record<string, string> = {
    success: 'bg-emerald-900 text-emerald-200',
    failed: 'bg-red-900 text-red-200',
    untested: 'bg-gray-700 text-text-soft'
  };

  const statusColor = statusColors[credential.test_status || 'untested'];

  return (
    <div className="bg-background-subtle border border-border-subtle rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary capitalize">
            {credential.provider}
          </h3>
          <p className="text-sm text-text-muted">
            Environment: <span className="font-mono text-indigo-300">{credential.environment}</span>
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${statusColor}`}>
            {credential.test_status === 'success'
              ? '✓ Valid'
              : credential.test_status === 'failed'
                ? '✗ Invalid'
                : '⊘ Untested'}
          </span>
          <button
            onClick={handleToggleActive}
            className={`px-2.5 py-0.5 rounded text-xs font-medium ${credential.is_active
              ? 'bg-indigo-900 text-indigo-200'
              : 'bg-gray-700 text-text-soft'
              }`}
          >
            {credential.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {/* Key Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-text-muted">Key Hint</span>
          <span className="text-xs font-mono text-text-soft">{credential.key_hint}</span>
        </div>
        {credential.last_tested_at && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Last Tested</span>
            <span className="text-xs text-text-soft">
              {new Date(credential.last_tested_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      {usage && (
        <div className="bg-background-elevated rounded p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Usage</span>
            <span className="text-text-primary font-semibold">
              {usage.monthly_usage} / {usage.monthly_limit} requests
            </span>
          </div>
          <div className="w-full bg-surface-chip rounded-full h-2">
            <div
              className={`h-full rounded-full transition-colors ${usage.status === 'ok'
                ? 'bg-emerald-500'
                : usage.status === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
                }`}
              style={{ width: `${Math.min(usage.monthly_percentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{usage.monthly_percentage.toFixed(1)}%</span>
            <span>Resets End of Month</span>
          </div>
        </div>
      )}

      {/* Test Result Message */}
      {testResult && (
        <div
          className={`text-sm p-3 rounded flex items-center gap-2 ${testResult.success
            ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-200'
            : 'bg-red-900/30 border border-red-700 text-red-200'
            }`}
        >
          <span className="text-lg">
            {testResult.success ? '✓' : '✕'}
          </span>
          <div className="flex-1">
            <div className="font-medium">{testResult.message}</div>
            {testResult.responseTime > 0 && (
              <div className="text-xs opacity-75 mt-1">
                Response time: {testResult.responseTime}ms
              </div>
            )}
          </div>
        </div>
      )}

      {testError && (
        <div className="text-sm bg-red-900 text-red-200 p-2 rounded">
          {testError}
        </div>
      )}

      {rotationError && (
        <div className="text-sm bg-red-900 text-red-200 p-2 rounded">
          {rotationError}
        </div>
      )}

      {/* Rotate Form */}
      {showRotateForm && (
        <div className="bg-background-elevated rounded p-3 space-y-2">
          <label className="block text-sm text-text-soft">New API Key</label>
          <input
            type="password"
            value={newApiKey}
            onChange={e => setNewApiKey(e.target.value)}
            placeholder="Paste new API key"
            className="w-full bg-background-subtle border border-border-subtle rounded px-3 py-2 text-sm text-text-primary placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleRotate}
              disabled={rotating === credential.id || !newApiKey.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-text-primary text-sm font-medium py-2 rounded transition-colors"
            >
              {rotating === credential.id ? 'Rotating...' : 'Rotate Key'}
            </button>
            <button
              onClick={() => {
                setShowRotateForm(false);
                setNewApiKey('');
              }}
              className="flex-1 bg-surface-chip hover:bg-zinc-600 text-text-primary text-sm font-medium py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="bg-red-900 border border-red-700 rounded p-3 space-y-2">
          <p className="text-sm text-red-200">
            Delete this credential? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-text-primary text-sm font-medium py-2 rounded transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 bg-red-800 hover:bg-red-700 text-text-primary text-sm font-medium py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!showRotateForm && !showDeleteConfirm && (
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={testing === credential.id}
            className={`flex-1 text-sm font-medium py-2 px-3 rounded transition-colors ${
              testing === credential.id
                ? 'bg-emerald-900/50 text-emerald-300 cursor-wait'
                : 'bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-700/30 text-emerald-200 hover:text-emerald-100'
            }`}
          >
            {testing === credential.id ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">⟳</span>
                Testing...
              </span>
            ) : (
              'Test Connection'
            )}
          </button>
          <button
            onClick={() => setShowRotateForm(true)}
            className="flex-1 bg-indigo-900/20 hover:bg-indigo-900/30 border border-indigo-700/30 text-indigo-200 hover:text-indigo-100 text-sm font-medium py-2 rounded transition-colors"
          >
            Rotate Key
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 bg-red-900/20 hover:bg-red-900/30 border border-red-700/30 text-red-200 hover:text-red-100 text-sm font-medium py-2 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
