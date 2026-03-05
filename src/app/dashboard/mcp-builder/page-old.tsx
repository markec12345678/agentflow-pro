"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MCPBuilder } from '@/web/components/mcp-builder/MCPBuilder-simple';

export default function MCPBuilderPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>('');
  const [availableMCPs, setAvailableMCPs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate project ID if not exists
    const generateProjectId = () => {
      const id = localStorage.getItem('mcpBuilderProjectId') || `mcp-proj-${Date.now()}`;
      localStorage.setItem('mcpBuilderProjectId', id);
      setProjectId(id);
    };

    // Load available MCPs from cursor config or default list
    const loadMCPs = async () => {
      try {
        // Try to load from cursor MCP config
        const response = await fetch('/api/mcp/available');
        if (response.ok) {
          const data = await response.json();
          setAvailableMCPs(data.mcps);
        } else {
          // Fallback to default MCPs
          setAvailableMCPs([
            'Memory',
            'GitHub',
            'Vercel',
            'Netlify',
            'Firecrawl',
            'Brave',
            'Context7',
            'Deploy'
          ]);
        }
      } catch (error) {
        console.error('Failed to load MCPs:', error);
        setAvailableMCPs([
          'Memory',
          'GitHub',
          'Vercel',
          'Firecrawl',
          'Brave'
        ]);
      } finally {
        setLoading(false);
      }
    };

    generateProjectId();
    loadMCPs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MCP Builder...</p>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Failed to initialize project</p>
      </div>
    );
  }

  return (
    <div className="mcp-builder-page">
      <MCPBuilder
        projectId={projectId}
        availableMCPs={availableMCPs}
      />
    </div>
  );
}
