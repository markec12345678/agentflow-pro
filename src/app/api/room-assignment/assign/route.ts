/**
 * API Route for Room Assignment
 * Handles automatic room assignment requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { RoomAssignmentEngine } from '@/lib/room-assignment/RoomAssignmentEngine';
import { AssignmentConfig, AssignmentCriteria } from '@/types/room-assignment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      guestData,
      checkIn,
      checkOut,
      availableRooms,
      preferences,
      constraints,
      weightings,
    } = body;

    // Validate required fields
    if (!guestData || !checkIn || !checkOut || !availableRooms) {
      return NextResponse.json(
        { error: 'Missing required fields: guestData, checkIn, checkOut, availableRooms' },
        { status: 400 }
      );
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    if (checkInDate < new Date()) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      );
    }

    // Validate guest data
    if (!guestData.name || !guestData.email || !guestData.phone) {
      return NextResponse.json(
        { error: 'Guest name, email, and phone are required' },
        { status: 400 }
      );
    }

    // Validate available rooms
    if (!Array.isArray(availableRooms) || availableRooms.length === 0) {
      return NextResponse.json(
        { error: 'At least one available room is required' },
        { status: 400 }
      );
    }

    // Initialize assignment engine
    const config: AssignmentConfig = {
      algorithm: 'hybrid',
      learningEnabled: true,
      updateFrequency: 'daily',
      minConfidenceThreshold: 0.7,
      maxAlternatives: 3,
      enableRevenueOptimization: true,
      enableGuestLoyaltyBoost: true,
      enableOperationalEfficiency: true,
    };

    const engine = new RoomAssignmentEngine(config);

    // Prepare assignment criteria
    const criteria: AssignmentCriteria = {
      checkIn: checkInDate,
      checkOut: checkOutDate,
      numberOfNights: Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
      guestRequirements: {
        id: guestData.id || `guest-${Date.now()}`,
        name: guestData.name,
        email: guestData.email,
        phone: guestData.phone,
        adults: guestData.adults || 1,
        children: guestData.children || 0,
        infants: guestData.infants || 0,
        preferences: preferences || {
          roomType: [],
          floor: [],
          view: [],
          amenities: [],
          location: 'no-preference',
          smoking: 'no-preference',
          petFriendly: false,
          accessibility: false,
        },
        specialRequests: guestData.specialRequests || [],
        loyaltyStatus: guestData.loyaltyStatus || 'none',
        previousStays: guestData.previousStays || 0,
        totalRevenue: guestData.totalRevenue || 0,
        averageRating: guestData.averageRating || 0,
      },
      availableRooms,
      weightings: weightings || {
        guestPreferences: 0.3,
        roomAvailability: 0.25,
        revenueOptimization: 0.2,
        guestLoyalty: 0.15,
        operationalEfficiency: 0.1,
        roomRotation: 0.05,
      },
      constraints: constraints || {
        minimumRoomType: 'standard',
        maximumRoomType: 'presidential',
        excludeRooms: [],
        requireAccessibility: false,
        requirePetFriendly: false,
        requireSmoking: undefined,
        minimumFloor: '',
        maximumFloor: '',
        avoidRecentStays: true,
        avoidMaintenanceRooms: true,
      },
    };

    // Perform room assignment
    const result = await engine.assignRoom(criteria);

    // Return assignment result
    return NextResponse.json({
      success: true,
      data: {
        assignment: result,
        criteria,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Room assignment error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to assign room',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return assignment engine status and configuration
  try {
    const config: AssignmentConfig = {
      algorithm: 'hybrid',
      learningEnabled: true,
      updateFrequency: 'daily',
      minConfidenceThreshold: 0.7,
      maxAlternatives: 3,
      enableRevenueOptimization: true,
      enableGuestLoyaltyBoost: true,
      enableOperationalEfficiency: true,
    };

    const engine = new RoomAssignmentEngine(config);
    const metrics = await engine.getMetrics();

    return NextResponse.json({
      success: true,
      data: {
        config,
        metrics,
        status: 'active',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Assignment status error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get assignment status',
      },
      { status: 500 }
    );
  }
}
