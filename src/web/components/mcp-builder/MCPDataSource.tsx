import React, { useState, useEffect } from 'react';

export interface MCPDataSourceProps {
  mcpName: string;
  onConnect: (functionName: string) => void;
}

export const MCPDataSource: React.FC<MCPDataSourceProps> = ({ mcpName, onConnect }) => {
  const [functions, setFunctions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchMCPFunctions = async () => {
      try {
        // In a real implementation, this would call your MCP server
        // to get available functions for this MCP
        const response = await fetch(`/api/mcp/functions?mcp=${mcpName}`);
        if (response.ok) {
          const data = await response.json();
          setFunctions(data.functions || getDefaultFunctions(mcpName));
        } else {
          setFunctions(getDefaultFunctions(mcpName));
        }
      } catch (error) {
        console.error(`Failed to fetch functions for ${mcpName}:`, error);
        setFunctions(getDefaultFunctions(mcpName));
      } finally {
        setLoading(false);
      }
    };

    fetchMCPFunctions();
  }, [mcpName]);

  const getDefaultFunctions = (mcpName: string): string[] => {
    const defaults: Record<string, string[]> = {
      'Memory': ['search_nodes', 'create_entities', 'add_observations'],
      'GitHub': ['create_repo', 'push_code', 'create_pr'],
      'Vercel': ['deploy_project', 'list_deployments', 'get_logs'],
      'Firecrawl': ['scrape_url', 'search_web', 'get_content'],
      'Brave': ['web_search', 'news_search', 'image_search'],
      'Context7': ['analyze_context', 'summarize', 'extract_entities']
    };
    return defaults[mcpName] || ['default_function'];
  };

  return (
    <div className="mcp-data-source mb-2">
      <div
        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          <span className="font-medium text-sm">{mcpName} MCP</span>
        </div>
        <span>{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="ml-4 mt-1 space-y-1">
          {loading ? (
            <div className="text-xs text-gray-500 pl-2">Loading functions...</div>
          ) : (
            functions.map(func => (
              <div
                key={func}
                className="flex items-center p-1 text-xs hover:bg-blue-50 rounded cursor-pointer"
                onClick={() => onConnect(func)}
              >
                <span className="mr-2 text-blue-600">🔗</span>
                <span>{func}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Default export for easy import
export default MCPDataSource;
