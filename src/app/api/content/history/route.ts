/**
 * Content History API - returns user's content from BlogPost and ContentHistory
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function GET(request: Request) {
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
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 100);
    const sourceFilter = searchParams.get("source"); // blogPost | contentHistory
    const typeFilter = searchParams.get("type");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const orderBy = order === "asc" ? "asc" : "desc";

    const [blogPosts, contentHistory] = await Promise.all([
      sourceFilter === "contentHistory"
        ? []
        : prisma.blogPost.findMany({
          where: { userId },
          orderBy: { createdAt: orderBy },
          take: sourceFilter ? limit : limit * 2,
          select: {
            id: true,
            title: true,
            topic: true,
            imageUrl: true,
            pipelineStage: true,
            createdAt: true,
          },
        }),
      sourceFilter === "blogPost"
        ? []
        : prisma.contentHistory.findMany({
          where: { userId, ...(typeFilter ? { type: typeFilter } : {}) },
          orderBy: { createdAt: orderBy },
          take: sourceFilter ? limit : limit * 2,
          select: {
            id: true,
            content: true,
            type: true,
            status: true,
            promptType: true,
            createdAt: true,
          },
        }),
    ]);

    const normalizedBlog = blogPosts.map((p) => ({
      id: p.id,
      title: p.title,
      topic: p.topic,
      pipelineStage: p.pipelineStage,
      type: p.topic ?? p.pipelineStage ?? "blog",
      source: "blogPost" as const,
      createdAt: p.createdAt,
    }));

    const normalizedHistory = contentHistory.map((h) => ({
      id: h.id,
      title: h.content?.slice(0, 80) ?? null,
      topic: h.type,
      pipelineStage: h.status,
      type: h.type,
      content: h.content?.slice(0, 200) ?? "",
      source: "contentHistory" as const,
      createdAt: h.createdAt,
    }));

    const sortFn = (a: { createdAt: Date; title?: string | null; topic?: string | null }) =>
      sort === "title"
        ? ((a.title ?? a.topic ?? "").toLowerCase())
        : new Date(a.createdAt).getTime();

    const merged = [...normalizedBlog, ...normalizedHistory]
      .sort((a, b) => {
        const aVal = sortFn(a);
        const bVal = sortFn(b);
        if (typeof aVal === "string" && typeof bVal === "string") {
          const cmp = aVal.localeCompare(bVal);
          return order === "asc" ? cmp : -cmp;
        }
        return order === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      })
      .slice(0, limit);

    return NextResponse.json({ posts: merged });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch content" },
      { status: 500 }
    );
  }
}
