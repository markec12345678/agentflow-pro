"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export function ContentBriefNode({ data }: NodeProps) {
  const title = (data?.title as string) ?? "Content Brief";
  const brief = (data?.brief as string) ?? "";
  const targetAudience = (data?.targetAudience as string) ?? "";
  const keywords = (data?.keywords as string) ?? "";

  return (
    <div className="min-w-[200px] rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600 px-4 py-3 shadow-lg">
      <Handle type="target" position={Position.Left} />
      <div className="font-semibold text-emerald-900 dark:text-emerald-200">{title}</div>
      {brief && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{brief}</p>}
      {targetAudience && (
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
          Audience: {targetAudience}
        </p>
      )}
      {keywords && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500 truncate">Keywords: {keywords}</p>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
