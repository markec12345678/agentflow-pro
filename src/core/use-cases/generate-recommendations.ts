/**
 * Use Case: Generate Recommendations
 * 
 * AI-generirana priporočila za gosta na podlagi preferenc, zgodovine in konteksta.
 */

import { Recommendation } from '../domain/tourism/entities/recommendation'
import { Guest } from '../domain/guest/entities/guest'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface GenerateRecommendationsInput {
  guest: Guest
  propertyId: string
  reservationId?: string
  context?: {
    checkInDate?: Date
    checkOutDate?: Date
    guests?: number
    occasion?: string
    weather?: string
    season?: string
  }
  limit?: number
}

export interface GenerateRecommendationsOutput {
  recommendations: Recommendation[]
  generatedAt: Date
  aiModel: string
  confidence: number
}

// ============================================================================
// Use Case Class
// ============================================================================

export class GenerateRecommendations {
  constructor(
    private recommendationRepository: RecommendationRepository,
    private aiService: AIService
  ) {}

  /**
   * Generiraj priporočila za gosta
   */
  async execute(input: GenerateRecommendationsInput): Promise<GenerateRecommendationsOutput> {
    const { guest, propertyId, reservationId, context, limit = 5 } = input

    // 1. Pridobi guest preference
    const guestPreferences = this.extractGuestPreferences(guest)

    // 2. Pridobi kontekst
    const recommendationContext = this.buildContext(guest, context)

    // 3. Generiraj priporočila z AI
    const aiRecommendations = await this.generateAIRecommendations(
      guest.id,
      propertyId,
      guestPreferences,
      recommendationContext,
      limit
    )

    // 4. Shrani priporočila
    for (const rec of aiRecommendations) {
      await this.recommendationRepository.save(rec)
    }

    // 5. Vrni rezultat
    return {
      recommendations: aiRecommendations,
      generatedAt: new Date(),
      aiModel: 'gpt-4-turbo', // TODO: Get from AI service
      confidence: this.calculateAverageConfidence(aiRecommendations)
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Izlušči preference iz gosta
   */
  private extractGuestPreferences(guest: Guest): string[] {
    const preferences: string[] = []

    // Add from guest preferences
    if (guest.preferences) {
      if (guest.preferences.dietaryRestrictions) {
        preferences.push(...guest.preferences.dietaryRestrictions)
      }
      if (guest.preferences.roomPreferences?.view) {
        preferences.push(guest.preferences.roomPreferences.view)
      }
    }

    // Add from loyalty tier
    if (guest.tier === 'platinum' || guest.tier === 'gold') {
      preferences.push('luxury')
      preferences.push('premium')
    }

    // Add from past stays (TODO: Get from history)
    if (guest.totalStays > 5) {
      preferences.push('repeat_guest')
    }

    return preferences
  }

  /**
   * Zgradi kontekst za priporočila
   */
  private buildContext(guest: Guest, context?: any): Record<string, any> {
    return {
      guestTier: guest.tier,
      totalStays: guest.totalStays,
      loyaltyPoints: guest.loyaltyPoints,
      checkInDate: context?.checkInDate,
      checkOutDate: context?.checkOutDate,
      guests: context?.guests,
      occasion: context?.occasion,
      weather: context?.weather,
      season: context?.season,
      timeOfDay: this.getTimeOfDay()
    }
  }

  /**
   * Generiraj priporočila z AI
   */
  private async generateAIRecommendations(
    guestId: string,
    propertyId: string,
    preferences: string[],
    context: Record<string, any>,
    limit: number
  ): Promise<Recommendation[]> {
    // TODO: Call AI service with prompt
    // const prompt = this.buildPrompt(preferences, context)
    // const aiResponse = await this.aiService.generate(prompt)
    
    // Mock AI response
    const mockRecommendations: Recommendation[] = [
      Recommendation.createAI(
        guestId,
        propertyId,
        'restaurant',
        'Top Rated Local Restaurant',
        'Authentic Slovenian cuisine with modern twist. Highly rated by locals.',
        0.92,
        'Based on your interest in local experiences and premium dining',
        24
      ),
      Recommendation.createAI(
        guestId,
        propertyId,
        'activity',
        'Guided City Tour',
        'Explore the city with expert local guide. Private tour available.',
        0.87,
        'Perfect for first-time visitors, matches your cultural interests',
        48
      ),
      Recommendation.createAI(
        guestId,
        propertyId,
        'attraction',
        'Historic Castle Visit',
        'Must-see landmark with panoramic city views.',
        0.85,
        'Highly recommended for history enthusiasts',
        72
      )
    ]

    return mockRecommendations.slice(0, limit)
  }

  /**
   * Zgradi AI prompt
   */
  private buildPrompt(preferences: string[], context: Record<string, any>): string {
    return `
      Generate ${5} personalized recommendations for a hotel guest.
      
      Guest Profile:
      - Tier: ${context.guestTier}
      - Total Stays: ${context.totalStays}
      - Preferences: ${preferences.join(', ')}
      
      Context:
      - Check-in: ${context.checkInDate?.toISOString() || 'N/A'}
      - Check-out: ${context.checkOutDate?.toISOString() || 'N/A'}
      - Guests: ${context.guests || 'N/A'}
      - Occasion: ${context.occasion || 'N/A'}
      - Weather: ${context.weather || 'N/A'}
      - Season: ${context.season || 'N/A'}
      - Time of Day: ${context.timeOfDay}
      
      Provide recommendations for:
      - Restaurants (local cuisine, fine dining)
      - Activities (tours, experiences)
      - Attractions (landmarks, museums)
      - Shopping (local markets, boutiques)
      - Nightlife (bars, clubs)
      
      For each recommendation include:
      - Title and description
      - Type (restaurant, activity, etc.)
      - Why it matches the guest
      - Confidence score (0-1)
      - Tags
    `
  }

  /**
   * Pridobi čas dneva
   */
  private getTimeOfDay(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
  }

  /**
   * Izračunaj average confidence
   */
  private calculateAverageConfidence(recommendations: Recommendation[]): number {
    if (recommendations.length === 0) return 0
    
    const sum = recommendations.reduce((acc, rec) => {
      return acc + (rec.aiConfidence || 0)
    }, 0)
    
    return sum / recommendations.length
  }
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface AIService {
  generate(prompt: string, options?: any): Promise<string>
  generateJSON(prompt: string, options?: any): Promise<any>
}

export interface RecommendationRepository {
  findById(id: string): Promise<Recommendation | null>
  findByGuest(guestId: string): Promise<Recommendation[]>
  save(recommendation: Recommendation): Promise<void>
  delete(id: string): Promise<void>
}
