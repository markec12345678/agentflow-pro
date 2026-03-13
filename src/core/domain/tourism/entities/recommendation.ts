/**
 * Domain Entity: Recommendation
 * 
 * AI-generirano priporočilo za gosta.
 * Temelji na preferencah, zgodovini in kontekstu.
 */

import { Money } from '../shared/value-objects/money'

export type RecommendationType = 'activity' | 'restaurant' | 'attraction' | 'shopping' | 'nightlife' | 'transport' | 'service'
export type RecommendationSource = 'ai' | 'manual' | 'collaborative' | 'content_based'
export type RecommendationStatus = 'draft' | 'active' | 'expired' | 'accepted' | 'rejected'

export interface RecommendationData {
  id: string
  guestId: string
  propertyId: string
  reservationId?: string
  type: RecommendationType
  source: RecommendationSource
  status: RecommendationStatus
  title: string
  description: string
  imageUrl?: string
  location?: {
    name: string
    address: string
    latitude: number
    longitude: number
  }
  priceRange?: {
    min: Money
    max: Money
  }
  rating?: number // 1-5
  distance?: number // km from property
  tags: string[]
  aiConfidence?: number // 0-1
  aiReasoning?: string
  validFrom: Date
  validUntil: Date
  acceptedAt?: Date
  rejectedAt?: Date
  metadata?: Record<string, any>
}

export class Recommendation {
  public readonly id: string
  public readonly guestId: string
  public readonly propertyId: string
  public readonly reservationId?: string
  public readonly type: RecommendationType
  public readonly source: RecommendationSource
  public status: RecommendationStatus
  public title: string
  public description: string
  public imageUrl?: string
  public location?: { name: string; address: string; latitude: number; longitude: number }
  public priceRange?: { min: Money; max: Money }
  public rating?: number
  public distance?: number
  public tags: string[]
  public aiConfidence?: number
  public aiReasoning?: string
  public readonly validFrom: Date
  public readonly validUntil: Date
  public acceptedAt?: Date
  public rejectedAt?: Date
  public metadata?: Record<string, any>

  constructor(data: RecommendationData) {
    this.id = data.id
    this.guestId = data.guestId
    this.propertyId = data.propertyId
    this.reservationId = data.reservationId
    this.type = data.type
    this.source = data.source
    this.status = data.status
    this.title = data.title
    this.description = data.description
    this.imageUrl = data.imageUrl
    this.location = data.location
    this.priceRange = data.priceRange
    this.rating = data.rating
    this.distance = data.distance
    this.tags = data.tags
    this.aiConfidence = data.aiConfidence
    this.aiReasoning = data.aiReasoning
    this.validFrom = data.validFrom
    this.validUntil = data.validUntil
    this.acceptedAt = data.acceptedAt
    this.rejectedAt = data.rejectedAt
    this.metadata = data.metadata
  }

  /**
   * Sprejmi priporočilo
   */
  accept(): void {
    this.status = 'accepted'
    this.acceptedAt = new Date()
  }

  /**
   * Zavrni priporočilo
   */
  reject(reason?: string): void {
    this.status = 'rejected'
    this.rejectedAt = new Date()
    if (reason) {
      this.metadata = { ...this.metadata, rejectReason: reason }
    }
  }

  /**
   * Preveri ali je priporočilo še veljavno
   */
  isValid(): boolean {
    const now = new Date()
    return this.status === 'active' && now >= this.validFrom && now <= this.validUntil
  }

  /**
   * Preveri ali je priporočilo poteklo
   */
  isExpired(): boolean {
    return this.status === 'expired' || new Date() > this.validUntil
  }

  /**
   * Posodobi AI confidence
   */
  updateAIConfidence(confidence: number, reasoning?: string): void {
    this.aiConfidence = confidence
    this.aiReasoning = reasoning
  }

  /**
   * Dodaj tag
   */
  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag)
    }
  }

  /**
   * Odstrani tag
   */
  removeTag(tag: string): boolean {
    const index = this.tags.indexOf(tag)
    if (index !== -1) {
      this.tags.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Preveri ali se ujema z interesom gosta
   */
  matchesInterest(interest: string): boolean {
    return this.tags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
  }

  /**
   * Izračunaj relevance score za gosta
   */
  calculateRelevanceScore(guestPreferences: string[]): number {
    let score = this.aiConfidence || 0.5

    // Boost if matches guest preferences
    const matchingPrefs = guestPreferences.filter(pref => this.matchesInterest(pref))
    if (matchingPrefs.length > 0) {
      score += matchingPrefs.length * 0.1
    }

    // Boost if highly rated
    if (this.rating && this.rating >= 4.5) {
      score += 0.1
    }

    // Boost if close by
    if (this.distance && this.distance < 1) {
      score += 0.05
    }

    return Math.min(score, 1.0) // Cap at 1.0
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): RecommendationData {
    return {
      id: this.id,
      guestId: this.guestId,
      propertyId: this.propertyId,
      reservationId: this.reservationId,
      type: this.type,
      source: this.source,
      status: this.status,
      title: this.title,
      description: this.description,
      imageUrl: this.imageUrl,
      location: this.location,
      priceRange: this.priceRange,
      rating: this.rating,
      distance: this.distance,
      tags: this.tags,
      aiConfidence: this.aiConfidence,
      aiReasoning: this.aiReasoning,
      validFrom: this.validFrom,
      validUntil: this.validUntil,
      acceptedAt: this.acceptedAt,
      rejectedAt: this.rejectedAt,
      metadata: this.metadata
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      priceRange: {
        min: this.priceRange?.min.toJSON(),
        max: this.priceRange?.max.toJSON()
      },
      validFrom: this.validFrom.toISOString(),
      validUntil: this.validUntil.toISOString(),
      acceptedAt: this.acceptedAt?.toISOString(),
      rejectedAt: this.rejectedAt?.toISOString()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): Recommendation {
    return new Recommendation({
      ...json,
      priceRange: json.priceRange ? {
        min: Money.fromJSON(json.priceRange.min),
        max: Money.fromJSON(json.priceRange.max)
      } : undefined,
      validFrom: new Date(json.validFrom),
      validUntil: new Date(json.validUntil),
      acceptedAt: json.acceptedAt ? new Date(json.acceptedAt) : undefined,
      rejectedAt: json.rejectedAt ? new Date(json.rejectedAt) : undefined
    })
  }

  /**
   * Ustvari novo priporočilo
   */
  static create(data: Omit<RecommendationData, 'id' | 'status'>): Recommendation {
    return new Recommendation({
      ...data,
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'active'
    })
  }

  /**
   * Ustvari AI priporočilo
   */
  static createAI(
    guestId: string,
    propertyId: string,
    type: RecommendationType,
    title: string,
    description: string,
    confidence: number,
    reasoning: string,
    validHours: number = 24
  ): Recommendation {
    const now = new Date()
    const validUntil = new Date(now)
    validUntil.setHours(validUntil.getHours() + validHours)

    return Recommendation.create({
      guestId,
      propertyId,
      type,
      source: 'ai',
      status: 'active',
      title,
      description,
      tags: [],
      aiConfidence: confidence,
      aiReasoning: reasoning,
      validFrom: now,
      validUntil
    })
  }
}
