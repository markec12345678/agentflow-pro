'use client';

/**
 * AgentFlow Pro - Workflow Node
 * Custom node component for React Flow
 */

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface WorkflowNodeData {
  label: string;
  icon: string;
  description?: string;
  config?: Record<string, any>;
  type?: string;
}

function WorkflowNodeComponent({ data, selected }: NodeProps<WorkflowNodeData>) {
  const getNodeTypeColor = (type?: string) => {
    switch (type) {
      case 'trigger':
        return 'border-green-500 bg-green-50';
      case 'agent':
        return 'border-blue-500 bg-blue-50';
      case 'action':
        return 'border-purple-500 bg-purple-50';
      case 'condition':
        return 'border-yellow-500 bg-yellow-50';
      case 'end':
        return 'border-gray-500 bg-gray-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getIconColor = (type?: string) => {
    switch (type) {
      case 'trigger':
        return 'text-green-600';
      case 'agent':
        return 'text-blue-600';
      case 'action':
        return 'text-purple-600';
      case 'condition':
        return 'text-yellow-600';
      case 'end':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg shadow-lg border-2 transition-all cursor-pointer
        ${getNodeTypeColor(data.type)}
        ${selected ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-xl'}
        min-w-[200px] max-w-[300px]`}
    >
      {/* Input handle */}
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-gray-400 !w-3 !h-3"
        />
      )}

      {/* Node content */}
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${getIconColor(data.type)}`}>
          {data.icon || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">
            {data.label}
          </div>
          {data.description && (
            <div className="text-xs text-gray-500 truncate mt-1">
              {data.description}
            </div>
          )}
          {data.config && Object.keys(data.config).length > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {Object.keys(data.config).length} settings configured
            </div>
          )}
        </div>
      </div>

      {/* Output handle */}
      {data.type !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-blue-500 !w-3 !h-3"
          id="output"
        />
      )}

      {/* Condition handles */}
      {data.type === 'condition' && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            className="!bg-green-500 !w-3 !h-3"
            id="true"
            style={{ top: '60%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            className="!bg-red-500 !w-3 !h-3"
            id="false"
            style={{ top: '80%' }}
          />
          <div className="absolute right-0 top-[55%] text-xs text-green-600 font-medium ml-6">
            Yes
          </div>
          <div className="absolute right-0 top-[75%] text-xs text-red-600 font-medium ml-6">
            No
          </div>
        </>
      )}
    </div>
  );
}

export default memo(WorkflowNodeComponent);
