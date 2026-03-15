import { NextRequest, NextResponse } from 'next/server';
import { sustainabilityService } from '@/lib/tourism/sustainability-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/tourism/sustainability/carbon-footprint
 * Calculate carbon footprint for a property
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
      energyKwh,
      waterM3,
      wasteKg,
      recyclingKg,
      nightsStayed,
      guests,
      periodDays = 30,
      saveToDb = true,
    } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Verify property access
    const { prisma } = await import('@/lib/prisma');
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property || property.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
    }

    // Calculate carbon footprint
    const footprint = sustainabilityService.calculateCarbonFootprint(
      { energyKwh, waterM3, wasteKg, recyclingKg, nightsStayed, guests },
      periodDays
    );

    // Save to database
    if (saveToDb) {
      const date = new Date();
      await prisma.sustainabilityMetric.upsert({
        where: {
          propertyId_date: {
            propertyId,
            date: new Date(date.getFullYear(), date.getMonth(), 1), // Monthly
          },
        },
        update: {
          energyKwh,
          waterM3,
          wasteKg,
          recyclingKg,
          carbonKg: footprint.totalCarbonKg,
        },
        create: {
          propertyId,
          date: new Date(date.getFullYear(), date.getMonth(), 1),
          energyKwh,
          waterM3,
          wasteKg,
          recyclingKg,
          carbonKg: footprint.totalCarbonKg,
          source: 'manual',
        },
      });
    }

    return NextResponse.json({
      success: true,
      footprint,
    });
  } catch (error) {
    logger.error('Carbon footprint error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate carbon footprint' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tourism/sustainability/carbon-footprint?propertyId=xxx
 * Get carbon footprint history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const months = parseInt(searchParams.get('months') || '6');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const metrics = await prisma.sustainabilityMetric.findMany({
      where: {
        propertyId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    const totalCarbon = metrics.reduce((sum, m) => sum + m.carbonKg, 0);
    const avgCarbon = metrics.length > 0 ? totalCarbon / metrics.length : 0;

    return NextResponse.json({
      metrics,
      summary: {
        totalCarbonKg: Math.round(totalCarbon * 100) / 100,
        avgMonthlyCarbonKg: Math.round(avgCarbon * 100) / 100,
        dataPoints: metrics.length,
      },
    });
  } catch (error) {
    logger.error('Get carbon footprint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carbon footprint' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tourism/sustainability/practices
 * Save eco practices for a property
 */
export async function POST_PRACTICES(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, practices } = body;

    if (!propertyId || !Array.isArray(practices)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');
    
    // Verify property access
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property || property.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
    }

    // Bulk create/update practices
    const result = await prisma.$transaction(
      practices.map((practice: any) =>
        prisma.ecoPractice.upsert({
          where: { id: practice.id || '' },
          update: {
            implemented: practice.implemented,
            implementedAt: practice.implemented ? new Date() : null,
            impactMetrics: practice.impactMetrics,
          },
          create: {
            propertyId,
            name: practice.name,
            category: practice.category,
            description: practice.description,
            impactLevel: practice.impactLevel,
            implemented: practice.implemented,
            implementedAt: practice.implemented ? new Date() : null,
            impactMetrics: practice.impactMetrics,
          },
        })
      )
    );

    return NextResponse.json({ success: true, practices: result });
  } catch (error) {
    logger.error('Save practices error:', error);
    return NextResponse.json(
      { error: 'Failed to save practices' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tourism/sustainability/practices?propertyId=xxx
 * Get eco practices for a property
 */
export async function GET_PRACTICES(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');
    
    const practices = await prisma.ecoPractice.findMany({
      where: {
        propertyId,
        category: category || undefined,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const stats = {
      total: practices.length,
      implemented: practices.filter(p => p.implemented).length,
      byCategory: practices.reduce((acc: any, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({ practices, stats });
  } catch (error) {
    logger.error('Get practices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch practices' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tourism/sustainability/templates
 * Get eco practice templates
 */
export async function GET_TEMPLATES(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = sustainabilityService.getEcoPracticeTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    logger.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tourism/sustainability/certifications
 * Check certification eligibility
 */
export async function POST_CERTIFICATIONS(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, practices, carbonRating } = body;

    if (!propertyId || !practices || !carbonRating) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    const eligibility = sustainabilityService.checkCertificationEligibility(
      practices,
      carbonRating
    );

    return NextResponse.json({
      success: true,
      certifications: eligibility,
    });
  } catch (error) {
    logger.error('Certification check error:', error);
    return NextResponse.json(
      { error: 'Failed to check certifications' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tourism/sustainability/report?propertyId=xxx
 * Generate full sustainability report
 */
export async function GET_REPORT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');
    
    // Get latest metrics
    const latestMetric = await prisma.sustainabilityMetric.findFirst({
      where: { propertyId },
      orderBy: { date: 'desc' },
    });

    // Get practices
    const practices = await prisma.ecoPractice.findMany({
      where: { propertyId },
    });

    // Get certifications
    const certifications = await prisma.ecoCertification.findMany({
      where: { propertyId },
    });

    if (!latestMetric) {
      return NextResponse.json(
        { error: 'No sustainability data found' },
        { status: 404 }
      );
    }

    const report = sustainabilityService.generateSustainabilityReport(
      {
        energyKwh: latestMetric.energyKwh,
        waterM3: latestMetric.waterM3,
        wasteKg: latestMetric.wasteKg,
        recyclingKg: latestMetric.recyclingKg,
      },
      practices.map(p => ({
        name: p.name,
        implemented: p.implemented,
        category: p.category,
      })),
      certifications.map(c => ({ name: c.name, status: c.status }))
    );

    return NextResponse.json({
      success: true,
      report,
      metrics: latestMetric,
      practices,
      certifications,
    });
  } catch (error) {
    logger.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
