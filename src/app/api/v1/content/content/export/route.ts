/**
 * Export user's content as markdown, JSON or CSV (BlogPost + ContentHistory)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

interface ExportItem {
  id: string;
  title: string | null;
  topic: string | null;
  fullContent: string | null;
  source: string;
  status: string | null;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "markdown";

    const [blogPosts, contentHistory] = await Promise.all([
      prisma.blogPost.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          topic: true,
          fullContent: true,
          metaTitle: true,
          metaDescription: true,
          pipelineStage: true,
          createdAt: true,
        },
      }),
      prisma.contentHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          type: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    const items: ExportItem[] = [
      ...blogPosts.map((p) => ({
        id: p.id,
        title: p.title,
        topic: p.topic,
        fullContent: p.fullContent,
        source: "blogPost",
        status: p.pipelineStage,
        createdAt: p.createdAt,
      })),
      ...contentHistory.map((h) => ({
        id: h.id,
        title: h.content?.slice(0, 80) ?? null,
        topic: h.type,
        fullContent: h.content,
        source: "contentHistory",
        status: h.status,
        createdAt: h.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (format === "json") {
      return new NextResponse(JSON.stringify({ items }, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="agentflow-content-export.json"`,
        },
      });
    }

    if (format === "csv") {
      const header = "id,title,topic,type,status,createdAt,contentPreview\n";
      const rows = items
        .map(
          (p) =>
            `"${(p.id ?? "").replace(/"/g, '""')}","${(p.title ?? "").replace(/"/g, '""')}","${(p.topic ?? "").replace(/"/g, '""')}","${(p.source ?? "").replace(/"/g, '""')}","${(p.status ?? "").replace(/"/g, '""')}","${p.createdAt.toISOString()}","${((p.fullContent ?? "").slice(0, 200) ?? "").replace(/"/g, '""')}"`
        )
        .join("\n");
      return new NextResponse(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="agentflow-content-export.csv"`,
        },
      });
    }

    const markdown = items
      .map(
        (p) =>
          `---\n# ${p.title ?? "Untitled"}\nTopic: ${p.topic ?? "-"}\nSource: ${p.source}\nDate: ${p.createdAt.toISOString()}\n---\n\n${p.fullContent ?? ""}`
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
