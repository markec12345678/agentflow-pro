"use client";

import type { ExecutionProgress } from "@/workflows/WorkflowExecutor";

interface ExecutionProgressModalProps {
  executionId: string;
  progress: ExecutionProgress;
  onClose: () => void;
  nodes?: Array<{ id: string; data?: { label?: string; type?: string } }>;
}

export function ExecutionProgressModal({
  executionId,
  progress,
  onClose,
  nodes = [],
}: ExecutionProgressModalProps) {
  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return (node?.data?.label as string) ?? node?.data?.type ?? nodeId;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      data-testid="execution-modal"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl bg-gray-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            Execution: {executionId}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
            aria-label="Close"
            data-testid="close-modal"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* Progress bar */}
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${progress.totalSteps > 0
                  ? (progress.currentStep / progress.totalSteps) * 100
                  : 0}%`,
              }}
            />
          </div>
          <div className="mb-4 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${progress.status === "completed"
                ? "bg-green-900/50 text-green-400"
                : progress.status === "error"
                  ? "bg-red-900/50 text-red-400"
                  : "bg-gray-700 text-gray-400"
                }`}
            >
              {progress.status}
            </span>
            <span className="text-sm text-gray-400">
              Step {progress.currentStep} of {progress.totalSteps}
              {progress.currentAgent && (
                <span className="ml-2">• {progress.currentAgent}</span>
              )}
            </span>
          </div>

          {progress.errors.length > 0 && (
            <div className="mb-4 rounded-lg bg-red-900/30 p-3">
              <h4 className="mb-2 text-sm font-medium text-red-400">
                Errors
              </h4>
              <ul className="space-y-1 text-sm text-red-300">
                {progress.errors.map((e, i) => (
                  <li key={i}>
                    {e.agent}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h4 className="mb-3 text-sm font-medium text-white">
            Execution Timeline
          </h4>
          <ul className="space-y-2">
            {progress.results.map((r, idx) => (
              <li
                key={`${r.nodeId}-${idx}`}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 ${r.status === "success" ? "bg-gray-700/50" : "bg-red-900/30"
                  }`}
              >
                <span
                  className={
                    r.status === "success" ? "text-green-500" : "text-red-500"
                  }
                >
                  {r.status === "success" ? "✓" : "✕"}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-white">
                    {getNodeLabel(r.nodeId)}
                  </span>
                  {r.error && (
                    <p className="mt-0.5 text-xs text-red-400">{r.error}</p>
                  )}
                  {r.status === "success" && r.output != null && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-gray-400">
                        View output
                      </summary>
                      <pre className="mt-1 max-h-32 overflow-auto rounded-sm bg-gray-800 p-2 text-xs text-gray-300">
                        {typeof r.output === "object"
                          ? JSON.stringify(r.output, null, 2)
                          : String(r.output)}
                      </pre>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
