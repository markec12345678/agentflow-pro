"use client";

import { useState } from "react";
import { WorkflowCanvas } from "@/web/components/workflow/WorkflowCanvas";
import type { Workflow } from "@/workflows/types";

export default function WorkflowsPage() {
  const [workflow, setWorkflow] = useState<Workflow>({
    id: `wf_${Date.now()}`,
    name: "New Workflow",
    nodes: [],
    edges: [],
  });

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-4 text-2xl font-bold">Workflow Builder</h1>
      <WorkflowCanvas workflow={workflow} onWorkflowChange={setWorkflow} />
    </main>
  );
}
