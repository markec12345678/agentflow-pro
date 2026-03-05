import React, { useState, useEffect } from 'react';

export interface MCPBuilderProps {
  projectId: string;
  initialComponents?: any[];
  availableMCPs: string[];
}

export const MCPBuilder: React.FC<MCPBuilderProps> = ({
  projectId,
  initialComponents = [],
  availableMCPs = []
}) => {
  const [components, setComponents] = useState(initialComponents);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  useEffect(() => {
    const loadState = async () => {
      try {
        const response = await fetch(`/api/mcp-builder/load?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setComponents(data.components || initialComponents);
        }
      } catch (error) {
        console.error('Failed to load MCP builder state:', error);
      }
    };

    loadState();
  }, [projectId, initialComponents]);

  const addComponent = (type: string) => {
    const newComponent = {
      id: `comp-${Date.now()}`,
      type,
      position: { x: 10, y: 10 },
      properties: { label: type, content: `Sample ${type}` }
    };
    setComponents([...components, newComponent]);
    setSelectedComponent(newComponent.id);
  };

  return (
    <div className="mcp-builder p-4">
      <h1 className="text-2xl font-bold mb-4">MCP Builder</h1>
      
      <div className="grid grid-cols-12 gap-4">
        {/* MCP List */}
        <div className="col-span-3">
          <h2 className="text-lg font-semibold mb-2">Available MCPs</h2>
          <div className="space-y-2">
            {availableMCPs.map((mcp) => (
              <div key={mcp} className="p-2 border rounded hover:bg-gray-50">
                {mcp}
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="col-span-6">
          <h2 className="text-lg font-semibold mb-2">Canvas</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 p-4">
            {components.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Add components to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {components.map((component) => (
                  <div
                    key={component.id}
                    className={`p-2 border rounded cursor-pointer ${
                      selectedComponent === component.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedComponent(component.id)}
                  >
                    <div className="font-medium">{component.type}</div>
                    <div className="text-sm text-gray-600">{component.properties.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Properties */}
        <div className="col-span-3">
          <h2 className="text-lg font-semibold mb-2">Properties</h2>
          <div className="border rounded p-2">
            {selectedComponent ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Component ID: {selectedComponent}</p>
                <button className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Test Call
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select a component to edit properties</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
