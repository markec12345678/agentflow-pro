/**
 * Guest Experience Types and Interfaces
 */

export interface GuestProfile {
  id: string;
  personalInfo: PersonalInfo;
  preferences: GuestPreferences;
  loyaltyInfo: LoyaltyInfo;
  communicationHistory: CommunicationHistory[];
  stayHistory: StayHistory[];
  feedback: GuestFeedback[];
  recommendations: PersonalizedRecommendation[];
  tags: GuestTag[];
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  nationality: string;
  language: string;
  currency: string;
  timezone: string;
  passportNumber?: string;
  visaInfo?: VisaInfo;
  emergencyContact: EmergencyContact;
  companyInfo?: CompanyInfo;
  dietaryRestrictions: DietaryRestriction[];
  accessibilityNeeds: AccessibilityNeed[];
  specialRequests: string[];
}

export interface GuestPreferences {
  roomPreferences: RoomPreferences;
  diningPreferences: DiningPreferences;
  servicePreferences: ServicePreferences;
  communicationPreferences: CommunicationPreferences;
  activityPreferences: ActivityPreferences;
  privacySettings: PrivacySettings;
  notificationSettings: NotificationSettings;
}

export interface RoomPreferences {
  roomType: string[];
  floor: string[];
  view: string[];
  bedType: string[];
  smoking: 'prefer-smoking' | 'prefer-non-smoking' | 'no-preference';
  petFriendly: boolean;
  accessibility: boolean;
  quietRoom: boolean;
  awayFromElevator: boolean;
  nearElevator: boolean;
  highFloor: boolean;
  lowFloor: boolean;
  temperature: 'warm' | 'cool' | 'neutral';
  lighting: 'bright' | 'dim' | 'natural';
}

export interface DiningPreferences {
  mealTimes: MealTime[];
  cuisineTypes: string[];
  dietaryRestrictions: DietaryRestriction[];
  allergies: Allergy[];
  preferredRestaurants: string[];
  roomService: boolean;
  minibar: boolean;
  specialDietaryNeeds: string[];
}

export interface ServicePreferences {
  housekeepingFrequency: 'daily' | 'every-other-day' | 'on-request' | 'no-service';
  turndownService: boolean;
  newspaperDelivery: boolean;
  conciergeServices: string[];
  spaServices: boolean;
  fitnessCenter: boolean;
  businessServices: boolean;
  transportation: TransportationPreference;
  checkInProcess: 'express' | 'standard' | 'vip';
  checkOutProcess: 'express' | 'standard' | 'late-checkout';
}

export interface CommunicationPreferences {
  preferredLanguage: string;
  communicationChannel: 'email' | 'sms' | 'phone' | 'app' | 'whatsapp';
  marketingConsent: boolean;
  promotionalOffers: boolean;
  transactionalEmails: boolean;
  smsAlerts: boolean;
  pushNotifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

export interface ActivityPreferences {
  interests: string[];
  fitnessActivities: string[];
  entertainment: string[];
  culturalActivities: string[];
  outdoorActivities: string[];
  shoppingPreferences: string[];
  nightlife: string[];
  familyActivities: string[];
  businessServices: string[];
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends-only';
  dataSharing: {
    marketing: boolean;
    analytics: boolean;
    partners: boolean;
    research: boolean;
  };
  communicationTracking: boolean;
  locationTracking: boolean;
  biometricData: boolean;
  paymentDataRetention: boolean;
}

export interface NotificationSettings {
  checkInReminder: boolean;
  checkOutReminder: boolean;
  specialOffers: boolean;
  eventNotifications: boolean;
  serviceUpdates: boolean;
  weatherAlerts: boolean;
  localAttractions: boolean;
  loyaltyUpdates: boolean;
  paymentReminders: boolean;
  feedbackRequests: boolean;
}

export interface LoyaltyInfo {
  tier: LoyaltyTier;
  points: number;
  pointsExpiry: Date;
  benefits: LoyaltyBenefit[];
  rewards: Reward[];
  achievements: Achievement[];
  progress: LoyaltyProgress;
  membershipSince: Date;
  lastActivity: Date;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface LoyaltyBenefit {
  id: string;
  name: string;
  description: string;
  category: 'room-upgrade' | 'discount' | 'service' | 'experience' | 'exclusive';
  value: number;
  unit: 'percentage' | 'points' | 'currency' | 'free';
  validUntil?: Date;
  usageLimit?: number;
  usedCount: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: 'room' | 'dining' | 'spa' | 'activity' | 'merchandise' | 'partner';
  pointsCost: number;
  value: number;
  availability: 'always' | 'seasonal' | 'limited';
  validUntil?: Date;
  redemptionCount: number;
  maxRedemptions?: number;
  image?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'stays' | 'spending' | 'activities' | 'referrals' | 'milestones';
  icon: string;
  pointsAwarded: number;
  unlockedAt: Date;
  progress?: number;
  maxProgress?: number;
}

export interface LoyaltyProgress {
  currentTierPoints: number;
  nextTierPoints: number;
  nextTier: LoyaltyTier;
  pointsToNextTier: number;
  tierProgressPercentage: number;
  yearlyStays: number;
  yearlySpending: number;
  referrals: number;
}

export interface CommunicationHistory {
  id: string;
  type: CommunicationType;
  channel: CommunicationChannel;
  direction: 'inbound' | 'outbound';
  subject: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments: Attachment[];
  metadata: Record<string, unknown>;
}

export type CommunicationType = 
  | 'booking-confirmation'
  | 'check-in-reminder'
  | 'check-out-reminder'
  | 'special-offer'
  | 'marketing'
  | 'service-request'
  | 'feedback-request'
  | 'loyalty-update'
  | 'emergency'
  | 'general-inquiry';

export type CommunicationChannel = 'email' | 'sms' | 'phone' | 'app' | 'whatsapp' | 'in-person';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface StayHistory {
  id: string;
  propertyId: string;
  roomNumber: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number;
  roomType: string;
  rate: number;
  totalAmount: number;
  paymentMethod: string;
  bookingChannel: string;
  purpose: string;
  guests: number;
  services: ServiceUsage[];
  feedback?: StayFeedback;
  issues: StayIssue[];
  createdAt: Date;
}

export interface ServiceUsage {
  serviceId: string;
  serviceName: string;
  category: 'dining' | 'spa' | 'transportation' | 'entertainment' | 'business' | 'other';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  timestamp: Date;
  staffMember?: string;
}

export interface StayFeedback {
  overallRating: number;
  roomRating: number;
  serviceRating: number;
  locationRating: number;
  valueRating: number;
  cleanlinessRating: number;
  amenitiesRating: number;
  comments: string;
  wouldRecommend: boolean;
  wouldReturn: boolean;
  submittedAt: Date;
  respondedAt?: Date;
  response?: string;
}

export interface StayIssue {
  id: string;
  category: 'maintenance' | 'service' | 'cleanliness' | 'noise' | 'safety' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  compensation?: Compensation;
  staffMember?: string;
}

export interface Compensation {
  type: 'discount' | 'refund' | 'upgrade' | 'service' | 'points';
  value: number;
  description: string;
  appliedAt?: Date;
}

export interface GuestFeedback {
  id: string;
  stayId?: string;
  type: FeedbackType;
  category: FeedbackCategory;
  rating: number;
  title: string;
  content: string;
  sentiment: SentimentAnalysis;
  tags: string[];
  images: string[];
  submittedAt: Date;
  status: 'pending' | 'reviewed' | 'responded' | 'resolved';
  response?: FeedbackResponse;
  metadata: Record<string, unknown>;
}

export type FeedbackType = 'survey' | 'review' | 'complaint' | 'compliment' | 'suggestion' | 'issue-report';

export type FeedbackCategory = 
  | 'room'
  | 'service'
  | 'dining'
  | 'facilities'
  | 'location'
  | 'cleanliness'
  | 'staff'
  | 'value'
  | 'technology'
  | 'accessibility'
  | 'other';

export interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0 to 1
  emotions: EmotionScore[];
  keywords: string[];
  processedAt: Date;
}

export interface EmotionScore {
  emotion: 'joy' | 'anger' | 'fear' | 'sadness' | 'disgust' | 'surprise';
  score: number;
  confidence: number;
}

export interface FeedbackResponse {
  content: string;
  respondedBy: string;
  respondedAt: Date;
  followUpRequired: boolean;
  followUpDate?: Date;
  internalNotes?: string;
}

export interface PersonalizedRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  reasoning: RecommendationReasoning;
  actionItems: ActionItem[];
  validUntil?: Date;
  accepted?: boolean;
  acceptedAt?: Date;
  createdAt: Date;
}

export type RecommendationType = 
  | 'room-upgrade'
  | 'service-offer'
  | 'dining-recommendation'
  | 'activity-suggestion'
  | 'local-attraction'
  | 'special-offer'
  | 'loyalty-reward'
  | 'personalized-experience';

export type RecommendationCategory = 
  | 'accommodation'
  | 'dining'
  | 'wellness'
  | 'entertainment'
  | 'transportation'
  | 'shopping'
  | 'business'
  | 'local-experience';

export interface RecommendationReasoning {
  primaryFactor: string;
  secondaryFactors: string[];
  dataSource: string;
  algorithm: string;
  confidenceScore: number;
  similarGuests: number;
  successRate: number;
  explanation: string;
}

export interface ActionItem {
  id: string;
  type: 'book' | 'purchase' | 'schedule' | 'request' | 'learn-more';
  title: string;
  description: string;
  url?: string;
  price?: number;
  availability?: string;
  deadline?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface GuestTag {
  id: string;
  name: string;
  category: TagCategory;
  color: string;
  description: string;
  autoGenerated: boolean;
  confidence: number;
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
}

export type TagCategory = 
  | 'preference'
  | 'behavior'
  | 'demographic'
  | 'loyalty'
  | 'feedback'
  | 'service'
  | 'risk'
  | 'opportunity';

export interface GuestExperienceEngine {
  getProfile: (guestId: string) => Promise<GuestProfile>;
  updateProfile: (guestId: string, updates: Partial<GuestProfile>) => Promise<GuestProfile>;
  getPreferences: (guestId: string) => Promise<GuestPreferences>;
  updatePreferences: (guestId: string, preferences: Partial<GuestPreferences>) => Promise<void>;
  getLoyaltyInfo: (guestId: string) => Promise<LoyaltyInfo>;
  updateLoyaltyPoints: (guestId: string, points: number, reason: string) => Promise<void>;
  getRecommendations: (guestId: string, context?: RecommendationContext) => Promise<PersonalizedRecommendation[]>;
  generateRecommendations: (guestId: string) => Promise<PersonalizedRecommendation[]>;
  analyzeFeedback: (feedback: string) => Promise<SentimentAnalysis>;
  recordFeedback: (guestId: string, feedback: Omit<GuestFeedback, 'id' | 'submittedAt' | 'sentiment'>) => Promise<GuestFeedback>;
  getCommunicationHistory: (guestId: string, limit?: number) => Promise<CommunicationHistory[]>;
  sendCommunication: (guestId: string, communication: Omit<CommunicationHistory, 'id' | 'timestamp' | 'status'>) => Promise<CommunicationHistory>;
  getStayHistory: (guestId: string, limit?: number) => Promise<StayHistory[]>;
  addTag: (guestId: string, tag: Omit<GuestTag, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => Promise<GuestTag>;
  removeTag: (guestId: string, tagId: string) => Promise<void>;
  searchGuests: (criteria: GuestSearchCriteria) => Promise<GuestProfile[]>;
  getGuestInsights: (guestId: string) => Promise<GuestInsights>;
  getSegmentation: (criteria: SegmentationCriteria) => Promise<GuestSegment[]>;
}

export interface RecommendationContext {
  currentStay?: {
    checkInDate: Date;
    checkOutDate: Date;
    roomType: string;
    propertyId: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: {
    temperature: number;
    condition: string;
    humidity: number;
  };
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  occasion?: 'business' | 'leisure' | 'family' | 'romantic' | 'celebration';
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  companions?: {
    adults: number;
    children: number;
    infants: number;
    pets: boolean;
  };
}

export interface GuestSearchCriteria {
  query?: string;
  filters?: {
    loyaltyTier?: LoyaltyTier[];
    nationality?: string[];
    language?: string[];
    roomType?: string[];
    bookingChannel?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    spendingRange?: {
      min: number;
      max: number;
    };
    stayCount?: {
      min: number;
      max: number;
    };
    ratingRange?: {
      min: number;
      max: number;
    };
    tags?: string[];
    preferences?: {
      roomType?: string[];
      dining?: string[];
      activities?: string[];
    };
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface GuestInsights {
  profile: GuestProfile;
  behaviorPatterns: BehaviorPattern[];
  preferences: PreferencePattern[];
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];
  predictions: Prediction[];
  recommendations: PersonalizedRecommendation[];
  lastAnalyzed: Date;
}

export interface BehaviorPattern {
  type: 'booking' | 'spending' | 'communication' | 'activity' | 'feedback';
  pattern: string;
  frequency: number;
  confidence: number;
  description: string;
  examples: string[];
  lastObserved: Date;
}

export interface PreferencePattern {
  category: string;
  preference: string;
  strength: number;
  consistency: number;
  basedOn: string[];
  lastConfirmed: Date;
}

export interface RiskFactor {
  type: 'churn' | 'complaint' | 'payment' | 'no-show' | 'negative-feedback';
  level: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: string;
  mitigation: string;
  detectedAt: Date;
}

export interface Opportunity {
  type: 'upsell' | 'cross-sell' | 'loyalty-upgrade' | 'referral' | 'feedback';
  value: number;
  confidence: number;
  description: string;
  actionRequired: string;
  deadline?: Date;
  identifiedAt: Date;
}

export interface Prediction {
  type: 'next-booking' | 'spending' | 'stay-duration' | 'room-preference' | 'cancellation';
  prediction: unknown;
  confidence: number;
  timeframe: string;
  factors: string[];
  lastUpdated: Date;
}

export interface GuestSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentationCriteria;
  size: number;
  percentage: number;
  characteristics: SegmentCharacteristic[];
  recommendations: string[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface SegmentationCriteria {
  demographics?: {
    ageRange?: { min: number; max: number };
    gender?: string[];
    nationality?: string[];
    language?: string[];
  };
  behavior?: {
    bookingFrequency?: { min: number; max: number };
    spendingRange?: { min: number; max: number };
    stayDuration?: { min: number; max: number };
    preferredRoomTypes?: string[];
    bookingChannels?: string[];
  };
  loyalty?: {
    tiers?: LoyaltyTier[];
    pointsRange?: { min: number; max: number };
    activities?: string[];
  };
  preferences?: {
    roomTypes?: string[];
    dining?: string[];
    activities?: string[];
    services?: string[];
  };
  feedback?: {
    ratingRange?: { min: number; max: number };
    sentiment?: 'positive' | 'negative' | 'neutral';
    categories?: string[];
  };
  custom?: Record<string, unknown>;
}

export interface SegmentCharacteristic {
  name: string;
  value: unknown;
  importance: number;
  description: string;
}

// Helper interfaces
export interface DietaryRestriction {
  type: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface Allergy {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  emergencyMedication?: string;
}

export interface AccessibilityNeed {
  type: string;
  requirement: string;
  equipment?: string;
  assistance?: string;
}

export interface VisaInfo {
  type: string;
  number: string;
  expiryDate: Date;
  issuingCountry: string;
  restrictions?: string[];
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address?: string;
}

export interface CompanyInfo {
  name: string;
  department: string;
  position: string;
  address: string;
  taxId?: string;
  billingContact?: string;
}

export interface MealTime {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  preferredTime: string;
  flexibility: number; // minutes
}

export interface TransportationPreference {
  type: 'airport-transfer' | 'car-rental' | 'taxi' | 'public-transport' | 'private-driver';
  preferences: string[];
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
}
