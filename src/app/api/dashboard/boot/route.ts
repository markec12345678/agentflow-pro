/**
 * Mock Dashboard Boot API
 * Returns mock data without database connection
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Return mock data for UI testing
  return NextResponse.json({
    profile: {
      onboarding: {
        industry: null,
      },
    },
    usage: {
      used: 0,
      limit: 100,
    },
    properties: [],
    blogPosts: [],
    contentHistory: [],
    checkpoints: [],
    alerts: [],
    summary: null,
    channelPerformance: null,
  });
}
