import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import {
  getUserApiKeys,
  setUserApiKeys,
  type ApiKeyProvider,
} from "@/lib/user-keys";
import { getUserId } from "@/lib/auth-users";
import { z } from 'zod';

const ALLOWED_PROVIDERS: ApiKeyProvider[] = [
  "firecrawl",
  "context7",
  "serpapi",
  "openai",
  "gemini",
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

// Zod schema for API key submission
const apiKeySchema = z.object({
  provider: z.enum(ALLOWED_PROVIDERS as [string, ...string[]]),
  key: z.string().min(1, 'API key is required'),
});

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

    const body = await request.json().catch(() => ({}));
    
    // Validate each provider key with Zod
    const validatedKeys: Record<string, string> = {};
    for (const provider of ALLOWED_PROVIDERS) {
      const value = body[provider] as string | undefined;
      if (value && value.trim()) {
        try {
          const validated = apiKeySchema.parse({ provider, key: value.trim() });
          validatedKeys[validated.provider] = validated.key;
        } catch (error) {
          // Skip invalid keys
          console.warn(`Invalid API key for ${provider}:`, error);
        }
      }
    }
    
    await setUserApiKeys(userId, validatedKeys);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in user keys POST API:", err);
    return NextResponse.json({ error: "Failed to save keys" }, { status: 500 });
  }
}
