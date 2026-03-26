import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

interface GDPRConsent {
  id: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  consentType: "marketing" | "analytics" | "cookies" | "data_processing";
  consentGiven: boolean;
  consentDate: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * GET /api/settings/security/gdpr
 * Get all GDPR consents
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

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const consentType = searchParams.get('type');
    const guestEmail = searchParams.get('email');

    // Get GDPR consents (in real implementation, this would fetch from database)
    const mockConsents: GDPRConsent[] = [
      {
        id: "1",
        guestId: "guest_1",
        guestName: "Janez Novak",
        guestEmail: "janez.novak@email.com",
        consentType: "marketing",
        consentGiven: true,
        consentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      {
        id: "2",
        guestId: "guest_2",
        guestName: "Maja Horvat",
        guestEmail: "maja.horvat@email.com",
        consentType: "analytics",
        consentGiven: false,
        consentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      },
      {
        id: "3",
        guestId: "guest_3",
        guestName: "Peter Kovačič",
        guestEmail: "peter.kovacic@email.com",
        consentType: "cookies",
        consentGiven: true,
        consentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.102",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
      },
      {
        id: "4",
        guestId: "guest_4",
        guestName: "Ana Zupan",
        guestEmail: "ana.zupan@email.com",
        consentType: "data_processing",
        consentGiven: true,
        consentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: "192.168.1.103",
        userAgent: "Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0"
      }
    ];

    // Apply filters
    let filteredConsents = mockConsents;
    
    if (consentType) {
      filteredConsents = filteredConsents.filter(consent => consent.consentType === consentType);
    }
    
    if (guestEmail) {
      filteredConsents = filteredConsents.filter(consent => 
        consent.guestEmail.toLowerCase().includes(guestEmail.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      data: { consents: filteredConsents }
    });

  } catch (error) {
    console.error('Get GDPR consents error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/security/gdpr
 * Update GDPR consent
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

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { consentId, consentGiven } = body;

    if (!consentId || typeof consentGiven !== 'boolean') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Consent ID and consentGiven are required' } },
        { status: 400 }
      );
    }

    // Update consent (in real implementation)
    // console.log('Updating GDPR consent:', consentId, consentGiven);

    // Log activity
    await logActivity(userId, "GDPR Consent Updated", `Updated consent for ID: ${consentId}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { message: 'GDPR consent updated successfully' }
    });

  } catch (error) {
    console.error('Update GDPR consent error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }

async function logActivity(userId: string, action: string, details: string, ipAddress: string) {
  // In real implementation, this would be stored in database
  // console.log('Activity log:', {
    userId,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  });
}
}
