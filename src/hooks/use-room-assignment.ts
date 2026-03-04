/**
 * React Hook for Room Assignment
 */

import { useState, useCallback, useEffect } from 'react';
import {
  GuestRequirements,
  GuestPreferences,
  Room,
  AssignmentCriteria,
  AssignmentWeightings,
  AssignmentConstraints,
  AssignmentResult,
  AssignmentConfig,
} from '@/types/room-assignment';
import { RoomAssignmentEngine } from '@/lib/room-assignment/RoomAssignmentEngine';
import { toast } from 'sonner';

interface UseRoomAssignmentOptions {
  propertyId: string;
  config?: Partial<AssignmentConfig>;
}

interface UseRoomAssignmentReturn {
  // State
  isAssigning: boolean;
  assignmentResult: AssignmentResult | null;
  error: string | null;
  
  // Actions
  assignRoom: (guest: GuestRequirements, checkIn: Date, checkOut: Date, availableRooms: Room[]) => Promise<AssignmentResult>;
  updateAssignment: (roomId: string, guest: GuestRequirements, checkIn: Date, checkOut: Date) => Promise<AssignmentResult>;
  clearAssignment: () => void;
  
  // Configuration
  updateConfig: (config: Partial<AssignmentConfig>) => void;
  getAssignmentHistory: (guestId: string) => Promise<any[]>;
}

const defaultConfig: AssignmentConfig = {
  algorithm: 'hybrid',
  learningEnabled: true,
  updateFrequency: 'daily',
  minConfidenceThreshold: 0.7,
  maxAlternatives: 3,
  enableRevenueOptimization: true,
  enableGuestLoyaltyBoost: true,
  enableOperationalEfficiency: true,
};

export function useRoomAssignment({ propertyId, config = {} }: UseRoomAssignmentOptions): UseRoomAssignmentReturn {
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assignmentEngine, setAssignmentEngine] = useState<RoomAssignmentEngine | null>(null);
  const [currentConfig, setCurrentConfig] = useState<AssignmentConfig>({ ...defaultConfig, ...config });

  // Initialize assignment engine
  useEffect(() => {
    if (propertyId) {
      const engine = new RoomAssignmentEngine(currentConfig);
      setAssignmentEngine(engine);
    }
  }, [propertyId, currentConfig]);

  // Default weightings
  const defaultWeightings: AssignmentWeightings = {
    guestPreferences: 0.3,
    roomAvailability: 0.25,
    revenueOptimization: 0.2,
    guestLoyalty: 0.15,
    operationalEfficiency: 0.1,
    roomRotation: 0.05,
  };

  // Default constraints
  const getDefaultConstraints = (guest: GuestRequirements): AssignmentConstraints => ({
    minimumRoomType: 'standard',
    maximumRoomType: 'presidential',
    excludeRooms: [],
    requireAccessibility: guest.preferences.accessibility,
    requirePetFriendly: guest.preferences.petFriendly,
    requireSmoking: guest.preferences.smoking === 'allowed' ? true : guest.preferences.smoking === 'not-allowed' ? false : undefined,
    minimumFloor: '',
    maximumFloor: '',
    avoidRecentStays: true,
    avoidMaintenanceRooms: true,
  });

  const assignRoom = useCallback(async (
    guest: GuestRequirements,
    checkIn: Date,
    checkOut: Date,
    availableRooms: Room[]
  ): Promise<AssignmentResult> => {
    if (!assignmentEngine) {
      throw new Error('Assignment engine not initialized');
    }

    setIsAssigning(true);
    setError(null);

    try {
      const criteria: AssignmentCriteria = {
        checkIn,
        checkOut,
        numberOfNights: Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
        guestRequirements: guest,
        availableRooms,
        weightings: defaultWeightings,
        constraints: getDefaultConstraints(guest),
      };

      const result = await assignmentEngine.assignRoom(criteria);
      setAssignmentResult(result);
      
      toast.success(`Room ${result.recommendedRoom.roomId} assigned successfully`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign room';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsAssigning(false);
    }
  }, [assignmentEngine, defaultWeightings]);

  const updateAssignment = useCallback(async (
    roomId: string,
    guest: GuestRequirements,
    checkIn: Date,
    checkOut: Date
  ): Promise<AssignmentResult> => {
    // This would fetch available rooms and reassign
    // For now, we'll simulate with the current assignment result
    if (!assignmentEngine) {
      throw new Error('Assignment engine not initialized');
    }

    setIsAssigning(true);
    setError(null);

    try {
      // In a real implementation, this would fetch available rooms for the new dates
      // For now, we'll use the existing available rooms
      const availableRooms = assignmentResult ? 
        assignmentResult.alternatives.map(alt => ({
          id: alt.roomId,
          name: `Room ${alt.roomId}`,
          type: 'standard',
          capacity: 2,
          maxAdults: 2,
          maxChildren: 1,
          maxInfants: 0,
          floor: '1',
          view: 'city',
          amenities: [],
          location: 'central',
          smoking: false,
          petFriendly: false,
          accessibility: false,
          basePrice: 100,
          currentPrice: 100,
          status: 'available' as const,
          lastCleaned: new Date(),
          nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          housekeepingNotes: [],
          maintenanceNotes: [],
          guestHistory: [],
        })) : [];

      const criteria: AssignmentCriteria = {
        checkIn,
        checkOut,
        numberOfNights: Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
        guestRequirements: guest,
        availableRooms,
        weightings: defaultWeightings,
        constraints: {
          ...getDefaultConstraints(guest),
          excludeRooms: [roomId], // Exclude current room
        },
      };

      const result = await assignmentEngine.assignRoom(criteria);
      setAssignmentResult(result);
      
      toast.success(`Room assignment updated to ${result.recommendedRoom.roomId}`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update assignment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsAssigning(false);
    }
  }, [assignmentEngine, assignmentResult, defaultWeightings]);

  const clearAssignment = useCallback(() => {
    setAssignmentResult(null);
    setError(null);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<AssignmentConfig>) => {
    const updatedConfig = { ...currentConfig, ...newConfig };
    setCurrentConfig(updatedConfig);
    
    // Reinitialize engine with new config
    if (propertyId) {
      const engine = new RoomAssignmentEngine(updatedConfig);
      setAssignmentEngine(engine);
    }
  }, [currentConfig, propertyId]);

  const getAssignmentHistory = useCallback(async (guestId: string): Promise<any[]> => {
    if (!assignmentEngine) {
      return [];
    }
    
    try {
      return await assignmentEngine.getAssignmentHistory(guestId);
    } catch (err) {
      console.error('Failed to get assignment history:', err);
      return [];
    }
  }, [assignmentEngine]);

  return {
    // State
    isAssigning,
    assignmentResult,
    error,
    
    // Actions
    assignRoom,
    updateAssignment,
    clearAssignment,
    
    // Configuration
    updateConfig,
    getAssignmentHistory,
  };
}

// Helper functions for creating guest requirements
export function createGuestRequirements(data: Partial<GuestRequirements>): GuestRequirements {
  return {
    id: data.id || '',
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    adults: data.adults || 1,
    children: data.children || 0,
    infants: data.infants || 0,
    preferences: data.preferences || createGuestPreferences(),
    specialRequests: data.specialRequests || [],
    loyaltyStatus: data.loyaltyStatus || 'none',
    previousStays: data.previousStays || 0,
    totalRevenue: data.totalRevenue || 0,
    averageRating: data.averageRating || 0,
  };
}

export function createGuestPreferences(data: Partial<GuestPreferences> = {}): GuestPreferences {
  return {
    roomType: data.roomType || [],
    floor: data.floor || [],
    view: data.view || [],
    amenities: data.amenities || [],
    location: data.location || 'no-preference',
    smoking: data.smoking || 'no-preference',
    petFriendly: data.petFriendly || false,
    accessibility: data.accessibility || false,
  };
}

// Hook for quick room assignment
export function useQuickRoomAssignment(propertyId: string) {
  const { assignRoom, isAssigning, assignmentResult, error } = useRoomAssignment({ propertyId });

  const quickAssign = useCallback(async (
    guestName: string,
    guestEmail: string,
    guestPhone: string,
    adults: number,
    children: number,
    checkIn: Date,
    checkOut: Date,
    availableRooms: Room[]
  ) => {
    const guest = createGuestRequirements({
      name: guestName,
      email: guestEmail,
      phone: guestPhone,
      adults,
      children,
      preferences: createGuestPreferences(),
    });

    return await assignRoom(guest, checkIn, checkOut, availableRooms);
  }, [assignRoom]);

  return {
    quickAssign,
    isAssigning,
    assignmentResult,
    error,
  };
}
