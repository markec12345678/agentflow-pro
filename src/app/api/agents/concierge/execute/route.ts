import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { createConciergeAgent } from "@/agents/concierge/ConciergeAgent";

/**
 * POST /api/agents/concierge/execute
 * 
 * Execute AI Concierge Agent for onboarding
 * Processes user message and returns AI response
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // 2. Parse request
    const { message, context } = await request.json();
    
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // 3. Create and execute agent
    const agent = createConciergeAgent();
    
    const result = await agent.processMessage(
      session.user.id,
      message,
      context
    );

    // 4. Return response
    return NextResponse.json({
      success: true,
      response: result.response,
      progress: result.progress,
      step: result.context.step,
      createdResources: result.createdResources,
      extractedData: result.context.extractedData,
    });

  } catch (error) {
    console.error("Concierge agent error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/concierge/execute
 * 
 * Get current onboarding status for user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // TODO: Get onboarding status from database
    // For now, return placeholder
    return NextResponse.json({
      success: true,
      status: "not_started",
      progress: 0,
    });

  } catch (error) {
    console.error("Concierge status error:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to get status",
      },
      { status: 500 }
    );
  }
}
