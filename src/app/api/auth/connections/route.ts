import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [apiKeys, salesforceIntegration] = await Promise.all([
    prisma.userApiKey.findMany({
      where: {
        userId,
        provider: { in: ["linkedin", "twitter", "hubspot"] },
      },
      select: { provider: true },
    }),
    prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: "salesforce" } },
    }),
  ]);

  const providers = new Set(apiKeys.map((k) => k.provider));

  return NextResponse.json({
    linkedin: providers.has("linkedin"),
    twitter: providers.has("twitter"),
    hubspot: providers.has("hubspot"),
    salesforce: !!salesforceIntegration?.accessToken,
  });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = request.nextUrl.searchParams.get("provider");
  if (!provider) {
    return NextResponse.json({ error: "Missing provider" }, { status: 400 });
  }

  const validProviders = ["linkedin", "twitter", "hubspot", "salesforce"];
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  if (provider === "salesforce") {
    await prisma.integration.deleteMany({
      where: { userId, provider: "salesforce" },
    });
  } else {
    await prisma.userApiKey.deleteMany({
      where: { userId, provider },
    });
  }
  return NextResponse.json({ ok: true });
}
