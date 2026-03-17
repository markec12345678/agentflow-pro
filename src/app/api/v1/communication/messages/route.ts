/**
 * Internal Messaging API
 * GET - Get user's messages
 * POST - Send new message
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET /api/messages - Get user's messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, direct, group, unread
    const limit = parseInt(searchParams.get("limit") || "50");

    let where = {};

    if (type === "direct") {
      where = {
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id }
        ]
      };
    } else if (type === "group") {
      const memberships = await prisma.messageGroupMember.findMany({
        where: { userId: session.user.id },
        select: { groupId: true }
      });
      where = { groupId: { in: memberships.map(m => m.groupId) } };
    } else if (type === "unread") {
      where = {
        recipientId: session.user.id,
        isRead: false
      };
    } else {
      // All messages (sent and received)
      where = {
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id }
        ]
      };
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            image: true 
          } 
        },
        recipient: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            image: true 
          } 
        },
        group: { 
          select: { 
            id: true, 
            name: true,
            description: true
          } 
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return NextResponse.json({ 
      messages,
      count: messages.length
    });
  } catch (error) {
    logger.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, recipientId, groupId, attachments } = body;

    if (!content && !attachments) {
      return NextResponse.json(
        { error: "Content or attachments required" },
        { status: 400 }
      );
    }

    // Validate recipient or group
    if (!recipientId && !groupId) {
      return NextResponse.json(
        { error: "recipientId or groupId required" },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId,
        groupId,
        content: content || "",
        attachments: attachments || null,
        messageType: groupId ? "group" : "direct"
      },
      include: {
        sender: { 
          select: { 
            id: true, 
            name: true, 
            image: true 
          } 
        },
        recipient: { 
          select: { 
            id: true, 
            name: true, 
            image: true 
          } 
        },
        group: { 
          select: { 
            id: true, 
            name: true 
          } 
        }
      }
    });

    // TODO: Send WebSocket notification to recipient
    // TODO: Send email notification if user is offline

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    logger.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
