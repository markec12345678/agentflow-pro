import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserApiKeys } from "@/lib/user-keys";

function getUserId(session: { user?: { userId?: string; email?: string } } | null): string | null {
  if (!session?.user) return null;
  return (session.user as { userId?: string }).userId ?? session.user.email ?? null;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const keys = await getUserApiKeys(userId, { masked: false });
  const apiKey = keys.mailchimp;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "Mailchimp API key not configured. Add it in Settings." },
      { status: 400 }
    );
  }

  const parts = apiKey.trim().split("-");
  const datacenter = parts[parts.length - 1];
  if (!datacenter || datacenter.length < 2) {
    return NextResponse.json(
      { error: "Invalid Mailchimp API key format. Use key-datacenter (e.g. abc123-us19)." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const count = Math.min(Number(searchParams.get("count")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;
  const status = searchParams.get("status") ?? "sent,schedule,save";

  const auth = Buffer.from(`anystring:${apiKey.trim()}`).toString("base64");
  const params = new URLSearchParams({
    count: String(count),
    offset: String(offset),
    status,
  });
  const url = `https://${datacenter}.api.mailchimp.com/3.0/campaigns?${params}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Mailchimp API error: ${res.status}`, details: err },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      campaigns?: {
        id: string;
        status: string;
        subject_line?: string;
        create_time?: string;
        send_time?: string;
        recipients?: { list_id?: string; list_name?: string };
      }[];
    };
    const campaigns = (data.campaigns ?? []).map((c) => ({
      id: c.id,
      status: c.status,
      subject_line: c.subject_line,
      create_time: c.create_time,
      send_time: c.send_time,
      list_id: c.recipients?.list_id,
      list_name: c.recipients?.list_name,
    }));

    return NextResponse.json({ campaigns });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch Mailchimp campaigns", details: String(e) },
      { status: 502 }
    );
  }
}
