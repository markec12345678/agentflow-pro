/**
 * Single content item by ID (BlogPost or ContentHistory)
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";
import { canApproveContent } from "@/lib/team-auth";
import { indexBlogPost } from "@/lib/vector-indexer";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    let post = await prisma.blogPost.findFirst({
      where: { id, userId },
    });

    if (post) {
      const canApprove = post.userId !== userId && (await canApproveContent(userId, post.userId));
      return NextResponse.json({
        id: post.id,
        title: post.title,
        topic: post.topic,
        fullContent: post.fullContent,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        imageUrl: post.imageUrl,
        pipelineStage: post.pipelineStage,
        brief: post.brief,
        reviewedAt: post.reviewedAt,
        guardrailIssues: (post.guardrailIssues as string[] | null) ?? null,
        approvalStatus: post.approvalStatus ?? null,
        approvedBy: post.approvedBy ?? null,
        createdAt: post.createdAt,
        canApprove,
        isOwner: post.userId === userId,
        source: "blogPost",
      });
    }

    post = await prisma.blogPost.findUnique({ where: { id } });
    if (post) {
      const canApprove = await canApproveContent(userId, post.userId);
      if (!canApprove) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({
        id: post.id,
        title: post.title,
        topic: post.topic,
        fullContent: post.fullContent,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        imageUrl: post.imageUrl,
        pipelineStage: post.pipelineStage,
        brief: post.brief,
        reviewedAt: post.reviewedAt,
        guardrailIssues: (post.guardrailIssues as string[] | null) ?? null,
        approvalStatus: post.approvalStatus ?? null,
        approvedBy: post.approvedBy ?? null,
        createdAt: post.createdAt,
        canApprove: true,
        isOwner: false,
        source: "blogPost",
      });
    }

    const history = await prisma.contentHistory.findFirst({
      where: { id, userId },
    });

    if (history) {
      return NextResponse.json({
        id: history.id,
        title: history.content?.slice(0, 80) ?? history.type,
        topic: history.type,
        fullContent: history.content,
        metaTitle: null,
        metaDescription: null,
        imageUrl: null,
        pipelineStage: history.status,
        brief: null,
        reviewedAt: null,
        guardrailIssues: null,
        approvalStatus: null,
        approvedBy: null,
        createdAt: history.createdAt,
        canApprove: false,
        isOwner: true,
        source: "contentHistory",
      });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const post = await prisma.blogPost.findFirst({
      where: { id, userId },
    });

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      title?: string;
      topic?: string;
      fullContent?: string;
      pipelineStage?: string;
      brief?: string;
      metaTitle?: string;
      metaDescription?: string;
    };

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.topic !== undefined && { topic: body.topic }),
        ...(body.fullContent !== undefined && { fullContent: body.fullContent }),
        ...(body.pipelineStage !== undefined && { pipelineStage: body.pipelineStage }),
        ...(body.brief !== undefined && { brief: body.brief }),
        ...(body.metaTitle !== undefined && { metaTitle: body.metaTitle }),
        ...(body.metaDescription !== undefined && { metaDescription: body.metaDescription }),
        ...(body.pipelineStage === "review" && { reviewedAt: new Date() }),
      },
    });
    indexBlogPost(updated.id, updated);

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      topic: updated.topic,
      fullContent: updated.fullContent,
      metaTitle: updated.metaTitle,
      metaDescription: updated.metaDescription,
      imageUrl: updated.imageUrl,
      pipelineStage: updated.pipelineStage,
      brief: updated.brief,
      reviewedAt: updated.reviewedAt,
      approvalStatus: updated.approvalStatus,
      approvedBy: updated.approvedBy,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
