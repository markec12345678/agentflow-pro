import { NextResponse } from "next/server";
import { getAppBackend } from "@/memory/app-backend";
import type { CreateEntityInput } from "@/memory/memory-backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const backend = getAppBackend();
    const graph = backend.readGraph();
    return NextResponse.json(graph);
  } catch (err) {
    console.error("Error in memory entities GET API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json() as { entities?: CreateEntityInput[] };
    const entities = body.entities ?? [];
    if (!Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json({ error: "entities array required" }, { status: 400 });
    }
    const backend = getAppBackend();
    backend.createEntities(entities);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in memory entities POST API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
