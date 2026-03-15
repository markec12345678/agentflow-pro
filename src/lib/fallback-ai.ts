/**
 * Fallback AI Provider
 * 
 * Try Qwen first, fallback to OpenAI if fails
 */

import { createQwenAI } from './qwen-ai';
import { logger } from '@/infrastructure/observability/logger';

export interface AIProvider {
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  extractEntities(conversation: string): Promise<any>;
  test(): Promise<boolean>;
}

export class FallbackAI implements AIProvider {
  private qwenApiKey?: string;
  private openaiApiKey?: string;
  private useQwen: boolean = true;

  constructor(qwenKey?: string, openaiKey?: string) {
    this.qwenApiKey = qwenKey;
    this.openaiApiKey = openaiKey;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    // Try Qwen first
    if (this.useQwen && this.qwenApiKey) {
      try {
        const qwen = createQwenAI(this.qwenApiKey);
        return await qwen.generateText(prompt, systemPrompt);
      } catch (error) {
        logger.warn('Qwen failed, falling back to OpenAI:', error);
        this.useQwen = false;
      }
    }

    // Fallback to OpenAI
    if (this.openaiApiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    }

    throw new Error('No AI provider available');
  }

  async extractEntities(conversation: string): Promise<any> {
    const systemPrompt = `Extract structured data from conversation. Return JSON with:
- propertyName: string
- propertyType: 'hotel' | 'kamp' | 'kmetija' | 'apartma'
- roomCount: number
- address: { street, city }
- amenities: string[]`;

    const result = await this.generateText(conversation, systemPrompt);
    
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  async test(): Promise<boolean> {
    try {
      await this.generateText('Test');
      return true;
    } catch {
      return false;
    }
  }

  getProvider(): 'qwen' | 'openai' | 'none' {
    if (this.useQwen && this.qwenApiKey) return 'qwen';
    if (this.openaiApiKey) return 'openai';
    return 'none';
  }
}

export function createFallbackAI(qwenKey?: string, openaiKey?: string): FallbackAI {
  return new FallbackAI(qwenKey, openaiKey);
}
