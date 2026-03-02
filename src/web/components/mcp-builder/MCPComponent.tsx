import React from 'react';
import { useDrag } from 'react-dnd';

export interface MCPComponentProps {
  component: {
    id: string;
    type: string;
    position: { x: number; y: number };
    properties: Record<string, any>;
    mcpBindings: Record<string, string>;
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<any>) => void;
  mcpConnection?: {
    mcp: string;
    function: string;
    connectedAt: string;
  };
}

export const MCPComponent: React.FC<MCPComponentProps> = ({
  component,
  isSelected,
  onSelect,
  onUpdate,
  mcpConnection
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'MCP_COMPONENT',
    item: { id: component.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const renderComponent = () => {
    const style = {
      position: 'absolute' as const,
      left: `${component.position.x}px`,
      top: `${component.position.y}px`,
      opacity: isDragging ? 0.5 : 1,
      cursor: 'move',
      border: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
      borderRadius: '4px',
      background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
    };

    switch (component.type) {
      case 'Button':
        const buttonStyle = {
          padding: '8px 16px',
          backgroundColor:
            component.properties.color === 'primary' ? '#3b82f6' :
            component.properties.color === 'secondary' ? '#6b7280' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        };
        return (
          <button style={buttonStyle} onClick={(e) => e.stopPropagation()}>
            {component.properties.label || 'Button'}
          </button>
        );

      case 'Input':
        return (
          <input
            type={component.properties.type || 'text'}
            placeholder={component.properties.placeholder || 'Input'}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        );

      case 'Text':
        return (
          <div
            style={{
              padding: '8px',
              fontSize: component.properties.fontSize || '14px',
              whiteSpace: 'pre-wrap'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {component.properties.content || 'Text'}
          </div>
        );

      case 'Image':
        return (
          <img
            src={component.properties.src || '/placeholder.jpg'}
            alt={component.properties.alt || 'Image'}
            style={{
              maxWidth: '200px',
              maxHeight: '150px',
              objectFit: 'cover'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        );

      case 'Container':
        return (
          <div
            style={{
              padding: component.properties.padding || '16px',
              backgroundColor: component.properties.background || '#f9fafb',
              minWidth: '200px',
              minHeight: '100px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            Container
          </div>
        );

      case 'DataGrid':
        return (
          <div
            style={{
              border: '1px solid #e5e7eb',
              minWidth: '300px',
              minHeight: '150px',
              padding: '8px',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {component.properties.columns?.length > 0 ?
              `DataGrid with ${component.properties.columns.length} columns` :
              'Empty DataGrid'}
          </div>
        );

      default:
        return (
          <div
            style={{
              padding: '12px',
              background: '#f3f4f6',
              borderRadius: '4px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {component.type} Component
          </div>
        );
    }
  };

  return (
    <div
      ref={drag}
      style={style}
      onClick={() => onSelect(component.id)}
      className="mcp-component"
    >
      {renderComponent()}
      {mcpConnection && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#10b981',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px'
          }}
          title={`Connected to ${mcpConnection.mcp}`}
        >
          MCP
        </div>
      )}
    </div>
  );
};

// Default export for easy import
export default MCPComponent;
