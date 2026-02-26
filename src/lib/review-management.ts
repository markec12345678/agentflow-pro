/**
 * AgentFlow Pro - Guest Review Management System
 * Automated review responses and reputation management
 */

import { getUnifiedBookingManager } from './unified-booking';

export interface GuestReview {
  id: string;
  propertyId: string;
  reservationId?: string;
  guestId: string;
  rating: number;
  title: string;
  content: string;
  author: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  date: Date;
  language: string;
  platform: 'booking.com' | 'airbnb' | 'tripadvisor' | 'google' | 'direct';
  response?: ReviewResponse;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  helpfulVotes: number;
  verified: boolean;
  categories: ReviewCategory[];
  photos?: string[];
  managementStatus: 'pending' | 'responded' | 'escalated' | 'resolved';
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  content: string;
  author: string;
  authorRole: string;
  date: Date;
  language: string;
  type: 'public' | 'private';
  status: 'draft' | 'published';
  template?: string;
  personalization?: string;
}

export interface ReviewCategory {
  category: 'cleanliness' | 'location' | 'service' | 'value' | 'amenities' | 'accuracy';
  score: number;
  description?: string;
}

export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  sentimentDistribution: Record<string, number>;
  responseRate: number;
  averageResponseTime: number; // in hours
  platformBreakdown: Record<string, {
    count: number;
    averageRating: number;
    responseRate: number;
  }>;
  trendData: {
    period: string;
    ratingChange: number;
    reviewCountChange: number;
  }[];
}

export interface ReviewResponseTemplate {
  id: string;
  name: string;
  type: 'positive' | 'neutral' | 'negative';
  ratingRange: {
    min: number;
    max: number;
  };
  template: string;
  variables: string[];
  languages: Record<string, string>;
  personalizationFields: string[];
  autoApprove: boolean;
}

export class GuestReviewManager {
  private reviews: Map<string, GuestReview> = new Map();
  private responseTemplates: Map<string, ReviewResponseTemplate> = new Map();
  private unifiedBookingManager = getUnifiedBookingManager();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: ReviewResponseTemplate[] = [
      {
        id: 'positive_5_star',
        name: '5-Star Thank You',
        type: 'positive',
        ratingRange: { min: 5, max: 5 },
        template: 'Dear {guestName}, thank you for your wonderful 5-star review! We\'re thrilled you had an amazing experience at {propertyName}. Your feedback about {specificPoints} helps us maintain our high standards. We hope to welcome you back soon!',
        variables: ['guestName', 'propertyName', 'specificPoints'],
        languages: {
          en: 'Dear {guestName}, thank you for your wonderful 5-star review! We\'re thrilled you had an amazing experience at {propertyName}. Your feedback about {specificPoints} helps us maintain our high standards. We hope to welcome you back soon!',
          sl: 'Spoštovani {guestName}, hvala za vašo čudovito 5-zvezdično oceno! Navdušeni smo, da ste imeli odlično izkušnjo v {propertyName}. Vaše povratne informacije o {specificPoints} nam pomagajo ohranjati visoke standarde. Upamo, da vas bomo kmalu spet prijeteli!',
          de: 'Sehr geehrter {guestName}, vielen Dank für Ihre fantastische 5-Sterne-Bewertung! Wir freuen uns, dass Sie eine wunderbare Erfahrung in {propertyName} hatten. Ihr Feedback zu {specificPoints} hilft uns, unsere hohen Standards zu erhalten. Wir hoffen, Sie bald wieder begrüßen zu dürfen!'
        },
        personalizationFields: ['guestName', 'propertyName', 'specificPoints'],
        autoApprove: true
      },
      {
        id: 'neutral_3_4_star',
        name: '3-4 Star Response',
        type: 'neutral',
        ratingRange: { min: 3, max: 4 },
        template: 'Dear {guestName}, thank you for your {rating}-star review and valuable feedback about {improvementAreas}. We\'re committed to improving our services, and we\'ve already addressed {actionTaken}. We\'d love to welcome you back to show you the improvements we\'ve made.',
        variables: ['guestName', 'rating', 'improvementAreas', 'actionTaken'],
        languages: {
          en: 'Dear {guestName}, thank you for your {rating}-star review and valuable feedback about {improvementAreas}. We\'re committed to improving our services, and we\'ve already addressed {actionTaken}. We\'d love to welcome you back to show you the improvements we\'ve made.',
          sl: 'Spoštovani {guestName}, hvala za vašo {rating}-zvezdično oceno in dragocene povratne informacije o {improvementAreas}. Zavezani smo k izboljšanju naših storitev in že obravnavali {actionTaken}. Radi bi vas ponovno prijeli, da vam pokažemo izboljšave, ki smo jih naredili.'
        },
        personalizationFields: ['guestName', 'rating', 'improvementAreas', 'actionTaken'],
        autoApprove: true
      },
      {
        id: 'negative_1_2_star',
        name: '1-2 Star Apology',
        type: 'negative',
        ratingRange: { min: 1, max: 2 },
        template: 'Dear {guestName}, we sincerely apologize that your experience at {propertyName} did not meet your expectations. We take your feedback about {issues} very seriously and have already {immediateAction}. As a gesture of our commitment to your satisfaction, we\'d like to offer you {compensation}. Please contact us directly at {contactInfo} to discuss this further.',
        variables: ['guestName', 'propertyName', 'issues', 'immediateAction', 'compensation', 'contactInfo'],
        languages: {
          en: 'Dear {guestName}, we sincerely apologize that your experience at {propertyName} did not meet your expectations. We take your feedback about {issues} very seriously and have already {immediateAction}. As a gesture of our commitment to your satisfaction, we\'d like to offer you {compensation}. Please contact us directly at {contactInfo} to discuss this further.',
          sl: 'Spoštovani {guestName}, se iskreno opravičujemo, da vaša izkušnja v {propertyName} niso bila v skladu z vašimi pričakovanji. Vaše povratne informacije o {issues} jemljemo zelo resno in že smo {immediateAction}. Kot gesto naše zavezanosti k vaši zadovoljstvi bi vam radi ponudili {compensation}. Prosimo, da nas neposredno kontaktirate na {contactInfo} za nadaljnjo razpravo.'
        },
        personalizationFields: ['guestName', 'propertyName', 'issues', 'immediateAction', 'compensation', 'contactInfo'],
        autoApprove: false // Requires manual review
      }
    ];

    defaultTemplates.forEach(template => {
      this.responseTemplates.set(template.id, template);
    });
  }

  async addReview(review: Omit<GuestReview, 'id'>): Promise<GuestReview> {
    const guestReview: GuestReview = {
      ...review,
      id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sentiment: this.analyzeSentiment(review.content),
      sentimentScore: this.calculateSentimentScore(review.content),
      managementStatus: 'pending',
      categories: this.categorizeReview(review)
    };

    this.reviews.set(guestReview.id, guestReview);
    
    // Trigger automated response for positive reviews
    if (guestReview.rating >= 4) {
      await this.generateAutoResponse(guestReview);
    }

    return guestReview;
  }

  async generateResponse(
    reviewId: string,
    templateId: string,
    personalization: Record<string, string> = {},
    language: string = 'en'
  ): Promise<ReviewResponse> {
    const review = this.reviews.get(reviewId);
    const template = this.responseTemplates.get(templateId);
    
    if (!review || !template) {
      throw new Error('Review or template not found');
    }

    // Check if template is appropriate for rating
    if (review.rating < template.ratingRange.min || review.rating > template.ratingRange.max) {
      throw new Error(`Template rating range ${template.ratingRange.min}-${template.ratingRange.max} doesn't match review rating ${review.rating}`);
    }

    // Generate personalized response
    let responseContent = template.template;
    const templateLanguage = template.languages[language] || template.languages.en;
    
    if (templateLanguage) {
      responseContent = templateLanguage;
    }

    // Replace template variables
    for (const [variable, value] of Object.entries(personalization)) {
      responseContent = responseContent.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
    }

    const response: ReviewResponse = {
      id: `response_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      reviewId,
      content: responseContent,
      author: 'Property Management',
      authorRole: 'host',
      date: new Date(),
      language,
      type: template.autoApprove ? 'public' : 'private',
      status: template.autoApprove ? 'published' : 'draft',
      template: templateId,
      personalization: JSON.stringify(personalization)
    };

    // Update review with response
    review.response = response;
    review.managementStatus = 'responded';
    this.reviews.set(reviewId, review);

    return response;
  }

  async generateAutoResponse(review: GuestReview): Promise<ReviewResponse> {
    if (review.sentiment === 'positive' && review.rating >= 4) {
      const template = this.responseTemplates.get('positive_5_star');
      if (!template) throw new Error('Positive template not found');

      const personalization = {
        guestName: review.author.name,
        propertyName: 'Property Name', // This would come from property data
        specificPoints: this.extractPositivePoints(review.content)
      };

      return await this.generateResponse(review.id, template.id, personalization, review.language);
    }

    throw new Error('Auto-response only available for positive reviews (4+ stars)');
  }

  async escalateReview(reviewId: string, reason: string, escalateTo: string): Promise<void> {
    const review = this.reviews.get(reviewId);
    if (!review) throw new Error('Review not found');

    review.managementStatus = 'escalated';
    this.reviews.set(reviewId, review);

    console.log(`Review ${reviewId} escalated to ${escalateTo} for reason: ${reason}`);
  }

  async publishResponse(responseId: string): Promise<void> {
    const response = this.findResponse(responseId);
    if (!response) throw new Error('Response not found');

    response.status = 'published';
    response.date = new Date();

    console.log(`Review response ${responseId} published publicly`);
  }

  getReviewAnalytics(propertyId?: string, dateRange?: { start: Date; end: Date }): ReviewAnalytics {
    let filteredReviews = Array.from(this.reviews.values());

    if (propertyId) {
      filteredReviews = filteredReviews.filter(r => r.propertyId === propertyId);
    }

    if (dateRange) {
      filteredReviews = filteredReviews.filter(r => 
        r.date >= dateRange.start && r.date <= dateRange.end
      );
    }

    const totalReviews = filteredReviews.length;
    const averageRating = totalReviews > 0 
      ? filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution: Record<number, number> = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = filteredReviews.filter(r => r.rating === i).length;
    }

    const sentimentDistribution: Record<string, number> = {
      positive: filteredReviews.filter(r => r.sentiment === 'positive').length,
      neutral: filteredReviews.filter(r => r.sentiment === 'neutral').length,
      negative: filteredReviews.filter(r => r.sentiment === 'negative').length
    };

    const respondedReviews = filteredReviews.filter(r => r.response);
    const responseRate = totalReviews > 0 ? (respondedReviews.length / totalReviews) * 100 : 0;

    const averageResponseTime = this.calculateAverageResponseTime(respondedReviews);

    const platformBreakdown: Record<string, any> = {};
    filteredReviews.forEach(review => {
      if (!platformBreakdown[review.platform]) {
        platformBreakdown[review.platform] = { count: 0, totalRating: 0, responseRate: 0 };
      }
      platformBreakdown[review.platform].count++;
      platformBreakdown[review.platform].totalRating += review.rating;
      platformBreakdown[review.platform].responseRate += review.response ? 1 : 0;
    });

    Object.keys(platformBreakdown).forEach(platform => {
      const count = platformBreakdown[platform].count;
      platformBreakdown[platform].averageRating = count > 0 ? platformBreakdown[platform].totalRating / count : 0;
      platformBreakdown[platform].responseRate = (platformBreakdown[platform].responseRate / count) * 100;
    });

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
      sentimentDistribution,
      responseRate,
      averageResponseTime,
      platformBreakdown
    };
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['excellent', 'amazing', 'wonderful', 'perfect', 'love', 'great', 'fantastic', 'beautiful', 'clean', 'comfortable'];
    const negativeWords = ['terrible', 'awful', 'disgusting', 'dirty', 'rude', 'unprofessional', 'disappointing', 'worst', 'horrible', 'never'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount * 2) return 'positive';
    return 'neutral';
  }

  private calculateSentimentScore(content: string): number {
    const sentiment = this.analyzeSentiment(content);
    const baseScore = sentiment === 'positive' ? 0.8 : sentiment === 'negative' ? 0.2 : 0.5;
    
    // Adjust based on review length and detail
    const lengthBonus = Math.min(content.length / 500, 0.2); // Max 0.2 bonus for longer reviews
    
    return Math.min(baseScore + lengthBonus, 1.0);
  }

  private categorizeReview(review: Omit<GuestReview, 'categories'>): ReviewCategory[] {
    const categories: ReviewCategory[] = [];
    const content = review.content.toLowerCase();

    const categoryKeywords = {
      cleanliness: ['clean', 'dirty', 'tidy', 'messy', 'hygienic', 'sanitary'],
      location: ['location', 'area', 'neighborhood', 'central', 'convenient', 'far', 'remote'],
      service: ['service', 'staff', 'host', 'helpful', 'friendly', 'rude', 'unresponsive'],
      value: ['value', 'price', 'expensive', 'cheap', 'worth', 'overpriced', 'good value'],
      amenities: ['amenities', 'facilities', 'equipment', 'missing', 'broken', 'well-equipped'],
      accuracy: ['accurate', 'description', 'photos', 'misleading', 'different', 'exactly as described']
    };

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const score = keywords.reduce((count, keyword) => {
        return count + (content.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > 0) {
        categories.push({
          category: category as any,
          score: Math.min(score / keywords.length, 1.0),
          description: `Mentions of ${category} in review`
        });
      }
    });

    return categories;
  }

  private extractPositivePoints(content: string): string {
    const positivePhrases = [
      'beautiful location',
      'clean and comfortable',
      'excellent service',
      'great value',
      'amazing amenities',
      'wonderful host',
      'perfect stay',
      'exceeded expectations'
    ];

    const contentLower = content.toLowerCase();
    const foundPhrases = positivePhrases.filter(phrase => contentLower.includes(phrase));
    
    return foundPhrases.length > 0 ? foundPhrases[0] : 'your wonderful feedback';
  }

  private calculateAverageResponseTime(respondedReviews: GuestReview[]): number {
    if (respondedReviews.length === 0) return 0;

    const responseTimes = respondedReviews
      .filter(review => review.response && review.date)
      .map(review => {
        const responseDate = new Date(review.response!.date);
        const reviewDate = new Date(review.date);
        const diffHours = (responseDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60);
        return diffHours;
      });

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private findResponse(responseId: string): ReviewResponse | null {
    for (const review of this.reviews.values()) {
      if (review.response && review.response.id === responseId) {
        return review.response;
      }
    }
    return null;
  }

  getReviewById(reviewId: string): GuestReview | null {
    return this.reviews.get(reviewId) || null;
  }

  getResponseTemplate(templateId: string): ReviewResponseTemplate | null {
    return this.responseTemplates.get(templateId) || null;
  }

  getAllReviews(): GuestReview[] {
    return Array.from(this.reviews.values());
  }

  getPendingReviews(): GuestReview[] {
    return this.getAllReviews().filter(review => review.managementStatus === 'pending');
  }

  getResponseTemplates(): ReviewResponseTemplate[] {
    return Array.from(this.responseTemplates.values());
  }
}
