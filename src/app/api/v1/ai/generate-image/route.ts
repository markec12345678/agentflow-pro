import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { recordAgentRun } from "@/api/usage";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getOpenAiApiKey } from "@/config/env";
import { getUserApiKeys } from "@/lib/user-keys";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user
      ? (session.user as { userId?: string }).userId ?? session.user?.email ?? null
      : null;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      prompt: string;
      postId?: string;
    };

    const { prompt, postId } = body;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const userKeys = await getUserApiKeys(userId, { masked: false });
    const apiKey = userKeys.openai?.trim() || getOpenAiApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: "Add your OpenAI API key in Settings for image generation." },
        { status: 503 }
      );
    }

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt.trim(),
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    const data = (await res.json()) as { data?: Array<{ url?: string }>; error?: { message?: string } };
    if (!res.ok) {
      const msg = data.error?.message ?? "OpenAI API error";
      if (msg.includes("api.model.images.request") || msg.includes("insufficient permissions")) {
        throw new Error(
          "DALL-E ni na voljo za ta API ključ. Uporabi ključ iz platform.openai.com z Images scope ali preveri nastavitve organizacije."
        );
      }
      throw new Error(msg);
    }
    const url = data.data?.[0]?.url;
    if (!url) {
      return NextResponse.json(
        { error: "No image URL returned from OpenAI" },
        { status: 500 }
      );
    }

    if (postId) {
      const post = await prisma.blogPost.findFirst({
        where: { id: postId, userId },
      });
      if (post) {
        await prisma.blogPost.update({
          where: { id: postId },
          data: { imageUrl: url },
        });
      }
    }

    await recordAgentRun(userId, "image", {
      input: { prompt: prompt.trim(), postId },
      output: { url },
    });

    return NextResponse.json({
      url,
      postId: postId ?? undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image generation failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
