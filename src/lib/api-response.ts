/**
 * AgentFlow Pro - Shared API response helpers
 * Consistent response shapes across API routes
 */

import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  message: string,
  status = 500,
  code?: string
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: code ?? "ERROR",
        message,
      },
    },
    { status }
  );
}
