'use client';

/**
 * API Key Management UI
 * Create, rotate, and revoke API keys
 */

import { useState, useEffect } from 'react';

interface APIKey {
  keyId: string;
  name: string;
  keyPrefix: string; // Show only first 8 chars
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  status: 'active' | 'revoked' | 'expired';
  permissions: string[];
  createdBy: string;
}

interface APIKeyCreateRequest {
  name: string;
  permissions: string[];
  expiresAt?: string;
}

export function APIKeyManager() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read']);

  const permissions = [
    { id: 'read', label: 'Read access', description: 'View resources' },
    { id: 'write', label: 'Write access', description: 'Create and update resources' },
    { id: 'delete', label: 'Delete access', description: 'Delete resources' },
    { id: 'admin', label: 'Admin access', description: 'Full administrative access' },
  ];

  // Fetch API keys
  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      const data = await response.json();
      if (data.success) {
        setKeys(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  // Create new API key
  const createKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          permissions: selectedPermissions,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedKey(data.data.key); // Full key shown only once
        setKeys([...keys, data.data.keyInfo]);
        setNewKeyName('');
        setSelectedPermissions(['read']);
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  // Revoke API key
  const revokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      setKeys(keys.filter(k => k.keyId !== keyId));
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  // Rotate API key
  const rotateKey = async (keyId: string) => {
    if (!confirm('Rotate this API key? The old key will stop working immediately.')) return;

    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}/rotate`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedKey(data.data.key); // New key shown only once
      }
    } catch (error) {
      console.error('Failed to rotate API key:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🔑 API Key Management</h1>
            <p className="text-gray-600">
              Create and manage API keys for programmatic access
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create API Key
          </button>
        </div>
      </div>

      {/* API Keys List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Permissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {keys.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <div className="text-4xl mb-3">🔐</div>
                  <p>No API keys yet. Create your first API key above.</p>
                </td>
              </tr>
            ) : (
              keys.map(key => (
                <tr key={key.keyId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{key.name}</div>
                    <div className="text-xs text-gray-500">
                      by {key.createdBy}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {key.keyPrefix}••••••••••••
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {key.permissions.map(perm => (
                        <span
                          key={perm}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {key.lastUsedAt ? (
                      new Date(key.lastUsedAt).toLocaleDateString()
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      key.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : key.status === 'revoked'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {key.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => rotateKey(key.keyId)}
                        disabled={key.status !== 'active'}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50 text-sm"
                      >
                        Rotate
                      </button>
                      <button
                        onClick={() => revokeKey(key.keyId)}
                        disabled={key.status !== 'active'}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 text-sm"
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create API Key</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {permissions.map(perm => (
                    <label key={perm.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm.id]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== perm.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm">{perm.label}</div>
                        <div className="text-xs text-gray-500">{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setGeneratedKey(null);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  createKey();
                  setShowCreateModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Key Modal */}
      {generatedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔑</div>
              <h2 className="text-xl font-bold">API Key Generated</h2>
              <p className="text-sm text-gray-600 mt-1">
                Copy this key now. You won't be able to see it again!
              </p>
            </div>

            <div className="mb-4">
              <code className="block w-full p-4 bg-gray-100 rounded-lg text-sm break-all border border-gray-300">
                {generatedKey}
              </code>
            </div>

            <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-600">⚠️</span>
              <div className="text-sm text-amber-800">
                <strong>Important:</strong> This key grants access according to the permissions you selected.
                Store it securely and never commit it to version control.
              </div>
            </div>

            <button
              onClick={() => setGeneratedKey(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              I've Copied the Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default APIKeyManager;
