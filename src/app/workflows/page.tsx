"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowNode } from "@/web/components/workflow/WorkflowNode";
import { StatusIndicator } from "@/web/components";
import Link from "next/link";
import type { Workflow } from "@/workflows/types";

const nodeTypes = {
  workflowNode: WorkflowNode,
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
  return {
    ...base,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: (n.data?.type as Workflow["nodes"][0]["type"]) ?? "Action",
      data: { ...n.data, type: undefined } as Record<string, unknown>,
      position: n.position,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? undefined,
      targetHandle: e.targetHandle ?? undefined,
    })),
  };
}

const defaultNodeData: Record<string, Record<string, unknown>> = {
  Agent: { agentType: "research", label: "Agent" },
  Condition: { operator: "eq", operandA: "", operandB: "", label: "Condition" },
  Action: { action: "log", label: "Action" },
  Trigger: { triggerType: "manual", label: "Trigger" },
};

let nodeId = 0;
const getId = () => `node_${++nodeId}_${Date.now()}`;

const initialNodes: Node[] = [
  {
    id: "1",
    type: "workflowNode",
    position: { x: 100, y: 100 },
    data: {
      label: "Start Trigger",
      type: "Trigger",
      triggerType: "manual",
    },
  },
  {
    id: "2",
    type: "workflowNode",
    position: { x: 400, y: 100 },
    data: {
      label: "Research Agent",
      type: "Agent",
      agentType: "research",
    },
  },
  {
    id: "3",
    type: "workflowNode",
    position: { x: 700, y: 100 },
    data: {
      label: "Content Agent",
      type: "Agent",
      agentType: "content",
    },
  },
  {
    id: "4",
    type: "workflowNode",
    position: { x: 1000, y: 100 },
    data: {
      label: "Deploy Agent",
      type: "Agent",
      agentType: "deploy",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    animated: true,
    style: { stroke: "#3b82f6" },
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    animated: true,
    style: { stroke: "#3b82f6" },
  },
];

const nodeTypesSidebar = [
  {
    type: "Agent",
    icon: "🤖",
    color: "bg-blue-600",
    description: "AI Agent execution",
  },
  {
    type: "Condition",
    icon: "⚡",
    color: "bg-green-600",
    description: "IF/ELSE logic",
  },
  {
    type: "Action",
    icon: "🔧",
    color: "bg-purple-600",
    description: "Custom action",
  },
  {
    type: "Trigger",
    icon: "🎯",
    color: "bg-orange-600",
    description: "Workflow trigger",
  },
];

function WorkflowsPageInner() {
  const searchParams = useSearchParams();
  const workflowIdParam = searchParams.get("id");
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowId, setWorkflowId] = useState<string>(`wf_${Date.now()}`);
  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [executeResult, setExecuteResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!workflowIdParam) return;
    fetch("/api/workflows")
      .then((r) => r.json())
      .then((list: Workflow[]) => {
        const w = list.find((x) => x.id === workflowIdParam);
        if (w) {
          const { nodes: n, edges: e } = workflowToFlow(w);
          setNodes(n);
          setEdges(e);
          setWorkflowId(w.id);
          setWorkflowName(w.name);
        }
      })
      .catch(() => { });
  }, [workflowIdParam, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: "#3b82f6" } }, eds)
      ),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  async function handleSave() {
    setSaveStatus(null);
    setSaving(true);
    try {
      const workflow = flowToWorkflow(nodes, edges, {
        id: workflowId,
        name: workflowName,
      });
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflow),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveStatus(`Error: ${data.error ?? res.statusText}`);
        return;
      }
      setSaveStatus("Saved");
      setWorkflowId(data.id ?? workflowId);
    } catch (e) {
      setSaveStatus(
        `Error: ${e instanceof Error ? e.message : "Unknown"}`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleExecute() {
    setExecuteResult(null);
    setExecuting(true);
    try {
      const workflow = flowToWorkflow(nodes, edges, {
        id: workflowId,
        name: workflowName,
      });
      const res = await fetch("/api/workflows?execute=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflow),
      });
      const data = await res.json();
      if (!res.ok) {
        setExecuteResult({ success: false, error: data.error ?? res.statusText });
        return;
      }
      setExecuteResult({
        success: data.execution?.success ?? false,
        error:
          data.execution?.success === false ? "Execution failed" : undefined,
      });
    } catch (e) {
      setExecuteResult({
        success: false,
        error: e instanceof Error ? e.message : "Unknown",
      });
    } finally {
      setExecuting(false);
    }
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(
        "application/reactflow"
      ) as keyof typeof defaultNodeData;
      if (!type || !["Agent", "Condition", "Action", "Trigger"].includes(type))
        return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const data = defaultNodeData[type] ?? { label: type };
      const newNode: Node = {
        id: getId(),
        type: "workflowNode",
        position,
        data: { ...data, type },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Sidebar - Node Types */}
      <aside className="flex w-72 flex-col border-r border-gray-700 bg-gray-800">
        <div className="border-b border-gray-700 p-4">
          <h2 className="mb-2 text-xl font-bold text-white">Workflow Builder</h2>
          <p className="text-sm text-gray-400">Drag nodes to canvas</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase text-gray-400">
            Node Types
          </h3>

          <div className="space-y-3">
            {nodeTypesSidebar.map((nodeType) => (
              <div
                key={nodeType.type}
                className={`cursor-grab rounded-lg p-4 transition-opacity hover:opacity-80 ${nodeType.color}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "application/reactflow",
                    nodeType.type
                  );
                  e.dataTransfer.effectAllowed = "move";
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{nodeType.icon}</span>
                  <div>
                    <p className="font-semibold text-white">{nodeType.type}</p>
                    <p className="text-xs text-gray-300">
                      {nodeType.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Stats */}
          <div className="mt-8 rounded-lg bg-gray-700 p-4">
            <h4 className="mb-3 text-sm font-medium text-white">
              Workflow Stats
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Nodes:</span>
                <span className="font-medium text-white">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connections:</span>
                <span className="font-medium text-white">{edges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Run:</span>
                <span className="font-medium text-white">Never</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {executing ? "Executing..." : "Run Workflow"}
            </button>
            <button className="w-full rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700">
              Export JSON
            </button>
          </div>
          {saveStatus && (
            <p className="mt-2 text-sm text-gray-400">
              {saveStatus === "Saved" ? (
                <span className="text-green-500">Saved</span>
              ) : (
                saveStatus
              )}
            </p>
          )}
          {executeResult && (
            <p className="mt-2 text-sm">
              {executeResult.success ? (
                <span className="text-green-500">Execution complete</span>
              ) : (
                <span className="text-red-500">{executeResult.error}</span>
              )}
            </p>
          )}
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1">
        {/* Top Toolbar */}
        <div className="flex h-14 items-center justify-between border-b border-gray-700 bg-gray-800 px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-400 transition-colors hover:text-white"
            >
              Back to Dashboard
            </Link>
            <div className="h-6 w-px bg-gray-700" />
            <h1 className="font-semibold text-white">My Workflow</h1>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <span
                className={`text-sm ${saveStatus === "Saved" ? "text-green-500" : "text-gray-400"
                  }`}
              >
                {saveStatus}
              </span>
            )}
            {executeResult && (
              <span
                className={`text-sm ${executeResult.success ? "text-green-500" : "text-red-500"
                  }`}
              >
                {executeResult.success
                  ? "Execution complete"
                  : executeResult.error}
              </span>
            )}
            <span className="text-sm text-gray-400">Auto-saved</span>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              aria-label="Execute"
            >
              {executing ? "Executing..." : "Execute"}
            </button>
            <button className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700">
              Deploy
            </button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div
          className="h-[calc(100vh-3.5rem)]"
          data-testid="workflow-drop-zone"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            className="bg-gray-900"
            style={{ background: "#111827" }}
          >
            <Background color="#374151" gap={20} />
            <Controls className="border-gray-700 bg-gray-800" />
            <MiniMap
              className="border-gray-700 bg-gray-800"
              nodeColor="#3b82f6"
              maskColor="rgba(17, 24, 39, 0.8)"
            />
          </ReactFlow>
        </div>
      </main>

      {/* Right Panel - Properties */}
      <aside className="flex w-80 flex-col border-l border-gray-700 bg-gray-800">
        <div className="border-b border-gray-700 p-4">
          <h2 className="text-lg font-bold text-white">Properties</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Node ID
                </label>
                <input
                  type="text"
                  value={selectedNode.id}
                  disabled
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Label
                </label>
                <input
                  type="text"
                  defaultValue={selectedNode.data?.label as string}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Type
                </label>
                <div className="rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white">
                  {String(selectedNode.data?.type ?? "")}
                </div>
              </div>

              {selectedNode.data?.agentType != null && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-400">
                    Agent Type
                  </label>
                  <select
                    defaultValue={String(selectedNode.data.agentType)}
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="research">Research Agent</option>
                    <option value="content">Content Agent</option>
                    <option value="code">Code Agent</option>
                    <option value="deploy">Deploy Agent</option>
                  </select>
                </div>
              )}

              <div className="border-t border-gray-700 pt-4">
                <h4 className="mb-3 text-sm font-medium text-white">
                  Configuration
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Retry on failure
                    </span>
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-gray-700"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Log output</span>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-600 bg-gray-700"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Send notification
                    </span>
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button className="w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700">
                  Delete Node
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-8 text-center text-gray-400">
              <p className="mb-4 text-4xl">👆</p>
              <p>Select a node to edit its properties</p>
            </div>
          )}
        </div>

        {/* Run Status */}
        <div className="border-t border-gray-700 bg-gray-800 p-4">
          <h4 className="mb-3 text-sm font-medium text-white">
            Workflow Run Status
          </h4>
          <StatusIndicator
            status="success"
            label="Last run completed"
            timestamp="5 minutes ago"
            size="sm"
          />
        </div>
      </aside>
    </div>
  );
}

export default function WorkflowsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-900">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <ReactFlowProvider>
        <WorkflowsPageInner />
      </ReactFlowProvider>
    </Suspense>
  );
}
