import { NextResponse } from "next/server";
import {
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  runWorkflow,
} from "@/api/workflows";
import type { Workflow } from "@/workflows/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getUserApiKeysForExecution } from "@/lib/user-keys";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = getUserId(session);
    const w = await getWorkflow(params.id, userId);
    if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(w);
  } catch (err) {
    console.error("Error in workflows/[id] GET API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = getUserId(session);
    const body = (await request.json()) as Workflow;
    const w = await updateWorkflow(params.id, { ...body, id: params.id }, userId);
    if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(w);
  } catch (err) {
    console.error("Error in workflows/[id] PUT API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = getUserId(session);
    const ok = await deleteWorkflow(params.id, userId);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deleted: params.id });
  } catch (err) {
    console.error("Error in workflows/[id] DELETE API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = getUserId(session);
    const body = (await request.json().catch(() => ({}))) as {
      context?: Record<string, unknown>;
    };
    const userApiKeys = await getUserApiKeysForExecution(userId);
    const result = await runWorkflow(params.id, body.context, userApiKeys, userId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in workflows/[id] POST API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
