/**
 * React Hook for Guest Experience Management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  GuestProfile,
  GuestPreferences,
  LoyaltyInfo,
  CommunicationHistory,
  StayHistory,
  GuestFeedback,
  PersonalizedRecommendation,
  GuestTag,
  GuestExperienceEngine,
  RecommendationContext,
  GuestSearchCriteria,
  GuestInsights,
  GuestSegment,
  SegmentationCriteria,
  SentimentAnalysis,
  LoyaltyTier,
} from '@/types/guest-experience';
import { GuestExperienceEngineImpl } from '@/lib/guest-experience/GuestExperienceEngine';
import { toast } from 'sonner';

interface UseGuestExperienceOptions {
  guestId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

interface UseGuestExperienceReturn {
  // State
  profile: GuestProfile | null;
  preferences: GuestPreferences | null;
  loyaltyInfo: LoyaltyInfo | null;
  recommendations: PersonalizedRecommendation[];
  communicationHistory: CommunicationHistory[];
  stayHistory: StayHistory[];
  feedback: GuestFeedback[];
  tags: GuestTag[];
  insights: GuestInsights | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadProfile: (guestId: string) => Promise<void>;
  updateProfile: (updates: Partial<GuestProfile>) => Promise<void>;
  updatePreferences: (preferences: Partial<GuestPreferences>) => Promise<void>;
  addLoyaltyPoints: (points: number, reason: string) => Promise<void>;
  generateRecommendations: (context?: RecommendationContext) => Promise<void>;
  sendCommunication: (communication: Omit<CommunicationHistory, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  recordFeedback: (feedback: Omit<GuestFeedback, 'id' | 'submittedAt' | 'sentiment'>) => Promise<void>;
  addTag: (tag: Omit<GuestTag, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>) => Promise<void>;
  removeTag: (tagId: string) => Promise<void>;
  searchGuests: (criteria: GuestSearchCriteria) => Promise<GuestProfile[]>;
  getInsights: () => Promise<void>;
  analyzeSentiment: (text: string) => Promise<SentimentAnalysis>;
  
  // Utility functions
  formatLoyaltyPoints: (points: number) => string;
  getLoyaltyTierColor: (tier: LoyaltyTier) => string;
  getLoyaltyTierBenefits: (tier: LoyaltyTier) => string[];
  calculateStayValue: (stay: StayHistory) => number;
  getGuestLifetimeValue: (profile: GuestProfile) => number;
  predictNextBooking: (profile: GuestProfile) => Date | null;
}

export function useGuestExperience({ 
  guestId, 
  autoRefresh = false, 
  refreshInterval = 5 
}: UseGuestExperienceOptions = {}): UseGuestExperienceReturn {
  const [profile, setProfile] = useState<GuestProfile | null>(null);
  const [preferences, setPreferences] = useState<GuestPreferences | null>(null);
  const [loyaltyInfo, setLoyaltyInfo] = useState<LoyaltyInfo | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [communicationHistory, setCommunicationHistory] = useState<CommunicationHistory[]>([]);
  const [stayHistory, setStayHistory] = useState<StayHistory[]>([]);
  const [feedback, setFeedback] = useState<GuestFeedback[]>([]);
  const [tags, setTags] = useState<GuestTag[]>([]);
  const [insights, setInsights] = useState<GuestInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestExperienceEngine, setGuestExperienceEngine] = useState<GuestExperienceEngine | null>(null);

  // Initialize guest experience engine
  useEffect(() => {
    const engine = new GuestExperienceEngineImpl();
    setGuestExperienceEngine(engine);
  }, []);

  // Load guest profile when guestId changes
  useEffect(() => {
    if (guestId && guestExperienceEngine) {
      loadProfile(guestId);
    }
  }, [guestId, guestExperienceEngine]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !guestId || !guestExperienceEngine) return;

    const interval = setInterval(() => {
      loadProfile(guestId);
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, guestId, guestExperienceEngine]);

  // Load guest profile
  const loadProfile = useCallback(async (id: string) => {
    if (!guestExperienceEngine) return;

    setIsLoading(true);
    setError(null);

    try {
      const guestProfile = await guestExperienceEngine.getProfile(id);
      setProfile(guestProfile);
      setPreferences(guestProfile.preferences);
      setLoyaltyInfo(guestProfile.loyaltyInfo);
      setCommunicationHistory(guestProfile.communicationHistory);
      setStayHistory(guestProfile.stayHistory);
      setFeedback(guestProfile.feedback);
      setTags(guestProfile.tags);
      
      // Generate recommendations
      const guestRecommendations = await guestExperienceEngine.getRecommendations(id);
      setRecommendations(guestRecommendations);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load guest profile';
      setError(errorMessage);
      toast.error('Failed to load guest profile');
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine]);

  // Update guest profile
  const updateProfile = useCallback(async (updates: Partial<GuestProfile>) => {
    if (!guestExperienceEngine || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedProfile = await guestExperienceEngine.updateProfile(profile.id, updates);
      setProfile(updatedProfile);
      
      // Update related state
      if (updates.preferences) {
        setPreferences(updatedProfile.preferences);
      }
      if (updates.loyaltyInfo) {
        setLoyaltyInfo(updatedProfile.loyaltyInfo);
      }
      if (updates.communicationHistory) {
        setCommunicationHistory(updatedProfile.communicationHistory);
      }
      if (updates.stayHistory) {
        setStayHistory(updatedProfile.stayHistory);
      }
      if (updates.feedback) {
        setFeedback(updatedProfile.feedback);
      }
      if (updates.tags) {
        setTags(updatedProfile.tags);
      }
      
      toast.success('Guest profile updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update guest profile';
      setError(errorMessage);
      toast.error('Failed to update guest profile');
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine, profile]);

  // Update guest preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<GuestPreferences>) => {
    if (!guestExperienceEngine || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      await guestExperienceEngine.updatePreferences(profile.id, newPreferences);
      
      // Update local state
      if (preferences) {
        const updatedPreferences = { ...preferences, ...newPreferences };
        setPreferences(updatedPreferences);
        setProfile(prev => prev ? { ...prev, preferences: updatedPreferences } : null);
      }
      
      toast.success('Preferences updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      toast.error('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine, profile, preferences]);

  // Add loyalty points
  const addLoyaltyPoints = useCallback(async (points: number, reason: string) => {
    if (!guestExperienceEngine || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      await guestExperienceEngine.updateLoyaltyPoints(profile.id, points, reason);
      
      // Reload profile to get updated loyalty info
      await loadProfile(profile.id);
      
      toast.success(`${points > 0 ? 'Added' : 'Deducted'} ${Math.abs(points)} loyalty points`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update loyalty points';
      setError(errorMessage);
      toast.error('Failed to update loyalty points');
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine, profile, loadProfile]);

  // Generate recommendations
  const generateRecommendations = useCallback(async (context?: RecommendationContext) => {
    if (!guestExperienceEngine || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      const guestRecommendations = await guestExperienceEngine.generateRecommendations(profile.id, context);
      setRecommendations(guestRecommendations);
      
      toast.success(`Generated ${guestRecommendations.length} personalized recommendations`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate recommendations';
      setError(errorMessage);
      toast.error('Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine, profile]);

  // Send communication
  const sendCommunication = useCallback(async (
    communication: Omit<CommunicationHistory, 'id' | 'timestamp' | 'status'>
  ) => {
    if (!guestExperienceEngine || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      const sentCommunication = await guestExperienceEngine.sendCommunication(profile.id, communication);
      
      // Update local state
      setCommunicationHistory(prev => [sentCommunication, ...prev]);
      
      toast.success('Communication sent successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send communication';
      setError(errorMessage);
      toast.error('Failed to send communication');
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine, profile]);

  // Record feedback
  const recordFeedback = useCallback(async (
    feedbackData: Omit<GuestFeedback, 'id' | 'submittedAt' | 'sentiment'>
  ) => {
    if (!guestExperienceEngine || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      const recordedFeedback = await guestExperienceEngine.recordFeedback(profile.id, feedbackData);
      
      // Update local state
      setFeedback(prev => [recordedFeedback, ...prev]);
      
      toast.success('Feedback recorded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record feedback';
      setError(errorMessage);
      toast.error('Failed to record feedback');
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine, profile]);

  // Add tag
  const addTag = useCallback(async (
    tagData: Omit<GuestTag, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>
  ) => {
    if (!guestExperienceEngine || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      const newTag = await guestExperienceEngine.addTag(profile.id, tagData);
      
      // Update local state
      setTags(prev => [...prev, newTag]);
      
      toast.success(`Tag "${tagData.name}" added successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add tag';
      setError(errorMessage);
      toast.error('Failed to add tag');
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine, profile]);

  // Remove tag
  const removeTag = useCallback(async (tagId: string) => {
    if (!guestExperienceEngine || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      await guestExperienceEngine.removeTag(profile.id, tagId);
      
      // Update local state
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      
      toast.success('Tag removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove tag';
      setError(errorMessage);
      toast.error('Failed to remove tag');
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine, profile]);

  // Search guests
  const searchGuests = useCallback(async (criteria: GuestSearchCriteria) => {
    if (!guestExperienceEngine) return [];

    setIsLoading(true);
    setError(null);

    try {
      const results = await guestExperienceEngine.searchGuests(criteria);
      
      toast.success(`Found ${results.length} guests matching criteria`);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search guests';
      setError(errorMessage);
      toast.error('Failed to search guests');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine]);

  // Get guest insights
  const getInsights = useCallback(async () => {
    if (!guestExperienceEngine || !profile) return;

    setIsLoading(true);
    setError(null);

    try {
      const guestInsights = await guestExperienceEngine.getGuestInsights(profile.id);
      setInsights(guestInsights);
      
      toast.success('Guest insights generated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate insights';
      setError(errorMessage);
      toast.error('Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  }, [guestExperienceEngine, profile]);

  // Analyze sentiment
  const analyzeSentiment = useCallback(async (text: string): Promise<SentimentAnalysis> => {
    if (!guestExperienceEngine) {
      throw new Error('Guest experience engine not initialized');
    }

    try {
      const analysis = await guestExperienceEngine.analyzeFeedback(text);
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze sentiment';
      setError(errorMessage);
      toast.error('Failed to analyze sentiment');
      throw err;
    }
  }, [guestExperienceEngine]);

  // Utility functions
  const formatLoyaltyPoints = useCallback((points: number): string => {
    return points.toLocaleString();
  }, []);

  const getLoyaltyTierColor = useCallback((tier: LoyaltyTier): string => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF',
    };
    return colors[tier] || '#666666';
  }, []);

  const getLoyaltyTierBenefits = useCallback((tier: LoyaltyTier): string[] => {
    const benefits = {
      bronze: ['Priority check-in', 'Room upgrade when available'],
      silver: ['Bronze benefits', 'Late check-out', 'Welcome drink'],
      gold: ['Silver benefits', 'Free breakfast', 'Spa discount'],
      platinum: ['Gold benefits', 'Free airport transfer', 'Executive lounge access'],
      diamond: ['Platinum benefits', 'Personal concierge', 'Complimentary suite upgrade'],
    };
    return benefits[tier] || [];
  }, []);

  const calculateStayValue = useCallback((stay: StayHistory): number => {
    return stay.totalAmount + (stay.services?.reduce((sum, service) => sum + service.totalPrice, 0) || 0);
  }, []);

  const getGuestLifetimeValue = useCallback((guestProfile: GuestProfile): number => {
    return guestProfile.stayHistory.reduce((total, stay) => total + calculateStayValue(stay), 0);
  }, [calculateStayValue]);

  const predictNextBooking = useCallback((guestProfile: GuestProfile): Date | null => {
    if (guestProfile.stayHistory.length < 2) return null;

    const sortedStays = guestProfile.stayHistory.sort((a, b) => 
      a.checkInDate.getTime() - b.checkInDate.getTime()
    );

    const intervals = [];
    for (let i = 1; i < sortedStays.length; i++) {
      const interval = sortedStays[i].checkInDate.getTime() - sortedStays[i-1].checkOutDate.getTime();
      intervals.push(interval);
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const lastStay = sortedStays[sortedStays.length - 1];
    
    return new Date(lastStay.checkOutDate.getTime() + averageInterval);
  }, []);

  return {
    // State
    profile,
    preferences,
    loyaltyInfo,
    recommendations,
    communicationHistory,
    stayHistory,
    feedback,
    tags,
    insights,
    isLoading,
    error,
    
    // Actions
    loadProfile,
    updateProfile,
    updatePreferences,
    addLoyaltyPoints,
    generateRecommendations,
    sendCommunication,
    recordFeedback,
    addTag,
    removeTag,
    searchGuests,
    getInsights,
    analyzeSentiment,
    
    // Utility functions
    formatLoyaltyPoints,
    getLoyaltyTierColor,
    getLoyaltyTierBenefits,
    calculateStayValue,
    getGuestLifetimeValue,
    predictNextBooking,
  };
}
