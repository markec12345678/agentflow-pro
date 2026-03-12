'use client';

/**
 * AgentFlow Pro - Node Palette
 * Left sidebar with draggable node types
 */

export default function NodePalette() {
  const nodeTypes = [
    {
      type: 'trigger',
      label: 'Trigger',
      icon: '⚡',
      description: 'Start workflow',
      variants: [
        { name: 'Webhook', icon: '🔗', description: 'HTTP webhook trigger' },
        { name: 'Schedule', icon: '⏰', description: 'Time-based trigger' },
        { name: 'Event', icon: '📢', description: 'Event-based trigger' },
        { name: 'Manual', icon: '👆', description: 'Manual trigger' },
      ],
    },
    {
      type: 'agent',
      label: 'AI Agent',
      icon: '🤖',
      description: 'Execute AI agent',
      variants: [
        { name: 'Research', icon: '🔍', description: 'Research agent' },
        { name: 'Content', icon: '📝', description: 'Content generation' },
        { name: 'Code', icon: '💻', description: 'Code generation' },
        { name: 'Communication', icon: '💬', description: 'Guest messaging' },
      ],
    },
    {
      type: 'action',
      label: 'Action',
      icon: '⚙️',
      description: 'Perform action',
      variants: [
        { name: 'API Call', icon: '🌐', description: 'HTTP API request' },
        { name: 'Email', icon: '📧', description: 'Send email' },
        { name: 'Database', icon: '🗄️', description: 'Database operation' },
        { name: 'File', icon: '📁', description: 'File operation' },
      ],
    },
    {
      type: 'condition',
      label: 'Condition',
      icon: '❓',
      description: 'If/else branching',
      variants: [
        { name: 'If/Else', icon: '🔀', description: 'Conditional branch' },
        { name: 'Switch', icon: '🔁', description: 'Multi-way branch' },
      ],
    },
    {
      type: 'end',
      label: 'End',
      icon: '🏁',
      description: 'End workflow',
      variants: [
        { name: 'Complete', icon: '✅', description: 'Workflow complete' },
        { name: 'Webhook', icon: '🔗', description: 'Send result to webhook' },
      ],
    },
  ];

  const handleDragStart = (
    event: React.DragEvent,
    nodeType: string,
    label: string,
    icon: string
  ) => {
    event.dataTransfer.setData('application/reactflow/node-type', nodeType);
    event.dataTransfer.setData('application/reactflow/node-label', label);
    event.dataTransfer.setData('application/reactflow/node-icon', icon);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Nodes</h2>
        <p className="text-xs text-gray-500 mb-6">
          Drag nodes to the canvas
        </p>

        {nodeTypes.map((category) => (
          <div key={category.type} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{category.icon}</span>
              <div>
                <div className="font-semibold text-sm text-gray-900">
                  {category.label}
                </div>
                <div className="text-xs text-gray-500">
                  {category.description}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {category.variants.map((variant) => (
                <div
                  key={variant.name}
                  draggable
                  onDragStart={(e) =>
                    handleDragStart(e, category.type, variant.name, variant.icon)
                  }
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:bg-gray-100 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{variant.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {variant.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {variant.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
