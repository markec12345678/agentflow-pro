import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { getUserApiKeys } from "@/lib/user-keys";

export async function GET() {
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

  const auth = Buffer.from(`anystring:${apiKey.trim()}`).toString("base64");
  const url = `https://${datacenter}.api.mailchimp.com/3.0/lists?count=100`;

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
      lists?: { id: string; name: string; stats?: { member_count?: number } }[];
    };
    const lists = (data.lists ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      member_count: l.stats?.member_count ?? 0,
    }));

    return NextResponse.json({ lists });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch Mailchimp lists", details: String(e) },
      { status: 502 }
    );
  }
}
