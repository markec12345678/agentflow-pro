import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computerVisionService } from '@/lib/tourism/computer-vision-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/tourism/photo-analysis
 * Analyze property photos for quality, amenities, and damage
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyId,
      imageUrl,
      photoId,
      analysisTypes = ['quality', 'amenity', 'damage'],
      saveToDb = true,
    } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Verify property access
    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { ownerId: true },
      });

      if (!property || property.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
      }
    }

    // Perform AI analysis
    const { result, metadata } = await computerVisionService.analyzePhoto(imageUrl, analysisTypes);

    // Save to database if requested
    let photoAnalysis;
    if (saveToDb && propertyId) {
      photoAnalysis = await prisma.photoAnalysis.create({
        data: {
          propertyId,
          photoId: photoId || null,
          imageUrl,
          analysisType: analysisTypes.join(','),
          qualityScore: result.qualityScore,
          amenities: result.amenities,
          damageDetected: result.damage.detected,
          damageType: result.damage.type || null,
          damageSeverity: result.damage.severity || null,
          metadata: {
            ...metadata,
            qualityMetrics: result.qualityMetrics,
            suggestions: result.suggestions,
          },
          processedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      analysis: result,
      metadata,
      photoAnalysisId: photoAnalysis?.id,
      recommendations: computerVisionService.generateQualityRecommendations(result),
    });
  } catch (error) {
    logger.error('Photo analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tourism/photo-analysis?propertyId=xxx
 * Get all photo analyses for a property
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const analysisType = searchParams.get('analysisType');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const analyses = await prisma.photoAnalysis.findMany({
      where: {
        propertyId,
        analysisType: analysisType || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: analyses.length,
      withDamage: analyses.filter(a => a.damageDetected).length,
      avgQualityScore: analyses.reduce((sum, a) => sum + (a.qualityScore || 0), 0) / analyses.length || 0,
    };

    return NextResponse.json({
      analyses,
      stats,
    });
  } catch (error) {
    logger.error('Get photo analyses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}
