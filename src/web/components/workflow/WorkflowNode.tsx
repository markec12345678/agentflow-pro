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

const agentTypeToLabel: Record<string, string> = {
  research: "Research Agent",
  content: "Content Agent",
  code: "Code Agent",
  deploy: "Deploy Agent",
};

const getAgentLabel = (data: Record<string, unknown> = {}): string => {
  const label = data?.label as string;
  const agentType = String(data?.agentType ?? "").toLowerCase();
  if (label && label !== "Agent") return label;
  return agentTypeToLabel[agentType] ?? (agentType || "Agent");
};

export function WorkflowNode(props: NodeProps) {
  const { data } = props;
  const nodeType = (data?.type as string) ?? "Action";
  const label =
    nodeType === "Agent"
      ? getAgentLabel(data as Record<string, unknown>)
      : ((data?.label as string) ?? nodeType ?? "Node");
  const typeKey = nodeType;
  const style = typeColors[typeKey] ?? "border-gray-400 bg-gray-50";

  return (
    <div
      className={`nodrag nopan min-w-[140px] rounded-lg border-2 px-4 py-3 shadow-sm ${style}`}
    >
      <Handle type="target" position={Position.Left} id="target" />
      <div className="font-medium">{label}</div>
      {nodeType === "Agent" && data?.agentType ? (
        <div className="mt-1 text-xs text-gray-600 capitalize">
          {String(data.agentType)}
        </div>
      ) : null}
      {nodeType === "Condition" && data?.operator ? (
        <div className="mt-1 text-xs text-gray-600">{String(data.operator)}</div>
      ) : null}
      {nodeType === "Trigger" && data?.triggerType ? (
        <div className="mt-1 text-xs text-gray-600">{String(data.triggerType)}</div>
      ) : null}
      {nodeType === "Action" && data?.action ? (
        <div className="mt-1 text-xs text-gray-600">{String(data.action)}</div>
      ) : null}
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
