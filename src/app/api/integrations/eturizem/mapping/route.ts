import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface PropertyMapping {
  id: string;
  localPropertyId: string;
  localPropertyName: string;
  eturizemId: string | null;
  eturizemName: string | null;
  lastSyncTime: string | null;
  syncStatus: "synced" | "pending" | "error" | "not_mapped";
  errorMessage?: string;
}

/**
 * GET /api/integrations/eturizem/mapping
 * Get property mappings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get all properties with their eTurizem mapping
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        eturizemId: true,
        eturizemSyncStatus: true,
        eturizemSyncedAt: true,
        eturizemLastError: true
      },
      orderBy: { name: 'asc' }
    });

    const mappings: PropertyMapping[] = properties.map(property => ({
      id: property.id,
      localPropertyId: property.id,
      localPropertyName: property.name,
      eturizemId: property.eturizemId,
      eturizemName: property.eturizemId ? `eTurizem Property ${property.eturizemId}` : null,
      lastSyncTime: property.eturizemSyncedAt ? property.eturizemSyncedAt.toISOString() : null,
      syncStatus: property.eturizemSyncStatus as any || "not_mapped",
      errorMessage: property.eturizemLastError || undefined
    }));

    return NextResponse.json({
      success: true,
      data: { mappings }
    });

  } catch (error) {
    console.error('Get property mappings error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/eturizem/mapping
 * Create or update property mapping
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { localPropertyId, eturizemId } = body;

    // Validate input
    if (!localPropertyId || !eturizemId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Local property ID and eTurizem ID are required' } },
        { status: 400 }
      );
    }

    // Check if property exists
    const property = await prisma.property.findFirst({
      where: { id: localPropertyId }
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Local property not found' } },
        { status: 404 }
      );
    }

    // Update property mapping
    const updatedProperty = await prisma.property.update({
      where: { id: localPropertyId },
      data: {
        eturizemId,
        eturizemSyncStatus: "pending",
        eturizemLastError: null
      }
    });

    const mapping: PropertyMapping = {
      id: updatedProperty.id,
      localPropertyId: updatedProperty.id,
      localPropertyName: updatedProperty.name,
      eturizemId: updatedProperty.eturizemId,
      eturizemName: `eTurizem Property ${eturizemId}`,
      lastSyncTime: updatedProperty.eturizemSyncedAt ? updatedProperty.eturizemSyncedAt.toISOString() : null,
      syncStatus: "pending"
    };

    return NextResponse.json({
      success: true,
      data: { mapping }
    });

  } catch (error) {
    console.error('Create property mapping error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Server error' } },
      { status: 500 }
    );
  }
}
