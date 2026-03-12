/**
 * Brand Voice System
 * Defines and enforces brand voice across all generated content.
 * Inspired by Jasper's Brand IQ and Contentful's AI personalization.
 */

import { z } from 'zod';

// Brand Voice Schema
export const brandVoiceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  
  // Tone Configuration
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'playful', 'luxurious']),
  toneIntensity: z.number().min(1).max(10).default(5), // 1=subtle, 10=strong
  
  // Vocabulary
  vocabulary: z.object({
    preferredWords: z.array(z.string()).default([]), // Words to use
    avoidedWords: z.array(z.string()).default([]), // Words to avoid
    industryTerms: z.array(z.string()).default([]), // Industry-specific terminology
    brandName: z.string(),
  }),
  
  // Style Guide
  styleGuide: z.object({
    writingStyle: z.enum(['concise', 'detailed', 'storytelling', 'factual', 'persuasive']),
    sentenceLength: z.enum(['short', 'medium', 'long', 'mixed']).default('medium'),
    paragraphStructure: z.enum(['single-idea', 'multiple-ideas', 'bulleted']).default('single-idea'),
    useActiveVoice: z.boolean().default(true),
    useSecondPerson: z.boolean().default(false), // "you" vs "we"
    useEmojis: z.boolean().default(false),
    emojiStyle: z.enum(['minimal', 'moderate', 'frequent']).default('minimal'),
  }),
  
  // Examples
  examples: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['good', 'bad']),
    title: z.string(),
    content: z.string(),
    explanation: z.string().optional(),
  })).default([]),
  
  // Audience Configuration
  audiences: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    toneAdjustment: z.object({
      formality: z.number().min(1).max(10),
      technicality: z.number().min(1).max(10),
      enthusiasm: z.number().min(1).max(10),
    }),
  })).default([]),
  
  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid(),
});

export type BrandVoice = z.infer<typeof brandVoiceSchema>;
export type BrandVoiceAudience = z.infer<typeof brandVoiceSchema>['audiences'][0];

/**
 * Brand Voice Analysis Result
 */
export interface BrandVoiceAnalysis {
  score: number; // 0-100
  toneMatch: number; // 0-100
  vocabularyMatch: number; // 0-100
  styleMatch: number; // 0-100
  issues: Array<{
    type: 'tone' | 'vocabulary' | 'style';
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestion: string;
  }>;
  suggestions: string[];
}

/**
 * Analyze content against brand voice
 */
export function analyzeBrandVoice(
  content: string,
  brandVoice: BrandVoice
): BrandVoiceAnalysis {
  const issues: BrandVoiceAnalysis['issues'] = [];
  const suggestions: string[] = [];
  
  // Tone Analysis (simplified - would use AI in production)
  const toneScore = analyzeTone(content, brandVoice.tone);
  
  // Vocabulary Analysis
  const vocabularyScore = analyzeVocabulary(content, brandVoice.vocabulary);
  
  // Style Analysis
  const styleScore = analyzeStyle(content, brandVoice.styleGuide);
  
  // Overall Score
  const overallScore = Math.round(
    (toneScore * 0.4 + vocabularyScore * 0.3 + styleScore * 0.3)
  );
  
  // Generate Issues
  if (toneScore < 70) {
    issues.push({
      type: 'tone',
      severity: toneScore < 50 ? 'high' : 'medium',
      message: 'Content tone does not match brand voice',
      suggestion: `Adjust tone to be more ${brandVoice.tone}`,
    });
  }
  
  // Check avoided words
  brandVoice.vocabulary.avoidedWords.forEach(word => {
    if (content.toLowerCase().includes(word.toLowerCase())) {
      issues.push({
        type: 'vocabulary',
        severity: 'medium',
        message: `Avoided word detected: "${word}"`,
        suggestion: 'Replace with a preferred alternative',
      });
    }
  });
  
  // Check sentence length
  const avgSentenceLength = calculateAvgSentenceLength(content);
  if (brandVoice.styleGuide.sentenceLength === 'short' && avgSentenceLength > 20) {
    issues.push({
      type: 'style',
      severity: 'low',
      message: 'Sentences are too long for "short" style',
      suggestion: 'Break long sentences into shorter ones',
    });
  }
  
  // Check active voice
  if (brandVoice.styleGuide.useActiveVoice) {
    const passiveVoiceCount = countPassiveVoice(content);
    if (passiveVoiceCount > 3) {
      issues.push({
        type: 'style',
        severity: 'medium',
        message: `${passiveVoiceCount} instances of passive voice detected`,
        suggestion: 'Use active voice for clearer communication',
      });
    }
  }
  
  return {
    score: overallScore,
    toneMatch: Math.round(toneScore),
    vocabularyMatch: Math.round(vocabularyScore),
    styleMatch: Math.round(styleScore),
    issues,
    suggestions,
  };
}

/**
 * Analyze tone (simplified implementation)
 * In production, this would use AI/ML models
 */
function analyzeTone(content: string, targetTone: string): number {
  // Simplified keyword-based tone detection
  const toneIndicators: Record<string, string[]> = {
    professional: ['therefore', 'furthermore', 'consequently', 'regarding', 'pertaining'],
    casual: ['hey', 'cool', 'awesome', 'yeah', 'gonna', 'wanna'],
    friendly: ['welcome', 'happy', 'glad', 'pleased', 'delighted', 'warm'],
    authoritative: ['must', 'required', 'essential', 'critical', 'imperative'],
    playful: ['fun', 'exciting', 'amazing', 'fantastic', 'wow', 'yay'],
    luxurious: ['exclusive', 'premium', 'elegant', 'sophisticated', 'refined'],
  };
  
  const indicators = toneIndicators[targetTone] || [];
  const contentLower = content.toLowerCase();
  
  let matchCount = 0;
  indicators.forEach(word => {
    if (contentLower.includes(word)) matchCount++;
  });
  
  // Score based on indicator density
  const wordCount = content.split(/\s+/).length;
  const density = (matchCount / wordCount) * 100;
  
  return Math.min(100, Math.round(density * 10 + 50));
}

/**
 * Analyze vocabulary usage
 */
function analyzeVocabulary(content: string, vocabulary: BrandVoice['vocabulary']): number {
  const contentLower = content.toLowerCase();
  let score = 100;
  
  // Penalize for avoided words
  vocabulary.avoidedWords.forEach(word => {
    if (contentLower.includes(word.toLowerCase())) {
      score -= 10;
    }
  });
  
  // Bonus for preferred words
  vocabulary.preferredWords.forEach(word => {
    if (contentLower.includes(word.toLowerCase())) {
      score += 5;
    }
  });
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze writing style
 */
function analyzeStyle(content: string, styleGuide: BrandVoice['styleGuide']): number {
  let score = 100;
  
  // Sentence length analysis
  const avgSentenceLength = calculateAvgSentenceLength(content);
  
  const targetLengths: Record<string, [number, number]> = {
    short: [5, 15],
    medium: [15, 25],
    long: [25, 40],
    mixed: [10, 30],
  };
  
  const [min, max] = targetLengths[styleGuide.sentenceLength] || [15, 25];
  if (avgSentenceLength < min || avgSentenceLength > max) {
    score -= 15;
  }
  
  // Paragraph structure
  const paragraphs = content.split(/\n\n+/);
  if (styleGuide.paragraphStructure === 'single-idea') {
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 100);
    if (longParagraphs.length > 0) {
      score -= 10;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate average sentence length
 */
function calculateAvgSentenceLength(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  
  const words = content.split(/\s+/).filter(w => w.length > 0);
  return Math.round(words.length / sentences.length);
}

/**
 * Count passive voice instances (simplified)
 */
function countPassiveVoice(content: string): number {
  // Simplified: look for "be" verbs + past participle patterns
  const passivePatterns = [
    /\b(am|is|are|was|were|be|been|being)\b\s+\w+ed\b/gi,
    /\b(am|is|are|was|were|be|been|being)\b\s+\w+en\b/gi,
  ];
  
  let count = 0;
  passivePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) count += matches.length;
  });
  
  return count;
}

/**
 * Generate content with brand voice
 * This would integrate with your AI content generation
 */
export async function generateWithBrandVoice(
  prompt: string,
  brandVoice: BrandVoice,
  audience?: BrandVoiceAudience
): Promise<string> {
  // Construct enhanced prompt with brand voice instructions
  const brandVoiceInstructions = `
Write content following these brand voice guidelines:

**Tone:** ${brandVoice.tone} (intensity: ${brandVoice.toneIntensity}/10)

**Vocabulary:**
- Use these words: ${brandVoice.vocabulary.preferredWords.join(', ') || 'none specified'}
- Avoid these words: ${brandVoice.vocabulary.avoidedWords.join(', ') || 'none specified'}
- Industry terms: ${brandVoice.vocabulary.industryTerms.join(', ') || 'none specified'}

**Style:**
- Writing style: ${brandVoice.styleGuide.writingStyle}
- Sentence length: ${brandVoice.styleGuide.sentenceLength}
- Paragraph structure: ${brandVoice.styleGuide.paragraphStructure}
- Use active voice: ${brandVoice.styleGuide.useActiveVoice ? 'Yes' : 'No'}
- Use second person: ${brandVoice.styleGuide.useSecondPerson ? 'Yes' : 'No'}
- Use emojis: ${brandVoice.styleGuide.useEmojis ? `Yes (${brandVoice.styleGuide.emojiStyle})` : 'No'}

${audience ? `
**Target Audience:** ${audience.name}
${audience.description}
` : ''}

**Examples of good content:**
${brandVoice.examples.filter(e => e.type === 'good').slice(0, 2).map(e => `- ${e.content}`).join('\n') || 'None provided'}

**Examples to avoid:**
${brandVoice.examples.filter(e => e.type === 'bad').slice(0, 2).map(e => `- ${e.content}`).join('\n') || 'None provided'}

Now generate content for this prompt: ${prompt}
`;

  // In production, call your AI service here
  // For now, return the enhanced prompt
  return brandVoiceInstructions;
}
