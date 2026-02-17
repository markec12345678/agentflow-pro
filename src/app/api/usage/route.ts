/**
 * AgentFlow Pro - Usage API route
 */

import { NextRequest, NextResponse } from "next/server";
import { getUsage, canRunAgent } from "@/api/usage";

function getUserId(request: NextRequest): string {
  return request.headers.get("x-user-id") ?? "mock-user-1";
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const usage = await getUsage(userId);
    const allowed = await canRunAgent(userId);
    return NextResponse.json({
      ...usage,
      canRunAgent: allowed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
