import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database/schema";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      company?: string;
      plan?: string;
      message?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim();
    const message = body.message?.trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    await prisma.contactSubmission.create({
      data: {
        name,
        email,
        company: body.company?.trim() || null,
        plan: body.plan?.trim() || null,
        message,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit" },
      { status: 500 }
    );
  }
}
