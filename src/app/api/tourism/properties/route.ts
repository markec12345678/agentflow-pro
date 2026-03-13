/**
 * Mock Tourism Properties API
 * Returns empty array without database
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    properties: [],
  });
}

export async function POST() {
  return NextResponse.json({
    property: {
      id: 'mock-prop',
      name: 'Mock Property',
    },
  });
}
