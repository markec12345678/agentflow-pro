import { NextRequest, NextResponse } from 'next/server';
import { workflowVersioningService } from '@/lib/workflows/versioning-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/workflows/[id]/versions/[versionNumber]/rollback
 * Rollback to specific version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowId = params.id;
    const versionNumber = parseInt(params.versionNumber);

    if (isNaN(versionNumber)) {
      return NextResponse.json(
        { error: 'Invalid version number' },
        { status: 400 }
      );
    }

    const version = await workflowVersioningService.rollback(
      workflowId,
      versionNumber,
      session.user.id
    );

    return NextResponse.json({ success: true, version });
  } catch (error) {
    console.error('Rollback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rollback failed' },
      { status: 500 }
    );
  }
}
