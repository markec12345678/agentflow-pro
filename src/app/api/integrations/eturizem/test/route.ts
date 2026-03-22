import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { prisma } from '@/database/schema';

export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/eturizem/test
 * Test eTurizem API connection
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

    // Get user's eTurizem configuration
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        eturizemConfig: true
      }
    });

    const config = user?.eturizemConfig as any;
    
    if (!config?.apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_API_KEY', message: 'API key not configured' } },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    
    try {
      // Test API connection (mock implementation)
      // In real implementation, this would make actual API calls to eTurizem
      
      // Mock API test
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulate random failures for testing
      if (Math.random() < 0.2) {
        throw new Error("API authentication failed");
      }

      const responseTime = Date.now() - startTime;
      
      // Mock API response
      const mockApiResponse = {
        status: "connected",
        apiVersion: "v2.1",
        rateLimit: {
          remaining: 950,
          limit: 1000,
          resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        },
        account: {
          id: "12345",
          name: "Test Tourism Account",
          properties: 12,
          activeSubscription: true
        }
      };

      return NextResponse.json({
        success: true,
        data: {
          status: "success",
          responseTime: Math.floor(responseTime / 1000),
          timestamp: new Date().toISOString(),
          apiResponse: mockApiResponse
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        data: {
          status: "error",
          responseTime: Math.floor(responseTime / 1000),
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Connection failed'
        }
      });
    }

  } catch (error) {
    console.error('Test eTurizem connection error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
