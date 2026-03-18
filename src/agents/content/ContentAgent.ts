/**
 * Content Agent - AI-Powered Content Generation for Tourism
 * 
 * Capabilities:
 * - Hotel/accommodation descriptions
 * - SEO-optimized blog posts
 * - Landing page copy
 * - Email campaigns
 * - Social media content
 * - Multi-language support (20+ languages)
 * 
 * @uses OpenAI GPT-4
 * @uses Google Gemini (fallback)
 */

import OpenAI from 'openai';
import { Agent } from '../orchestrator/Orchestrator';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ContentGenerationRequest {
  type: ContentType;
  topic: string;
  context?: ContentContext;
  tone?: ContentTone;
  length?: 'short' | 'medium' | 'long';
  language?: string;
  keywords?: string[];
  format?: ContentFormat;
}

export type ContentType =
  | 'hotel-description'
  | 'room-description'
  | 'blog-post'
  | 'landing-page'
  | 'email'
  | 'social-media'
  | 'meta-description'
  | 'faq'
  | 'destination-guide';

export type ContentTone =
  | 'professional'
  | 'friendly'
  | 'luxurious'
  | 'casual'
  | 'enthusiastic'
  | 'informative';

export type ContentFormat =
  | 'html'
  | 'markdown'
  | 'plain-text'
  | 'json';

export interface ContentContext {
  propertyId?: string;
  propertyName?: string;
  location?: string;
  propertyType?: 'hotel' | 'apartment' | 'resort' | 'villa';
  targetAudience?: string;
  uniqueSellingPoints?: string[];
  amenities?: string[];
  competitors?: string[];
}

export interface ContentGenerationResponse {
  success: boolean;
  content: string;
  metadata: {
    type: ContentType;
    wordCount: number;
    readingTimeMinutes: number;
    language: string;
    tone: ContentTone;
    generatedAt: Date;
  };
  seo?: {
    keywords: string[];
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
  };
  alternatives?: string[];
  error?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const DEFAULT_TONE: ContentTone = 'professional';
const DEFAULT_LANGUAGE = 'en';
const DEFAULT_LENGTH: 'short' | 'medium' | 'long' = 'medium';

const LENGTH_CONFIG = {
  short: { words: 150, tokens: 200 },
  medium: { words: 500, tokens: 650 },
  long: { words: 1500, tokens: 2000 },
};

// ============================================
// CONTENT AGENT CLASS
// ============================================

export class ContentAgent implements Agent {
  readonly id = 'content-agent-001';
  readonly type = 'content' as const;
  readonly name = 'Content Agent';

  private openai?: OpenAI;
  private useGemini = false;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'sk-') {
      this.openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
      this.initialized = true;
    } else if (GEMINI_API_KEY && GEMINI_API_KEY !== '') {
      // Fallback to Gemini if OpenAI not available
      this.useGemini = true;
      this.initialized = true;
      console.log('[ContentAgent] Using Google Gemini as fallback');
    } else {
      console.warn('[ContentAgent] No AI API keys configured');
    }
  }

  /**
   * Execute content generation
   * Main entry point for the agent
   */
  async execute(input: unknown): Promise<unknown> {
    const startTime = Date.now();

    try {
      // Parse input
      const request = this.parseInput(input);
      
      // Generate content
      const result = await this.generateContent(request);
      
      // Add metadata
      result.metadata.generatedAt = new Date();

      return result;
    } catch (error) {
      console.error('[ContentAgent] Execution error:', error);
      
      return {
        success: false,
        content: '',
        metadata: {
          type: this.parseInput(input).type,
          wordCount: 0,
          readingTimeMinutes: 0,
          language: this.parseInput(input).language || DEFAULT_LANGUAGE,
          tone: this.parseInput(input).tone || DEFAULT_TONE,
          generatedAt: new Date(),
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      } as ContentGenerationResponse;
    }
  }

  /**
   * Parse and validate input
   */
  private parseInput(input: unknown): ContentGenerationRequest {
    if (typeof input !== 'object' || input === null) {
      throw new Error('Invalid input: expected object');
    }

    const obj = input as Record<string, unknown>;
    
    if (typeof obj.type !== 'string') {
      throw new Error('Missing required field: type');
    }

    if (typeof obj.topic !== 'string') {
      throw new Error('Missing required field: topic');
    }

    return {
      type: obj.type as ContentType,
      topic: obj.topic as string,
      context: obj.context as ContentContext,
      tone: (obj.tone as ContentTone) || DEFAULT_TONE,
      length: (obj.length as 'short' | 'medium' | 'long') || DEFAULT_LENGTH,
      language: (obj.language as string) || DEFAULT_LANGUAGE,
      keywords: obj.keywords as string[],
      format: obj.format as ContentFormat,
    };
  }

  /**
   * Generate content based on request
   */
  private async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    if (!this.initialized) {
      throw new Error('ContentAgent not initialized - missing API keys');
    }

    // Build prompt based on content type
    const prompt = this.buildPrompt(request);
    
    // Generate with OpenAI or Gemini
    let content: string;
    
    if (this.useGemini) {
      content = await this.generateWithGemini(prompt);
    } else {
      content = await this.generateWithOpenAI(prompt, request);
    }

    // Generate SEO metadata
    const seo = this.generateSEO(content, request);

    // Generate alternatives
    const alternatives = await this.generateAlternatives(request, 2);

    return {
      success: true,
      content,
      metadata: {
        type: request.type,
        wordCount: this.countWords(content),
        readingTimeMinutes: Math.ceil(this.countWords(content) / 200),
        language: request.language || DEFAULT_LANGUAGE,
        tone: request.tone || DEFAULT_TONE,
        generatedAt: new Date(), // Will be updated by execute()
      },
      seo,
      alternatives,
    };
  }

  /**
   * Build prompt for content generation
   */
  private buildPrompt(request: ContentGenerationRequest): string {
    const { type, topic, context, tone, length, language, keywords } = request;
    
    const lengthConfig = LENGTH_CONFIG[length || DEFAULT_LENGTH];
    
    // Type-specific instructions
    const typeInstructions = this.getTypeInstructions(type);

    // Context information
    const contextInfo = context ? this.formatContext(context) : '';

    // Keywords integration
    const keywordsInfo = keywords && keywords.length > 0
      ? `Include these keywords naturally: ${keywords.join(', ')}`
      : '';

    // Tone guidance
    const toneGuidance = this.getToneGuidance(tone || DEFAULT_TONE);

    // Language specification
    const languageSpec = language && language !== DEFAULT_LANGUAGE
      ? `Write in ${language} language.`
      : '';

    // Complete prompt
    return `
You are an expert content writer specializing in tourism and hospitality.

TASK: Generate ${type} content about "${topic}"

${typeInstructions}

${contextInfo}

${keywordsInfo}

${toneGuidance}

${languageSpec}

REQUIREMENTS:
- Write approximately ${lengthConfig.words} words
- Use engaging, professional language
- Include relevant details for tourism industry
- Optimize for SEO
- Make it compelling and action-oriented
- Avoid generic phrases
- Be specific and descriptive

Generate the content now:
`.trim();
  }

  /**
   * Get type-specific instructions
   */
  private getTypeInstructions(type: ContentType): string {
    const instructions: Record<ContentType, string> = {
      'hotel-description': `
Write a captivating hotel description that:
- Highlights unique selling points
- Describes amenities and atmosphere
- Appeals to target guests
- Includes location benefits
- Creates emotional connection`,

      'room-description': `
Write a detailed room description that:
- Describes layout, decor, and ambiance
- Lists all amenities
- Highlights comfort features
- Creates desire to book
- Includes practical details (size, view, etc.)`,

      'blog-post': `
Write an informative blog post that:
- Has compelling headline
- Includes introduction, body, conclusion
- Provides valuable information
- Uses subheadings
- Includes call-to-action`,

      'landing-page': `
Write conversion-focused landing page copy that:
- Has attention-grabbing headline
- Clearly states value proposition
- Includes benefits (not just features)
- Has strong call-to-action
- Builds trust and credibility`,

      'email': `
Write an engaging email that:
- Has compelling subject line
- Personalized greeting
- Clear purpose
- Concise body
- Strong call-to-action`,

      'social-media': `
Write engaging social media content that:
- Grabs attention immediately
- Is concise and scannable
- Includes relevant hashtags
- Encourages engagement
- Has clear call-to-action`,

      'meta-description': `
Write SEO-optimized meta description that:
- Is 150-160 characters
- Includes primary keyword
- Is compelling and click-worthy
- Accurately describes content`,

      'faq': `
Write comprehensive FAQ that:
- Answers common questions
- Is clear and concise
- Addresses concerns
- Provides helpful information
- Includes 5-10 Q&A pairs`,

      'destination-guide': `
Write comprehensive destination guide that:
- Describes location and atmosphere
- Highlights attractions
- Includes practical tips
- Covers dining, activities, culture
- Helps visitors plan their trip`,
    };

    return instructions[type] || '';
  }

  /**
   * Format context for prompt
   */
  private formatContext(context: ContentContext): string {
    const parts: string[] = [];

    if (context.propertyName) {
      parts.push(`Property Name: ${context.propertyName}`);
    }
    if (context.location) {
      parts.push(`Location: ${context.location}`);
    }
    if (context.propertyType) {
      parts.push(`Property Type: ${context.propertyType}`);
    }
    if (context.targetAudience) {
      parts.push(`Target Audience: ${context.targetAudience}`);
    }
    if (context.uniqueSellingPoints && context.uniqueSellingPoints.length > 0) {
      parts.push(`Unique Selling Points: ${context.uniqueSellingPoints.join(', ')}`);
    }
    if (context.amenities && context.amenities.length > 0) {
      parts.push(`Amenities: ${context.amenities.join(', ')}`);
    }

    return `CONTEXT:\n${parts.join('\n')}`;
  }

  /**
   * Get tone guidance
   */
  private getToneGuidance(tone: ContentTone): string {
    const guidance: Record<ContentTone, string> = {
      professional: 'Use professional, polished language suitable for business audience.',
      friendly: 'Use warm, conversational tone that feels approachable.',
      luxurious: 'Use elegant, sophisticated language that conveys exclusivity.',
      casual: 'Use relaxed, informal language that feels authentic.',
      enthusiastic: 'Use energetic, excited language that conveys passion.',
      informative: 'Use clear, factual language focused on providing information.',
    };

    return `TONE: ${guidance[tone]}`;
  }

  /**
   * Generate content with OpenAI
   */
  private async generateWithOpenAI(prompt: string, request: ContentGenerationRequest): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const lengthConfig = LENGTH_CONFIG[request.length || DEFAULT_LENGTH];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content writer specializing in tourism and hospitality. Your writing is engaging, SEO-optimized, and conversion-focused.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: lengthConfig.tokens,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0.5,
    });

    const content = response.choices[0]?.message?.content || '';
    
    if (!content) {
      throw new Error('OpenAI returned empty content');
    }

    return content.trim();
  }

  /**
   * Generate content with Google Gemini (fallback)
   */
  private async generateWithGemini(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt,
              }],
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!content) {
        throw new Error('Gemini returned empty content');
      }

      return content.trim();
    } catch (error) {
      console.error('[ContentAgent] Gemini generation error:', error);
      throw new Error('Failed to generate content with Gemini');
    }
  }

  /**
   * Generate SEO metadata
   */
  private generateSEO(content: string, request: ContentGenerationRequest): ContentGenerationResponse['seo'] {
    const keywords = request.keywords || this.extractKeywords(content);
    
    // Generate meta title (50-60 characters)
    const metaTitle = `${request.topic.substring(0, 40)}${request.topic.length > 40 ? '...' : ''} | ${request.context?.propertyName || 'AgentFlow'}`;

    // Generate meta description (150-160 characters)
    const firstParagraph = content.split('\n')[0] || '';
    const metaDescription = `${firstParagraph.substring(0, 140)}${firstParagraph.length > 140 ? '...' : ''}`;

    // Generate slug
    const slug = request.topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);

    return {
      keywords,
      metaTitle,
      metaDescription,
      slug,
    };
  }

  /**
   * Generate alternative versions
   */
  private async generateAlternatives(request: ContentGenerationRequest, count: number): Promise<string[]> {
    const alternatives: string[] = [];
    
    // Generate variations with different tones
    const tones: ContentTone[] = ['friendly', 'luxurious', 'enthusiastic'];
    
    for (let i = 0; i < Math.min(count, tones.length); i++) {
      try {
        const altRequest: ContentGenerationRequest = {
          ...request,
          tone: tones[i],
          length: 'short', // Shorter for alternatives
        };
        
        const altContent = await this.generateContent(altRequest);
        alternatives.push(altContent.content);
      } catch (error) {
        console.warn(`[ContentAgent] Failed to generate alternative ${i + 1}:`, error);
      }
    }

    return alternatives;
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    const text = content.toLowerCase();
    const words = text.split(/\s+/);
    
    // Remove stop words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const filtered = words.filter(word => 
      word.length > 3 && 
      !stopWords.includes(word) &&
      !/^[0-9]+$/.test(word)
    );

    // Frequency analysis
    const frequency: Record<string, number> = {};
    filtered.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Return top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.trim().split(/\s+/).length;
  }
}

/**
 * Factory function for creating ContentAgent
 */
export function createContentAgent(): ContentAgent {
  return new ContentAgent();
}
