'use client';

/**
 * AgentFlow Pro - Workflow Canvas
 * Main drag-and-drop canvas for workflow building
 */

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '@/lib/workflow/workflow-store';
import WorkflowNode from './WorkflowNode';
import { WorkflowNodeType } from '@/lib/workflow/types';

// Define node types
const nodeTypes = {
  trigger: WorkflowNode,
  agent: WorkflowNode,
  action: WorkflowNode,
  condition: WorkflowNode,
  end: WorkflowNode,
};

interface WorkflowCanvasProps {
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

export default function WorkflowCanvas({ selectedNodeId, onNodeSelect }: WorkflowCanvasProps) {
  const { 
    currentWorkflow, 
    addNode, 
    updateNode, 
    deleteNode,
    addConnection, 
    deleteConnection 
  } = useWorkflowStore();

  // Convert workflow nodes to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    if (!currentWorkflow) return [];
    return currentWorkflow.nodes.map(n => ({
      id: n.id,
      type: n.type as WorkflowNodeType,
      position: n.position,
      data: {
        label: n.data.label,
        icon: n.data.icon,
        description: n.data.description,
        config: n.data.config,
        type: n.type,
      },
    }));
  }, [currentWorkflow]);

  // Convert workflow connections to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    if (!currentWorkflow) return [];
    return currentWorkflow.connections.map(c => ({
      id: c.id,
      source: c.source,
      target: c.target,
      sourceHandle: c.sourceHandle,
      targetHandle: c.targetHandle,
      label: c.label,
    }));
  }, [currentWorkflow]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node drag from palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/node-type') as WorkflowNodeType;
      const label = event.dataTransfer.getData('application/reactflow/node-label');
      const icon = event.dataTransfer.getData('application/reactflow/node-icon');

      if (!type) return;

      const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: {
          label: label || type,
          icon: icon || '📦',
          config: {},
          type,
        },
      };

      addNode({
        id: newNode.id,
        type: type as WorkflowNodeType,
        position,
        data: newNode.data as any,
      });

      setNodes((nds) => [...nds, newNode]);
    },
    [addNode, setNodes]
  );

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle connection
  const onConnect = useCallback(
    (params: Connection) => {
      const connection = {
        id: `connection_${Date.now()}`,
        source: params.source || '',
        target: params.target || '',
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
      };
      addConnection(connection);
      setEdges((eds) => addEdge(connection, eds));
    },
    [addConnection, setEdges]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  return (
    <div className="flex-1 bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        minZoom={0.5}
        maxZoom={2}
      >
        <Controls />
        <MiniMap 
          nodeStrokeColor={(n) => {
            if (n.type === 'trigger') return '#10b981';
            if (n.type === 'agent') return '#3b82f6';
            if (n.type === 'action') return '#8b5cf6';
            if (n.type === 'condition') return '#f59e0b';
            return '#6b7280';
          }}
          nodeColor={(n) => {
            if (n.type === 'trigger') return '#d1fae5';
            if (n.type === 'agent') return '#dbeafe';
            if (n.type === 'action') return '#ede9fe';
            if (n.type === 'condition') return '#fef3c7';
            return '#f3f4f6';
          }}
        />
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
      </ReactFlow>
    </div>
  );
}
