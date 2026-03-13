/**
 * Mock Tourism Reservations API
 * Returns empty array without database
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    reservations: [],
    total: 0,
  });
}

export async function POST() {
  return NextResponse.json({
    reservation: {
      id: 'mock-res',
      guestName: 'Mock Guest',
    },
  });
}
