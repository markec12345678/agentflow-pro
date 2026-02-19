import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getValidHubSpotToken } from "@/lib/hubspot-token";

function getUserId(session: { user?: { userId?: string; email?: string } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const accessToken = await getValidHubSpotToken(userId);
  if (!accessToken) {
    return NextResponse.json(
      { error: "HubSpot not connected. Connect in Settings." },
      { status: 400 }
    );
  }

  const res = await fetch(
    "https://api.hubapi.com/crm/v3/objects/contacts?limit=50",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json(
      { error: `HubSpot API error: ${res.status}`, details: err },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { results?: unknown[] };
  const contacts = (data.results ?? []).map((c: { id?: string; properties?: Record<string, string> }) => ({
    id: c.id,
    email: c.properties?.email,
    firstname: c.properties?.firstname,
    lastname: c.properties?.lastname,
  }));

  return NextResponse.json({ contacts });
}
