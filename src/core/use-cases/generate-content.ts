/**
 * Use Case: Generate Content
 * 
 * Generate AI content.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GenerateContentInput {
  userId: string
  type: 'property_description' | 'tour_package' | 'email' | 'social_media' | 'blog_post'
  inputData: Record<string, any>
  tone?: 'professional' | 'friendly' | 'luxury' | 'casual'
  language?: string
  length?: 'short' | 'medium' | 'long'
}

export interface GenerateContentOutput {
  success: boolean
  contentId: string
  content: string
  alternatives?: string[]
  metadata?: Record<string, any>
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GenerateContent {
  constructor(
    private contentRepository: ContentRepository,
    private aiService: AIService
  ) {}

  /**
   * Generate content
   */
  async execute(input: GenerateContentInput): Promise<GenerateContentOutput> {
    const { userId, type, inputData, tone = 'professional', language = 'en', length = 'medium' } = input

    // 1. Build prompt
    const prompt = this.buildPrompt(type, inputData, tone, language, length)

    // 2. Generate content with AI
    const aiResult = await this.aiService.generate(prompt)

    // 3. Create content ID
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 4. Save content
    const content = {
      id: contentId,
      userId,
      type,
      content: aiResult.content,
      alternatives: aiResult.alternatives,
      metadata: {
        tone,
        language,
        length,
        inputData,
        model: aiResult.model,
        tokens: aiResult.tokens
      },
      createdAt: new Date()
    }

    await this.contentRepository.save(content)

    return {
      success: true,
      contentId,
      content: aiResult.content,
      alternatives: aiResult.alternatives,
      metadata: content.metadata
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private buildPrompt(
    type: string,
    inputData: Record<string, any>,
    tone: string,
    language: string,
    length: string
  ): string {
    // Build prompt based on content type
    const prompts: Record<string, string> = {
      property_description: `Write a ${tone} property description in ${language} (${length}). Details: ${JSON.stringify(inputData)}`,
      tour_package: `Create a ${tone} tour package description in ${language} (${length}). Details: ${JSON.stringify(inputData)}`,
      email: `Write a ${tone} email in ${language} (${length}). Details: ${JSON.stringify(inputData)}`,
      social_media: `Create a ${tone} social media post in ${language} (${length}). Details: ${JSON.stringify(inputData)}`,
      blog_post: `Write a ${tone} blog post in ${language} (${length}). Details: ${JSON.stringify(inputData)}`
    }

    return prompts[type] || `Generate content in ${language} (${length}, ${tone}): ${JSON.stringify(inputData)}`
  }
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface ContentRepository {
  save(content: any): Promise<void>
}

export interface AIService {
  generate(prompt: string): Promise<{
    content: string
    alternatives?: string[]
    model: string
    tokens: number
  }>
}
