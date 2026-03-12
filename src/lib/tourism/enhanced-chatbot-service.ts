/**
 * Enhanced AI Chatbot Service with LLM Integration
 * Handles: Context-aware conversations, Multi-turn dialogue, Advanced intent recognition
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface ChatContext {
  userId: string;
  propertyId?: string;
  conversationHistory: ChatMessage[];
  userPreferences?: any;
  propertyContext?: any;
}

interface ChatResponse {
  message: string;
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  suggestedActions: Array<{
    label: string;
    action: string;
    payload?: any;
  }>;
  requiresHumanIntervention?: boolean;
}

export class EnhancedChatbotService {
  private apiKey: string;
  private maxHistoryLength = 10;

  constructor() {
    this.apiKey = process.env.INFERENCE_SH_API_KEY || process.env.HUGGINGFACE_API_KEY || '';
  }

  /**
   * Generate context-aware response using LLM
   */
  async generateResponse(context: ChatContext): Promise<ChatResponse> {
    const latestMessage = context.conversationHistory[context.conversationHistory.length - 1];
    
    if (!latestMessage || latestMessage.role !== 'user') {
      throw new Error('No user message to respond to');
    }

    try {
      // Build enhanced prompt with context
      const prompt = this.buildEnhancedPrompt(context, latestMessage.content);

      const response = await this.callLLM(prompt, context.conversationHistory);
      
      // Parse LLM response
      const parsed = this.parseLLMResponse(response);

      // Log conversation for analytics
      await this.logConversation(context, parsed);

      return parsed;
    } catch (error) {
      console.error('Chatbot response generation failed:', error);
      
      // Fallback to simple response
      return this.fallbackResponse(latestMessage.content);
    }
  }

  /**
   * Build enhanced prompt with full context
   */
  private buildEnhancedPrompt(context: ChatContext, userMessage: string): string {
    const propertyInfo = context.propertyContext 
      ? `
Property Information:
- Name: ${context.propertyContext.name || 'Unknown'}
- Type: ${context.propertyContext.type || 'Unknown'}
- Location: ${context.propertyContext.location || 'Unknown'}
- Amenities: ${context.propertyContext.amenities?.join(', ') || 'None'}
- Pricing: ${context.propertyContext.pricing?.avgPrice || 'Unknown'}€ per night
` 
      : '';

    const recentHistory = context.conversationHistory
      .slice(-this.maxHistoryLength)
      .map(msg => `${msg.role === 'user' ? 'Guest' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    return `
You are a professional hotel/tourism AI assistant for Slovenian tourism properties.
Your role is to help guests with inquiries about bookings, amenities, pricing, and local attractions.

${propertyInfo}

Conversation History:
${recentHistory}

Current Guest Message: "${userMessage}"

Respond in the following JSON format:
{
  "message": "Your helpful response in Slovenian (or match guest's language)",
  "intent": "One of: booking_inquiry, pricing_question, amenity_question, check_in_out, local_info, complaint, request, general_chat",
  "confidence": 0.95,
  "entities": {
    "date": "2026-03-15" or null,
    "guests": 2 or null,
    "nights": 3 or null,
    "room_type": "double" or null
  },
  "suggestedActions": [
    {"label": "Check Availability", "action": "check_availability", "payload": {"date": "2026-03-15"}}
  ],
  "requiresHumanIntervention": false
}

Guidelines:
- Be friendly, professional, and helpful
- Use Slovenian unless guest wrote in another language
- If intent is unclear, ask clarifying questions
- For complex issues, suggest human assistance
- Include 1-3 suggested actions when relevant
`;
  }

  /**
   * Call LLM API (Claude/Gemini/Qwen)
   */
  private async callLLM(prompt: string, history: ChatMessage[]): Promise<string> {
    const messages = [
      { role: 'system', content: 'You are a helpful tourism assistant.' },
      ...history.slice(-this.maxHistoryLength),
      { role: 'user', content: prompt }
    ];

    const response = await fetch('https://api.inference.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4.5', // or 'gemini-3-pro', 'qwen-plus'
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse LLM response into structured format
   */
  private parseLLMResponse(content: string): ChatResponse {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        message: parsed.message || 'Oprostite, nisem razumel.',
        intent: parsed.intent || 'general_chat',
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || {},
        suggestedActions: parsed.suggestedActions || [],
        requiresHumanIntervention: parsed.requiresHumanIntervention || false,
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      return this.fallbackResponse(content);
    }
  }

  /**
   * Fallback response when LLM fails
   */
  private fallbackResponse(userMessage: string): ChatResponse {
    const text = userMessage.toLowerCase();
    
    // Simple keyword-based intent detection
    let intent = 'general_chat';
    if (text.match(/rezervir|book|termin/)) intent = 'booking_inquiry';
    else if (text.match(/cena|price|strošek/)) intent = 'pricing_question';
    else if (text.match(/oprema|amenity|wifi|bazen/)) intent = 'amenity_question';
    else if (text.match(/prihod|odhod|check-in|check-out/)) intent = 'check_in_out';
    else if (text.match(/težava|problem|slabo/)) intent = 'complaint';

    return {
      message: 'Hvala za vaše sporočilo. Kako vam lahko pomagam?',
      intent,
      confidence: 0.3,
      entities: {},
      suggestedActions: [
        { label: 'Preveri razpoložljivost', action: 'check_availability' },
        { label: 'Kontaktiraj recepcijo', action: 'contact_reception' },
      ],
      requiresHumanIntervention: intent === 'complaint',
    };
  }

  /**
   * Log conversation for analytics and improvement
   */
  private async logConversation(context: ChatContext, response: ChatResponse): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      
      const latestMessage = context.conversationHistory[context.conversationHistory.length - 1];
      
      await prisma.voiceInteraction.create({
        data: {
          userId: context.userId,
          propertyId: context.propertyId,
          sessionId: `chat-${Date.now()}`,
          interactionType: 'chat',
          transcript: latestMessage.content,
          intent: response.intent,
          confidence: response.confidence,
          response: response.message,
          language: 'sl',
          metadata: {
            entities: response.entities,
            suggestedActions: response.suggestedActions,
            requiresHumanIntervention: response.requiresHumanIntervention,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log conversation:', error);
    }
  }

  /**
   * Handle suggested action from chatbot
   */
  async handleSuggestedAction(
    action: string,
    payload: any,
    context: ChatContext
  ): Promise<string> {
    switch (action) {
      case 'check_availability':
        return this.checkAvailability(payload, context);
      case 'contact_reception':
        return this.contactReception(context);
      case 'book_now':
        return this.initiateBooking(payload, context);
      default:
        return 'Akcija ni podprta.';
    }
  }

  private async checkAvailability(payload: any, context: ChatContext): Promise<string> {
    // TODO: Implement actual availability check
    const { prisma } = await import('@/lib/prisma');
    
    if (!context.propertyId) {
      return 'Prosim izberite nastanitev za preverjanje razpoložljivosti.';
    }

    // Mock availability check
    const available = Math.random() > 0.3;
    
    return available
      ? '✅ Na voljo! Imamo proste termine za izbrane datume. Želite narediti rezervacijo?'
      : '❌ Oprostite, za izbrane datume nimamo prostih sob. Želite preveriti druge termine?';
  }

  private async contactReception(context: ChatContext): Promise<string> {
    // TODO: Implement actual contact mechanism
    return 'Povezujem vas z recepcijo... Lahko jih kontaktirate na telefon +386 1 234 5678 ali email info@example.com';
  }

  private async initiateBooking(payload: any, context: ChatContext): Promise<string> {
    // TODO: Implement booking flow
    return 'V redu! Začenjam postopek rezervacije. Prosim vnesite podatke...';
  }

  /**
   * Get conversation summary for handoff to human
   */
  async getConversationSummary(conversationHistory: ChatMessage[]): Promise<string> {
    try {
      const prompt = `
Summarize this conversation in 2-3 sentences, highlighting:
1. Guest's main inquiry or issue
2. Key details (dates, number of guests, special requests)
3. Current status and next steps

Conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Summary:
      `.trim();

      const response = await this.callLLM(prompt, []);
      return response.trim();
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return 'Conversation summary unavailable';
    }
  }
}

export const enhancedChatbotService = new EnhancedChatbotService();
