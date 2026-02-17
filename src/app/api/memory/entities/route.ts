import { NextResponse } from "next/server";
import { getAppBackend } from "@/memory/app-backend";
import type { CreateEntityInput } from "@/memory/memory-backend";

export async function GET() {
  const backend = getAppBackend();
  const graph = backend.readGraph();
  return NextResponse.json(graph);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { entities?: CreateEntityInput[] };
    const entities = body.entities ?? [];
    if (!Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json({ error: "entities array required" }, { status: 400 });
    }
    const backend = getAppBackend();
    backend.createEntities(entities);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bad request" },
      { status: 400 }
    );
  }
}
