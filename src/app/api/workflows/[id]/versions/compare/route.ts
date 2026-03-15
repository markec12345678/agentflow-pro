import { NextRequest, NextResponse } from 'next/server';
import { workflowVersioningService } from '@/lib/workflows/versioning-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/workflows/[id]/versions/compare?v1=1&v2=2
 * Compare two versions
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
    const { searchParams } = new URL(request.url);
    const v1 = parseInt(searchParams.get('v1') || '1');
    const v2 = parseInt(searchParams.get('v2') || '2');

    if (isNaN(v1) || isNaN(v2)) {
      return NextResponse.json(
        { error: 'Invalid version numbers' },
        { status: 400 }
      );
    }

    const comparison = await workflowVersioningService.compareVersions(
      workflowId,
      v1,
      v2
    );

    return NextResponse.json({ comparison });
  } catch (error) {
    logger.error('Compare versions error:', error);
    return NextResponse.json(
      { error: 'Failed to compare versions' },
      { status: 500 }
    );
  }
}
