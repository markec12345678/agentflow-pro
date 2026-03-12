/**
 * Google Gemini AI Integration
 * 
 * Use Gemini models for AI Concierge and content generation
 * Fast, cheap, and excellent for conversation
 */

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export const GEMINI_MODELS = {
  // Best for conversation & reasoning
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    context: 1000000, // 1M tokens!
    price: 0.075, // per 1M tokens (input)
    best: 'Fast conversation, reasoning, multilingual',
  },
  // Most powerful
  'gemini-2.0-pro': {
    name: 'Gemini 2.0 Pro',
    context: 2000000, // 2M tokens!
    price: 0.15,
    best: 'Complex tasks, analysis, code',
  },
  // Legacy but still good
  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    context: 1000000,
    price: 0.0375,
    best: 'Budget-friendly, fast responses',
  },
};

export class GeminiAI {
  private config: GeminiConfig;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.config = {
      apiKey,
      model,
    };
  }

  /**
   * Generate text using Gemini
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: systemPrompt 
                  ? `${systemPrompt}\n\n${prompt}`
                  : prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error?.message || error.message || errorMessage;
        } catch {
          // Response wasn't JSON
        }
        
        throw new Error(`Gemini API error: ${errorMessage}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw error;
    }
  }

  /**
   * Extract structured data from conversation
   * Perfect for AI Concierge onboarding
   */
  async extractEntities(conversation: string): Promise<any> {
    const systemPrompt = `You are a data extraction assistant. Extract structured data from conversation about property setup.

Return ONLY valid JSON with these fields:
{
  "propertyName": string | null,
  "propertyType": "hotel" | "kamp" | "kmetija" | "apartma" | "drugo" | null,
  "roomCount": number | null,
  "address": {
    "street": string | null,
    "city": string | null,
    "country": string | null
  },
  "amenities": string[]
}

If you cannot find a value, use null. Speak Slovenian.`;

    const result = await this.generateText(conversation, systemPrompt);
    
    // Clean up response to extract JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        console.error('Failed to parse JSON from Gemini response');
      }
    }
    
    return null;
  }

  /**
   * Generate response for AI Concierge
   */
  async generateConciergeResponse(
    userMessage: string,
    context: any
  ): Promise<string> {
    const systemPrompt = `You are AgentFlow Pro's AI Concierge - a friendly, helpful assistant for Slovenian property owners.

Your job:
1. Guide users through property setup conversationally
2. Extract information naturally (don't ask too many questions at once)
3. Be friendly, warm, and encouraging
4. Keep responses concise (2-3 short paragraphs max)
5. Use emojis appropriately (1-2 per message)
6. ALWAYS speak SLOVENIAN language
7. Be patient and understanding

Current context:
${JSON.stringify(context, null, 2)}

Respond naturally in Slovenian. Be conversational, not robotic.`;

    return await this.generateText(userMessage, systemPrompt);
  }

  /**
   * Test if Gemini is working
   */
  async test(): Promise<boolean> {
    try {
      const result = await this.generateText('Pozdrav! Kako si? Odgovori na kratko v slovenščini.');
      return result.length > 0 && result.toLowerCase().includes('pozdrav');
    } catch {
      return false;
    }
  }
}

/**
 * Create Gemini AI instance
 */
export function createGeminiAI(apiKey: string, model?: string): GeminiAI {
  return new GeminiAI(apiKey, model);
}

/**
 * Check if Gemini API key is valid
 */
export async function validateGeminiKey(apiKey: string): Promise<{
  valid: boolean;
  models: string[];
  error?: string;
}> {
  try {
    // Try a simple generation to test the key
    const testAI = createGeminiAI(apiKey, 'gemini-2.0-flash');
    const isValid = await testAI.test();
    
    if (isValid) {
      return {
        valid: true,
        models: Object.keys(GEMINI_MODELS),
      };
    } else {
      return {
        valid: false,
        models: [],
        error: 'API key test failed',
      };
    }
  } catch (error) {
    return {
      valid: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
