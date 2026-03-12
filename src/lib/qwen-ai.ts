/**
 * Qwen AI Integration via OpenRouter
 * 
 * Use Qwen models for AI Concierge and content generation
 * Cheaper alternative to GPT-4 with comparable performance
 */

export interface QwenConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export const QWEN_MODELS = {
  // Best for conversation & reasoning
  'qwen/qwen-2.5-72b-instruct': {
    name: 'Qwen 2.5 72B Instruct',
    context: 128000,
    price: 0.40, // per 1M tokens
    best: 'Conversation, reasoning, general tasks',
  },
  // Good balance of speed & quality
  'qwen/qwen-2.5-32b-instruct': {
    name: 'Qwen 2.5 32B Instruct',
    context: 64000,
    price: 0.20,
    best: 'Content generation, summarization',
  },
  // Fast & cheap
  'qwen/qwen-2.5-14b-instruct': {
    name: 'Qwen 2.5 14B Instruct',
    context: 32000,
    price: 0.10,
    best: 'Quick responses, chat',
  },
  // For code generation
  'qwen/qwen-2.5-coder-32b-instruct': {
    name: 'Qwen Coder 2.5 32B Instruct',
    context: 64000,
    price: 0.20,
    best: 'Code generation, debugging',
  },
};

export class QwenAI {
  private config: QwenConfig;

  constructor(apiKey: string, model: string = 'qwen-2.5-72b') {
    this.config = {
      apiKey,
      baseUrl: 'https://openrouter.ai/api/v1',
      model,
    };
  }

  /**
   * Generate text using Qwen
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://agentflow.pro',
          'X-Title': 'AgentFlow Pro',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt || 'You are a helpful assistant.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Qwen API Response:', {
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
        
        throw new Error(`Qwen API error: ${errorMessage}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Qwen generation error:', error);
      throw error;
    }
  }

  /**
   * Extract structured data from conversation
   * Perfect for AI Concierge onboarding
   */
  async extractEntities(conversation: string): Promise<any> {
    const systemPrompt = `You are a data extraction assistant. Extract structured data from conversation.

Return JSON with:
- propertyName: string
- propertyType: 'hotel' | 'kamp' | 'kmetija' | 'apartma' | 'drugo'
- roomCount: number
- address: { street, city, country }
- amenities: string[]

If data is missing, use null.`;

    const result = await this.generateText(conversation, systemPrompt);
    
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  /**
   * Generate response for AI Concierge
   */
  async generateConciergeResponse(
    userMessage: string,
    context: any
  ): Promise<string> {
    const systemPrompt = `You are AgentFlow Pro's AI Concierge - a friendly, helpful assistant for property owners.

Your job:
1. Guide users through property setup
2. Extract information naturally from conversation
3. Be friendly and encouraging
4. Keep responses concise (2-3 paragraphs max)
5. Use emojis appropriately
6. Speak Slovenian language

Current context:
${JSON.stringify(context, null, 2)}

Respond naturally in Slovenian.`;

    return await this.generateText(userMessage, systemPrompt);
  }

  /**
   * Test if Qwen is working
   */
  async test(): Promise<boolean> {
    try {
      const result = await this.generateText('Pozdrav! Kako si?');
      return result.length > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Create Qwen AI instance
 */
export function createQwenAI(apiKey: string, model?: string): QwenAI {
  return new QwenAI(apiKey, model);
}

/**
 * Check if Qwen API key is valid
 */
export async function validateQwenKey(apiKey: string): Promise<{
  valid: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return { valid: false, models: [], error: 'Invalid API key' };
    }

    const data = await response.json();
    const qwenModels = data.data
      .filter((m: any) => m.id.includes('qwen'))
      .map((m: any) => m.id);

    return {
      valid: true,
      models: qwenModels,
    };
  } catch (error) {
    return {
      valid: false,
      models: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
