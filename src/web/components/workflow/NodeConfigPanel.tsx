'use client';

/**
 * AgentFlow Pro - Node Configuration Panel
 * Right sidebar for configuring selected node
 */

import { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/lib/workflow/workflow-store';

interface NodeConfigPanelProps {
  nodeId: string | null;
  onClose: () => void;
}

export default function NodeConfigPanel({ nodeId, onClose }: NodeConfigPanelProps) {
  const { currentWorkflow, updateNode, deleteNode } = useWorkflowStore();
  const [config, setConfig] = useState<Record<string, any>>({});

  // Get selected node
  const selectedNode = currentWorkflow?.nodes.find(n => n.id === nodeId);

  // Load config when node changes
  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data.config || {});
    }
  }, [selectedNode]);

  // Handle config change
  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (selectedNode) {
      updateNode(selectedNode.id, { config: newConfig });
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedNode) {
      deleteNode(selectedNode.id);
      onClose();
    }
  };

  if (!nodeId || !selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="text-center text-gray-500 mt-8">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-sm">Select a node to configure</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl">{selectedNode.data.icon}</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <h3 className="font-bold text-gray-900">{selectedNode.data.label}</h3>
        <p className="text-xs text-gray-500 mt-1 capitalize">
          Type: {selectedNode.type}
        </p>
      </div>

      {/* Config form */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Common settings */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Node Name
          </label>
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type-specific settings */}
        {selectedNode.type === 'trigger' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Type
              </label>
              <select
                value={config.type || 'webhook'}
                onChange={(e) => handleConfigChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="webhook">Webhook</option>
                <option value="schedule">Schedule</option>
                <option value="event">Event</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {config.type === 'schedule' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={config.schedule || ''}
                  onChange={(e) => handleConfigChange('schedule', e.target.value)}
                  placeholder="0 0 * * *"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: 0 0 * * * (daily at midnight)
                </p>
              </div>
            )}
          </>
        )}

        {selectedNode.type === 'agent' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent
              </label>
              <select
                value={config.agentId || ''}
                onChange={(e) => handleConfigChange('agentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select agent...</option>
                <option value="research-agent">Research Agent</option>
                <option value="content-agent">Content Agent</option>
                <option value="code-agent">Code Agent</option>
                <option value="communication-agent">Communication Agent</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input
              </label>
              <textarea
                value={config.input || ''}
                onChange={(e) => handleConfigChange('input', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter agent input..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={config.timeout || 30}
                onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {selectedNode.type === 'action' && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={config.actionType || 'api'}
                onChange={(e) => handleConfigChange('actionType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="api">API Call</option>
                <option value="email">Email</option>
                <option value="database">Database</option>
                <option value="file">File</option>
              </select>
            </div>

            {config.actionType === 'api' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={config.endpoint || ''}
                    onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                    placeholder="https://api.example.com/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Method
                  </label>
                  <select
                    value={config.method || 'GET'}
                    onChange={(e) => handleConfigChange('method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
              </>
            )}
          </>
        )}

        {selectedNode.type === 'condition' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition Expression
            </label>
            <input
              type="text"
              value={config.expression || ''}
              onChange={(e) => handleConfigChange('expression', e.target.value)}
              placeholder="value > 100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}
