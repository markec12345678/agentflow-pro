import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import {
  createOrUpdateWorkflow,
  listWorkflows,
  runWorkflow,
} from "@/api/workflows";
import { authOptions } from "@/lib/auth-options";
import { getUserApiKeysForExecution } from "@/lib/user-keys";
import type { Workflow } from "@/workflows/types";
import { getUserId } from "@/lib/auth-users";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  const workflows = await listWorkflows(userId);
  return NextResponse.json(workflows);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Workflow;
    const url = new URL(request.url);
    const execute = url.searchParams.get("execute") === "true";

    if (!body.id || !body.name) {
      return NextResponse.json(
        { error: "Workflow must have id and name" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = getUserId(session);

    const w = await createOrUpdateWorkflow(
      {
        id: body.id,
        name: body.name,
        nodes: body.nodes ?? [],
        edges: body.edges ?? [],
        metadata: body.metadata,
      },
      userId
    );

    if (execute) {
      const userApiKeys = await getUserApiKeysForExecution(userId);
      const result = await runWorkflow(
        w.id,
        body.metadata as Record<string, unknown>,
        userApiKeys
      );
      return NextResponse.json({ workflow: w, execution: result });
    }

    return NextResponse.json(w);
  } catch (err) {
    console.error("Error in workflows API (POST):", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
