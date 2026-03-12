/**
 * AgentFlow Pro - Unified Calendar with Channel Filters
 * Multi-channel view with color coding and filtering
 */

"use client";

import { useState, useMemo } from "react";

export interface UnifiedReservation {
  id: string;
  propertyId: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  channel: ChannelType;
  status: "confirmed" | "pending" | "cancelled";
  totalAmount: number;
  roomId?: string;
}

export type ChannelType = "booking.com" | "airbnb" | "expedia" | "direct" | "ical" | "other";

export interface ChannelConfig {
  id: ChannelType;
  name: string;
  color: string;
  bgColor: string;
  enabled: boolean;
}

export interface UnifiedCalendarFilters {
  channels: Record<ChannelType, boolean>;
  properties: string[];
  status: Record<"confirmed" | "pending" | "cancelled", boolean>;
}

export const DEFAULT_CHANNELS: ChannelConfig[] = [
  { id: "booking.com", name: "Booking.com", color: "text-blue-700", bgColor: "bg-blue-100", enabled: true },
  { id: "airbnb", name: "Airbnb", color: "text-pink-700", bgColor: "bg-pink-100", enabled: true },
  { id: "expedia", name: "Expedia", color: "text-yellow-700", bgColor: "bg-yellow-100", enabled: true },
  { id: "direct", name: "Direktno", color: "text-green-700", bgColor: "bg-green-100", enabled: true },
  { id: "ical", name: "iCal", color: "text-purple-700", bgColor: "bg-purple-100", enabled: true },
  { id: "other", name: "Ostalo", color: "text-gray-700", bgColor: "bg-gray-100", enabled: true },
];

export const CHANNEL_COLOR_MAP: Record<ChannelType, { color: string; bgColor: string; borderColor: string }> = {
  "booking.com": { color: "text-blue-700", bgColor: "bg-blue-100", borderColor: "border-blue-300" },
  "airbnb": { color: "text-pink-700", bgColor: "bg-pink-100", borderColor: "border-pink-300" },
  "expedia": { color: "text-yellow-700", bgColor: "bg-yellow-100", borderColor: "border-yellow-300" },
  "direct": { color: "text-green-700", bgColor: "bg-green-100", borderColor: "border-green-300" },
  "ical": { color: "text-purple-700", bgColor: "bg-purple-100", borderColor: "border-purple-300" },
  "other": { color: "text-gray-700", bgColor: "bg-gray-100", borderColor: "border-gray-300" },
};

interface UnifiedCalendarFiltersProps {
  filters: UnifiedCalendarFilters;
  onFilterChange: (filters: UnifiedCalendarFilters) => void;
  channels?: ChannelConfig[];
  properties?: Array<{ id: string; name: string }>;
}

export function UnifiedCalendarFilters({
  filters,
  onFilterChange,
  channels = DEFAULT_CHANNELS,
  properties = [],
}: UnifiedCalendarFiltersProps) {
  const toggleChannel = (channel: ChannelType) => {
    onFilterChange({
      ...filters,
      channels: {
        ...filters.channels,
        [channel]: !filters.channels[channel],
      },
    });
  };

  const toggleStatus = (status: "confirmed" | "pending" | "cancelled") => {
    onFilterChange({
      ...filters,
      status: {
        ...filters.status,
        [status]: !filters.status[status],
      },
    });
  };

  const toggleProperty = (propertyId: string) => {
    const newProperties = filters.properties.includes(propertyId)
      ? filters.properties.filter(p => p !== propertyId)
      : [...filters.properties, propertyId];
    
    onFilterChange({
      ...filters,
      properties: newProperties,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-lg">
      {/* Channel Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Kanali</h3>
        <div className="flex flex-wrap gap-2">
          {channels.map((channel) => {
            const isActive = filters.channels[channel.id];
            return (
              <button
                key={channel.id}
                onClick={() => toggleChannel(channel.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? `${channel.bgColor} ${channel.color} border-2 ${channel.borderColor}`
                    : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                }`}
              >
                {channel.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Status</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toggleStatus("confirmed")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filters.status.confirmed
                ? "bg-green-100 text-green-700 border-2 border-green-300"
                : "bg-gray-100 text-gray-400 border-2 border-gray-200"
            }`}
          >
            ✓ Potrjeno
          </button>
          <button
            onClick={() => toggleStatus("pending")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filters.status.pending
                ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                : "bg-gray-100 text-gray-400 border-2 border-gray-200"
            }`}
          >
            ⏳ Na čakanju
          </button>
          <button
            onClick={() => toggleStatus("cancelled")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filters.status.cancelled
                ? "bg-red-100 text-red-700 border-2 border-red-300"
                : "bg-gray-100 text-gray-400 border-2 border-gray-200"
            }`}
          >
            ✕ Preklicano
          </button>
        </div>
      </div>

      {/* Property Filters (if multiple properties) */}
      {properties.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Nastanitve</h3>
          <div className="flex flex-wrap gap-2">
            {properties.map((property) => {
              const isActive = filters.properties.includes(property.id);
              return (
                <button
                  key={property.id}
                  onClick={() => toggleProperty(property.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                      : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                  }`}
                >
                  {property.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <button
          onClick={() => {
            onFilterChange({
              ...filters,
              channels: Object.fromEntries(channels.map(c => [c.id, true])) as Record<ChannelType, boolean>,
            });
          }}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Vklopi vse kanale
        </button>
        <button
          onClick={() => {
            onFilterChange({
              ...filters,
              channels: Object.fromEntries(channels.map(c => [c.id, false])) as Record<ChannelType, boolean>,
            });
          }}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Izklopi vse kanale
        </button>
      </div>
    </div>
  );
}

/**
 * Get channel statistics
 */
export function useChannelStats(reservations: UnifiedReservation[]) {
  return useMemo(() => {
    const stats = {
      total: reservations.length,
      byChannel: {} as Record<ChannelType, number>,
      byStatus: {
        confirmed: 0,
        pending: 0,
        cancelled: 0,
      },
      totalRevenue: 0,
      revenueByChannel: {} as Record<ChannelType, number>,
    };

    reservations.forEach(res => {
      // By channel
      stats.byChannel[res.channel] = (stats.byChannel[res.channel] || 0) + 1;
      
      // By status
      stats.byStatus[res.status]++;
      
      // Revenue (only confirmed)
      if (res.status === "confirmed") {
        stats.totalRevenue += res.totalAmount;
        stats.revenueByChannel[res.channel] = (stats.revenueByChannel[res.channel] || 0) + res.totalAmount;
      }
    });

    return stats;
  }, [reservations]);
}

/**
 * Filter reservations by filters
 */
export function filterReservations(
  reservations: UnifiedReservation[],
  filters: UnifiedCalendarFilters
): UnifiedReservation[] {
  return reservations.filter(res => {
    // Filter by channel
    if (!filters.channels[res.channel]) return false;
    
    // Filter by status
    if (!filters.status[res.status]) return false;
    
    // Filter by property
    if (filters.properties.length > 0 && !filters.properties.includes(res.propertyId)) return false;
    
    return true;
  });
}

/**
 * Detect conflicts between reservations
 */
export function detectConflicts(reservations: UnifiedReservation[]): Array<{
  reservation1: UnifiedReservation;
  reservation2: UnifiedReservation;
  overlapDays: number;
  roomId?: string;
}> {
  const conflicts: Array<{
    reservation1: UnifiedReservation;
    reservation2: UnifiedReservation;
    overlapDays: number;
    roomId?: string;
  }> = [];

  for (let i = 0; i < reservations.length; i++) {
    for (let j = i + 1; j < reservations.length; j++) {
      const res1 = reservations[i];
      const res2 = reservations[j];

      // Skip if different properties
      if (res1.propertyId !== res2.propertyId) continue;

      // Skip if either is cancelled
      if (res1.status === "cancelled" || res2.status === "cancelled") continue;

      // Check for date overlap
      const start1 = new Date(res1.checkIn);
      const end1 = new Date(res1.checkOut);
      const start2 = new Date(res2.checkIn);
      const end2 = new Date(res2.checkOut);

      const hasOverlap = start1 < end2 && start2 < end1;
      
      if (hasOverlap) {
        const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
        const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
        const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));

        conflicts.push({
          reservation1: res1,
          reservation2: res2,
          overlapDays,
          roomId: res1.roomId,
        });
      }
    }
  }

  return conflicts;
}
