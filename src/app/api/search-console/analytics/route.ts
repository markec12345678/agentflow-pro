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

function getDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 28); // last 28 days
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get("siteUrl") ?? "";
    if (!siteUrl.trim()) {
      return NextResponse.json(
        { error: "siteUrl query param required (e.g. https://example.com/)" },
        { status: 400 }
      );
    }

    const keys = await getUserApiKeys(userId, { masked: false });
    const raw = keys.google_search_console;
    const token = raw ? parseGscToken(raw) : null;
    if (!token?.access_token) {
      return NextResponse.json(
        { error: "Connect Google Search Console first" },
        { status: 401 }
      );
    }

    const searchconsole = await getSearchConsoleClient(token);
    const { start, end } = getDateRange();

    const { data } = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl.startsWith("sc-domain:") ? siteUrl : siteUrl,
      requestBody: {
        startDate: start,
        endDate: end,
        dimensions: ["query"],
        rowLimit: 100,
        startRow: 0,
      },
    });

    const rows = (data.rows ?? []).map((r) => ({
      keyword: (r.keys ?? [])[0] ?? "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: Math.round((r.position ?? 0) * 10) / 10,
    }));

    return NextResponse.json({
      siteUrl,
      start,
      end,
      rows,
      totalRows: data.totalRows ?? rows.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to query analytics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
