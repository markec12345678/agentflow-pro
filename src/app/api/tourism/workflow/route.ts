/**
 * AgentFlow Pro - Tourism Use Cases API
 * MVP tourism workflows endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTourismWorkflows, TourismWorkflowInput } from '@/workflows/tourism-workflows';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body: TourismWorkflowInput = await request.json();
    const tourismWorkflows = getTourismWorkflows();

    const result = await tourismWorkflows.executeWorkflow(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tourism workflow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AgentFlow Pro Tourism Workflows API',
    useCases: [
      {
        id: 'property_description',
        name: 'Property Descriptions',
        target: 'Hotels/Villas',
        value: 'HIGH',
        description: 'Generate compelling property descriptions with SEO optimization'
      },
      {
        id: 'tour_package',
        name: 'Tour Package Content',
        target: 'Tour Operators',
        value: 'HIGH',
        description: 'Create detailed tour packages with itineraries and pricing'
      },
      {
        id: 'destination_blog',
        name: 'Destination Blog Posts',
        target: 'Travel Agencies',
        value: 'MEDIUM',
        description: 'Generate SEO-optimized destination guides and travel content'
      },
      {
        id: 'guest_automation',
        name: 'Guest Email Automation',
        target: 'Hospitality',
        value: 'HIGH',
        description: 'Automated guest communications for pre-arrival, post-stay, and service requests'
      },
      {
        id: 'social_media',
        name: 'Social Media Content',
        target: 'All',
        value: 'MEDIUM',
        description: 'Generate platform-specific social media content for tourism marketing'
      },
      {
        id: 'translation',
        name: 'Multi-language Translation',
        target: 'International',
        value: 'HIGH',
        description: 'Translate tourism content to multiple languages for global reach'
      }
    ],
    endpoints: {
      workflow: '/api/tourism/workflow',
      documentation: '/api/tourism/use-cases'
    }
  });
}
