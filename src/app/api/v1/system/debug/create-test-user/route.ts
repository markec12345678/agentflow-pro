/**
 * Create test user for development
 */
import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/infrastructure/observability/logger';
import { prisma } from "@/infrastructure/database/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Check if test user already exists
    const existing = await prisma.user.findUnique({
      where: { email: "test@test.com" },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Test user already exists",
        user: { id: existing.id, email: existing.email },
      });
    }

    // Create test user
    const passwordHash = await bcrypt.hash("test123", 10);

    const user = await prisma.user.create({
      data: {
        email: "test@test.com",
        passwordHash,
        name: "Test User",
        role: "ADMIN",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({
      success: true,
      message: "Test user created",
      user,
    });
  } catch (error) {
    logger.error("Error creating test user:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
