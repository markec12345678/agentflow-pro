/**
 * API Route - Sandbox Management
 * GET: List sandboxes
 * POST: Create sandbox
 * DELETE: Delete sandbox
 */

import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/testing/environment-isolation';
import { dataMocker } from '@/testing/data-mocker';

export interface SandboxCreateRequest {
  name: string;
  durationHours?: number;
  isolatedDatabase?: boolean;
  mockExternalAPIs?: boolean;
  seedData?: 'production' | 'minimal' | 'custom';
  purpose?: string;
  tags?: string[];
}

export interface MockDataRequest {
  entityType: 'user' | 'reservation' | 'property' | 'workflow';
  count: number;
  locale?: 'sl' | 'en' | 'de' | 'it';
  includeRelations?: boolean;
}

/**
 * GET /api/dev/sandbox
 * List all sandboxes
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const sandboxes = sandboxManager.listSandboxes(status);
    const stats = sandboxManager.getSandboxStats();

    return NextResponse.json({
      success: true,
      data: {
        sandboxes,
        stats,
      },
    });
  } catch (error) {
    logger.error('Failed to list sandboxes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list sandboxes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dev/sandbox
 * Create new sandbox
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, durationHours, isolatedDatabase, mockExternalAPIs, seedData, purpose, tags } = body as SandboxCreateRequest;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const sandbox = await sandboxManager.createSandbox(
      {
        name,
        durationHours,
        isolatedDatabase,
        mockExternalAPIs,
        seedData,
        purpose,
        tags,
      },
      'current-user' // Would be actual user ID
    );

    return NextResponse.json({
      success: true,
      data: sandbox,
      message: 'Sandbox created successfully',
    });
  } catch (error) {
    logger.error('Failed to create sandbox:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sandbox' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dev/sandbox
 * Delete sandbox
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sandboxId = searchParams.get('id');

    if (!sandboxId) {
      return NextResponse.json(
        { success: false, error: 'Sandbox ID is required' },
        { status: 400 }
      );
    }

    const deleted = await sandboxManager.deleteSandbox(sandboxId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Sandbox not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sandbox deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete sandbox:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete sandbox' },
      { status: 500 }
    );
  }
}
