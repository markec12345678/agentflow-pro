/**
 * AgentFlow Pro - Data Cleanup API (Roadmap § 2.B.6)
 * POST: run data cleanup (dry run or apply)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyForUser, getPropertyIdsForUser } from "@/lib/tourism/property-access";
import { runDataCleanup } from "@/lib/tourism/data-cleanup";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      propertyId?: string;
      dryRun?: boolean;
      mergeDuplicates?: boolean;
    };

    const dryRun = body.dryRun !== false;
    const mergeDuplicates = body.mergeDuplicates === true && !dryRun;

    let propertyId: string | undefined;
    let propertyIds: string[] | undefined;

    if (body.propertyId) {
      const property = await getPropertyForUser(body.propertyId, userId);
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 403 });
      }
      propertyId = body.propertyId;
    } else {
      propertyIds = await getPropertyIdsForUser(userId);
    }

    const result = await runDataCleanup({
      propertyId,
      propertyIds,
      dryRun,
      mergeDuplicates,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Data cleanup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Data cleanup failed" },
      { status: 500 }
    );
  }
}
