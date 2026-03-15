/**
 * Google Reviews API Integration for AgentFlow Pro
 *
 * Automates review requests to guests after checkout.
 * Supports Google Business Profile API integration.
 *
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

import { renderEmailTemplate, renderSMSTemplate } from './guest-templates';

export interface GoogleReviewConfig {
  placeId: string;
  apiKey: string;
  businessName: string;
  reviewRequestDelayDays: number; // Days after checkout to send review request
}

export interface ReviewRequest {
  id: string;
  reservationId: string;
  guestEmail: string;
  guestPhone?: string;
  guestName: string;
  propertyName: string;
  checkOutDate: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'completed' | 'failed';
  reviewUrl: string;
  channel: 'email' | 'sms' | 'both';
}

export interface ReviewResponse {
  reviewId: string;
  rating: number;
  text: string;
  authorName: string;
  authorEmail?: string;
  publishedAt: Date;
  language: string;
}

/**
 * Generate Google Review URL
 *
 * @param placeId - Google Place ID of the property
 * @returns Google review URL
 */
export function generateGoogleReviewUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}&action=write-review`;
}

/**
 * Create a review request for a guest
 *
 * @param reservation - Reservation data
 * @param config - Google review configuration
 * @returns Review request object
 */
export function createReviewRequest(
  reservation: {
    id: string;
    guestEmail: string;
    guestPhone?: string;
    guestName: string;
    property: {
      name: string;
      googlePlaceId?: string;
    };
    checkOutDate: Date;
  },
  config: GoogleReviewConfig
): ReviewRequest {
  const reviewUrl = config.placeId
    ? generateGoogleReviewUrl(config.placeId)
    : `https://www.google.com/search?q=${encodeURIComponent(reservation.property.name)}`;

  return {
    id: `review-${reservation.id}-${Date.now()}`,
    reservationId: reservation.id,
    guestEmail: reservation.guestEmail,
    guestPhone: reservation.guestPhone,
    guestName: reservation.guestName,
    propertyName: reservation.property.name,
    checkOutDate: reservation.checkOutDate,
    status: 'pending',
    reviewUrl,
    channel: 'both' // Default to both email and SMS
  };
}

/**
 * Generate review request email
 *
 * @param reviewRequest - Review request data
 * @param customMessage - Optional custom message
 * @returns Email subject and body
 */
export function generateReviewRequestEmail(
  reviewRequest: ReviewRequest,
  customMessage?: string
): { subject: string; body: string } {
  const variables: Record<string, string> = {
    guest_name: reviewRequest.guestName,
    property_name: reviewRequest.propertyName,
    review_link: reviewRequest.reviewUrl,
    discount_code: 'HVALA10',
    discount_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    instagram_link: 'https://instagram.com',
    facebook_link: 'https://facebook.com'
  };

  const { subject, body } = renderEmailTemplate('post_stay', variables);

  return { subject, body };
}

/**
 * Generate review request SMS
 *
 * @param reviewRequest - Review request data
 * @returns SMS body
 */
export function generateReviewRequestSMS(reviewRequest: ReviewRequest): {
  body: string;
  characterCount: number;
  segmentCount: number;
} {
  const variables: Record<string, string> = {
    guest_name: reviewRequest.guestName,
    property_name: reviewRequest.propertyName,
    review_link: reviewRequest.reviewUrl
  };

  return renderSMSTemplate('sms_review_request', variables);
}

/**
 * Calculate when to send review request
 *
 * @param checkOutDate - Guest checkout date
 * @param delayDays - Number of days after checkout to send request
 * @returns Date when review request should be sent
 */
export function calculateReviewRequestDate(
  checkOutDate: Date,
  delayDays: number = 1
): Date {
  const sendDate = new Date(checkOutDate);
  sendDate.setDate(sendDate.getDate() + delayDays);
  // Send at 10 AM local time
  sendDate.setHours(10, 0, 0, 0);
  return sendDate;
}

/**
 * Validate if review request can be sent
 *
 * @param reviewRequest - Review request to validate
 * @returns Validation result
 */
export function validateReviewRequest(reviewRequest: ReviewRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!reviewRequest.guestEmail && !reviewRequest.guestPhone) {
    errors.push('Guest must have email or phone number');
  }

  if (!reviewRequest.reviewUrl) {
    errors.push('Review URL is required');
  }

  if (reviewRequest.status !== 'pending') {
    errors.push('Review request must be in pending status');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Parse Google Review response (webhook handler)
 *
 * @param payload - Webhook payload from Google
 * @returns Parsed review response
 */
export function parseGoogleReviewWebhook(payload: any): ReviewResponse | null {
  try {
    // Google Business Profile API webhook format
    const { reviewId, rating, text, author, publishTime, languageCode } = payload;

    if (!reviewId || !rating) {
      return null;
    }

    return {
      reviewId,
      rating,
      text: text || '',
      authorName: author?.displayName || 'Anonymous',
      authorEmail: author?.email || undefined,
      publishedAt: new Date(publishTime),
      language: languageCode || 'sl'
    };
  } catch (error) {
    logger.error('Error parsing Google review webhook:', error);
    return null;
  }
}

/**
 * Get review statistics
 *
 * @param reviews - Array of review responses
 * @returns Review statistics
 */
export function getReviewStats(reviews: ReviewResponse[]): {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  recentTrend: 'positive' | 'neutral' | 'negative';
} {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentTrend: 'neutral'
    };
  }

  const totalReviews = reviews.length;
  const sumRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = Math.round((sumRating / totalReviews) * 10) / 10;

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
  });

  // Calculate recent trend (last 10 reviews)
  const recentReviews = reviews.slice(-10);
  const recentAverage = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
  
  let recentTrend: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (recentAverage >= 4.5) {
    recentTrend = 'positive';
  } else if (recentAverage < 3.5) {
    recentTrend = 'negative';
  }

  return {
    totalReviews,
    averageRating,
    ratingDistribution,
    recentTrend
  };
}

/**
 * Export for server-side usage
 */
export default {
  generateGoogleReviewUrl,
  createReviewRequest,
  generateReviewRequestEmail,
  generateReviewRequestSMS,
  calculateReviewRequestDate,
  validateReviewRequest,
  parseGoogleReviewWebhook,
  getReviewStats
};
