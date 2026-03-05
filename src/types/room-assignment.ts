/**
 * Room Assignment Types and Interfaces
 */

export interface GuestRequirements {
  id: string;
  name: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  infants: number;
  preferences: GuestPreferences;
  specialRequests: string[];
  loyaltyStatus: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  previousStays: number;
  totalRevenue: number;
  averageRating: number;
}

export interface GuestPreferences {
  roomType: string[];
  floor: string[];
  view: string[];
  amenities: string[];
  location: 'quiet' | 'central' | 'near-elevator' | 'near-entrance';
  smoking: 'allowed' | 'not-allowed' | 'no-preference';
  petFriendly: boolean;
  accessibility: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  maxAdults: number;
  maxChildren: number;
  maxInfants: number;
  floor: string;
  view: string;
  amenities: string[];
  location: string;
  smoking: boolean;
  petFriendly: boolean;
  accessibility: boolean;
  basePrice: number;
  currentPrice: number;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out_of_order';
  lastCleaned: Date;
  nextMaintenance: Date;
  housekeepingNotes: string[];
  maintenanceNotes: string[];
  guestHistory: GuestHistory[];
}

export interface GuestHistory {
  guestId: string;
  stayCount: number;
  lastStay: Date;
  preferredRoom: string;
  averageRating: number;
  totalRevenue: number;
  notes: string[];
}

export interface AssignmentCriteria {
  checkIn: Date;
  checkOut: Date;
  numberOfNights: number;
  guestRequirements: GuestRequirements;
  availableRooms: Room[];
  weightings: AssignmentWeightings;
  constraints: AssignmentConstraints;
}

export interface AssignmentWeightings {
  guestPreferences: number; // 0-1
  roomAvailability: number; // 0-1
  revenueOptimization: number; // 0-1
  guestLoyalty: number; // 0-1
  operationalEfficiency: number; // 0-1
  roomRotation: number; // 0-1
}

export interface AssignmentConstraints {
  minimumRoomType: string;
  maximumRoomType: string;
  excludeRooms: string[];
  requireAccessibility: boolean;
  requirePetFriendly: boolean;
  requireSmoking: boolean;
  minimumFloor: string;
  maximumFloor: string;
  avoidRecentStays: boolean;
  avoidMaintenanceRooms: boolean;
}

export interface RoomScore {
  roomId: string;
  score: number;
  breakdown: ScoreBreakdown;
  confidence: number;
  reasons: string[];
  warnings: string[];
}

export interface ScoreBreakdown {
  preferenceMatch: number;
  availabilityScore: number;
  revenueScore: number;
  loyaltyScore: number;
  operationalScore: number;
  rotationScore: number;
  penaltyScore: number;
}

export interface AssignmentResult {
  recommendedRoom: RoomScore;
  alternatives: RoomScore[];
  rejectedRooms: RoomScore[];
  assignmentReason: string;
  confidence: number;
  estimatedRevenue: number;
  operationalImpact: OperationalImpact;
}

export interface OperationalImpact {
  housekeepingLoad: number;
  maintenanceSchedule: boolean;
  staffAllocation: number;
  guestSatisfaction: number;
  revenueImpact: number;
}

export interface AssignmentHistory {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  assignedAt: Date;
  assignedBy: string;
  algorithm: string;
  score: number;
  actualOutcome: 'successful' | 'changed' | 'cancelled';
  guestRating?: number;
  guestFeedback?: string;
}

export interface LearningData {
  guestPreferences: GuestPreferences;
  roomCharacteristics: Room;
  outcome: {
    guestRating: number;
    guestFeedback: string;
    revenue: number;
    operationalCost: number;
  };
  seasonality: string;
  dayOfWeek: string;
  occupancyRate: number;
}

export interface AssignmentConfig {
  algorithm: 'rule-based' | 'ml-based' | 'hybrid';
  learningEnabled: boolean;
  updateFrequency: 'daily' | 'weekly' | 'monthly';
  minConfidenceThreshold: number;
  maxAlternatives: number;
  enableRevenueOptimization: boolean;
  enableGuestLoyaltyBoost: boolean;
  enableOperationalEfficiency: boolean;
}

export interface RoomAssignmentEngine {
  assignRoom: (criteria: AssignmentCriteria) => Promise<AssignmentResult>;
  updateLearning: (data: LearningData) => Promise<void>;
  getAssignmentHistory: (guestId: string) => Promise<AssignmentHistory[]>;
  optimizePricing: (roomId: string, demand: number) => Promise<number>;
  predictOccupancy: (roomId: string, dateRange: Date[]) => Promise<number>;
}

export interface AssignmentMetrics {
  accuracy: number;
  guestSatisfaction: number;
  revenueOptimization: number;
  operationalEfficiency: number;
  assignmentSpeed: number;
  learningAccuracy: number;
}
