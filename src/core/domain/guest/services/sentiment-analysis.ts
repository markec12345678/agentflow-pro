/**
 * AI-Powered Sentiment Analysis
 * 
 * Advanced sentiment analysis using Hugging Face models:
 * - Sentiment classification (positive/negative/neutral)
 * - Emotion detection (joy, anger, sadness, fear, surprise)
 * - Theme/topic extraction
 * - Suggested response generation
 * - Multi-language support
 * 
 * Use cases:
 * - Guest feedback analysis
 * - Communication sentiment tracking
 * - Review analysis
 * - Complaint detection
 * - Satisfaction monitoring
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

import { HfInference } from '@huggingface/inference';
import { logger } from '@/infrastructure/observability/logger';
import { sentiment as simpleSentiment } from 'sentiment';

// ============================================================================
// TYPES
// ============================================================================

export interface SentimentResult {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0-1
  emotions?: EmotionScores;
  themes: string[];
  aspects?: AspectSentiment[];
  suggestedResponse?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  language?: string;
}

export interface EmotionScores {
  joy: number;
  anger: number;
  sadness: number;
  fear: number;
  surprise: number;
  disgust: number;
  dominant: string;
}

export interface AspectSentiment {
  aspect: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  mentions: string[];
}

export interface SentimentConfig {
  apiKey?: string;
  modelId?: string;
  language?: string;
  minConfidence?: number;
  enableEmotions?: boolean;
  enableAspects?: boolean;
  enableSuggestions?: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: SentimentConfig = {
  apiKey: process.env.HUGGINGFACE_API_KEY,
  modelId: 'distilbert-base-uncased-finetuned-sst-2-english',
  language: 'en',
  minConfidence: 0.6,
  enableEmotions: true,
  enableAspects: true,
  enableSuggestions: true
};

// Emotion detection model
const EMOTION_MODEL = 'j-hartmann/emotion-english-distilroberta-base';

// Theme extraction keywords
const THEME_KEYWORDS: Record<string, string[]> = {
  cleanliness: ['clean', 'dirty', 'spotless', 'stain', 'hygiene', 'sanitized', 'dust'],
  comfort: ['comfortable', 'bed', 'pillow', 'mattress', 'noise', 'quiet', 'sleep'],
  location: ['location', 'near', 'distance', 'walk', 'center', 'area', 'neighborhood'],
  facilities: ['pool', 'gym', 'spa', 'parking', 'wifi', 'internet', 'elevator', 'ac'],
  staff: ['staff', 'friendly', 'helpful', 'service', 'reception', 'personnel', 'rude'],
  value: ['price', 'value', 'expensive', 'cheap', 'worth', 'money', 'cost'],
  breakfast: ['breakfast', 'food', 'meal', 'restaurant', 'dining', 'menu', 'taste'],
  room: ['room', 'view', 'balcony', 'bathroom', 'shower', 'size', 'space'],
  checkin: ['check-in', 'check-out', 'arrival', 'departure', 'reception', 'key'],
  amenities: ['amenities', 'towels', 'soap', 'minibar', 'coffee', 'tea']
};

// Response templates
const RESPONSE_TEMPLATES: Record<string, Record<string, string>> = {
  positive: {
    generic: 'Thank you so much for your wonderful feedback! We\'re delighted that you enjoyed your stay.',
    staff: 'We\'re thrilled to hear about your positive experience with our staff! We\'ll share your kind words with the team.',
    room: 'We\'re glad you enjoyed your room! Comfort is our top priority.',
    location: 'We\'re happy you appreciated our location! It\'s one of our favorite features too.',
    cleanliness: 'Thank you for noticing our cleanliness standards! We take great pride in maintaining a spotless environment.',
    value: 'We\'re delighted you felt you received great value! We strive to offer the best experience for the price.',
    breakfast: 'We\'re thrilled you enjoyed our breakfast! Our culinary team works hard to provide delicious options.',
    facilities: 'We\'re glad you enjoyed our facilities! We continuously invest in maintaining top-quality amenities.'
  },
  negative: {
    generic: 'We sincerely apologize for your experience. We take your feedback seriously and would like to make things right.',
    staff: 'We apologize for the service issue you experienced. This is not our standard, and we\'re addressing it with our team.',
    room: 'We\'re sorry your room didn\'t meet expectations. We\'d like to discuss this further and find a solution.',
    location: 'We understand location is important. We\'d appreciate the opportunity to discuss your concerns.',
    cleanliness: 'We sincerely apologize for the cleanliness issues. This is unacceptable, and we\'re taking immediate action.',
    value: 'We\'re sorry you didn\'t feel the value matched the price. We\'d like to understand your concerns better.',
    breakfast: 'We apologize that our breakfast didn\'t meet your expectations. We\'re reviewing your feedback with our culinary team.',
    facilities: 'We\'re sorry our facilities didn\'t meet your expectations. We\'re continuously working on improvements.'
  },
  neutral: {
    generic: 'Thank you for your feedback. We appreciate you taking the time to share your experience.',
    suggestion: 'Thank you for your suggestions. We\'re always looking for ways to improve and value your input.'
  }
};

// ============================================================================
// MAIN CLASS
// ============================================================================

/**
 * Sentiment Analysis Engine
 * 
 * @example
 * ```typescript
 * const analyzer = new SentimentAnalyzer();
 * await analyzer.initialize();
 * 
 * const result = await analyzer.analyze('Amazing stay! Loved the view!');
 * logger.info(result.label); // 'positive'
 * logger.info(result.confidence); // 0.95
 * logger.info(result.themes); // ['room', 'location']
 * ```
 */
export class SentimentAnalyzer {
  private hf: HfInference | null = null;
  private config: SentimentConfig;
  private initialized: boolean = false;

  constructor(config: SentimentConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the analyzer
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (this.config.apiKey) {
        this.hf = new HfInference(this.config.apiKey);
        logger.info('[SentimentAnalyzer] ✅ Initialized with Hugging Face');
      } else {
        logger.warn('[SentimentAnalyzer] ⚠️ No API key, using fallback sentiment analysis');
      }
      this.initialized = true;
    } catch (error) {
      logger.error('[SentimentAnalyzer] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Analyze sentiment of text
   * 
   * @param text - Text to analyze
   * @returns Sentiment analysis result
   * 
   * @example
   * ```typescript
   * const result = await analyzer.analyze('Great stay, but room was small');
   * // {
   * //   score: 0.6,
   * //   label: 'positive',
   * //   confidence: 0.85,
   * //   themes: ['room'],
   * //   aspects: [
   * //     { aspect: 'stay', sentiment: 'positive', score: 0.9 },
   * //     { aspect: 'room', sentiment: 'negative', score: -0.6 }
   * //   ],
   * //   suggestedResponse: 'Thank you for your wonderful feedback...'
   * // }
   * ```
   */
  async analyze(text: string): Promise<SentimentResult> {
    await this.ensureInitialized();

    try {
      // Detect language
      const language = this.detectLanguage(text);

      // Get sentiment from Hugging Face or fallback
      let sentimentResult: {
        label: string;
        score: number;
      };

      if (this.hf) {
        try {
          const hfResult: any = await this.hf.textClassification({
            model: this.config.modelId,
            inputs: text
          });

          sentimentResult = {
            label: hfResult[0]?.label || 'NEUTRAL',
            score: hfResult[0]?.score || 0.5
          };
        } catch (error) {
          logger.warn('[SentimentAnalyzer] HF API failed, using fallback:', error);
          sentimentResult = this.fallbackSentiment(text);
        }
      } else {
        sentimentResult = this.fallbackSentiment(text);
      }

      // Normalize sentiment
      const normalized = this.normalizeSentiment(sentimentResult);

      // Extract themes
      const themes = this.extractThemes(text);

      // Extract aspect-based sentiment
      const aspects = this.config.enableAspects
        ? this.extractAspectSentiment(text, normalized.label)
        : undefined;

      // Detect emotions
      const emotions = this.config.enableEmotions
        ? await this.detectEmotions(text)
        : undefined;

      // Determine urgency
      const urgency = this.determineUrgency(normalized, emotions);

      // Generate suggested response
      const suggestedResponse = this.config.enableSuggestions
        ? this.generateSuggestedResponse(normalized.label, themes)
        : undefined;

      return {
        score: normalized.score,
        label: normalized.label,
        confidence: normalized.confidence,
        themes,
        aspects,
        emotions,
        suggestedResponse,
        urgency,
        language
      };
    } catch (error) {
      logger.error('[SentimentAnalyzer] analyze error:', error);
      return this.createFallbackResult(text);
    }
  }

  /**
   * Analyze multiple texts (batch processing)
   */
  async analyzeBatch(texts: string[]): Promise<SentimentResult[]> {
    await this.ensureInitialized();

    // Process in parallel with concurrency limit
    const concurrencyLimit = 5;
    const results: SentimentResult[] = [];

    for (let i = 0; i < texts.length; i += concurrencyLimit) {
      const batch = texts.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(text => this.analyze(text))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Analyze guest feedback specifically
   */
  async analyzeGuestFeedback(
    feedback: string,
    ratings?: {
      overall?: number;
      cleanliness?: number;
      comfort?: number;
      staff?: number;
      facilities?: number;
      value?: number;
    }
  ): Promise<SentimentResult> {
    const result = await this.analyze(feedback);

    // Enhance with rating-based insights
    if (ratings) {
      const aspectMapping: Record<string, number | undefined> = {
        cleanliness: ratings.cleanliness,
        comfort: ratings.comfort,
        staff: ratings.staff,
        facilities: ratings.facilities,
        value: ratings.value
      };

      if (result.aspects) {
        for (const aspect of result.aspects) {
          const rating = aspectMapping[aspect.aspect];
          if (rating !== undefined) {
            // Adjust sentiment score based on rating
            const ratingScore = (rating - 5) / 5; // Normalize to -1 to 1
            aspect.score = (aspect.score + ratingScore) / 2;
            aspect.sentiment = ratingScore > 0.2 ? 'positive' : ratingScore < -0.2 ? 'negative' : 'neutral';
          }
        }
      }
    }

    return result;
  }

  /**
   * Analyze communication for urgency
   */
  async analyzeCommunicationUrgency(text: string): Promise<'low' | 'medium' | 'high' | 'critical'> {
    const result = await this.analyze(text);
    return result.urgency || 'low';
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private fallbackSentiment(text: string): { label: string; score: number } {
    const result = simpleSentiment(text);
    const score = result.score / Math.max(result.tokens.length, 1);
    const normalizedScore = Math.tanh(score); // Normalize to -1 to 1

    let label = 'NEUTRAL';
    if (normalizedScore > 0.1) {
      label = 'POSITIVE';
    } else if (normalizedScore < -0.1) {
      label = 'NEGATIVE';
    }

    return {
      label,
      score: Math.abs(normalizedScore)
    };
  }

  private normalizeSentiment(result: {
    label: string;
    score: number;
  }): { score: number; label: 'positive' | 'negative' | 'neutral'; confidence: number } {
    const label = result.label.toLowerCase();
    let normalizedLabel: 'positive' | 'negative' | 'neutral' = 'neutral';
    let score = result.score;

    if (label.includes('pos')) {
      normalizedLabel = 'positive';
    } else if (label.includes('neg')) {
      normalizedLabel = 'negative';
      score = -score;
    }

    const confidence = Math.abs(score);

    return {
      score,
      label: normalizedLabel,
      confidence
    };
  }

  private extractThemes(text: string): string[] {
    const textLower = text.toLowerCase();
    const themes: string[] = [];

    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        themes.push(theme);
      }
    }

    return themes;
  }

  private extractAspectSentiment(
    text: string,
    overallSentiment: string
  ): AspectSentiment[] {
    const aspects: AspectSentiment[] = [];
    const textLower = text.toLowerCase();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    for (const [aspect, keywords] of Object.entries(THEME_KEYWORDS)) {
      const mentions: string[] = [];
      let aspectScore = 0;
      let mentionCount = 0;

      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        if (keywords.some(keyword => sentenceLower.includes(keyword))) {
          mentions.push(sentence.trim());
          mentionCount++;

          // Simple sentiment for this aspect
          const sentenceResult = this.fallbackSentiment(sentence);
          aspectScore += sentenceResult.label.includes('POS') ? 1 : sentenceResult.label.includes('NEG') ? -1 : 0;
        }
      }

      if (mentionCount > 0) {
        const avgScore = aspectScore / mentionCount;
        aspects.push({
          aspect,
          sentiment: avgScore > 0.2 ? 'positive' : avgScore < -0.2 ? 'negative' : 'neutral',
          score: avgScore,
          mentions
        });
      }
    }

    return aspects.filter(a => a.mentions.length > 0);
  }

  private async detectEmotions(text: string): Promise<EmotionScores | undefined> {
    if (!this.hf) {
      return undefined;
    }

    try {
      const result: any = await this.hf.textClassification({
        model: EMOTION_MODEL,
        inputs: text
      });

      const scores: Record<string, number> = {
        joy: 0,
        anger: 0,
        sadness: 0,
        fear: 0,
        surprise: 0,
        disgust: 0
      };

      for (const item of result) {
        const label = item.label.toLowerCase();
        if (label in scores) {
          scores[label] = item.score;
        }
      }

      const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];

      return {
        ...scores,
        dominant
      };
    } catch (error) {
      logger.warn('[SentimentAnalyzer] Emotion detection failed:', error);
      return undefined;
    }
  }

  private determineUrgency(
    sentiment: { label: string; score: number },
    emotions?: EmotionScores
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: Very negative with anger
    if (
      sentiment.label === 'negative' &&
      sentiment.score < -0.7 &&
      emotions?.anger &&
      emotions.anger > 0.6
    ) {
      return 'critical';
    }

    // High: Very negative or high anger/sadness
    if (
      sentiment.label === 'negative' &&
      (sentiment.score < -0.5 ||
        (emotions?.anger && emotions.anger > 0.4) ||
        (emotions?.sadness && emotions.sadness > 0.5))
    ) {
      return 'high';
    }

    // Medium: Moderately negative
    if (sentiment.label === 'negative' && sentiment.score < -0.2) {
      return 'medium';
    }

    // Low: Neutral or positive
    return 'low';
  }

  private generateSuggestedResponse(
    label: string,
    themes: string[]
  ): string {
    const templates = label === 'positive'
      ? RESPONSE_TEMPLATES.positive
      : label === 'negative'
      ? RESPONSE_TEMPLATES.negative
      : RESPONSE_TEMPLATES.neutral;

    // Find most relevant theme
    const primaryTheme = themes.find(t => t in templates) || 'generic';

    return templates[primaryTheme] || templates.generic;
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on characters
    const hasCyrillic = /[\u0400-\u04FF]/.test(text);
    const hasChinese = /[\u4E00-\u9FFF]/.test(text);
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasGerman = /[äöüÄÖÜß]/.test(text);
    const hasFrench = /[àâçéèêëïîôùûüÿœæ]/.test(text);

    if (hasCyrillic) return 'ru';
    if (hasChinese) return 'zh';
    if (hasArabic) return 'ar';
    if (hasGerman) return 'de';
    if (hasFrench) return 'fr';
    return 'en';
  }

  private createFallbackResult(text: string): SentimentResult {
    const fallback = this.fallbackSentiment(text);
    const normalized = this.normalizeSentiment(fallback);
    const themes = this.extractThemes(text);

    return {
      score: normalized.score,
      label: normalized.label,
      confidence: normalized.confidence,
      themes,
      suggestedResponse: this.generateSuggestedResponse(normalized.label, themes),
      urgency: this.determineUrgency(normalized),
      language: this.detectLanguage(text)
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

const defaultAnalyzer = new SentimentAnalyzer();

/**
 * Quick sentiment analysis
 */
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  return defaultAnalyzer.analyze(text);
}

/**
 * Analyze guest feedback
 */
export async function analyzeGuestFeedback(
  feedback: string,
  ratings?: SentimentResult['aspects'] extends any ? any : never
): Promise<SentimentResult> {
  await defaultAnalyzer.initialize();
  return defaultAnalyzer.analyzeGuestFeedback(feedback, ratings);
}

/**
 * Analyze communication urgency
 */
export async function analyzeCommunicationUrgency(text: string): Promise<'low' | 'medium' | 'high' | 'critical'> {
  await defaultAnalyzer.initialize();
  return defaultAnalyzer.analyzeCommunicationUrgency(text);
}

/**
 * Batch analyze texts
 */
export async function analyzeSentimentBatch(texts: string[]): Promise<SentimentResult[]> {
  await defaultAnalyzer.initialize();
  return defaultAnalyzer.analyzeBatch(texts);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { SentimentAnalyzer };
export default SentimentAnalyzer;
