import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { listPendingCheckpoints } from '@/app/api/v1/workflows/workflows';
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const checkpoints = await listPendingCheckpoints(userId);
  return NextResponse.json(checkpoints);
}
