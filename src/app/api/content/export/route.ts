/**
 * Export user's content as markdown or JSON
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "markdown";

    const posts = await prisma.blogPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        topic: true,
        fullContent: true,
        metaTitle: true,
        metaDescription: true,
        createdAt: true,
      },
    });

    if (format === "json") {
      return new NextResponse(JSON.stringify({ posts }, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="agentflow-content-export.json"`,
        },
      });
    }

    const markdown = posts
      .map(
        (p) =>
          `---\n# ${p.title ?? "Untitled"}\nTopic: ${p.topic ?? "-"}\nDate: ${p.createdAt.toISOString()}\n---\n\n${p.fullContent ?? ""}`
      )
      .join("\n\n");

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="agentflow-content-export.md"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    );
  }
}
