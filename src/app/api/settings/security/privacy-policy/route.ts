import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * GET /api/settings/security/privacy-policy
 * Get privacy policy content
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

    // Get privacy policy (in real implementation, this would fetch from database)
    const privacyPolicy = {
      id: "policy_1",
      version: "1.0",
      title: "Privacy Policy",
      content: `# Privacy Policy

**Last Updated:** ${new Date().toLocaleDateString()}

## 1. Introduction

We are committed to protecting your privacy and personal data. This privacy policy explains how we collect, use, and protect your information when you use our services.

## 2. Data We Collect

### Personal Information
- Name and contact details
- Email address and phone number
- Payment information
- Booking details and preferences

### Usage Data
- How you interact with our website
- Pages visited and time spent
- Device and browser information

### Technical Data
- IP address
- Cookies and similar technologies
- System performance data

## 3. How We Use Your Data

We use your data to:
- Process your bookings and reservations
- Provide customer support
- Send important notifications
- Improve our services
- Comply with legal obligations

## 4. Data Protection

We implement appropriate security measures to protect your personal data:
- Encryption of sensitive information
- Secure servers and databases
- Regular security audits
- Staff training on data protection

## 5. Your Rights

Under GDPR, you have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Object to processing
- Data portability
- Restrict processing

## 6. Cookies

We use cookies to:
- Remember your preferences
- Analyze website usage
- Provide personalized content
- Ensure website security

## 7. Third-Party Services

We may share data with:
- Payment processors
- Booking platforms
- Analytics providers
- Marketing services (with consent)

## 8. Data Retention

We retain your data for:
- Booking records: 7 years
- Financial data: 10 years
- Marketing communications: Until you unsubscribe
- Analytics data: 26 months

## 9. International Transfers

Your data may be transferred to countries outside the EU. We ensure appropriate safeguards are in place for such transfers.

## 10. Contact Us

If you have questions about this privacy policy or your data rights, please contact us at:
- Email: privacy@hotel-alpina.si
- Phone: +386 1 234 5678
- Address: Cankarjeva ulica 5, 1000 Ljubljana, Slovenia

## 11. Changes to This Policy

We may update this privacy policy from time to time. We will notify you of any changes by:
- Posting the new policy on our website
- Sending email notifications
- Updating the "Last Updated" date

## 12. Legal Basis

We process your data based on:
- Contract necessity (for bookings)
- Legal obligations
- Legitimate interests
- Your consent (where required)

## 13. Complaints

If you believe we have mishandled your data, you can:
- Contact our Data Protection Officer
- File a complaint with the Information Commissioner of Slovenia
- Seek legal remedies
`,
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    };

    return NextResponse.json({
      success: true,
      data: { policy: privacyPolicy }
    });

  } catch (error) {
    console.error('Get privacy policy error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/security/privacy-policy
 * Update privacy policy content
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
    const { content, publish } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Content is required' } },
        { status: 400 }
      );
    }

    // Update privacy policy (in real implementation)
    const updatedPolicy = {
      id: "policy_1",
      version: "1.1",
      title: "Privacy Policy",
      content,
      publishedAt: publish ? new Date().toISOString() : undefined,
      isActive: publish || false
    };

    // console.log('Updated privacy policy:', { version: updatedPolicy.version, published: publish });

    // Log activity
    await logActivity(userId, "Privacy Policy Updated", `Updated privacy policy version: ${updatedPolicy.version}`, request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || "unknown");

    return NextResponse.json({
      success: true,
      data: { 
        message: publish ? 'Privacy policy published successfully' : 'Privacy policy saved as draft',
        policy: updatedPolicy
      }
    });

  } catch (error) {
    console.error('Update privacy policy error:', error);
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
