"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { WorkflowCanvas } from "@/web/components/workflow/WorkflowCanvas";
import type { Workflow } from "@/workflows/types";

const DEFAULT_WORKFLOW: Workflow = {
  id: `wf_${Date.now()}`,
  name: "New Workflow",
  nodes: [],
  edges: [],
};

function WorkflowsPageInner() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const [workflow, setWorkflow] = useState<Workflow>(DEFAULT_WORKFLOW);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [executeResult, setExecuteResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!workflowId) return;
    fetch("/api/workflows")
      .then((r) => r.json())
      .then((list: Workflow[]) => {
        const w = list.find((x) => x.id === workflowId);
        if (w) setWorkflow(w);
      })
      .catch(() => { });
  }, [workflowId]);

  async function handleSave() {
    setSaveStatus(null);
    setSaving(true);
    try {
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
      setWorkflow((w) => ({ ...w, id: data.id ?? w.id }));
    } catch (e) {
      setSaveStatus(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleExecute() {
    setExecuteResult(null);
    setExecuting(true);
    try {
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
        error: data.execution?.success === false ? "Execution failed" : undefined,
      });
    } catch (e) {
      setExecuteResult({ success: false, error: e instanceof Error ? e.message : "Unknown" });
    } finally {
      setExecuting(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-4 text-2xl font-bold">Workflow Builder</h1>
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-900 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={handleExecute}
          disabled={executing}
          className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {executing ? "Executing..." : "Execute"}
        </button>
        {saveStatus && <span className="text-sm text-gray-600">{saveStatus}</span>}
        {executeResult && (
          <span className={`text-sm ${executeResult.success ? "text-green-600" : "text-red-600"}`}>
            {executeResult.success ? "Execution complete" : executeResult.error}
          </span>
        )}
      </div>
      <WorkflowCanvas workflow={workflow} onWorkflowChange={setWorkflow} />
    </main>
  );
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen p-8"><p>Loading...</p></main>}>
      <WorkflowsPageInner />
    </Suspense>
  );
}
