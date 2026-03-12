'use client';

/**
 * AgentFlow Pro - Workflow Toolbar
 * Top toolbar with workflow actions
 */

import { Workflow } from '@/lib/workflow/types';

interface WorkflowToolbarProps {
  workflow: Workflow | null;
  onSave: () => void;
  onTest: () => void;
}

export default function WorkflowToolbar({ workflow, onSave, onTest }: WorkflowToolbarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-bold text-gray-900">
            {workflow?.name || 'New Workflow'}
          </h1>
          {workflow && (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                workflow.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {workflow.status}
              </span>
              <span>•</span>
              <span>
                {workflow.nodes.length} nodes
              </span>
              <span>•</span>
              <span>
                {workflow.connections.length} connections
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Center section - actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTest}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ▶ Test
        </button>
        
        <button
          onClick={onSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          💾 Save
        </button>
      </div>

      {/* Right section - status */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-500">
          Last saved: {workflow?.updatedAt ? new Date(workflow.updatedAt).toLocaleString() : 'Never'}
        </div>
      </div>
    </div>
  );
}
