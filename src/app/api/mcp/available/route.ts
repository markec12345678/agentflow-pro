import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a real implementation, this would read from your .cursor/mcp.json
    // For now, we'll return the available MCPs from your project
    const availableMCPs = [
      'Memory',
      'GitHub',
      'Vercel',
      'Netlify',
      'Firecrawl',
      'Brave',
      'Context7',
      'Deploy',
      'Code',
      'Content',
      'Research',
      'Communication'
    ];

    return NextResponse.json(
      { success: true, mcps: availableMCPs },
      { status: 200 }
    );
  } catch (error) {
    console.error('MCP Available Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get available MCPs' },
      { status: 500 }
    );
  }
}
