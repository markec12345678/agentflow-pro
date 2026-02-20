import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import {
  getUserApiKeys,
  setUserApiKeys,
  type ApiKeyProvider,
} from "@/lib/user-keys";
import { getUserId } from "@/lib/auth-users";

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
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "No user ID" }, { status: 401 });
    }

    const keys = await getUserApiKeys(userId, { masked: true });
    return NextResponse.json(keys);
  } catch (err) {
    console.error("Error in user keys GET API:", err);
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "No user ID" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      string | undefined
    >;

    const keys: Record<string, string | null> = {};
    for (const provider of ALLOWED_PROVIDERS) {
      const value = body[provider];
      // If the value is an empty string, set it to null to delete the key
      if (typeof value === "string" && value.trim() === "") {
        keys[provider] = null;
      } else if (typeof value === "string" && value.trim()) {
        keys[provider] = value.trim();
      }
    }

    await setUserApiKeys(userId, keys);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in user keys POST API:", err);
    return NextResponse.json({ error: "Failed to save keys" }, { status: 500 });
  }
}
