/**
 * Single blog post by ID
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { canApproveContent } from "@/lib/team-auth";

export async function GET(
  _request: NextRequest,
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
    let post = await prisma.blogPost.findFirst({
      where: { id, userId },
    });

    if (!post) {
      post = await prisma.blogPost.findUnique({ where: { id } });
      if (!post) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const canApprove = await canApproveContent(userId, post.userId);
      if (!canApprove) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

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
    });
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
