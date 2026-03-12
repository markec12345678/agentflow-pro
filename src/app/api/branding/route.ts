/**
 * Branding API - GET/PUT
 * Manage custom branding configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// GET /api/branding - Get current user's branding
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const branding = await prisma.branding.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      branding: branding || getDefaultBranding(user.id),
    });
  } catch (error) {
    console.error("Get branding error:", error);
    return NextResponse.json(
      { error: "Failed to get branding" },
      { status: 500 }
    );
  }
}

// PUT /api/branding - Update/create branding
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      logoUrl,
      logoSmall,
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      removeAgentFlowBranding,
      customDomain,
      customCSS,
    } = body;

    // Validate colors (hex format)
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return NextResponse.json(
        { error: "Invalid primary color format" },
        { status: 400 }
      );
    }
    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return NextResponse.json(
        { error: "Invalid secondary color format" },
        { status: 400 }
      );
    }
    if (accentColor && !hexColorRegex.test(accentColor)) {
      return NextResponse.json(
        { error: "Invalid accent color format" },
        { status: 400 }
      );
    }

    const branding = await prisma.branding.upsert({
      where: { userId: user.id },
      update: {
        logoUrl,
        logoSmall,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        removeAgentFlowBranding,
        customDomain,
        customCSS,
      },
      create: {
        userId: user.id,
        logoUrl: logoUrl || null,
        logoSmall: logoSmall || null,
        primaryColor: primaryColor || "#3B82F6",
        secondaryColor: secondaryColor || "#1E40AF",
        accentColor: accentColor || "#60A5FA",
        fontFamily: fontFamily || "Inter",
        removeAgentFlowBranding: removeAgentFlowBranding || false,
        customDomain: customDomain || null,
        customCSS: customCSS || null,
      },
    });

    return NextResponse.json({ branding });
  } catch (error) {
    console.error("Update branding error:", error);
    return NextResponse.json(
      { error: "Failed to update branding" },
      { status: 500 }
    );
  }
}

function getDefaultBranding(userId: string) {
  return {
    id: "default",
    userId,
    logoUrl: null,
    logoSmall: null,
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    accentColor: "#60A5FA",
    fontFamily: "Inter",
    removeAgentFlowBranding: false,
    customDomain: null,
    customCSS: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
