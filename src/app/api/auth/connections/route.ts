import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { prisma } from "@/database/schema";
import { getUserApiKeys } from "@/lib/user-keys";

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
    getUserApiKeys(userId, { masked: false }),
    prisma.integration.findUnique({
      where: { userId_provider: { userId, provider: "salesforce" } },
    }),
  ]);

  const providers = new Set(
    ["linkedin", "twitter", "hubspot"].filter((p) => apiKeys[p]?.trim())
  );

  return NextResponse.json({
    linkedin: providers.has("linkedin"),
    twitter: providers.has("twitter"),
    hubspot: providers.has("hubspot"),
    salesforce: !!salesforceIntegration?.accessToken,
    google_search_console: !!(apiKeys.google_search_console?.trim()),
    meta: !!(apiKeys.meta?.trim()),
    booking_affiliate: !!(apiKeys.booking_affiliate?.trim()),
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

  const validProviders = ["linkedin", "twitter", "hubspot", "salesforce", "google_search_console", "meta", "booking_affiliate"];
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  try {
    if (provider === "salesforce") {
      await prisma.integration.deleteMany({
        where: { userId, provider: "salesforce" },
      });
    } else {
      await prisma.userApiKey.deleteMany({
        where: { userId, provider },
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("does not exist")) {
      return NextResponse.json({ ok: true });
    }
    throw err;
  }
  return NextResponse.json({ ok: true });
}
