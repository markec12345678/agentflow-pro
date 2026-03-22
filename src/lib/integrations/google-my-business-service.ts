/**
 * Google My Business (Google Business Profile) Integration
 * Handles: Review management, business info sync, posts
 */

interface GoogleMyBusinessConfig {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  accountId: string;
  locationId: string;
}

interface Review {
  name: string;
  reviewId: string;
  starRating: number;
  comment: string;
  createTime: string;
  updateTime: string;
  reviewerDisplayName: string;
  reviewerProfilePhotoUrl?: string;
  languageCode: string;
}

interface ReviewResponse {
  comment: string;
  updateTime: string;
}

interface BusinessInfo {
  title: string;
  placeName: string;
  primaryPhone: string;
  primaryWebsite: string;
  address: {
    regionCode: string;
    locality: string;
    postalCode: string;
    addressLines: string[];
  };
  openHours?: {
    openInterval: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };
}

export class GoogleMyBusinessService {
  private config: GoogleMyBusinessConfig;
  private baseUrl: string = 'https://mybusinessaccountmanagement.googleapis.com/v1';
  private placesUrl: string = 'https://mybusinessplace.googleapis.com/v1';

  constructor(config?: Partial<GoogleMyBusinessConfig>) {
    this.config = {
      clientId: config?.clientId || process.env.GOOGLE_MY_BUSINESS_CLIENT_ID || '',
      clientSecret: config?.clientSecret || process.env.GOOGLE_MY_BUSINESS_CLIENT_SECRET || '',
      accessToken: config?.accessToken,
      refreshToken: config?.refreshToken,
      accountId: config?.accountId || process.env.GOOGLE_MY_BUSINESS_ACCOUNT_ID || '',
      locationId: config?.locationId || process.env.GOOGLE_MY_BUSINESS_LOCATION_ID || '',
    };
  }

  /**
   * Get all reviews for location
   */
  async getReviews(): Promise<Review[]> {
    if (!this.config.accessToken) {
      throw new Error('Google My Business access token not configured');
    }

    const response = await fetch(
      `${this.placesUrl}/locations/${this.config.locationId}/reviews`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google My Business API error: ${error.error.message}`);
    }

    const data = await response.json();
    return data.reviews || [];
  }

  /**
   * Reply to review
   */
  async replyToReview(reviewId: string, responseText: string): Promise<ReviewResponse> {
    if (!this.config.accessToken) {
      throw new Error('Google My Business access token not configured');
    }

    const response = await fetch(
      `${this.placesUrl}/locations/${this.config.locationId}/reviews/${reviewId}:reply`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: responseText,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google My Business API error: ${error.error.message}`);
    }

    return response.json();
  }

  /**
   * Get business information
   */
  async getBusinessInfo(): Promise<BusinessInfo> {
    if (!this.config.accessToken) {
      throw new Error('Google My Business access token not configured');
    }

    const response = await fetch(
      `${this.placesUrl}/locations/${this.config.locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google My Business API error: ${error.error.message}`);
    }

    return response.json();
  }

  /**
   * Update business information
   */
  async updateBusinessInfo(info: Partial<BusinessInfo>): Promise<BusinessInfo> {
    if (!this.config.accessToken) {
      throw new Error('Google My Business access token not configured');
    }

    const updateMask = Object.keys(info).join(',');

    const response = await fetch(
      `${this.placesUrl}/locations/${this.config.locationId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...info,
          updateMask,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google My Business API error: ${error.error.message}`);
    }

    return response.json();
  }

  /**
   * Create post on Google Business Profile
   */
  async createPost(data: {
    summary: string;
    content?: string;
    imageUrl?: string;
    callToAction?: {
      type: 'BOOK' | 'ORDER' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL';
      url?: string;
      phoneNumber?: string;
    };
  }): Promise<any> {
    if (!this.config.accessToken) {
      throw new Error('Google My Business access token not configured');
    }

    const post: any = {
      summary: data.summary,
      state: 'LIVE',
    };

    if (data.content) {
      post.description = { content: data.content };
    }

    if (data.imageUrl) {
      post.media = {
        photo: {
          photoUrl: data.imageUrl,
        },
      };
    }

    if (data.callToAction) {
      post.callToAction = data.callToAction;
    }

    const response = await fetch(
      `${this.placesUrl}/locations/${this.config.locationId}/posts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google My Business API error: ${error.error.message}`);
    }

    return response.json();
  }

  /**
   * Get review statistics
   */
  async getReviewStats(): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    recentReviews: Review[];
  }> {
    const reviews = await this.getReviews();
    
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.starRating, 0) / totalReviews || 0;
    
    const ratingDistribution = reviews.reduce((acc, r) => {
      acc[r.starRating] = (acc[r.starRating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const recentReviews = reviews.slice(0, 10);

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      recentReviews,
    };
  }

  /**
   * Auto-reply to reviews using AI
   */
  async autoReplyToReview(
    reviewId: string,
    reviewText: string,
    starRating: number,
    propertyName: string
  ): Promise<ReviewResponse> {
    // Generate AI response
    const response = await this.generateAIResponse(reviewText, starRating, propertyName);
    
    // Post reply
    return this.replyToReview(reviewId, response);
  }

  /**
   * Generate AI response to review
   */
  private async generateAIResponse(
    reviewText: string,
    starRating: number,
    propertyName: string
  ): Promise<string> {
    const isPositive = starRating >= 4;
    const isNeutral = starRating === 3;
    const isNegative = starRating <= 2;

    if (isPositive) {
      return `Hvala za čudovito oceno, ${reviewText.split(' ')[0]}! Veseli nas, da ste uživali v bivanju pri ${propertyName}. Komaj čakamo na vaš naslednji obisk!`;
    } else if (isNegative) {
      return `Spoštovani, iskreno se opravičujemo za vaše neprijetno izkušnjo pri ${propertyName}. Radi bi se pogovorili z vami in popravili situacijo. Prosimo, kontaktirajte nas na info@${propertyName.toLowerCase().replace(/\s/g, '')}.si. Hvala za povratne informacije.`;
    } else {
      return `Hvala za vaše mnenje o ${propertyName}. Cenimo vaše povratne informacije in bomo upoštevali vaša opažanja za izboljšavo naše ponudbe.`;
    }
  }

  /**
   * Sync reviews to database
   */
  async syncReviewsToDatabase(propertyId: string): Promise<number> {
    const { prisma } = await import('@/lib/prisma');
    const reviews = await this.getReviews();
    
    let syncedCount = 0;

    for (const review of reviews) {
      await prisma.review.upsert({
        where: {
          externalId: review.reviewId,
        },
        update: {
          rating: review.starRating,
          comment: review.comment,
          reviewerName: review.reviewerDisplayName,
          reviewedAt: new Date(review.updateTime),
        },
        create: {
          externalId: review.reviewId,
          propertyId,
          rating: review.starRating,
          comment: review.comment,
          reviewerName: review.reviewerDisplayName,
          reviewerAvatar: review.reviewerProfilePhotoUrl,
          language: review.languageCode,
          source: 'google',
          reviewedAt: new Date(review.createTime),
        },
      });
      syncedCount++;
    }

    return syncedCount;
  }
}

export const googleMyBusinessService = new GoogleMyBusinessService();
