/**
 * AgentFlow Pro - PMS Sync API (Roadmap § 2.B.7)
 * POST: trigger reservation sync from PMS (Mews, etc.)
 * Credentials: from body (ephemeral) or from PmsConnection (stored)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/database/schema";
import { getPmsAdapter } from "@/lib/tourism/mews-adapter";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { subDays, addDays } from "date-fns";

function getUserId(session: { user?: { userId?: string; email?: string | null } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      propertyId: string;
      provider?: string;
      accessToken?: string;
      clientToken?: string;
    };

    if (!body.propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    const property = await getPropertyForUser(body.propertyId, userId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const provider = body.provider ?? "mews";
    const adapter = getPmsAdapter(provider);
    if (!adapter) {
      return NextResponse.json(
        { error: `Unknown PMS provider: ${provider}` },
        { status: 400 }
      );
    }

    let credentials: Record<string, string> = {};
    if (body.accessToken && body.clientToken) {
      credentials = { accessToken: body.accessToken, clientToken: body.clientToken };
    } else {
      const conn = await prisma.pmsConnection.findUnique({
        where: { propertyId_provider: { propertyId: body.propertyId, provider } },
      });
      if (conn && conn.credentials && typeof conn.credentials === "object") {
        const c = conn.credentials as { accessToken?: string; clientToken?: string };
        if (c.accessToken && c.clientToken) {
          credentials = { accessToken: c.accessToken, clientToken: c.clientToken };
        }
      }
    }

    if (!credentials.accessToken || !credentials.clientToken) {
      return NextResponse.json(
        { error: "Mews requires accessToken and clientToken (in body or saved in PmsConnection)" },
        { status: 400 }
      );
    }

    const from = subDays(new Date(), 30);
    const to = addDays(new Date(), 90);

    const reservations = await adapter.getReservations({
      config: { propertyId: body.propertyId, credentials },
      from,
      to,
    });

    const result = await adapter.syncToAgentFlow({
      config: { propertyId: body.propertyId, credentials },
      reservations,
    });

    return NextResponse.json({
      provider,
      fetched: reservations.length,
      ...result,
    });
  } catch (error) {
    console.error("PMS sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PMS sync failed" },
      { status: 500 }
    );
  }
}
