import { NextRequest, NextResponse } from 'next/server';
import { workflowVersioningService } from '@/lib/workflows/versioning-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/workflows/[id]/versions
 * Get all versions of a workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowId = params.id;
    const versions = await workflowVersioningService.getVersions(workflowId);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Get versions error:', error);
    return NextResponse.json(
      { error: 'Failed to get versions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows/[id]/versions
 * Create new version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowId = params.id;
    const body = await request.json();
    const {
      name,
      description,
      nodes,
      edges,
      metadata,
      changeSummary,
      changeType = 'minor',
    } = body;

    if (!name || !nodes || !edges) {
      return NextResponse.json(
        { error: 'Name, nodes, and edges are required' },
        { status: 400 }
      );
    }

    const version = await workflowVersioningService.createVersion(
      workflowId,
      {
        workflowId,
        name,
        description,
        nodes,
        edges,
        metadata,
      },
      {
        changeSummary: changeSummary || 'Manual version creation',
        changeType,
        createdBy: session.user.id,
      }
    );

    return NextResponse.json({ success: true, version });
  } catch (error) {
    console.error('Create version error:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
