"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  Background,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/workflows/types";
import { createNode } from "@/workflows/nodes";
import { WorkflowNode as WorkflowNodeComponent } from "./WorkflowNode";

const nodeTypes = { workflowNode: WorkflowNodeComponent };

const defaultNodeData: Record<string, Record<string, unknown>> = {
  Agent: { agentType: "research", label: "Agent" },
  Condition: { operator: "eq", operandA: "", operandB: "", label: "Condition" },
  Action: { action: "log", label: "Action" },
  Trigger: { triggerType: "manual", label: "Trigger" },
};

function workflowToFlow(workflow: Workflow): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = workflow.nodes.map((n) => ({
    id: n.id,
    type: "workflowNode",
    position: n.position ?? { x: 0, y: 0 },
    data: { ...n.data, type: n.type },
  }));
  const edges: Edge[] = workflow.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  }));
  return { nodes, edges };
}

function flowToWorkflow(
  nodes: Node[],
  edges: Edge[],
  base: Pick<Workflow, "id" | "name">
): Workflow {
  const workflowNodes: WorkflowNode[] = nodes.map((n) => ({
    id: n.id,
    type: (n.data?.type as WorkflowNode["type"]) ?? "Action",
    data: { ...n.data, type: undefined } as Record<string, unknown>,
    position: n.position,
  }));
  const workflowEdges: WorkflowEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
  }));
  return {
    ...base,
    nodes: workflowNodes,
    edges: workflowEdges,
  };
}

let nodeId = 0;
const getId = () => `node_${++nodeId}_${Date.now()}`;

interface WorkflowCanvasInnerProps {
  workflow?: Workflow;
  onWorkflowChange?: (w: Workflow) => void;
}

function WorkflowCanvasInner({ workflow, onWorkflowChange }: WorkflowCanvasInnerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const initial = workflow
    ? workflowToFlow(workflow)
    : { nodes: [] as Node[], edges: [] as Edge[] };

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  const prevWorkflowId = useRef(workflow?.id);
  useEffect(() => {
    if (workflow && workflow.id !== prevWorkflowId.current) {
      prevWorkflowId.current = workflow.id;
      const { nodes: n, edges: e } = workflowToFlow(workflow);
      setNodes(n);
      setEdges(e);
    }
  }, [workflow?.id]);

  useEffect(() => {
    if (workflow && onWorkflowChange && (nodes.length > 0 || edges.length > 0)) {
      const w = flowToWorkflow(nodes, edges, { id: workflow.id, name: workflow.name });
      onWorkflowChange(w);
    }
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow") as WorkflowNode["type"];
      if (!type || !["Agent", "Condition", "Action", "Trigger"].includes(type)) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const data = defaultNodeData[type] ?? { label: type };
      const wNode = createNode(getId(), type, data, position);
      const newNode: Node = {
        id: wNode.id,
        type: "workflowNode",
        position: wNode.position!,
        data: { ...wNode.data, type: wNode.type },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const onDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex h-full w-full">
      <div ref={wrapperRef} className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <aside className="w-48 border-l bg-gray-50 p-2">
        <div className="mb-2 text-sm font-medium text-gray-700">Add node</div>
        {(["Trigger", "Agent", "Condition", "Action"] as const).map((t) => (
          <div
            key={t}
            draggable
            onDragStart={(e) => onDragStart(e, t)}
            className="mb-2 cursor-grab rounded border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
          >
            {t}
          </div>
        ))}
      </aside>
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasInnerProps) {
  return (
    <div className="h-[600px] w-full">
      <ReactFlowProvider>
        <WorkflowCanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}
