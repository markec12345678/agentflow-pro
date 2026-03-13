/**
 * Mock Tourism Notifications API
 * Returns empty array without database
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    notifications: [],
    unreadCount: 0,
  });
}

export async function POST() {
  return NextResponse.json({
    notification: {
      id: 'mock-id',
      title: 'Mock',
      message: 'Mock notification',
    },
  });
}

export async function PATCH() {
  return NextResponse.json({ success: true });
}
