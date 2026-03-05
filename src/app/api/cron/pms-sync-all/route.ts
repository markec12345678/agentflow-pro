/**
 * AgentFlow Pro - PMS Sync All Cron
 * Syncs reservations from PMS (Mews, etc.) for all properties with PmsConnection.
 * Schedule: 0 6,12,18 * * * (3x daily UTC)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { getPmsAdapter } from "@/lib/tourism/mews-adapter";
import { verifyCronAuth } from "@/lib/cron-auth";
import { subDays, addDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connections = await prisma.pmsConnection.findMany({
      include: { property: true },
    });

    const now = new Date();
    const from = subDays(now, 30);
    const to = addDays(now, 90);

    const results: Array<{
      propertyId: string;
      synced: number;
      created: number;
      updated: number;
      fetched: number;
      errors: string[];
    }> = [];

    for (const conn of connections) {
      const creds = conn.credentials as { accessToken?: string; clientToken?: string };
      const accessToken = String(creds?.accessToken ?? "").trim();
      const clientToken = String(creds?.clientToken ?? "").trim();

      if (!accessToken || !clientToken) {
        results.push({
          propertyId: conn.propertyId,
          synced: 0,
          created: 0,
          updated: 0,
          fetched: 0,
          errors: ["Missing credentials in PmsConnection"],
        });
        continue;
      }

      const adapter = getPmsAdapter(conn.provider);
      if (!adapter) {
        results.push({
          propertyId: conn.propertyId,
          synced: 0,
          created: 0,
          updated: 0,
          fetched: 0,
          errors: [`Unknown PMS provider: ${conn.provider}`],
        });
        continue;
      }

      try {
        const config = {
          propertyId: conn.propertyId,
          credentials: { accessToken, clientToken },
        };
        const reservations = await adapter.getReservations({ config, from, to });
        const result = await adapter.syncToAgentFlow({ config, reservations });
        results.push({
          propertyId: conn.propertyId,
          synced: result.synced,
          created: result.created,
          updated: result.updated,
          fetched: reservations.length,
          errors: result.errors,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`PMS sync error for ${conn.propertyId}:`, err);
        results.push({
          propertyId: conn.propertyId,
          synced: 0,
          created: 0,
          updated: 0,
          fetched: 0,
          errors: [message],
        });
      }
    }

    const totalSynced = results.reduce((s, r) => s + r.synced, 0);
    const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);

    return NextResponse.json({
      success: totalErrors === 0,
      processed: connections.length,
      totalSynced,
      results,
    });
  } catch (error) {
    console.error("PMS sync-all error:", error);
    return NextResponse.json(
      { error: "PMS sync-all failed" },
      { status: 500 }
    );
  }
}
