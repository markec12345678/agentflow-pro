import React, { useState } from 'react';

export interface MCPFunctionCallerProps {
  mcpName: string;
  functionName: string;
  componentId: string;
}

export const MCPFunctionCaller: React.FC<MCPFunctionCallerProps> = ({
  mcpName,
  functionName,
  componentId
}) => {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getParameterSchema = () => {
    const schemas: Record<string, Record<string, any>> = {
      'Memory_search_nodes': {
        query: { type: 'string', required: true },
        limit: { type: 'number', default: 10 }
      },
      'GitHub_create_repo': {
        name: { type: 'string', required: true },
        private: { type: 'boolean', default: false }
      },
      'Vercel_deploy_project': {
        projectId: { type: 'string', required: true },
        environment: { type: 'string', default: 'production' }
      },
      'Firecrawl_scrape_url': {
        url: { type: 'string', required: true },
        depth: { type: 'number', default: 1 }
      },
      'Brave_web_search': {
        query: { type: 'string', required: true },
        count: { type: 'number', default: 5 }
      }
    };

    const key = `${mcpName}_${functionName}`;
    return schemas[key] || {};
  };

  const handleParameterChange = (paramName: string, value: any) => {
    setParameters({ ...parameters, [paramName]: value });
  };

  const callMCPFunction = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch('/api/mcp/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mcp: mcpName,
          function: functionName,
          parameters,
          componentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to call MCP function');
      }

      const result = await response.json();
      setResponse(result);
    } catch (err) {
      setError(err.message);
      console.error('MCP Function Call Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const schema = getParameterSchema();

  return (
    <div className="mcp-function-caller border-t pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">
          {mcpName} &gt; {functionName}
        </h4>
        <button
          onClick={callMCPFunction}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Calling...' : 'Call Function'}
        </button>
      </div>

      {Object.entries(schema).length > 0 && (
        <div className="space-y-3 mb-4">
          {Object.entries(schema).map(([paramName, paramConfig]) => (
            <div key={paramName} className="parameter-input">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {paramName} {paramConfig.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={paramConfig.type === 'number' ? 'number' : 'text'}
                value={parameters[paramName] || paramConfig.default || ''}
                onChange={(e) => handleParameterChange(paramName, e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 rounded"
                placeholder={paramConfig.type}
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-red-500 text-xs p-2 bg-red-50 rounded mb-2">
          Error: {error}
        </div>
      )}

      {response && (
        <div className="response-viewer mt-3 p-3 bg-gray-50 rounded">
          <h5 className="font-medium text-xs mb-2">Response:</h5>
          <pre className="text-xs overflow-auto max-h-32 bg-white p-2 rounded">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Default export for easy import
export default MCPFunctionCaller;
