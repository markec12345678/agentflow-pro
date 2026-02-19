"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export function CampaignNode({ data }: NodeProps) {
  const title = (data?.title as string) ?? "Campaign";
  const brief = (data?.brief as string) ?? "";
  const status = (data?.status as string) ?? "planning";

  return (
    <div className="min-w-[200px] rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 px-4 py-3 shadow-lg">
      <Handle type="target" position={Position.Left} />
      <div className="font-semibold text-amber-900 dark:text-amber-200">{title}</div>
      {brief && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{brief}</p>}
      <span className="mt-2 inline-block rounded px-2 py-0.5 text-xs bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 capitalize">
        {status}
      </span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
