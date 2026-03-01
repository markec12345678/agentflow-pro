import { NextResponse } from "next/server";
import { prisma } from "@/database/schema";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "connected",
      ok: true,
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        database: "error",
        ok: false,
        error: "database",
      },
      { status: 503 }
    );
  }
}
