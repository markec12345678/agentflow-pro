/**
 * AgentFlow Pro - Guest ID Upload
 * Secure upload for guest identification (GDPR compliant)
 */

import { prisma } from "@/database/schema";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const reservationId = formData.get("reservationId") as string;
    const guestEmail = formData.get("guestEmail") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!reservationId) {
      return NextResponse.json({ error: "Missing reservation ID" }, { status: 400 });
    }

    // Verify reservation exists and belongs to property
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
        propertyId,
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Verify email matches
    if (reservation.guestEmail !== guestEmail) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only JPG, PNG, and PDF are allowed." 
      }, { status: 400 });
    }

    // Generate secure filename
    const fileExtension = file.name.split(".").pop() || "bin";
    const filename = `${uuidv4()}.${fileExtension}`;
    
    // Save to secure directory (not publicly accessible)
    const uploadDir = join(process.cwd(), "uploads", "guest-ids", propertyId);
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Store metadata in database
    await prisma.guestDocument.create({
      data: {
        reservationId,
        type: "id_document",
        filename: filename,
        filePath: filePath,
        uploadedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Auto-delete after 90 days
        metadata: {
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      documentId: filename,
    });
  } catch (error) {
    console.error("[Guest ID Upload] Error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
