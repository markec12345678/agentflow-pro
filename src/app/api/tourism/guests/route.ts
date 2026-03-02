import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getPropertyIdsForUser } from "@/lib/tourism/property-access";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const propertyId = searchParams.get("propertyId");

    const propertyIds = await getPropertyIdsForUser(userId);

    const where: any = {
      propertyId: propertyId ? propertyId : { in: propertyIds },
    };

    if (q && q.length >= 2) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const guests = await prisma.guest.findMany({
      where,
      take: 20,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(guests);
  } catch (error) {
    console.error("Guest search API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
