import { NextRequest, NextResponse } from 'next/server';
import { enhancedChatbotService } from '@/lib/tourism/enhanced-chatbot-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/tourism/chat
 * Send a message to the AI chatbot
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      message,
      conversationHistory = [],
      propertyId,
    } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get property context if available
    let propertyContext;
    if (propertyId) {
      const { prisma } = await import('@/lib/prisma');
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          name: true,
          type: true,
          location: true,
          amenities: true,
          pricing: true,
        },
      });
      propertyContext = property || undefined;
    }

    // Generate response
    const response = await enhancedChatbotService.generateResponse({
      userId: session.user.id,
      propertyId,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message, timestamp: new Date() },
      ],
      propertyContext,
    });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tourism/chat/action
 * Handle a suggested action from chatbot
 */
export async function POST_ACTION(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      action,
      payload,
      conversationHistory = [],
      propertyId,
    } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const result = await enhancedChatbotService.handleSuggestedAction(
      action,
      payload,
      {
        userId: session.user.id,
        propertyId,
        conversationHistory,
      }
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Action handling error:', error);
    return NextResponse.json(
      { error: 'Action failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tourism/chat/history?sessionId=xxx
 * Get chat history for a session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const propertyId = searchParams.get('propertyId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const { prisma } = await import('@/lib/prisma');
    
    const interactions = await prisma.voiceInteraction.findMany({
      where: {
        userId: session.user.id,
        sessionId: sessionId || undefined,
        propertyId: propertyId || undefined,
        interactionType: 'chat',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Transform into conversation format
    const conversation = interactions.flatMap(interaction => [
      {
        role: 'user',
        content: interaction.transcript,
        timestamp: interaction.createdAt,
      },
      {
        role: 'assistant',
        content: interaction.response || '',
        timestamp: interaction.createdAt,
        metadata: interaction.metadata,
      },
    ]);

    return NextResponse.json({
      conversation,
      total: interactions.length,
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
