import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MCPComponent } from './MCPComponent';
import { MCPDataSource } from './MCPDataSource';
import { MCPFunctionCaller } from './MCPFunctionCaller';

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
  const [mcpConnections, setMcpConnections] = useState<Record<string, any>>({});
  const [showDataSources, setShowDataSources] = useState(false);

  // Load saved MCP builder state
  useEffect(() => {
    const loadState = async () => {
      try {
        const response = await fetch(`/api/mcp-builder/load?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setComponents(data.components || initialComponents);
          setMcpConnections(data.mcpConnections || {});
        }
      } catch (error) {
        console.error('Failed to load MCP builder state:', error);
      }
    };

    loadState();
  }, [projectId, initialComponents]);

  const addComponent = (type: string) => {
    const newComponent = {
      id: `comp-${Math.random().toString(36).substr(2, 9)}`,
      type,
      position: { x: 10, y: 10 },
      properties: getDefaultProperties(type),
      mcpBindings: {}
    };
    setComponents([...components, newComponent]);
    setSelectedComponent(newComponent.id);
  };

  const updateComponent = (id: string, updates: Partial<any>) => {
    setComponents(components.map(comp =>
      comp.id === id ? { ...comp, ...updates } : comp
    ));
  };

  const connectToMCP = (componentId: string, mcpName: string, functionName: string) => {
    setMcpConnections(prev => ({
      ...prev,
      [componentId]: {
        mcp: mcpName,
        function: functionName,
        connectedAt: new Date().toISOString()
      }
    }));

    // Update component with MCP binding
    updateComponent(componentId, {
      mcpBindings: {
        [functionName]: `mcp://${mcpName}/${functionName}`
      }
    });
  };

  const saveBuilderState = async () => {
    try {
      const response = await fetch('/api/mcp-builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          components,
          mcpConnections
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getDefaultProperties = (type: string) => {
    const defaults = {
      'Button': { label: 'Click Me', color: 'primary', size: 'medium' },
      'Input': { placeholder: 'Enter text', type: 'text' },
      'Text': { content: 'Sample text', fontSize: '16px' },
      'Image': { src: '/placeholder.jpg', alt: 'Image' },
      'Container': { background: '#ffffff', padding: '16px' },
      'DataGrid': { columns: [], dataSource: null }
    };
    return defaults[type] || {};
  };

  const selectedComp = components.find(comp => comp.id === selectedComponent);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="mcp-builder-container flex h-screen bg-gray-100">
        {/* Left Sidebar - Components Palette */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-semibold text-lg mb-4">UI Components</h3>
          <div className="space-y-2">
            {['Button', 'Input', 'Text', 'Image', 'Container', 'DataGrid'].map(type => (
              <button
                key={type}
                onClick={() => addComponent(type)}
                className="w-full text-left p-2 hover:bg-blue-50 rounded flex items-center"
              >
                <span className="mr-2">+</span>
                {type}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={() => setShowDataSources(!showDataSources)}
              className="w-full text-left p-2 hover:bg-blue-50 rounded flex items-center justify-between"
            >
              <span>MCP Data Sources</span>
              <span>{showDataSources ? '▲' : '▼'}</span>
            </button>

            {showDataSources && (
              <div className="mt-2 ml-4 space-y-1">
                {availableMCPs.map(mcp => (
                  <MCPDataSource
                    key={mcp}
                    mcpName={mcp}
                    onConnect={(functionName) => {
                      if (selectedComponent) {
                        connectToMCP(selectedComponent, mcp, functionName);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 relative bg-white overflow-auto">
          <div className="p-8 min-h-full">
            <h2 className="text-xl font-bold mb-4">MCP Web Builder - Canvas</h2>
            <div className="border border-gray-300 rounded-lg min-h-[calc(100%-60px)] relative">
              {components.map(component => (
                <MCPComponent
                  key={component.id}
                  component={component}
                  isSelected={component.id === selectedComponent}
                  onSelect={setSelectedComponent}
                  onUpdate={updateComponent}
                  mcpConnection={mcpConnections[component.id]}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties & MCP Bindings */}
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          {selectedComponent ? (
            <>
              <h3 className="font-semibold text-lg mb-4">Properties</h3>
              <div className="space-y-4">
                {Object.entries(selectedComp.properties).map(([key, value]) => (
                  <div key={key} className="property-editor">
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        updateComponent(selectedComponent, {
                          properties: {
                            ...selectedComp.properties,
                            [key]: e.target.value
                          }
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>

              {mcpConnections[selectedComponent] && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">MCP Connection</h4>
                  <MCPFunctionCaller
                    mcpName={mcpConnections[selectedComponent].mcp}
                    functionName={mcpConnections[selectedComponent].function}
                    componentId={selectedComponent}
                  />
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBuilderState}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-500">Select a component to edit its properties</div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

// Default export for easy import
export default MCPBuilder;
