/**
 * Branding Logo Upload API - POST
 * Upload logo images for branding
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// Simple in-memory storage for demo (use S3/blob storage in production)
const uploadedLogos = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const logoFile = formData.get("logo") as File;
    const logoType = formData.get("type") as string; // "main" or "small"

    if (!logoFile) {
      return NextResponse.json(
        { error: "No logo file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!logoFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (logoFile.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert to base64 for storage (in production, upload to S3/blob storage)
    const bytes = await logoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const logoUrl = `data:${logoFile.type};base64,${base64}`;

    // Store in memory (in production, save to database or cloud storage)
    const key = `${session.user.email}-${logoType}`;
    uploadedLogos.set(key, logoUrl);

    return NextResponse.json({
      success: true,
      logoUrl,
      logoType,
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}
