import { NextResponse } from "next/server";
import {
  createWorkflow,
  listWorkflows,
  runWorkflow,
} from "@/api/workflows";
import type { Workflow } from "@/workflows/types";

export async function GET() {
  const workflows = listWorkflows();
  return NextResponse.json(workflows);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Workflow;
    const url = new URL(request.url);
    const execute = url.searchParams.get("execute") === "true";

    if (!body.id || !body.name) {
      return NextResponse.json(
        { error: "Workflow must have id and name" },
        { status: 400 }
      );
    }

    const w = createWorkflow({
      id: body.id,
      name: body.name,
      nodes: body.nodes ?? [],
      edges: body.edges ?? [],
      metadata: body.metadata,
    });

    if (execute) {
      const result = await runWorkflow(w.id, body.metadata as Record<string, unknown>);
      return NextResponse.json({ workflow: w, execution: result });
    }

    return NextResponse.json(w);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
