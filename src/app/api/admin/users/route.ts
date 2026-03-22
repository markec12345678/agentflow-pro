import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { isAdminEmail } from "@/lib/is-admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!session?.user || !isAdminEmail(email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        subscription: {
          select: { planId: true, status: true },
        },
      },
    });
    const list = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      plan: u.subscription?.planId ?? null,
      status: u.subscription?.status ?? null,
    }));
    return NextResponse.json({ users: list });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch users" },
      { status: 500 }
    );
  }
}
