/**
 * App Icon Component
 * Returns favicon for the application
 */

import { Metadata } from 'next';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Static metadata for favicon
export const metadata: Metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

/**
 * Icon component - renders null as favicon is served statically
 */
export default function Icon() {
  return null;
}

/**
 * GET handler for dynamic favicon.ico
 * Serves the static favicon file
 */
export async function GET() {
  try {
    // Try to read from public folder
    const faviconPath = join(process.cwd(), 'public', 'favicon.ico');
    const faviconBuffer = readFileSync(faviconPath);
    
    return new NextResponse(faviconBuffer, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    // Fallback - return empty response
    console.warn('[Icon] Favicon not found, returning empty response');
    return new NextResponse(null, {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
