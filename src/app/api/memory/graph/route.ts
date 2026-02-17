import { NextResponse } from "next/server";
import { getAppBackend } from "@/memory/app-backend";

export async function GET() {
  const backend = getAppBackend();
  const graph = backend.readGraph();
  return NextResponse.json(graph);
}
