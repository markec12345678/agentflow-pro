/**
 * Guest Experience Engine
 * Comprehensive guest experience management with AI-powered recommendations
 */

import {
  GuestProfile,
  GuestPreferences,
  LoyaltyInfo,
  CommunicationHistory,
  StayHistory,
  GuestFeedback,
  PersonalizedRecommendation,
  GuestTag,
  GuestExperienceEngine as IGuestExperienceEngine,
  RecommendationContext,
  GuestSearchCriteria,
  GuestInsights,
  GuestSegment,
  SegmentationCriteria,
  SentimentAnalysis,
  BehaviorPattern,
  PreferencePattern,
  RiskFactor,
  Opportunity,
  Prediction,
  LoyaltyTier,
  RecommendationType,
  RecommendationCategory,
  FeedbackType,
  FeedbackCategory,
  CommunicationType,
  CommunicationChannel,
  TagCategory,
} from '@/types/guest-experience';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/infrastructure/observability/logger';
import Sentiment from 'sentiment';

export class GuestExperienceEngine implements IGuestExperienceEngine {
  private profiles: Map<string, GuestProfile> = new Map();
  private recommendations: Map<string, PersonalizedRecommendation[]> = new Map();
  private segments: Map<string, GuestSegment> = new Map();
  private sentiment: any;

  constructor() {
    this.sentiment = new Sentiment();
    this.initializeMockData();
  }

  /**
   * Get guest profile by ID
   */
  async getProfile(guestId: string): Promise<GuestProfile> {
    const profile = this.profiles.get(guestId);
    if (!profile) {
      throw new Error(`Guest profile not found: ${guestId}`);
    }
    return profile;
  }

  /**
   * Update guest profile
   */
  async updateProfile(guestId: string, updates: Partial<GuestProfile>): Promise<GuestProfile> {
    const existingProfile = await this.getProfile(guestId);
    const updatedProfile = {
      ...existingProfile,
      ...updates,
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    };

    this.profiles.set(guestId, updatedProfile);
    
    // Regenerate recommendations if preferences changed
    if (updates.preferences) {
      await this.generateRecommendations(guestId);
    }

    logger.info(`👤 Updated guest profile: ${guestId}`);
    return updatedProfile;
  }

  /**
   * Get guest preferences
   */
  async getPreferences(guestId: string): Promise<GuestPreferences> {
    const profile = await this.getProfile(guestId);
    return profile.preferences;
  }

  /**
   * Update guest preferences
   */
  async updatePreferences(guestId: string, preferences: Partial<GuestPreferences>): Promise<void> {
    const profile = await this.getProfile(guestId);
    const updatedPreferences = {
      ...profile.preferences,
      ...preferences,
    };

    await this.updateProfile(guestId, { preferences: updatedPreferences });
    logger.info(`⚙️ Updated preferences for guest: ${guestId}`);
  }

  /**
   * Get loyalty information
   */
  async getLoyaltyInfo(guestId: string): Promise<LoyaltyInfo> {
    const profile = await this.getProfile(guestId);
    return profile.loyaltyInfo;
  }

  /**
   * Update loyalty points
   */
  async updateLoyaltyPoints(guestId: string, points: number, reason: string): Promise<void> {
    const profile = await this.getProfile(guestId);
    const currentPoints = profile.loyaltyInfo.points;
    const newPoints = Math.max(0, currentPoints + points);

    const updatedLoyaltyInfo = {
      ...profile.loyaltyInfo,
      points: newPoints,
      lastActivity: new Date(),
    };

    // Check for tier upgrade
    const newTier = this.calculateLoyaltyTier(newPoints, profile.loyaltyInfo.membershipSince);
    if (newTier !== profile.loyaltyInfo.tier) {
      updatedLoyaltyInfo.tier = newTier;
      logger.info(`🎉 Guest ${guestId} upgraded to ${newTier} tier!`);
    }

    await this.updateProfile(guestId, { loyaltyInfo: updatedLoyaltyInfo });
    logger.info(`💰 Updated loyalty points for guest ${guestId}: ${points} (${reason})`);
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(guestId: string, context?: RecommendationContext): Promise<PersonalizedRecommendation[]> {
    const cached = this.recommendations.get(guestId);
    if (cached && !context) {
      return cached;
    }

    return await this.generateRecommendations(guestId, context);
  }

  /**
   * Generate personalized recommendations
   */
  async generateRecommendations(guestId: string, context?: RecommendationContext): Promise<PersonalizedRecommendation[]> {
    const profile = await this.getProfile(guestId);
    const recommendations: PersonalizedRecommendation[] = [];

    // Room upgrade recommendations
    if (profile.preferences.roomPreferences.roomType.length > 0) {
      const upgradeRecommendation = await this.generateRoomUpgradeRecommendation(profile, context);
      if (upgradeRecommendation) {
        recommendations.push(upgradeRecommendation);
      }
    }

    // Dining recommendations
    if (profile.preferences.diningPreferences.cuisineTypes.length > 0) {
      const diningRecommendation = await this.generateDiningRecommendation(profile, context);
      if (diningRecommendation) {
        recommendations.push(diningRecommendation);
      }
    }

    // Activity recommendations
    if (profile.preferences.activityPreferences.interests.length > 0) {
      const activityRecommendation = await this.generateActivityRecommendation(profile, context);
      if (activityRecommendation) {
        recommendations.push(activityRecommendation);
      }
    }

    // Loyalty rewards
    const loyaltyRecommendation = await this.generateLoyaltyRecommendation(profile);
    if (loyaltyRecommendation) {
      recommendations.push(loyaltyRecommendation);
    }

    // Special offers based on stay history
    const offerRecommendation = await this.generateSpecialOfferRecommendation(profile, context);
    if (offerRecommendation) {
      recommendations.push(offerRecommendation);
    }

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.confidence - a.confidence;
    });

    this.recommendations.set(guestId, recommendations);
    logger.info(`🎯 Generated ${recommendations.length} recommendations for guest: ${guestId}`);
    
    return recommendations;
  }

  /**
   * Analyze feedback sentiment
   */
  async analyzeFeedback(feedback: string): Promise<SentimentAnalysis> {
    const sentimentResult = this.sentiment.analyze(feedback);
    
    const analysis: SentimentAnalysis = {
      score: sentimentResult.score || 0,
      magnitude: sentimentResult.comparative || 0,
      label: this.getSentimentLabel(sentimentResult.score || 0),
      confidence: Math.abs(sentimentResult.score || 0),
      emotions: this.extractEmotions(feedback),
      keywords: this.extractKeywords(feedback),
      processedAt: new Date(),
    };

    logger.info(`📊 Analyzed feedback sentiment: ${analysis.label} (${analysis.score})`);
    return analysis;
  }

  /**
   * Record guest feedback
   */
  async recordFeedback(
    guestId: string,
    feedback: Omit<GuestFeedback, 'id' | 'submittedAt' | 'sentiment'>
  ): Promise<GuestFeedback> {
    const sentiment = await this.analyzeFeedback(feedback.content);
    
    const guestFeedback: GuestFeedback = {
      ...feedback,
      id: uuidv4(),
      submittedAt: new Date(),
      sentiment,
    };

    const profile = await this.getProfile(guestId);
    profile.feedback.push(guestFeedback);
    await this.updateProfile(guestId, profile);

    // Update loyalty points for feedback
    await this.updateLoyaltyPoints(guestId, 10, 'Feedback submitted');

    logger.info(`📝 Recorded feedback for guest: ${guestId}`);
    return guestFeedback;
  }

  /**
   * Get communication history
   */
  async getCommunicationHistory(guestId: string, limit: number = 50): Promise<CommunicationHistory[]> {
    const profile = await this.getProfile(guestId);
    return profile.communicationHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Send communication
   */
  async sendCommunication(
    guestId: string,
    communication: Omit<CommunicationHistory, 'id' | 'timestamp' | 'status'>
  ): Promise<CommunicationHistory> {
    const guestCommunication: CommunicationHistory = {
      ...communication,
      id: uuidv4(),
      timestamp: new Date(),
      status: 'sent',
    };

    const profile = await this.getProfile(guestId);
    profile.communicationHistory.push(guestCommunication);
    await this.updateProfile(guestId, profile);

    logger.info(`📧 Sent communication to guest: ${guestId}`);
    return guestCommunication;
  }

  /**
   * Get stay history
   */
  async getStayHistory(guestId: string, limit: number = 20): Promise<StayHistory[]> {
    const profile = await this.getProfile(guestId);
    return profile.stayHistory
      .sort((a, b) => b.checkInDate.getTime() - a.checkInDate.getTime())
      .slice(0, limit);
  }

  /**
   * Add tag to guest
   */
  async addTag(
    guestId: string,
    tag: Omit<GuestTag, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>
  ): Promise<GuestTag> {
    const guestTag: GuestTag = {
      ...tag,
      id: uuidv4(),
      createdAt: new Date(),
      lastUsed: new Date(),
      usageCount: 1,
    };

    const profile = await this.getProfile(guestId);
    profile.tags.push(guestTag);
    await this.updateProfile(guestId, profile);

    logger.info(`🏷️ Added tag to guest ${guestId}: ${tag.name}`);
    return guestTag;
  }

  /**
   * Remove tag from guest
   */
  async removeTag(guestId: string, tagId: string): Promise<void> {
    const profile = await this.getProfile(guestId);
    profile.tags = profile.tags.filter(tag => tag.id !== tagId);
    await this.updateProfile(guestId, profile);

    logger.info(`🗑️ Removed tag from guest ${guestId}: ${tagId}`);
  }

  /**
   * Search guests
   */
  async searchGuests(criteria: GuestSearchCriteria): Promise<GuestProfile[]> {
    const allProfiles = Array.from(this.profiles.values());
    let filtered = allProfiles;

    // Apply filters
    if (criteria.filters) {
      if (criteria.filters.loyaltyTier) {
        filtered = filtered.filter(profile => 
          criteria.filters!.loyaltyTier!.includes(profile.loyaltyInfo.tier)
        );
      }

      if (criteria.filters.nationality) {
        filtered = filtered.filter(profile => 
          criteria.filters!.nationality!.includes(profile.personalInfo.nationality)
        );
      }

      if (criteria.filters.language) {
        filtered = filtered.filter(profile => 
          criteria.filters!.language!.includes(profile.personalInfo.language)
        );
      }

      if (criteria.filters.spendingRange) {
        const totalSpending = profile.stayHistory.reduce((sum, stay) => sum + stay.totalAmount, 0);
        filtered = filtered.filter(profile => {
          const spending = profile.stayHistory.reduce((sum, stay) => sum + stay.totalAmount, 0);
          return spending >= criteria.filters!.spendingRange!.min && 
                 spending <= criteria.filters!.spendingRange!.max;
        });
      }
    }

    // Apply text search
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      filtered = filtered.filter(profile => 
        profile.personalInfo.firstName.toLowerCase().includes(query) ||
        profile.personalInfo.lastName.toLowerCase().includes(query) ||
        profile.personalInfo.email.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (criteria.sorting) {
      filtered.sort((a, b) => {
        const aValue = this.getNestedValue(a, criteria.sorting!.field);
        const bValue = this.getNestedValue(b, criteria.sorting!.field);
        
        if (criteria.sorting!.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Apply pagination
    if (criteria.pagination) {
      const start = (criteria.pagination.page - 1) * criteria.pagination.limit;
      const end = start + criteria.pagination.limit;
      filtered = filtered.slice(start, end);
    }

    logger.info(`🔍 Found ${filtered.length} guests matching criteria`);
    return filtered;
  }

  /**
   * Get guest insights
   */
  async getGuestInsights(guestId: string): Promise<GuestInsights> {
    const profile = await this.getProfile(guestId);
    
    const insights: GuestInsights = {
      profile,
      behaviorPatterns: await this.analyzeBehaviorPatterns(profile),
      preferences: await this.analyzePreferencePatterns(profile),
      riskFactors: await this.identifyRiskFactors(profile),
      opportunities: await this.identifyOpportunities(profile),
      predictions: await this.generatePredictions(profile),
      recommendations: await this.getRecommendations(guestId),
      lastAnalyzed: new Date(),
    };

    logger.info(`🧠 Generated insights for guest: ${guestId}`);
    return insights;
  }

  /**
   * Get guest segmentation
   */
  async getSegmentation(criteria: SegmentationCriteria): Promise<GuestSegment[]> {
    const allProfiles = Array.from(this.profiles.values());
    const segments: GuestSegment[] = [];

    // Create segments based on criteria
    if (criteria.demographics?.ageRange) {
      const ageSegment = this.createAgeSegment(allProfiles, criteria.demographics.ageRange);
      segments.push(ageSegment);
    }

    if (criteria.loyalty?.tiers) {
      const loyaltySegment = this.createLoyaltySegment(allProfiles, criteria.loyalty.tiers);
      segments.push(loyaltySegment);
    }

    if (criteria.behavior?.spendingRange) {
      const spendingSegment = this.createSpendingSegment(allProfiles, criteria.behavior.spendingRange);
      segments.push(spendingSegment);
    }

    logger.info(`📊 Created ${segments.length} guest segments`);
    return segments;
  }

  /**
   * Private helper methods
   */
  private initializeMockData(): void {
    // Initialize with some mock data for development
    logger.info('🔧 Initializing guest experience engine with mock data');
  }

  private calculateLoyaltyTier(points: number, membershipSince: Date): LoyaltyTier {
    const yearsActive = (Date.now() - membershipSince.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (points >= 10000 && yearsActive >= 3) return 'diamond';
    if (points >= 5000 && yearsActive >= 2) return 'platinum';
    if (points >= 2000 && yearsActive >= 1) return 'gold';
    if (points >= 500) return 'silver';
    return 'bronze';
  }

  private async generateRoomUpgradeRecommendation(
    profile: GuestProfile,
    context?: RecommendationContext
  ): Promise<PersonalizedRecommendation | null> {
    const currentStay = context?.currentStay;
    if (!currentStay) return null;

    const preferredRoomTypes = profile.preferences.roomPreferences.roomType;
    const currentRoomType = currentStay.roomType;

    // Find preferred room types that are upgrades
    const upgradeOptions = preferredRoomTypes.filter(type => 
      this.isRoomUpgrade(type, currentRoomType)
    );

    if (upgradeOptions.length === 0) return null;

    return {
      id: uuidv4(),
      type: 'room-upgrade',
      title: 'Room Upgrade Available',
      description: `Upgrade to ${upgradeOptions[0]} for enhanced comfort`,
      category: 'accommodation',
      priority: 'medium',
      confidence: 0.8,
      reasoning: {
        primaryFactor: 'room-preference-match',
        secondaryFactors: ['loyalty-tier', 'availability'],
        dataSource: 'guest-preferences',
        algorithm: 'rule-based',
        confidenceScore: 0.8,
        similarGuests: 25,
        successRate: 0.75,
        explanation: 'Based on your room preferences and availability',
      },
      actionItems: [
        {
          id: uuidv4(),
          type: 'request',
          title: 'Request Upgrade',
          description: 'Upgrade to preferred room type',
          price: 50,
        },
      ],
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
    };
  }

  private async generateDiningRecommendation(
    profile: GuestProfile,
    context?: RecommendationContext
  ): Promise<PersonalizedRecommendation | null> {
    const preferredCuisines = profile.preferences.diningPreferences.cuisineTypes;
    if (preferredCuisines.length === 0) return null;

    return {
      id: uuidv4(),
      type: 'dining-recommendation',
      title: `Try ${preferredCuisines[0]} Cuisine`,
      description: `Based on your dining preferences`,
      category: 'dining',
      priority: 'low',
      confidence: 0.7,
      reasoning: {
        primaryFactor: 'dining-preference',
        secondaryFactors: ['time-of-day', 'seasonal-availability'],
        dataSource: 'guest-preferences',
        algorithm: 'collaborative-filtering',
        confidenceScore: 0.7,
        similarGuests: 15,
        successRate: 0.65,
        explanation: 'Recommended based on your cuisine preferences',
      },
      actionItems: [
        {
          id: uuidv4(),
          type: 'book',
          title: 'Make Reservation',
          description: 'Book a table at our restaurant',
        },
      ],
      createdAt: new Date(),
    };
  }

  private async generateActivityRecommendation(
    profile: GuestProfile,
    context?: RecommendationContext
  ): Promise<PersonalizedRecommendation | null> {
    const interests = profile.preferences.activityPreferences.interests;
    if (interests.length === 0) return null;

    return {
      id: uuidv4(),
      type: 'activity-suggestion',
      title: `${interests[0]} Activity Available`,
      description: `Enjoy ${interests[0]} during your stay`,
      category: 'entertainment',
      priority: 'low',
      confidence: 0.6,
      reasoning: {
        primaryFactor: 'activity-interest',
        secondaryFactors: ['weather', 'season', 'availability'],
        dataSource: 'guest-preferences',
        algorithm: 'content-based',
        confidenceScore: 0.6,
        similarGuests: 20,
        successRate: 0.70,
        explanation: 'Based on your activity interests',
      },
      actionItems: [
        {
          id: uuidv4(),
          type: 'schedule',
          title: 'Schedule Activity',
          description: 'Book this activity',
        },
      ],
      createdAt: new Date(),
    };
  }

  private async generateLoyaltyRecommendation(
    profile: GuestProfile
  ): Promise<PersonalizedRecommendation | null> {
    const availableRewards = profile.loyaltyInfo.rewards.filter(reward => 
      reward.pointsCost <= profile.loyaltyInfo.points &&
      (!reward.validUntil || reward.validUntil > new Date())
    );

    if (availableRewards.length === 0) return null;

    const bestReward = availableRewards[0];

    return {
      id: uuidv4(),
      type: 'loyalty-reward',
      title: `Redeem ${bestReward.name}`,
      description: bestReward.description,
      category: bestReward.category as RecommendationCategory,
      priority: 'medium',
      confidence: 0.9,
      reasoning: {
        primaryFactor: 'points-balance',
        secondaryFactors: ['reward-popularity', 'tier-eligibility'],
        dataSource: 'loyalty-program',
        algorithm: 'eligibility-check',
        confidenceScore: 0.9,
        similarGuests: 30,
        successRate: 0.85,
        explanation: 'You have enough points for this reward',
      },
      actionItems: [
        {
          id: uuidv4(),
          type: 'purchase',
          title: 'Redeem Reward',
          description: 'Use your points for this reward',
          price: bestReward.pointsCost,
        },
      ],
      createdAt: new Date(),
    };
  }

  private async generateSpecialOfferRecommendation(
    profile: GuestProfile,
    context?: RecommendationContext
  ): Promise<PersonalizedRecommendation | null> {
    // Generate special offers based on stay history and preferences
    const stayCount = profile.stayHistory.length;
    
    if (stayCount === 0) {
      // First-time guest offer
      return {
        id: uuidv4(),
        type: 'special-offer',
        title: 'Welcome Discount',
        description: '15% off your next stay',
        category: 'accommodation',
        priority: 'high',
        confidence: 0.8,
        reasoning: {
          primaryFactor: 'first-time-guest',
          secondaryFactors: ['seasonal-demand', 'availability'],
          dataSource: 'stay-history',
          algorithm: 'promotional',
          confidenceScore: 0.8,
          similarGuests: 100,
          successRate: 0.75,
          explanation: 'Special offer for first-time guests',
        },
        actionItems: [
          {
            id: uuidv4(),
            type: 'learn-more',
            title: 'View Offer Details',
            description: 'Learn more about this special offer',
          },
        ],
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
      };
    }

    return null;
  }

  private isRoomUpgrade(preferredType: string, currentType: string): boolean {
    const roomHierarchy = ['standard', 'deluxe', 'suite', 'presidential'];
    const preferredIndex = roomHierarchy.indexOf(preferredType);
    const currentIndex = roomHierarchy.indexOf(currentType);
    return preferredIndex > currentIndex;
  }

  private getSentimentLabel(score: number): 'positive' | 'negative' | 'neutral' {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  private extractEmotions(text: string): any[] {
    // Mock emotion extraction - in production, use NLP library
    const emotions = [];
    
    if (text.includes('happy') || text.includes('love') || text.includes('excellent')) {
      emotions.push({ emotion: 'joy', score: 0.8, confidence: 0.7 });
    }
    
    if (text.includes('angry') || text.includes('frustrated') || text.includes('terrible')) {
      emotions.push({ emotion: 'anger', score: 0.7, confidence: 0.8 });
    }
    
    return emotions;
  }

  private extractKeywords(text: string): string[] {
    // Mock keyword extraction - in production, use NLP library
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    return words.filter(word => word.length > 2 && !stopWords.includes(word));
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async analyzeBehaviorPatterns(profile: GuestProfile): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];
    
    // Analyze booking patterns
    if (profile.stayHistory.length > 1) {
      const bookingFrequency = profile.stayHistory.length / 12; // bookings per month
      patterns.push({
        type: 'booking',
        pattern: bookingFrequency > 1 ? 'frequent-guest' : 'occasional-guest',
        frequency: bookingFrequency,
        confidence: 0.8,
        description: `Guest books ${bookingFrequency.toFixed(1)} times per month`,
        examples: ['Multiple stays per month', 'Regular bookings'],
        lastObserved: new Date(),
      });
    }

    return patterns;
  }

  private async analyzePreferencePatterns(profile: GuestProfile): Promise<PreferencePattern[]> {
    const patterns: PreferencePattern[] = [];
    
    // Analyze room preferences
    if (profile.preferences.roomPreferences.roomType.length > 0) {
      patterns.push({
        category: 'room',
        preference: profile.preferences.roomPreferences.roomType[0],
        strength: 0.9,
        consistency: 0.8,
        basedOn: ['stay-history', 'explicit-preferences'],
        lastConfirmed: new Date(),
      });
    }

    return patterns;
  }

  private async identifyRiskFactors(profile: GuestProfile): Promise<RiskFactor[]> {
    const risks: RiskFactor[] = [];
    
    // Check for negative feedback
    const negativeFeedback = profile.feedback.filter(f => f.sentiment.label === 'negative');
    if (negativeFeedback.length > 2) {
      risks.push({
        type: 'negative-feedback',
        level: 'medium',
        probability: 0.6,
        impact: 'Guest satisfaction and repeat business',
        mitigation: 'Proactive outreach and service recovery',
        detectedAt: new Date(),
      });
    }

    return risks;
  }

  private async identifyOpportunities(profile: GuestProfile): Promise<Opportunity[]> {
    const opportunities: Opportunity[] = [];
    
    // Check for upsell opportunities
    if (profile.loyaltyInfo.tier === 'gold' || profile.loyaltyInfo.tier === 'platinum') {
      opportunities.push({
        type: 'upsell',
        value: 200,
        confidence: 0.7,
        description: 'Premium room upgrade opportunity',
        actionRequired: 'Offer room upgrade during next stay',
        identifiedAt: new Date(),
      });
    }

    return opportunities;
  }

  private async generatePredictions(profile: GuestProfile): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    
    // Predict next booking
    if (profile.stayHistory.length > 0) {
      const avgDaysBetweenStays = this.calculateAverageDaysBetweenStays(profile.stayHistory);
      const nextBookingDate = new Date(Date.now() + avgDaysBetweenStays * 24 * 60 * 60 * 1000);
      
      predictions.push({
        type: 'next-booking',
        prediction: nextBookingDate,
        confidence: 0.6,
        timeframe: '30 days',
        factors: ['historical-booking-pattern', 'seasonality'],
        lastUpdated: new Date(),
      });
    }

    return predictions;
  }

  private calculateAverageDaysBetweenStays(stays: StayHistory[]): number {
    if (stays.length < 2) return 90; // default to 90 days
    
    const sortedStays = stays.sort((a, b) => a.checkInDate.getTime() - b.checkInDate.getTime());
    const differences = [];
    
    for (let i = 1; i < sortedStays.length; i++) {
      const diff = sortedStays[i].checkInDate.getTime() - sortedStays[i-1].checkOutDate.getTime();
      differences.push(diff / (1000 * 60 * 60 * 24)); // convert to days
    }
    
    return differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  }

  private createAgeSegment(profiles: GuestProfile[], ageRange: { min: number; max: number }): GuestSegment {
    const currentYear = new Date().getFullYear();
    const filtered = profiles.filter(profile => {
      const birthYear = profile.personalInfo.dateOfBirth?.getFullYear();
      if (!birthYear) return false;
      const age = currentYear - birthYear;
      return age >= ageRange.min && age <= ageRange.max;
    });

    return {
      id: uuidv4(),
      name: `Age ${ageRange.min}-${ageRange.max}`,
      description: `Guests aged ${ageRange.min} to ${ageRange.max}`,
      criteria: { demographics: { ageRange } },
      size: filtered.length,
      percentage: (filtered.length / profiles.length) * 100,
      characteristics: [
        {
          name: 'average-spending',
          value: 250,
          importance: 0.8,
          description: 'Average spending per stay',
        },
      ],
      recommendations: ['Target with family packages', 'Offer group activities'],
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
  }

  private createLoyaltySegment(profiles: GuestProfile[], tiers: LoyaltyTier[]): GuestSegment {
    const filtered = profiles.filter(profile => 
      tiers.includes(profile.loyaltyInfo.tier)
    );

    return {
      id: uuidv4(),
      name: `Loyalty ${tiers.join(', ')}`,
      description: `Guests with loyalty tiers: ${tiers.join(', ')}`,
      criteria: { loyalty: { tiers } },
      size: filtered.length,
      percentage: (filtered.length / profiles.length) * 100,
      characteristics: [
        {
          name: 'retention-rate',
          value: 0.85,
          importance: 0.9,
          description: 'High retention rate',
        },
      ],
      recommendations: ['Exclusive offers', 'Priority services'],
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
  }

  private createSpendingSegment(profiles: GuestProfile[], spendingRange: { min: number; max: number }): GuestSegment {
    const filtered = profiles.filter(profile => {
      const totalSpending = profile.stayHistory.reduce((sum, stay) => sum + stay.totalAmount, 0);
      return totalSpending >= spendingRange.min && totalSpending <= spendingRange.max;
    });

    return {
      id: uuidv4(),
      name: `Spending $${spendingRange.min}-${spendingRange.max}`,
      description: `Guests with total spending between $${spendingRange.min} and $${spendingRange.max}`,
      criteria: { behavior: { spendingRange } },
      size: filtered.length,
      percentage: (filtered.length / profiles.length) * 100,
      characteristics: [
        {
          name: 'average-stay-duration',
          value: 3.5,
          importance: 0.7,
          description: 'Average stay duration',
        },
      ],
      recommendations: ['Premium services', 'Extended stay discounts'],
      createdAt: new Date(),
      lastUpdated: new Date(),
    };
  }
}
