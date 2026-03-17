import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Return mock data for now
    return NextResponse.json(
      { success: true, components: [], mcpConnections: {} },
      { status: 200 }
    );
  } catch (error) {
    console.error('MCP Builder Load Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error)?.message || 'Failed to load MCP builder state' },
      { status: 500 }
    );
  }
}
