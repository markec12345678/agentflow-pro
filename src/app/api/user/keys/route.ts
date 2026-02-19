import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import {
  getUserApiKeys,
  setUserApiKeys,
  type ApiKeyProvider,
} from "@/lib/user-keys";

const ALLOWED_PROVIDERS: ApiKeyProvider[] = [
  "firecrawl",
  "context7",
  "serpapi",
  "openai",
  "github",
  "vercel",
  "netlify",
  "wordpress",
  "medium",
  "linkedin",
  "twitter",
  "mailchimp",
  "hubspot",
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { userId?: string }).userId ?? session.user.email;
  if (!userId) {
    return NextResponse.json({ error: "No user ID" }, { status: 401 });
  }

  try {
    const keys = await getUserApiKeys(userId, { masked: true });
    return NextResponse.json(keys);
  } catch {
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { userId?: string }).userId ?? session.user.email;
  if (!userId) {
    return NextResponse.json({ error: "No user ID" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      string | undefined
    >;

    const keys: Record<string, string> = {};
    for (const provider of ALLOWED_PROVIDERS) {
      const value = body[provider];
      if (typeof value === "string" && value.trim()) {
        keys[provider] = value.trim();
      }
    }

    await setUserApiKeys(userId, keys);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save keys" }, { status: 500 });
  }
}
