import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const threads = await prisma.conversationThread.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      parentThreadId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(threads);
}

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
    messages?: Array<{ id: string; role: string; content: string }>;
    parentThreadId?: string;
    title?: string;
  };
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const thread = await prisma.conversationThread.create({
    data: {
      userId,
      messages: messages as object[],
      parentThreadId: body.parentThreadId ?? null,
      title: body.title ?? null,
    },
  });
  return NextResponse.json(thread);
}
