/**
 * Bulk delete content (BlogPost and ContentHistory)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids : [];

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No IDs provided" },
        { status: 400 }
      );
    }

    const [deletedBlog, deletedHistory] = await Promise.all([
      prisma.blogPost.deleteMany({
        where: { id: { in: ids }, userId },
      }),
      prisma.contentHistory.deleteMany({
        where: { id: { in: ids }, userId },
      }),
    ]);

    return NextResponse.json({
      deleted: deletedBlog.count + deletedHistory.count,
      blogPosts: deletedBlog.count,
      contentHistory: deletedHistory.count,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk delete failed" },
      { status: 500 }
    );
  }
}
