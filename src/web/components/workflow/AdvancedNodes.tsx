/**
 * Advanced Workflow Node Types
 * Router, Loop, Merge, Code, HTTP Request nodes
 */

import { Handle, Position } from "@xyflow/react";

// --- Router Node (Split paths based on conditions) ---
export interface RouterNodeData {
  label: string;
  routes: Array<{
    id: string;
    label: string;
    condition: {
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
      value: any;
    };
  }>;
  defaultRoute?: string;
}

export const RouterNode = ({ data, selected }: { data: RouterNodeData; selected: boolean }) => {
  return (
    <div className={`p-4 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-xl min-w-[280px] ${
      selected ? 'border-purple-500 scale-105' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Router</p>
          <p className="text-sm font-bold">{data.label}</p>
        </div>
      </div>

      <div className="space-y-2">
        {data.routes?.map((route, index) => (
          <div key={route.id} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="font-medium">{route.label}</span>
            <span className="text-gray-500">
              {route.condition.field} {route.condition.operator} {JSON.stringify(route.condition.value)}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={route.id}
              className="!static w-2 h-2 ml-auto"
              style={{ top: `${index * 24}px` }}
            />
          </div>
        ))}
      </div>

      {data.defaultRoute && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span>Default: {data.defaultRoute}</span>
            <Handle
              type="source"
              position={Position.Right}
              id="default"
              className="!static w-2 h-2 ml-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// --- Loop Node (Iterate over arrays) ---
export interface LoopNodeData {
  label: string;
  arrayField: string;
  itemName: string;
  indexName?: string;
}

export const LoopNode = ({ data, selected }: { data: LoopNodeData; selected: boolean }) => {
  return (
    <div className={`p-4 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-xl min-w-[240px] ${
      selected ? 'border-orange-500 scale-105' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-500" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loop</p>
          <p className="text-sm font-bold">{data.label}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Array:</span>
          <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 rounded">{data.arrayField}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Item:</span>
          <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 rounded">{data.itemName}</span>
        </div>
        {data.indexName && (
          <div className="flex justify-between">
            <span className="text-gray-500">Index:</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 rounded">{data.indexName}</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500" />
    </div>
  );
};

// --- Merge Node (Combine parallel paths) ---
export interface MergeNodeData {
  label: string;
  mergeStrategy: 'wait_all' | 'any' | 'custom';
  inputCount: number;
}

export const MergeNode = ({ data, selected }: { data: MergeNodeData; selected: boolean }) => {
  return (
    <div className={`p-4 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-xl min-w-[200px] ${
      selected ? 'border-blue-500 scale-105' : 'border-gray-200 dark:border-gray-700'
    }`}>
      {Array.from({ length: data.inputCount || 2 }).map((_, i) => (
        <Handle
          key={i}
          type="target"
          position={Position.Top}
          id={`input-${i}`}
          className="w-3 h-3 bg-blue-500"
          style={{ left: `${20 + (i * 60)}px` }}
        />
      ))}
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Merge</p>
          <p className="text-sm font-bold">{data.label}</p>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Strategy: <span className="font-medium">{data.mergeStrategy.replace('_', ' ')}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
};

// --- Code Node (Custom JavaScript/Python) ---
export interface CodeNodeData {
  label: string;
  language: 'javascript' | 'python';
  code: string;
  inputs: string[];
  outputs: string[];
}

export const CodeNode = ({ data, selected }: { data: CodeNodeData; selected: boolean }) => {
  return (
    <div className={`p-4 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-xl min-w-[320px] ${
      selected ? 'border-green-500 scale-105' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-green-500" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-green-50 text-green-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Code</p>
          <p className="text-sm font-bold">{data.label}</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Language</span>
          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 rounded capitalize">
            {data.language}
          </span>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-2 mb-2 overflow-hidden">
        <pre className="text-xs text-green-400 font-mono whitespace-nowrap overflow-x-auto">
          {data.code?.split('\n').slice(0, 5).join('\n')}
          {data.code?.split('\n').length > 5 && '\n...'}
        </pre>
      </div>

      <div className="flex gap-4 text-xs">
        <div>
          <span className="text-gray-500">In:</span> {data.inputs?.join(', ')}
        </div>
        <div>
          <span className="text-gray-500">Out:</span> {data.outputs?.join(', ')}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-green-500" />
    </div>
  );
};

// --- HTTP Request Node ---
export interface HttpRequestNodeData {
  label: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

export const HttpRequestNode = ({ data, selected }: { data: HttpRequestNodeData; selected: boolean }) => {
  const methodColors = {
    GET: 'bg-blue-500',
    POST: 'bg-green-500',
    PUT: 'bg-orange-500',
    DELETE: 'bg-red-500',
    PATCH: 'bg-purple-500',
  };

  return (
    <div className={`p-4 rounded-2xl border-2 bg-white dark:bg-gray-900 shadow-xl min-w-[320px] ${
      selected ? 'border-indigo-500 scale-105' : 'border-gray-200 dark:border-gray-700'
    }`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl text-white ${methodColors[data.method]}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">HTTP {data.method}</p>
          <p className="text-sm font-bold truncate">{data.label}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-white font-bold text-xs ${methodColors[data.method]}`}>
            {data.method}
          </span>
          <span className="font-mono text-gray-600 dark:text-gray-400 truncate flex-1">
            {data.url}
          </span>
        </div>
        
        {data.headers && Object.keys(data.headers).length > 0 && (
          <div>
            <span className="text-gray-500">Headers:</span>
            <div className="mt-1 space-y-1">
              {Object.entries(data.headers).map(([key, value]) => (
                <div key={key} className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {key}: {value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
};

// Export all node types
export const advancedNodeTypes = {
  router: RouterNode,
  loop: LoopNode,
  merge: MergeNode,
  code: CodeNode,
  http_request: HttpRequestNode,
};
