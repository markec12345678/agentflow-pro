/**
 * App Icon - Dynamic Route Handler
 * 
 * Serves favicon.ico dynamically
 * Required for Next.js metadata route
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * GET handler for favicon.ico
 * Returns the static favicon file from /public folder
 */
export async function GET() {
  try {
    const faviconPath = join(process.cwd(), 'public', 'favicon.ico');
    const faviconBuffer = readFileSync(faviconPath);
    
    return new NextResponse(faviconBuffer, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.warn('[Icon] Favicon not found:', error);
    // Return empty 1x1 transparent PNG as fallback
    const transparentPixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    return new NextResponse(transparentPixel, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
}
