import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id ?? null;
    const templates = await prisma.pageBuilderTemplate.findMany({
      where: {
        OR: [
          { isPublic: true },
          ...(userId ? [{ userId }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Page builder templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { name, description, components } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    const template = await prisma.pageBuilderTemplate.create({
      data: {
        name,
        description: description ?? null,
        components: components ?? [],
        isPublic: false,
        userId: (session?.user as { id?: string })?.id ?? null,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Page builder template creation error:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
