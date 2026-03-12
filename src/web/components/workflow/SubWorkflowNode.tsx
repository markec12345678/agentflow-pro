/**
 * Sub-workflow Node Component
 * Allows embedding workflows within workflows
 */

import { Handle, Position } from "@xyflow/react";

export interface SubWorkflowNodeData {
  label: string;
  subWorkflowId: string;
  subWorkflowName: string;
  inputs: string[];
  outputs: string[];
  version?: number;
}

export const SubWorkflowNode = ({ data, selected }: { data: SubWorkflowNodeData; selected: boolean }) => {
  return (
    <div className={`p-4 rounded-2xl border-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 shadow-xl min-w-[280px] ${
      selected ? 'border-indigo-600 scale-105 ring-2 ring-indigo-200' : 'border-indigo-200 dark:border-gray-700'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-600" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-indigo-600 text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Sub-workflow</p>
          <p className="text-sm font-bold truncate">{data.subWorkflowName || data.label}</p>
        </div>
      </div>

      {data.version && (
        <div className="mb-2">
          <span className="text-xs text-gray-500">Version: </span>
          <span className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
            v{data.version}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500 block mb-1">Inputs:</span>
          {data.inputs?.map((input, i) => (
            <div key={i} className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mb-1 truncate">
              {input}
            </div>
          ))}
        </div>
        <div>
          <span className="text-gray-500 block mb-1">Outputs:</span>
          {data.outputs?.map((output, i) => (
            <div key={i} className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mb-1 truncate">
              {output}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Workflow ID:</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400 truncate max-w-[150px]">
            {data.subWorkflowId}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-600" />
    </div>
  );
};

// Sub-workflow selector modal component
export interface SubWorkflowSelectorProps {
  onSelect: (workflowId: string, workflowName: string) => void;
  onClose: () => void;
  currentWorkflowId?: string;
}

export const SubWorkflowSelector = ({ onSelect, onClose, currentWorkflowId }: SubWorkflowSelectorProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Select Sub-workflow</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose a workflow to embed as a sub-workflow. The selected workflow will be executed with the parent's data.
          </p>
          
          <div className="space-y-2">
            {/* This would fetch from API in real implementation */}
            <div className="p-4 border rounded-lg hover:border-indigo-500 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Guest Communication Flow</h3>
                  <p className="text-sm text-gray-500">Automated guest messaging workflow</p>
                </div>
                <button
                  onClick={() => onSelect('wf-guest-comm', 'Guest Communication Flow')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Select
                </button>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg hover:border-indigo-500 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Booking Confirmation</h3>
                  <p className="text-sm text-gray-500">Send booking confirmation emails</p>
                </div>
                <button
                  onClick={() => onSelect('wf-booking-conf', 'Booking Confirmation')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Select
                </button>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg hover:border-indigo-500 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Review Request Automation</h3>
                  <p className="text-sm text-gray-500">Request reviews after checkout</p>
                </div>
                <button
                  onClick={() => onSelect('wf-review-req', 'Review Request Automation')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Note: Circular references are not allowed
            </span>
            {currentWorkflowId && (
              <span className="text-gray-500">
                Current workflow: {currentWorkflowId}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
