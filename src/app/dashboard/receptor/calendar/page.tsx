/**
 * Calendar Page with Drag-and-Drop Functionality
 */

"use client";

import { useState, useEffect } from 'react';
import { logger } from '@/infrastructure/observability/logger';
import { useRouter } from 'next/navigation';
import { PropertySelector } from '@/web/components/PropertySelector';
import DragDropCalendar from '@/components/calendar/DragDropCalendar';
import { CalendarEvent } from '@/types/calendar';
import { toast } from 'sonner';

export default function CalendarPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (!response.ok) {
          router.push('/login');
          return;
        }
      } catch (error) {
        router.push('/login');
        return;
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedEvent(null);
    toast.success(`Switched to property ${propertyId}`);
  };

  const handleEventSelect = (event: CalendarEvent | null) => {
    setSelectedEvent(event);
  };

  const handleEventCreate = async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          propertyId: selectedPropertyId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create reservation');
      }
      
      const newEvent = await response.json();
      toast.success('Reservation created successfully');
      
      // Optionally select the new event
      setSelectedEvent(newEvent.data);
    } catch (error) {
      logger.error('Error creating event:', error);
      toast.error('Failed to create reservation');
    }
  };

  const handleEventUpdate = async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reservation');
      }
      
      toast.success('Reservation updated successfully');
      
      // Update selected event if it's the one being updated
      if (selectedEvent?.id === eventId) {
        setSelectedEvent({ ...selectedEvent, ...updates });
      }
    } catch (error) {
      logger.error('Error updating event:', error);
      toast.error('Failed to update reservation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100"
                aria-label="Go back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Reservation Calendar</h1>
            </div>
            
            <PropertySelector
              selectedPropertyId={selectedPropertyId}
              onPropertyChange={handlePropertyChange}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            {selectedPropertyId ? (
              <DragDropCalendar
                propertyId={selectedPropertyId}
                onEventSelect={handleEventSelect}
                onEventCreate={handleEventCreate}
                onEventUpdate={handleEventUpdate}
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Property</h3>
                <p className="text-gray-600">Please select a property to view the reservation calendar.</p>
              </div>
            )}
          </div>

          {/* Event Details Sidebar */}
          <div className="lg:col-span-1">
            {selectedEvent ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Reservation Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Guest Name</label>
                    <p className="text-gray-900">{selectedEvent.guestName || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room</label>
                    <p className="text-gray-900">{selectedEvent.resourceId}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-in</label>
                    <p className="text-gray-900">
                      {selectedEvent.start.toLocaleDateString()} at {selectedEvent.start.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-out</label>
                    <p className="text-gray-900">
                      {selectedEvent.end.toLocaleDateString()} at {selectedEvent.end.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedEvent.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      selectedEvent.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedEvent.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      selectedEvent.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEvent.status}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Price</label>
                    <p className="text-gray-900">${selectedEvent.totalPrice}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Channel</label>
                    <p className="text-gray-900">{selectedEvent.channel}</p>
                  </div>
                  
                  {selectedEvent.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="text-gray-900">{selectedEvent.notes}</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedEvent(null)}
                        className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                      >
                        Close
                      </button>
                      
                      {selectedEvent.status === 'pending' && (
                        <button
                          onClick={() => handleEventUpdate(selectedEvent.id, { status: 'confirmed' })}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Confirm
                        </button>
                      )}
                      
                      {selectedEvent.status === 'confirmed' && (
                        <button
                          onClick={() => handleEventUpdate(selectedEvent.id, { status: 'cancelled' })}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendar Instructions</h2>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Click on any empty time slot to create a new reservation</p>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 1.5a1.5 1.5 0 01-3 0v-6a1.5 1.5 0 013 0m0-6V3m0 0V3m0 0h3M18 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 1.5a1.5 1.5 0 01-3 0v-6a1.5 1.5 0 013 0m0-6V3m0 0V3m0 0h3" />
                    </svg>
                    <p>Drag and drop reservations to move them between rooms or dates</p>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5 5m11-5l-5 5m5-5v-4m0 4h-4" />
                    </svg>
                    <p>Resize reservations by dragging their edges</p>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-2 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
                    </svg>
                    <p>Click on a reservation to view and edit details</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Color Legend</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">Confirmed</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-600 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">Checked In</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-600 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">Cancelled</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
