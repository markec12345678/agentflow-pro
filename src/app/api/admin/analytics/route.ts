import { NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdminEmail } from "@/lib/is-admin";
import { prisma } from "@/database/schema";

// Approximate monthly price by plan (used for MRR estimate)
const PLAN_MRR: Record<string, number> = {
  starter: 29,
  pro: 99,
  enterprise: 499,
  price_starter: 29,
  price_pro: 99,
  price_enterprise: 499,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!session?.user || !isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeSubscriptions,
      allSubscriptions,
      newUsersCount,
      totalUsers,
      byPlan,
    ] = await Promise.all([
      prisma.subscription.count({
        where: { status: { in: ["active", "trialing"] } },
      }),
      prisma.subscription.findMany({
        select: { planId: true, status: true, createdAt: true, updatedAt: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: monthStart } },
      }),
      prisma.user.count(),
      prisma.subscription.groupBy({
        by: ["planId"],
        where: { status: { in: ["active", "trialing"] } },
        _count: { id: true },
      }),
    ]);

    const mrr = byPlan.reduce((sum, g) => {
      const key = g.planId.toLowerCase().replace(/^price_/, "price_");
      const price = PLAN_MRR[key] ?? PLAN_MRR[g.planId] ?? 0;
      return sum + (g._count.id * price);
    }, 0);

    const churnedThisMonth = allSubscriptions.filter(
      (s) => s.status === "canceled" && s.updatedAt >= monthStart
    ).length;

    return NextResponse.json({
      mrr,
      arr: mrr * 12,
      activeSubscriptions,
      totalUsers,
      newUsersThisMonth: newUsersCount,
      churnedThisMonth,
      churnRate: activeSubscriptions > 0 ? (churnedThisMonth / activeSubscriptions) * 100 : 0,
      byPlan: byPlan.map((g) => {
        const id = g.planId.toLowerCase();
        const price =
          PLAN_MRR[id] ??
          (id.includes("pro") ? 99 : id.includes("enterprise") ? 499 : id.includes("starter") ? 29 : 0);
        return { planId: g.planId, count: g._count.id, mrr: price * g._count.id };
      }),
    });
  } catch (err) {
    logger.error("Error in admin analytics API:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
