import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.pageBuilderTemplate.findMany({
      orderBy: { updatedAt: "desc" }
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
        description,
        components,
        isPublic: false,
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
