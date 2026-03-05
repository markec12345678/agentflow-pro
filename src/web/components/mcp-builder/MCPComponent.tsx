import React from 'react';
import { useDrag } from 'react-dnd';
import Image from 'next/image';
import './MCPComponent.css';
import './MCPComponentStyles.css';

export interface MCPComponentProps {
  component: {
    id: string;
    type: string;
    position: { x: number; y: number };
    properties: Record<string, string | number | boolean>;
    columns?: string[];
  };
  selected?: boolean;
  onSelect?: (id: string) => void;
  _onUpdate?: (id: string, updates: Partial<unknown>) => void;
  mcpConnection?: {
    mcp: string;
    function: string;
    connectedAt: string;
  };
}

export const MCPComponent: React.FC<MCPComponentProps> = ({
  component,
  selected,
  onSelect,
  _onUpdate,
  mcpConnection
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'MCP_COMPONENT',
    item: { id: component.id, type: component.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const renderComponent = () => {

    switch (component.type) {
      case 'Button':
        const buttonClasses = [
          'mcp-button',
          component.properties.color || 'primary'
        ].join(' ');
        return (
          <button 
            className={buttonClasses}
            onClick={(e) => e.stopPropagation()}
          >
            {component.properties.label || 'Button'}
          </button>
        );

      case 'Input':
        const inputType = (component.properties.type as 'text' | 'password' | 'email' | 'number' | 'tel' | 'url') || 'text';
        const inputPlaceholder = (component.properties.placeholder as string) || 'Input';
        return (
          <input
            type={inputType}
            placeholder={inputPlaceholder}
            className="mcp-input"
            onClick={(e) => e.stopPropagation()}
          />
        );

      case 'Text':
        const fontSize = (component.properties.fontSize as string) || '14px';
        const textClass = fontSize === '14px' ? 'mcp-text' : 'mcp-text mcp-text-custom';
        return (
          <div
            className={textClass}
            onClick={(e) => e.stopPropagation()}
          >
            {component.properties.content || 'Text'}
          </div>
        );

      case 'Image':
        return (
          <div
            className="mcp-image"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={(component.properties.src as string) || '/placeholder.jpg'}
              alt={(component.properties.alt as string) || 'Image'}
              width={48}
              height={48}
            />
          </div>
        );

      case 'Container':
        const padding = (component.properties.padding as string) || '16px';
        const background = (component.properties.background as string) || '#f9fafb';
        const containerClass = padding === '16px' && background === '#f9fafb' ? 'mcp-container' : 'mcp-container mcp-container-custom';
        return (
          <div
            className={containerClass}
            onClick={(e) => e.stopPropagation()}
          >
            Container
          </div>
        );

      case 'DataGrid':
        return (
          <div
            className="mcp-datagrid"
            onClick={(e) => e.stopPropagation()}
          >
            {Array.isArray(component.properties.columns) ? (
              `DataGrid with ${component.properties.columns.length} columns`
            ) : (
              'Empty DataGrid'
            )}
          </div>
        );

      default:
        return (
          <div
            className="mcp-default"
            onClick={(e) => e.stopPropagation()}
          >
            {component.type} Component
          </div>
        );
    }
  };

  const baseClasses = [
    'mcp-component',
    'positioned',
    selected ? 'selected' : 'not-selected',
    isDragging ? 'dragging' : ''
  ].filter(Boolean).join(' ');

  const positionStyle: React.CSSProperties = {
    // Note: Inline styles are necessary here for dynamic positioning
    // which cannot be achieved with CSS classes alone
    left: `${component.position.x}px`,
    top: `${component.position.y}px`
  };

  return (
    <div
      ref={drag}
      style={positionStyle}
      className={baseClasses}
      onClick={() => onSelect(component.id)}
    >
      {renderComponent()}
      {mcpConnection && (
        <div
          className="mcp-connection-indicator"
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
