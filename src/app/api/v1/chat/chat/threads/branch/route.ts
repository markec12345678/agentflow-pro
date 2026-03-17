import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    messages: Array<{ id: string; role: string; content: string }>;
    parentThreadId?: string | null;
  };
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "messages array is required for branching" },
      { status: 400 }
    );
  }
  if (body.parentThreadId) {
    const parent = await prisma.conversationThread.findFirst({
      where: { id: body.parentThreadId, userId },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent thread not found" }, { status: 404 });
    }
  }
  const thread = await prisma.conversationThread.create({
    data: {
      userId,
      messages: messages as object[],
      parentThreadId: body.parentThreadId ?? null,
      title: `Branch from ${new Date().toLocaleDateString()}`,
    },
  });
  return NextResponse.json(thread);
}
