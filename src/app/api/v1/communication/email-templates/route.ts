import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

/**
 * GET /api/email-templates
 * Get all email templates for user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get user's custom templates
    const templates = await prisma.userTemplate.findMany({
      where: {
        userId,
        category: {
          in: ["pre-arrival", "during-stay", "post-stay", "booking", "payment", "cancellation"]
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(templates);
  } catch (error) {
    logger.error("Error fetching email templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email-templates
 * Create or update email template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      category,
      subject,
      body: templateBody,
      variables,
      language = "sl"
    } = body;

    // Validate required fields
    if (!name || !category || !templateBody) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (id) {
      // Update existing template
      const template = await prisma.userTemplate.update({
        where: { id, userId },
        data: {
          name,
          category,
          content: templateBody,
          customVars: variables ? { subject: variables } : undefined,
          language,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({ success: true, template });
    } else {
      // Create new template
      const template = await prisma.userTemplate.create({
        data: {
          userId,
          name,
          category,
          basePrompt: subject || "",
          content: templateBody,
          customVars: variables ? { subject: variables } : undefined,
          language,
          isPublic: false
        }
      });

      return NextResponse.json({ success: true, template }, { status: 201 });
    }
  } catch (error) {
    logger.error("Error saving email template:", error);
    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email-templates
 * Delete email template
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    await prisma.userTemplate.delete({
      where: { id, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting email template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
