import { NextRequest, NextResponse } from "next/server";
import { getUsage, canRunAgent } from "@/api/usage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const usage = await getUsage(userId);
    const allowed = await canRunAgent(userId);
    return NextResponse.json({
      ...usage,
      canRunAgent: allowed,
    });
  } catch (err) {
    console.error("Error in usage API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
