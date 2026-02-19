import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getUserApiKeys } from "@/lib/user-keys";
import { parseGscToken, getSearchConsoleClient } from "@/lib/search-console";

function getUserId(session: unknown): string | null {
  const s = session as { user?: { userId?: string; email?: string | null } } | null;
  if (!s?.user) return null;
  return s.user.userId ?? (typeof s.user.email === "string" ? s.user.email : null);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await getUserApiKeys(userId, { masked: false });
    const raw = keys.google_search_console;
    const token = raw ? parseGscToken(raw) : null;
    if (!token?.access_token) {
      return NextResponse.json(
        { error: "Connect Google Search Console first", connected: false },
        { status: 200 }
      );
    }

    const searchconsole = await getSearchConsoleClient(token);
    const { data } = await searchconsole.sites.list();
    const sites = (data.siteEntry ?? []).map((s) => ({
      siteUrl: s.siteUrl ?? "",
      permissionLevel: s.permissionLevel ?? "",
    }));

    return NextResponse.json({
      connected: true,
      sites: sites.filter((s) => s.siteUrl),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list sites";
    return NextResponse.json({ error: msg, connected: false }, { status: 500 });
  }
}
