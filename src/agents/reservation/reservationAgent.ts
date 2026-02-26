/**
 * AgentFlow Pro - Reservation Agent
 * Booking management, availability checking, price calculation
 */

import type { Agent } from "../../orchestrator/Orchestrator";
import { isMockMode } from "@/lib/mock-mode";

export interface ReservationInput {
  action: "create" | "modify" | "cancel" | "check_availability";
  propertyId?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  roomId?: string;
  reservationId?: string;
  channel?: "direct" | "booking.com" | "airbnb";
}

export interface ReservationOutput {
  success: boolean;
  reservationId?: string;
  availability?: boolean;
  totalPrice?: number;
  currency?: string;
  confirmationCode?: string;
  message?: string;
  errors?: string[];
}

export function createReservationAgent(config?: {
  bookingComKey?: string;
  airbnbKey?: string;
}): Agent {
  const bookingComKey = config?.bookingComKey ?? process.env.BOOKING_COM_API_KEY ?? "";
  const airbnbKey = config?.airbnbKey ?? process.env.AIRBNB_API_KEY ?? "";

  return {
    id: "reservation-agent",
    type: "reservation",
    name: "Reservation Agent",
    execute: async (input: unknown): Promise<ReservationOutput> => {
      const { action, propertyId, checkIn, checkOut, guests, roomId, reservationId, channel = "direct" } = (input as ReservationInput) ?? {};
      
      if (isMockMode()) {
        return {
          success: true,
          reservationId: `RES_${Date.now()}`,
          availability: true,
          totalPrice: 299.99,
          currency: "EUR",
          confirmationCode: `CONF_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          message: "Mock reservation created successfully"
        };
      }

      try {
        switch (action) {
          case "check_availability":
            return await checkAvailability(propertyId!, checkIn!, checkOut!, guests!);
          
          case "create":
            return await createReservation(propertyId!, checkIn!, checkOut!, guests!, roomId, channel);
          
          case "modify":
            return await modifyReservation(reservationId!, propertyId!, checkIn!, checkOut!, guests!);
          
          case "cancel":
            return await cancelReservation(reservationId!);
          
          default:
            return {
              success: false,
              message: `Unknown action: ${action}`,
              errors: [`Invalid action: ${action}`]
            };
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error occurred",
          errors: [error instanceof Error ? error.message : "Unknown error"]
        };
      }
    },
  };
}

async function checkAvailability(propertyId: string, checkIn: Date, checkOut: Date, guests: number): Promise<ReservationOutput> {
  // Mock implementation - integrate with Booking.com/Airbnb APIs
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const basePrice = 150; // Per night
  const totalPrice = basePrice * nights;
  
  return {
    success: true,
    availability: true,
    totalPrice,
    currency: "EUR",
    message: `Property available for ${nights} nights`
  };
}

async function createReservation(
  propertyId: string, 
  checkIn: Date, 
  checkOut: Date, 
  guests: number, 
  roomId?: string, 
  channel?: string
): Promise<ReservationOutput> {
  // Mock implementation - integrate with booking systems
  const reservationId = `RES_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const confirmationCode = `CONF_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  
  const availability = await checkAvailability(propertyId, checkIn, checkOut, guests);
  if (!availability.availability) {
    return {
      success: false,
      message: "Property not available for selected dates",
      errors: ["No availability"]
    };
  }
  
  return {
    success: true,
    reservationId,
    totalPrice: availability.totalPrice,
    currency: availability.currency,
    confirmationCode,
    message: `Reservation created via ${channel}`
  };
}

async function modifyReservation(
  reservationId: string, 
  propertyId: string, 
  checkIn: Date, 
  checkOut: Date, 
  guests: number
): Promise<ReservationOutput> {
  // Mock implementation - update existing reservation
  const availability = await checkAvailability(propertyId, checkIn, checkOut, guests);
  
  return {
    success: true,
    reservationId,
    totalPrice: availability.totalPrice,
    currency: availability.currency,
    message: "Reservation modified successfully"
  };
}

async function cancelReservation(reservationId: string): Promise<ReservationOutput> {
  // Mock implementation - cancel reservation
  return {
    success: true,
    reservationId,
    message: "Reservation cancelled successfully"
  };
}
