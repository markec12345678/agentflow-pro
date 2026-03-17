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
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ submissions });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
