import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { canApproveContent } from "@/lib/team-auth";

export async function POST(
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
    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const allowed = await canApproveContent(userId, post.userId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Only team admins can approve this content" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as { action?: string };
    const action = body.action === "reject" ? "reject" : "approve";

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        approvalStatus: action === "approve" ? "approved" : "rejected",
        approvedBy: userId,
        ...(action === "approve" && { pipelineStage: "published" }),
      },
    });

    return NextResponse.json({
      success: true,
      approvalStatus: updated.approvalStatus,
      pipelineStage: updated.pipelineStage,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Approval failed" },
      { status: 500 }
    );
  }
}
