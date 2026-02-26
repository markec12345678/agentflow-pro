/**
 * AgentFlow Pro - Local SEO Optimization for Tourism
 * Destination-specific SEO optimization for tourism businesses
 */

export interface LocalSEOData {
  businessName: string;
  category: 'hotel' | 'vacation_rental' | 'restaurant' | 'tour_operator' | 'attraction' | 'activity_provider';
  location: {
    address: string;
    city: string;
    region: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    postalCode: string;
    phone: string;
    website: string;
  };
  services: string[];
  targetAudience: string[];
  operatingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  seoElements: SEOElements;
}

export interface SEOElements {
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  h2: string[];
  content: string;
  images: SEOImage[];
  schema: StructuredData;
  localBusinessData: LocalBusinessData;
}

export interface SEOImage {
  url: string;
  alt: string;
  title: string;
  caption?: string;
  geoTag?: boolean;
}

export interface LocalBusinessData {
  businessType: string;
  services: string[];
  areaServed: string[];
  priceRange: string;
  paymentAccepted: string[];
  languages: string[];
  accessibility: string[];
  amenities: string[];
  reviews: ReviewData;
}

export interface ReviewData {
  averageRating: number;
  totalReviews: number;
  recentReviews: number;
}

export interface StructuredData {
  type: string;
  properties: Record<string, any>;
}

export interface LocalSEOReport {
  businessInfo: LocalSEOData;
  seoAnalysis: SEOAnalysis;
  recommendations: SEORecommendation[];
  score: number;
  generatedAt: Date;
}

export interface SEOAnalysis {
  titleOptimization: TitleAnalysis;
  descriptionOptimization: DescriptionAnalysis;
  keywordAnalysis: KeywordAnalysis;
  localRankingFactors: LocalRankingFactors;
  technicalSEO: TechnicalSEO;
  competitorAnalysis: CompetitorAnalysis;
}

export interface TitleAnalysis {
  currentTitle: string;
  length: number;
  keywordPresence: boolean;
  locationIncluded: boolean;
  recommendations: string[];
  score: number;
}

export interface DescriptionAnalysis {
  currentDescription: string;
  length: number;
  keywordDensity: Record<string, number>;
  callToAction: boolean;
  localReferences: boolean;
  recommendations: string[];
  score: number;
}

export interface KeywordAnalysis {
  primaryKeywords: string[];
  secondaryKeywords: string[];
  localKeywords: string[];
  longTailKeywords: string[];
  searchVolume: Record<string, number>;
  competition: Record<string, number>;
  opportunities: string[];
}

export interface LocalRankingFactors {
  googleBusinessProfile: GoogleBusinessProfile;
  localCitations: LocalCitation[];
  reviews: ReviewSignals;
  backlinks: BacklinkProfile;
  contentRelevance: number;
}

export interface GoogleBusinessProfile {
  verified: boolean;
  completeness: number;
  photos: number;
  reviews: number;
  questions: number;
  posts: number;
  rating: number;
}

export interface LocalCitation {
  source: string;
  url: string;
  consistency: boolean;
  authority: number;
}

export interface ReviewSignals {
  quantity: number;
  averageRating: number;
  diversity: number;
  recency: number;
  velocity: number;
}

export interface BacklinkProfile {
  localLinks: number;
  authorityLinks: number;
  relevanceScore: number;
  anchorTextDiversity: number;
}

export interface TechnicalSEO {
  mobileFriendly: boolean;
  pageSpeed: number;
  schemaMarkup: boolean;
  sslCertificate: boolean;
  xmlSitemaps: boolean;
  robotsTxt: boolean;
}

export interface CompetitorAnalysis {
  topCompetitors: CompetitorData[];
  keywordOverlap: Record<string, string[]>;
  contentGap: string[];
  opportunityAreas: string[];
}

export interface CompetitorData {
  name: string;
  url: string;
  ranking: number;
  strengths: string[];
  weaknesses: string[];
  strategies: string[];
}

export interface SEORecommendation {
  category: 'critical' | 'high' | 'medium' | 'low';
  priority: number;
  title: string;
  description: string;
  implementation: string;
  impact: string;
  effort: string;
  timeframe: string;
}

export class LocalSEOOptimizer {
  private tourismKeywords = {
    accommodation: ['hotel', 'motel', 'resort', 'vacation rental', 'apartment', 'villa', 'guesthouse', 'bnb', 'lodging'],
    activities: ['tour', 'excursion', 'activity', 'adventure', 'hiking', 'skiing', 'water sports', 'cycling', 'sightseeing'],
    dining: ['restaurant', 'cafe', 'bar', 'bistro', 'dining', 'cuisine', 'food', 'breakfast'],
    transportation: ['airport transfer', 'shuttle', 'taxi', 'car rental', 'transport', 'transfer', 'pickup'],
    services: ['spa', 'wellness', 'massage', 'fitness', 'pool', 'gym', 'wellness center'],
    booking: ['reservation', 'booking', 'availability', 'rates', 'prices', 'check-in', 'check-out', 'accommodation']
  };

  private locationModifiers = {
    slovenia: ['slovenia', 'ljubljana', 'bled', 'lake bled', 'julian alps', 'triglav', 'piran', 'koper', 'maribor'],
    croatia: ['croatia', 'zagreb', 'split', 'dubrovnik', 'pula', 'zadar', 'plitvice', 'hvar'],
    italy: ['italy', 'rome', 'venice', 'florence', 'milan', 'naples', 'amalfi coast', 'tuscany'],
    austria: ['austria', 'vienna', 'salzburg', 'innsbruck', 'graz', 'tyrol', 'alps']
  };

  async optimizeForLocalSEO(businessData: LocalSEOData): Promise<LocalSEOReport> {
    const analysis = await this.analyzeSEO(businessData);
    const recommendations = this.generateRecommendations(analysis);
    const score = this.calculateOverallScore(analysis);

    return {
      businessInfo: businessData,
      seoAnalysis: analysis,
      recommendations,
      score,
      generatedAt: new Date()
    };
  }

  private async analyzeSEO(businessData: LocalSEOData): Promise<SEOAnalysis> {
    const titleAnalysis = this.analyzeTitle(businessData.seoElements.title, businessData);
    const descriptionAnalysis = this.analyzeDescription(businessData.seoElements.description, businessData);
    const keywordAnalysis = await this.analyzeKeywords(businessData);
    const localRankingFactors = this.analyzeLocalRankingFactors(businessData);
    const technicalSEO = this.analyzeTechnicalSEO(businessData);
    const competitorAnalysis = await this.analyzeCompetitors(businessData);

    return {
      titleOptimization: titleAnalysis,
      descriptionOptimization: descriptionAnalysis,
      keywordAnalysis,
      localRankingFactors,
      technicalSEO,
      competitorAnalysis
    };
  }

  private analyzeTitle(title: string, businessData: LocalSEOData): TitleAnalysis {
    const recommendations: string[] = [];
    let score = 50;

    // Length check
    const length = title.length;
    if (length < 30) {
      recommendations.push('Title is too short - aim for 50-60 characters');
      score -= 10;
    } else if (length > 60) {
      recommendations.push('Title is too long - may be truncated in search results');
      score -= 10;
    }

    // Location presence
    const hasLocation = this.locationModifiers[businessData.location.country.toLowerCase()]?.some(modifier =>
      title.toLowerCase().includes(modifier)
    );
    if (!hasLocation) {
      recommendations.push(`Include location "${businessData.location.city}" in title`);
      score -= 15;
    }

    // Keyword presence
    const hasKeywords = this.tourismKeywords[businessData.category]?.some(keyword =>
      title.toLowerCase().includes(keyword)
    );
    if (!hasKeywords) {
      recommendations.push('Include primary tourism keywords in title');
      score -= 15;
    }

    return {
      currentTitle: title,
      length,
      keywordPresence: hasKeywords,
      locationIncluded: hasLocation,
      recommendations,
      score
    };
  }

  private analyzeDescription(description: string, businessData: LocalSEOData): DescriptionAnalysis {
    const recommendations: string[] = [];
    let score = 50;

    // Length check
    const length = description.length;
    if (length < 120) {
      recommendations.push('Description is too short - aim for 150-160 characters');
      score -= 10;
    } else if (length > 160) {
      recommendations.push('Description may be truncated - keep under 160 characters');
      score -= 5;
    }

    // Call to action
    const hasCTA = /\b(call|book|reserve|contact|visit|learn more)\b/i.test(description);
    if (!hasCTA) {
      recommendations.push('Add call-to-action like "Book now" or "Check availability"');
      score -= 10;
    }

    // Local references
    const hasLocalRefs = this.locationModifiers[businessData.location.country.toLowerCase()]?.some(modifier =>
      description.toLowerCase().includes(modifier)
    );
    if (!hasLocalRefs) {
      recommendations.push(`Include local references like "${businessData.location.city}" or nearby landmarks`);
      score -= 10;
    }

    // Keyword density
    const keywordDensity = this.calculateKeywordDensity(description, businessData);

    return {
      currentDescription: description,
      length,
      keywordDensity,
      callToAction: hasCTA,
      localReferences: hasLocalRefs,
      recommendations,
      score
    };
  }

  private async analyzeKeywords(businessData: LocalSEOData): Promise<KeywordAnalysis> {
    const categoryKeywords = this.tourismKeywords[businessData.category] || [];
    const locationKeywords = this.locationModifiers[businessData.location.country.toLowerCase()] || [];
    
    const primaryKeywords = categoryKeywords.slice(0, 5);
    const secondaryKeywords = categoryKeywords.slice(5, 10);
    const localKeywords = [...categoryKeywords.slice(0, 3), ...locationKeywords.slice(0, 2)];
    const longTailKeywords = this.generateLongTailKeywords(businessData);

    // Mock search volume and competition data
    const searchVolume: Record<string, number> = {};
    const competition: Record<string, number> = {};

    [...primaryKeywords, ...secondaryKeywords, ...localKeywords].forEach(keyword => {
      searchVolume[keyword] = Math.floor(Math.random() * 10000) + 100; // Mock data
      competition[keyword] = Math.floor(Math.random() * 100); // Mock data
    });

    const opportunities = this.identifyKeywordOpportunities(primaryKeywords, competition);

    return {
      primaryKeywords,
      secondaryKeywords,
      localKeywords,
      longTailKeywords,
      searchVolume,
      competition,
      opportunities
    };
  }

  private analyzeLocalRankingFactors(businessData: LocalSEOData): LocalRankingFactors {
    const googleBusinessProfile: GoogleBusinessProfile = {
      verified: false, // Mock: would check Google Business API
      completeness: 75, // Mock: 75% profile completeness
      photos: 12, // Mock: number of photos
      reviews: 25, // Mock: number of reviews
      questions: 5, // Mock: Q&A responses
      posts: 8, // Mock: recent posts
      rating: 4.2 // Mock: average rating
    };

    const localCitations: LocalCitation[] = [
      {
        source: 'TripAdvisor',
        url: 'https://www.tripadvisor.com',
        consistency: true,
        authority: 85
      },
      {
        source: 'Booking.com',
        url: 'https://www.booking.com',
        consistency: true,
        authority: 90
      }
    ];

    const reviews: ReviewSignals = {
      quantity: 25,
      averageRating: 4.2,
      diversity: 0.8, // Rating distribution
      recency: 0.9, // Recent reviews
      velocity: 2.5 // Reviews per month
    };

    const backlinks: BacklinkProfile = {
      localLinks: 15,
      authorityLinks: 3,
      relevanceScore: 0.7,
      anchorTextDiversity: 0.6
    };

    return {
      googleBusinessProfile,
      localCitations,
      reviews,
      backlinks,
      contentRelevance: 0.8 // Mock relevance score
    };
  }

  private analyzeTechnicalSEO(businessData: LocalSEOData): TechnicalSEO {
    return {
      mobileFriendly: true, // Assume mobile-friendly
      pageSpeed: 85, // Mock: 85/100 Google PageSpeed
      schemaMarkup: true, // Check for structured data
      sslCertificate: businessData.website.startsWith('https'),
      xmlSitemaps: true, // Assume sitemap exists
      robotsTxt: true // Assume robots.txt exists
    };
  }

  private async analyzeCompetitors(businessData: LocalSEOData): Promise<CompetitorAnalysis> {
    // Mock competitor analysis
    const topCompetitors: CompetitorData[] = [
      {
        name: 'Competitor Hotel 1',
        url: 'https://competitor1.com',
        ranking: 1,
        strengths: ['Strong brand', 'Good reviews', 'Central location'],
        weaknesses: ['Old website', 'Limited amenities'],
        strategies: ['Content marketing', 'Local SEO focus']
      },
      {
        name: 'Competitor Hotel 2',
        url: 'https://competitor2.com',
        ranking: 3,
        strengths: ['Competitive pricing', 'Modern design'],
        weaknesses: ['Poor service', 'Limited online presence'],
        strategies: ['Social media marketing', 'Customer service improvement']
      }
    ];

    const keywordOverlap: Record<string, string[]> = {
      'hotel': ['Competitor Hotel 1', 'Competitor Hotel 2'],
      'accommodation': ['Competitor Hotel 1'],
      'location': ['Competitor Hotel 1', 'Competitor Hotel 2']
    };

    const contentGap = [
      'Virtual tours',
      'Sustainability initiatives',
      'Local experience packages'
    ];

    const opportunityAreas = [
      'Google Business optimization',
      'Video marketing',
      'Influencer partnerships'
    ];

    return {
      topCompetitors,
      keywordOverlap,
      contentGap,
      opportunityAreas
    };
  }

  private calculateKeywordDensity(text: string, businessData: LocalSEOData): Record<string, number> {
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    const density: Record<string, number> = {};

    const categoryKeywords = this.tourismKeywords[businessData.category] || [];
    
    categoryKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const count = words.filter(word => word.includes(keywordLower)).length;
      density[keyword] = totalWords > 0 ? (count / totalWords) * 100 : 0;
    });

    return density;
  }

  private generateLongTailKeywords(businessData: LocalSEOData): string[] {
    const location = businessData.location.city.toLowerCase();
    const category = businessData.category;
    
    const longTailPatterns = [
      `${location} ${category} near me`,
      `best ${category} in ${location}`,
      `affordable ${category} ${location}`,
      `${location} ${category} with parking`,
      `family friendly ${category} ${location}`,
      `${category} ${location} reviews`,
      `how to get to ${location} ${category}`,
      `${location} ${category} deals`,
      `${category} ${location} booking`
    ];

    return longTailPatterns;
  }

  private identifyKeywordOpportunities(keywords: string[], competition: Record<string, number>): string[] {
    return keywords
      .filter(keyword => (competition[keyword] || 50) < 30) // Low competition
      .filter(keyword => keyword.length > 3) // Long-tail
      .slice(0, 5);
  }

  private generateRecommendations(analysis: SEOAnalysis): SEORecommendation[] {
    const recommendations: SEORecommendation[] = [];

    // Title recommendations
    if (analysis.titleOptimization.score < 70) {
      recommendations.push({
        category: 'high',
        priority: 1,
        title: 'Optimize Page Title',
        description: 'Improve title length, include location and keywords',
        implementation: 'Rewrite title to 50-60 characters with location and primary keywords',
        impact: 'High - Direct impact on search rankings',
        effort: 'Low - Quick to implement',
        timeframe: '1-2 days'
      });
    }

    // Description recommendations
    if (analysis.descriptionOptimization.score < 70) {
      recommendations.push({
        category: 'high',
        priority: 2,
        title: 'Enhance Meta Description',
        description: 'Add call-to-action and local references',
        implementation: 'Rewrite description to 150-160 characters with CTA and location mentions',
        impact: 'Medium - Improves click-through rates',
        effort: 'Low - Quick to implement',
        timeframe: '1-2 days'
      });
    }

    // Local SEO recommendations
    if (analysis.localRankingFactors.googleBusinessProfile.completeness < 80) {
      recommendations.push({
        category: 'critical',
        priority: 1,
        title: 'Complete Google Business Profile',
        description: 'Fill out all Google Business profile sections',
        implementation: 'Add photos, services, hours, and respond to reviews',
        impact: 'Critical - Major impact on local rankings',
        effort: 'Medium - Requires ongoing effort',
        timeframe: '1-2 weeks'
      });
    }

    // Technical SEO recommendations
    if (analysis.technicalSEO.pageSpeed < 80) {
      recommendations.push({
        category: 'medium',
        priority: 3,
        title: 'Improve Page Speed',
        description: 'Optimize images and reduce server response time',
        implementation: 'Compress images, enable caching, optimize code',
        impact: 'Medium - Improves user experience and rankings',
        effort: 'Medium - Technical optimization required',
        timeframe: '1-2 weeks'
      });
    }

    return recommendations;
  }

  private calculateOverallScore(analysis: SEOAnalysis): number {
    const titleScore = analysis.titleOptimization.score;
    const descriptionScore = analysis.descriptionOptimization.score;
    const localScore = (analysis.localRankingFactors.googleBusinessProfile.completeness + 
                   analysis.localRankingFactors.reviews.quantity * 2) / 3;
    const technicalScore = (analysis.technicalSEO.pageSpeed + 
                   (analysis.technicalSEO.schemaMarkup ? 10 : 0) +
                   (analysis.technicalSEO.sslCertificate ? 5 : 0)) / 3;

    return Math.round((titleScore + descriptionScore + localScore + technicalScore) / 4);
  }
}
