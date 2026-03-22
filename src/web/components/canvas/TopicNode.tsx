"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export function TopicNode({ data }: NodeProps) {
  const topic = (data?.topic as string) ?? "Topic";

  return (
    <div className="min-w-[160px] rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 px-4 py-3 shadow-lg">
      <Handle type="target" position={Position.Left} />
      <div className="font-medium text-blue-900 dark:text-blue-200">{topic}</div>
      <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Blog post topic</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
