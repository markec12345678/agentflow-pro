/**
 * AI-Powered Guest Recommendations Engine
 * 
 * Advanced recommendation system using:
 * - Collaborative filtering (similar guests)
 * - Content-based filtering (preferences)
 * - Hybrid approach (combination)
 * - Context-aware recommendations
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

import { prisma } from '@/database/schema';
import type { PersonalizedRecommendation, GuestProfile } from '@/types/guest-experience';

// ============================================================================
// TYPES
// ============================================================================

interface GuestSimilarity {
  guestId: string;
  similarityScore: number;
  commonAttributes: string[];
}

interface RecommendationCandidate {
  id: string;
  type: string;
  score: number;
  reasons: string[];
  metadata: Record<string, any>;
}

interface CollaborativeFilteringResult {
  similarGuests: GuestSimilarity[];
  recommendations: RecommendationCandidate[];
}

interface ContentBasedFilteringResult {
  matchedPreferences: string[];
  patterns: GuestPattern[];
  recommendations: RecommendationCandidate[];
}

interface GuestPattern {
  type: 'room_preference' | 'price_range' | 'stay_duration' | 'seasonal' | 'service';
  pattern: string;
  confidence: number;
  examples: number;
}

// ============================================================================
// COLLABORATIVE FILTERING
// ============================================================================

/**
 * Find guests similar to the target guest
 * 
 * Uses multiple similarity metrics:
 * - Demographic similarity (country, age group)
 * - Behavioral similarity (booking patterns, spend)
 * - Preference similarity (room type, amenities)
 * 
 * @param guestId - Target guest ID
 * @param limit - Max similar guests to return
 * @returns Array of similar guests with similarity scores
 */
export async function findSimilarGuests(
  guestId: string,
  limit: number = 10
): Promise<GuestSimilarity[]> {
  try {
    // Get target guest data
    const targetGuest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        reservations: true
      }
    });

    if (!targetGuest) {
      return [];
    }

    // Get all other active guests
    const otherGuests = await prisma.guest.findMany({
      where: {
        id: { not: guestId },
        status: 'active'
      },
      include: {
        reservations: true
      },
      take: 100 // Limit for performance
    });

    // Calculate similarity scores
    const similarities: GuestSimilarity[] = otherGuests
      .map(guest => {
        const similarity = calculateGuestSimilarity(targetGuest, guest);
        return {
          guestId: guest.id,
          similarityScore: similarity.score,
          commonAttributes: similarity.attributes
        };
      })
      .filter(s => s.similarityScore > 0.5) // Minimum similarity threshold
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    return similarities;
  } catch (error) {
    console.error('[AI Recommendations] findSimilarGuests error:', error);
    return [];
  }
}

/**
 * Calculate similarity between two guests
 */
function calculateGuestSimilarity(
  guest1: any,
  guest2: any
): { score: number; attributes: string[] } {
  let score = 0;
  let weight = 0;
  const attributes: string[] = [];

  // Country similarity (weight: 2)
  if (guest1.country && guest2.country && guest1.country === guest2.country) {
    score += 2;
    attributes.push('same_country');
  }
  weight += 2;

  // Loyalty tier similarity (weight: 2)
  const tier1 = guest1.loyalty?.tier || 'bronze';
  const tier2 = guest2.loyalty?.tier || 'bronze';
  if (tier1 === tier2) {
    score += 2;
    attributes.push('same_tier');
  } else if (
    (tier1 === 'gold' || tier1 === 'platinum') &&
    (tier2 === 'gold' || tier2 === 'platinum')
  ) {
    score += 1;
    attributes.push('similar_tier');
  }
  weight += 2;

  // Value segment similarity (weight: 3)
  const spend1 = guest1.loyalty?.totalSpend || 0;
  const spend2 = guest2.loyalty?.totalSpend || 0;
  const spendRatio = Math.min(spend1, spend2) / Math.max(spend1, spend2, 1);
  if (spendRatio > 0.8) {
    score += 3 * spendRatio;
    attributes.push('similar_spend');
  }
  weight += 3;

  // Booking patterns similarity (weight: 2)
  const stays1 = guest1.reservations?.length || 0;
  const stays2 = guest2.reservations?.length || 0;
  const staysDiff = Math.abs(stays1 - stays2);
  if (staysDiff <= 2) {
    score += 2 * (1 - staysDiff / 2);
    attributes.push('similar_stays');
  }
  weight += 2;

  // Room type preference similarity (weight: 2)
  const roomTypes1 = new Set(guest1.reservations?.map((r: any) => r.roomType));
  const roomTypes2 = new Set(guest2.reservations?.map((r: any) => r.roomType));
  const commonRoomTypes = [...roomTypes1].filter(r => roomTypes2.has(r));
  if (commonRoomTypes.length > 0) {
    score += 2 * (commonRoomTypes.length / Math.max(roomTypes1.size, roomTypes2.size, 1));
    attributes.push('similar_room_preference');
  }
  weight += 2;

  // Normalize score
  const normalizedScore = weight > 0 ? score / weight : 0;

  return {
    score: normalizedScore,
    attributes
  };
}

/**
 * Aggregate preferences from similar guests
 */
export async function aggregatePreferences(
  similarGuests: GuestSimilarity[]
): Promise<RecommendationCandidate[]> {
  try {
    if (!similarGuests.length) {
      return [];
    }

    const preferences: Map<string, RecommendationCandidate> = new Map();

    for (const similar of similarGuests) {
      // Get guest's positive experiences
      const guest = await prisma.guest.findUnique({
        where: { id: similar.guestId },
        include: {
          reservations: {
            where: {
              status: 'completed'
            },
            include: {
              property: true
            }
          }
        }
      });

      if (!guest) continue;

      // Extract preferences from stays
      for (const reservation of guest.reservations) {
        const roomType = reservation.roomType;
        if (roomType && roomType !== 'standard') {
          const key = `room_${roomType}`;
          const existing = preferences.get(key);
          if (existing) {
            existing.score += similar.similarityScore;
            existing.reasons.push(`Liked by similar guest ${guest.name}`);
          } else {
            preferences.set(key, {
              id: `room-${roomType}`,
              type: 'room_upgrade',
              score: similar.similarityScore,
              reasons: [`Liked by similar guest ${guest.name}`],
              metadata: { roomType }
            });
          }
        }

        // Extract services used
        if (reservation.servicesUsed) {
          for (const service of reservation.servicesUsed) {
            const key = `service_${service}`;
            const existing = preferences.get(key);
            if (existing) {
              existing.score += similar.similarityScore * 0.8;
              existing.reasons.push(`Used by similar guest ${guest.name}`);
            } else {
              preferences.set(key, {
                id: `service-${service}`,
                type: 'service',
                score: similar.similarityScore * 0.8,
                reasons: [`Used by similar guest ${guest.name}`],
                metadata: { service }
              });
            }
          }
        }
      }
    }

    // Convert to array and sort by score
    const candidates = Array.from(preferences.values())
      .sort((a, b) => b.score - a.score);

    return candidates;
  } catch (error) {
    console.error('[AI Recommendations] aggregatePreferences error:', error);
    return [];
  }
}

/**
 * Main collaborative filtering function
 */
export async function collaborativeFiltering(
  guestId: string
): Promise<CollaborativeFilteringResult> {
  // Find similar guests
  const similarGuests = await findSimilarGuests(guestId);

  // Aggregate their preferences
  const recommendations = await aggregatePreferences(similarGuests);

  return {
    similarGuests,
    recommendations
  };
}

// ============================================================================
// CONTENT-BASED FILTERING
// ============================================================================

/**
 * Extract patterns from guest's history
 */
export async function extractPatterns(guestId: string): Promise<GuestPattern[]> {
  try {
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        reservations: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!guest || !guest.reservations.length) {
      return [];
    }

    const patterns: GuestPattern[] = [];

    // Room type preference pattern
    const roomTypeCounts = new Map<string, number>();
    for (const res of guest.reservations) {
      const roomType = res.roomType || 'standard';
      roomTypeCounts.set(roomType, (roomTypeCounts.get(roomType) || 0) + 1);
    }

    const preferredRoomType = [...roomTypeCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (preferredRoomType && preferredRoomType[1] >= 2 && preferredRoomType[0] !== 'standard') {
      patterns.push({
        type: 'room_preference',
        pattern: `Prefers ${preferredRoomType[0]} rooms`,
        confidence: Math.min(1, preferredRoomType[1] / 5),
        examples: preferredRoomType[1]
      });
    }

    // Price range pattern
    const prices = guest.reservations.map(r => r.totalAmount || 0).filter(p => p > 0);
    if (prices.length >= 2) {
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const priceRange = avgPrice < 200 ? 'budget' : avgPrice < 500 ? 'medium' : 'luxury';
      patterns.push({
        type: 'price_range',
        pattern: `Typically spends €${avgPrice.toFixed(0)} per stay (${priceRange})`,
        confidence: Math.min(1, prices.length / 5),
        examples: prices.length
      });
    }

    // Stay duration pattern
    const durations = guest.reservations.map(r => r.numberOfNights || 1);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    if (avgDuration > 1) {
      patterns.push({
        type: 'stay_duration',
        pattern: `Typically stays ${avgDuration.toFixed(1)} nights`,
        confidence: Math.min(1, durations.length / 5),
        examples: durations.length
      });
    }

    // Seasonal pattern
    const monthCounts = new Map<number, number>();
    for (const res of guest.reservations) {
      const month = new Date(res.checkIn).getMonth();
      monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
    }

    const preferredMonth = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (preferredMonth && preferredMonth[1] >= 2) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      patterns.push({
        type: 'seasonal',
        pattern: `Prefers traveling in ${monthNames[preferredMonth[0]]}`,
        confidence: Math.min(1, preferredMonth[1] / 3),
        examples: preferredMonth[1]
      });
    }

    // Service preference pattern
    const serviceCounts = new Map<string, number>();
    for (const res of guest.reservations) {
      if (res.servicesUsed) {
        for (const service of res.servicesUsed) {
          serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1);
        }
      }
    }

    const preferredService = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (preferredService && preferredService[1] >= 2) {
      patterns.push({
        type: 'service',
        pattern: `Frequently uses ${preferredService[0]} service`,
        confidence: Math.min(1, preferredService[1] / 3),
        examples: preferredService[1]
      });
    }

    return patterns;
  } catch (error) {
    console.error('[AI Recommendations] extractPatterns error:', error);
    return [];
  }
}

/**
 * Match patterns with available options
 */
export async function matchWithAvailable(
  patterns: GuestPattern[]
): Promise<RecommendationCandidate[]> {
  try {
    const recommendations: RecommendationCandidate[] = [];

    for (const pattern of patterns) {
      if (pattern.type === 'room_preference') {
        const roomType = pattern.pattern.match(/Prefers (\w+) rooms/)?.[1];
        if (roomType && roomType !== 'standard') {
          recommendations.push({
            id: `room-${roomType}`,
            type: 'room_upgrade',
            score: pattern.confidence,
            reasons: [pattern.pattern],
            metadata: { roomType }
          });
        }
      }

      if (pattern.type === 'service') {
        const service = pattern.pattern.match(/Frequently uses (\w+) service/)?.[1];
        if (service) {
          recommendations.push({
            id: `service-${service}`,
            type: 'service',
            score: pattern.confidence,
            reasons: [pattern.pattern],
            metadata: { service }
          });
        }
      }

      if (pattern.type === 'stay_duration' && pattern.confidence > 0.6) {
        recommendations.push({
          id: 'extended-stay-package',
          type: 'package',
          score: pattern.confidence * 0.8,
          reasons: ['Based on your typical stay duration'],
          metadata: { package: 'extended-stay' }
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error('[AI Recommendations] matchWithAvailable error:', error);
    return [];
  }
}

/**
 * Main content-based filtering function
 */
export async function contentBasedFiltering(
  guestId: string
): Promise<ContentBasedFilteringResult> {
  // Extract patterns from guest history
  const patterns = await extractPatterns(guestId);

  // Match with available options
  const recommendations = await matchWithAvailable(patterns);

  return {
    matchedPreferences: patterns.map(p => p.pattern),
    patterns,
    recommendations
  };
}

// ============================================================================
// HYBRID RECOMMENDATIONS
// ============================================================================

/**
 * Combine collaborative and content-based filtering
 * 
 * Uses weighted combination:
 * - Collaborative filtering: 40% weight
 * - Content-based filtering: 60% weight
 * 
 * @param guestId - Target guest ID
 * @returns Hybrid recommendations
 */
export async function generateHybridRecommendations(
  guestId: string
): Promise<PersonalizedRecommendation[]> {
  try {
    // Get recommendations from both sources
    const [collaborative, contentBased] = await Promise.all([
      collaborativeFiltering(guestId),
      contentBasedFiltering(guestId)
    ]);

    // Merge recommendations
    const merged = new Map<string, PersonalizedRecommendation>();

    // Add collaborative recommendations (weight: 0.4)
    for (const candidate of collaborative.recommendations.slice(0, 10)) {
      merged.set(candidate.id, {
        id: candidate.id,
        guestId,
        type: candidate.type as any,
        category: candidate.type,
        title: getRecommendationTitle(candidate.type, candidate.metadata),
        description: getRecommendationDescription(candidate.type),
        confidence: candidate.score * 0.4,
        reason: candidate.reasons.join('; '),
        basedOn: ['similar_guests'],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Add content-based recommendations (weight: 0.6)
    for (const candidate of contentBased.recommendations.slice(0, 10)) {
      const existing = merged.get(candidate.id);
      if (existing) {
        // Boost existing recommendation
        existing.confidence += candidate.score * 0.6;
        existing.reasons.push(...candidate.reasons);
        existing.basedOn.push('preferences');
      } else {
        merged.set(candidate.id, {
          id: candidate.id,
          guestId,
          type: candidate.type as any,
          category: candidate.type,
          title: getRecommendationTitle(candidate.type, candidate.metadata),
          description: getRecommendationDescription(candidate.type),
          confidence: candidate.score * 0.6,
          reason: candidate.reasons.join('; '),
          basedOn: ['preferences'],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Sort by confidence and limit
    const recommendations = Array.from(merged.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);

    return recommendations;
  } catch (error) {
    console.error('[AI Recommendations] generateHybridRecommendations error:', error);
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRecommendationTitle(type: string, metadata?: any): string {
  const titles: Record<string, string> = {
    room_upgrade: `Upgrade to ${metadata?.roomType || 'Premium'} Room`,
    service: `${metadata?.service || 'Premium'} Service Package`,
    experience: 'Local Experience Recommendation',
    dining: 'Special Dining Experience',
    package: metadata?.package === 'extended-stay' ? 'Extended Stay Package' : 'Special Package'
  };
  return titles[type] || 'Personalized Recommendation';
}

function getRecommendationDescription(type: string): string {
  const descriptions: Record<string, string> = {
    room_upgrade: 'Enjoy more space and premium amenities',
    service: 'Enhance your stay with our premium services',
    experience: 'Discover unique local experiences',
    dining: 'Savor exquisite local cuisine',
    package: 'Save more with our special packages'
  };
  return descriptions[type] || 'Tailored just for you';
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  findSimilarGuests,
  calculateGuestSimilarity,
  aggregatePreferences,
  extractPatterns,
  matchWithAvailable,
  collaborativeFiltering,
  contentBasedFiltering,
  generateHybridRecommendations
};

export type {
  GuestSimilarity,
  RecommendationCandidate,
  CollaborativeFilteringResult,
  ContentBasedFilteringResult,
  GuestPattern
};
