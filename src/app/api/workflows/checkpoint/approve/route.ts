import { getServerSession } from "next-auth";
import { logger } from '@/infrastructure/observability/logger';
import { NextResponse } from "next/server";
import { approveCheckpoint } from "@/api/workflows";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getUserApiKeysForExecution } from "@/lib/user-keys";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { checkpointId?: string };
  if (!body.checkpointId) {
    return NextResponse.json(
      { error: "checkpointId is required" },
      { status: 400 }
    );
  }
  try {
    const userApiKeys = await getUserApiKeysForExecution(userId);
    const result = await approveCheckpoint(
      body.checkpointId,
      userId,
      userApiKeys
    );
    return NextResponse.json(result);
  } catch (err) {
    logger.error("Error approving checkpoint:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
