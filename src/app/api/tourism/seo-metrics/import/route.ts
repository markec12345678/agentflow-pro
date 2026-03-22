/**
 * Tourism SEO Metrics Import API
 * POST: import keywords from CSV (keyword, position, volume, difficulty)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/database/schema";
import { authOptions } from "@/lib/auth-options";
import { getUserId } from "@/lib/auth-users";

function parseCsv(text: string): { keyword: string; position?: number; volume?: number; difficulty?: number }[] {
  const rows: { keyword: string; position?: number; volume?: number; difficulty?: number }[] = [];
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return rows;

  const header = lines[0].toLowerCase();
  const hasHeader = /keyword|position|volume|searchvolume|difficulty/i.test(header);
  const start = hasHeader ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    const keyword = parts[0]?.trim();
    if (!keyword) continue;

    const pos = parseInt(parts[1] ?? "", 10);
    const vol = parseInt(parts[2] ?? "", 10);
    const diff = parseInt(parts[3] ?? "", 10);

    rows.push({
      keyword,
      position: Number.isNaN(pos) ? undefined : pos,
      volume: Number.isNaN(vol) ? undefined : vol,
      difficulty: Number.isNaN(diff) ? undefined : diff,
    });
  }
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = "keyword";
    const contentId: string | null = null;

    let csvText: string;
    const contentTypeHeader = request.headers.get("content-type") ?? "";

    const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
    const MAX_ROWS = 10_000;
    const ALLOWED_MIME_TYPES = ["text/csv", "application/csv", "text/plain"];

    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "Missing file. Upload a CSV file or send CSV text in body." },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 1 MB." },
          { status: 413 }
        );
      }
      const ext = file.name?.toLowerCase().slice(-4);
      const isAllowedType =
        ALLOWED_MIME_TYPES.includes(file.type) || ext === ".csv";
      if (!isAllowedType) {
        return NextResponse.json(
          { error: "Invalid file type. Only CSV files are allowed." },
          { status: 400 }
        );
      }
      csvText = await file.text();
    } else {
      const body = await request.text();
      if (!body.trim()) {
        return NextResponse.json(
          { error: "Missing CSV data. Send CSV text or upload a file." },
          { status: 400 }
        );
      }
      if (body.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Payload too large. Maximum size is 1 MB." },
          { status: 413 }
        );
      }
      csvText = body;
    }

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid rows found. Expected: keyword, position, volume, difficulty" },
        { status: 400 }
      );
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        {
          error: `Too many rows. Maximum ${MAX_ROWS} keywords per import. Split your file.`,
        },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const existing = await prisma.seoMetric.findFirst({
        where: {
          userId,
          keyword: row.keyword,
          contentType,
          contentId,
        },
      });

      const data = {
        position: row.position ?? null,
        searchVolume: row.volume ?? null,
        difficulty: row.difficulty ?? null,
        lastChecked: new Date(),
      };

      if (existing) {
        await prisma.seoMetric.update({
          where: { id: existing.id },
          data,
        });
        updated++;
      } else {
        await prisma.seoMetric.create({
          data: {
            userId,
            contentType,
            contentId,
            keyword: row.keyword,
            ...data,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      imported: rows.length,
      created,
      updated,
    });
  } catch (error) {
    console.error("SEO metrics import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
