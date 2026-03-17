import { getServerSession } from "next-auth";
import { logger } from '@/infrastructure/observability/logger';
import { NextResponse } from "next/server";
import { rejectCheckpoint } from '@/app/api/v1/workflows/workflows';
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    checkpointId?: string;
    reason?: string;
  };
  if (!body.checkpointId) {
    return NextResponse.json(
      { error: "checkpointId is required" },
      { status: 400 }
    );
  }
  try {
    await rejectCheckpoint(body.checkpointId, userId, body.reason);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Error rejecting checkpoint:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
