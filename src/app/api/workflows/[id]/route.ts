import { NextResponse } from "next/server";
import {
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  runWorkflow,
} from "@/api/workflows";
import type { Workflow } from "@/workflows/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const w = getWorkflow(id);
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(w);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Workflow;
    const w = updateWorkflow(id, { ...body, id });
    if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(w);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = deleteWorkflow(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deleted: id });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({})) as { context?: Record<string, unknown> };
    const result = await runWorkflow(id, body.context);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
