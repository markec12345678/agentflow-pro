/**
 * AgentFlow Pro - PMS Sync API (Roadmap § 2.B.7)
 * POST: trigger reservation sync from PMS (Mews, etc.)
 * Credentials: from body (ephemeral) or from PmsConnection (stored)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getPmsAdapter } from "@/lib/tourism/mews-adapter";
import { getPropertyForUser } from "@/lib/tourism/property-access";
import { subDays, addDays } from "date-fns";

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

    let accessToken = body.accessToken?.trim();
    let clientToken = body.clientToken?.trim();
    const provider = body.provider ?? "mews";

    if (!accessToken || !clientToken) {
      const conn = await prisma.pmsConnection.findUnique({
        where: {
          propertyId_provider: {
            propertyId: body.propertyId,
            provider,
          },
        },
      });
      if (conn) {
        const creds = conn.credentials as { accessToken?: string; clientToken?: string };
        accessToken = String(creds?.accessToken ?? "").trim();
        clientToken = String(creds?.clientToken ?? "").trim();
      }
      if (!accessToken || !clientToken) {
        return NextResponse.json(
          { error: "Dodaj credentials v PMS Povezave ali vnesi accessToken in clientToken v ta klic." },
          { status: 400 }
        );
      }
    }
    const adapter = getPmsAdapter(provider);
    if (!adapter) {
      return NextResponse.json(
        { error: `Unknown PMS provider: ${provider}` },
        { status: 400 }
      );
    }

    const now = new Date();
    const from = subDays(now, 30);
    const to = addDays(now, 90);
    const config = {
      propertyId: body.propertyId,
      credentials: { accessToken, clientToken },
    };

    const reservations = await adapter.getReservations({ config, from, to });
    const result = await adapter.syncToAgentFlow({ config, reservations });

    return NextResponse.json({
      success: result.errors.length === 0,
      message: `Sinhronizirano: ${result.synced} rezervacij`,
      synced: result.synced,
      created: result.created,
      updated: result.updated,
      errors: result.errors,
      fetched: reservations.length,
    });
  } catch (error) {
    console.error("PMS sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync with PMS" },
      { status: 500 }
    );
  }
}
