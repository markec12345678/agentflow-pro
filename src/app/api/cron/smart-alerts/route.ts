/**
 * AgentFlow Pro - Smart Alerts Cron
 * Checks occupancy per property and triggers alerts when threshold (95%) exceeded.
 * Schedule: 0 * * * * (hourly)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getOccupancyForProperty } from "@/lib/tourism/occupancy";
import { triggerAlert, runEscalationCheck } from "@/alerts/smartAlerts";
import { startOfDay } from "date-fns";
import { getEscalationPolicy, calculateEscalationLevel, getActionsForEscalationLevel, executeEscalationAction } from "@/alerts/escalation-policy";

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseDate = startOfDay(new Date());
    const properties = await prisma.property.findMany({
      where: { userId: { not: null } },
      select: { id: true },
    });

    let triggered = 0;
    let escalated = 0;

    for (const property of properties) {
      try {
        const data = await getOccupancyForProperty(
          prisma,
          [property.id],
          baseDate
        );

        if (data.today.occupancyPercent >= 95) {
          await triggerAlert("occupancy", {
            propertyId: property.id,
            value: data.today.occupancyPercent,
          });
          triggered++;
        }
      } catch (e) {
        console.error(`[SmartAlerts] Occupancy check failed for ${property.id}:`, e);
      }
    }

    // Run escalation checks for existing alerts
    escalated = await runEscalationCheck();

    // Check and execute escalation actions for unacknowledged alerts
    const activeAlerts = await prisma.alertEvent.findMany({
      where: {
        resolvedAt: null,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const alert of activeAlerts) {
      try {
        const policy = getEscalationPolicy(alert.type);
        if (!policy) continue;

        const escalationLevel = calculateEscalationLevel(alert as any, policy);
        const actions = getActionsForEscalationLevel(policy, escalationLevel);

        for (const action of actions) {
          await executeEscalationAction(alert as any, action);
          escalated++;
        }
      } catch (e) {
        console.error(`[SmartAlerts] Escalation failed for alert ${alert.id}:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      checked: properties.length,
      triggered,
      escalated,
    });
  } catch (error) {
    console.error("Smart alerts cron error:", error);
    return NextResponse.json(
      { error: "Smart alerts cron failed" },
      { status: 500 }
    );
  }
}
