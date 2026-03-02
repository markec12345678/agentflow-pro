import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: 'Project ID is required' },
      { status: 400 }
    );
  }

  try {
    const savedState = await prisma.mcpBuilderState.findUnique({
      where: { projectId }
    });

    if (!savedState) {
      return NextResponse.json(
        { success: true, components: [], mcpConnections: {} },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        components: savedState.components,
        mcpConnections: savedState.mcpConnections
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('MCP Builder Load Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load MCP builder state' },
      { status: 500 }
    );
  }
}
