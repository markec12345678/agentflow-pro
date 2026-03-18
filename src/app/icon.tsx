/**
 * App Icon - Dynamic Generation with ImageResponse
 * 
 * Generates favicon dynamically using Next.js OG Image API
 * Must use 'edge' runtime for worker thread compatibility
 * 
 * @see https://nextjs.org/docs/app/api-reference/functions/image-response
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// CRITICAL: Must use edge runtime for worker thread compatibility
export const runtime = 'edge';

// Icon configuration
const ICON_SIZE = 32;
const BACKGROUND_COLOR = '#1a73e8'; // AgentFlow Pro blue
const TEXT_COLOR = '#ffffff';

/**
 * GET handler - Returns dynamic favicon as ImageResponse
 * 
 * @param request - Next.js request object
 * @returns ImageResponse with generated icon
 */
export async function GET(request: NextRequest) {
  try {
    // Get search params for customization (optional)
    const { searchParams } = new URL(request.url);
    const size = searchParams.get('size') || ICON_SIZE.toString();
    
    const width = parseInt(size, 10);
    const height = width;

    // Create ImageResponse with SVG icon
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${BACKGROUND_COLOR} 0%, #0d47a1 100%)`,
            borderRadius: '20%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* AgentFlow Pro Logo - Simplified "A" */}
          <svg
            width={width * 0.6}
            height={height * 0.6}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left leg of A */}
            <path
              d="M12 4L4 20H8L12 12L16 20H20L12 4Z"
              fill={TEXT_COLOR}
              stroke={TEXT_COLOR}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Crossbar of A */}
            <path
              d="M8 14H16"
              stroke={TEXT_COLOR}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ),
      {
        width,
        height,
        emoji: 'text', // Use text rendering for better quality
      }
    );
  } catch (error) {
    // Log error but don't throw - return fallback
    console.error('[Icon] Error generating favicon:', error);
    
    // Return simple fallback icon
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: BACKGROUND_COLOR,
            color: TEXT_COLOR,
            fontSize: 20,
            fontWeight: 'bold',
          }}
        >
          A
        </div>
      ),
      {
        width: ICON_SIZE,
        height: ICON_SIZE,
      }
    );
  }
}

/**
 * Static metadata for SEO
 */
export const metadata = {
  icons: {
    icon: '/api/icon',
    apple: '/api/icon?size=180',
  },
};
