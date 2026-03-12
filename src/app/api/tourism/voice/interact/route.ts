import { NextRequest, NextResponse } from 'next/server';
import { voiceAssistantService } from '@/lib/tourism/voice-assistant-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/tourism/voice/interact
 * Process voice interaction: STT → Intent → Response → TTS
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const propertyId = formData.get('propertyId') as string;
    const sessionId = formData.get('sessionId') as string;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get property context if available
    let propertyContext;
    if (propertyId) {
      const { prisma } = await import('@/lib/prisma');
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          name: true,
          description: true,
          amenities: true,
          pricing: true,
        },
      });
      propertyContext = property || undefined;
    }

    // Process voice interaction
    const result = await voiceAssistantService.processVoiceInteraction(buffer, propertyContext);

    // Log interaction to database
    await voiceAssistantService.logInteraction({
      userId: session.user.id,
      propertyId: propertyId || undefined,
      sessionId: sessionId || `session-${Date.now()}`,
      interactionType: 'inquiry',
      transcript: result.transcript,
      intent: result.intent,
      confidence: result.confidence,
      response: result.response,
      responseAudioUrl: result.responseAudioUrl,
      duration: 0,
      language: result.language,
    });

    return NextResponse.json({
      success: true,
      interaction: result,
    });
  } catch (error) {
    console.error('Voice interaction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Voice processing failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tourism/voice/transcribe
 * Transcribe audio to text only
 */
export async function POST_TRANSSCRIBE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'sl';

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await voiceAssistantService.speechToText(buffer, { language });

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      language: result.language,
      duration: result.duration,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tourism/voice/synthesize
 * Convert text to speech
 */
export async function POST_SYNTHESIZE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, voice = 'default', language = 'sl-SI' } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const result = await voiceAssistantService.textToSpeech(text, { voice, language });

    return NextResponse.json({
      success: true,
      audioUrl: result.audioUrl,
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Text-to-speech failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tourism/voice/interactions?sessionId=xxx
 * Get voice interaction history
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
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error('Get interactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}
