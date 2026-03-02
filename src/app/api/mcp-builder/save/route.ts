import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { projectId, components, mcpConnections } = await req.json();

    // Validate input
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Save to database
    const savedState = await prisma.mcpBuilderState.upsert({
      where: { projectId },
      create: {
        projectId,
        components: components as any,
        mcpConnections: mcpConnections as any,
        updatedAt: new Date()
      },
      update: {
        components: components as any,
        mcpConnections: mcpConnections as any,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(
      { success: true, data: savedState },
      { status: 200 }
    );
  } catch (error) {
    console.error('MCP Builder Save Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save MCP builder state' },
      { status: 500 }
    );
  }
}
