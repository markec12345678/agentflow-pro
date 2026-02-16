"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { WorkflowNode } from "@/workflows/types";

export type WorkflowNodeData = WorkflowNode["data"] & { label?: string };

const typeColors: Record<string, string> = {
  Agent: "border-blue-500 bg-blue-50",
  Condition: "border-amber-500 bg-amber-50",
  Action: "border-emerald-500 bg-emerald-50",
  Trigger: "border-violet-500 bg-violet-50",
};

export function WorkflowNode(props: NodeProps<{ type?: string; label?: string; [k: string]: unknown }>) {
  const { data } = props;
  const nodeType = (data?.type as string) ?? "Action";
  const label = (data?.label as string) ?? nodeType ?? "Node";
  const typeKey = nodeType;
  const style = typeColors[typeKey] ?? "border-gray-400 bg-gray-50";

  return (
    <div
      className={`nodrag nopan min-w-[140px] rounded-lg border-2 px-4 py-3 shadow-sm ${style}`}
    >
      <Handle type="target" position={Position.Left} id="target" />
      <div className="font-medium">{label}</div>
      {nodeType === "Agent" && data?.agentType && (
        <div className="mt-1 text-xs text-gray-600">{String(data.agentType)}</div>
      )}
      {nodeType === "Condition" && data?.operator && (
        <div className="mt-1 text-xs text-gray-600">{String(data.operator)}</div>
      )}
      {nodeType === "Trigger" && data?.triggerType && (
        <div className="mt-1 text-xs text-gray-600">{String(data.triggerType)}</div>
      )}
      {nodeType === "Action" && data?.action && (
        <div className="mt-1 text-xs text-gray-600">{String(data.action)}</div>
      )}
      {nodeType === "Condition" ? (
        <>
          <Handle type="source" position={Position.Right} id="true" />
          <Handle type="source" position={Position.Bottom} id="false" className="!left-1/2" />
        </>
      ) : (
        <Handle type="source" position={Position.Right} id="source" />
      )}
    </div>
  );
}
