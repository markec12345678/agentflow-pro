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

const ANONYMOUS_USER_ID = "anonymous-user-id";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user
    ? (session.user as { userId?: string }).userId ?? session.user.email
    : undefined;
  const workflows = await listWorkflows(userId ?? undefined);
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
    const userId: string =
      session?.user
        ? (session.user as { userId?: string }).userId ?? session.user.email ?? ANONYMOUS_USER_ID
        : ANONYMOUS_USER_ID;

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
      let userApiKeys: Record<string, string> | undefined;
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const userId =
          (session.user as { userId?: string }).userId ?? session.user.email;
        if (userId) {
          userApiKeys = await getUserApiKeysForExecution(userId);
        }
      }
      const result = await runWorkflow(
        w.id,
        body.metadata as Record<string, unknown>,
        userApiKeys
      );
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
