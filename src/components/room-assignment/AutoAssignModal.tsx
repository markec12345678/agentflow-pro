/**
 * Auto-Assign Room Modal Component
 * Interactive modal for automatic room assignment
 */

"use client";

import { useState, useEffect } from 'react';
import { logger } from '@/infrastructure/observability/logger';
import { useRoomAssignment, createGuestRequirements, createGuestPreferences } from '@/hooks/use-room-assignment';
import { GuestRequirements, Room } from '@/types/room-assignment';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface AutoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestData: {
    name: string;
    email: string;
    phone: string;
    adults: number;
    children: number;
    infants: number;
  };
  checkIn: Date;
  checkOut: Date;
  availableRooms: Room[];
  onAssignmentComplete: (result: any) => void;
}

export default function AutoAssignModal({
  isOpen,
  onClose,
  guestData,
  checkIn,
  checkOut,
  availableRooms,
  onAssignmentComplete,
}: AutoAssignModalProps) {
  const [preferences, setPreferences] = useState(createGuestPreferences());
  const [constraints, setConstraints] = useState({
    minimumRoomType: 'standard',
    maximumRoomType: 'presidential',
    requireAccessibility: false,
    requirePetFriendly: false,
    avoidRecentStays: true,
  });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<any>(null);

  const { assignRoom, error } = useRoomAssignment({ propertyId: 'default' });

  const handleAssignRoom = async () => {
    if (isAssigning) return;

    setIsAssigning(true);
    setAssignmentResult(null);

    try {
      const guest = createGuestRequirements({
        ...guestData,
        preferences,
        loyaltyStatus: 'none',
        previousStays: 0,
        totalRevenue: 0,
        averageRating: 0,
      });

      const result = await assignRoom(guest, checkIn, checkOut, availableRooms);
      setAssignmentResult(result);
      onAssignmentComplete(result);
      
      // Auto-close after successful assignment
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      logger.error('Assignment failed:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleConstraintChange = (key: string, value: any) => {
    setConstraints(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Auto-Assign Room</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={isAssigning}
              title="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Guest Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Guest Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{guestData.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{guestData.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900">{guestData.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Guests</label>
                <p className="text-gray-900">
                  {guestData.adults} adults, {guestData.children} children, {guestData.infants} infants
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-in</label>
                <p className="text-gray-900">{format(checkIn, 'MMM d, yyyy')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-Out</label>
                <p className="text-gray-900">{format(checkOut, 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          {/* Guest Preferences */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Guest Preferences</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select
                  multiple
                  value={preferences.roomType}
                  onChange={(e) => handlePreferenceChange('roomType', Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  size={3}
                  title="Select room types"
                >
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="presidential">Presidential</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Preference</label>
                <select
                  multiple
                  value={preferences.floor}
                  onChange={(e) => handlePreferenceChange('floor', Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  size={3}
                  title="Select floor preferences"
                >
                  <option value="1">1st Floor</option>
                  <option value="2">2nd Floor</option>
                  <option value="3">3rd Floor</option>
                  <option value="4">4th Floor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">View Preference</label>
                <select
                  multiple
                  value={preferences.view}
                  onChange={(e) => handlePreferenceChange('view', Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  size={3}
                  title="Select view preferences"
                >
                  <option value="city">City View</option>
                  <option value="garden">Garden View</option>
                  <option value="ocean">Ocean View</option>
                  <option value="mountain">Mountain View</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Preference</label>
                <select
                  value={preferences.location}
                  onChange={(e) => handlePreferenceChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Select location preference"
                >
                  <option value="no-preference">No Preference</option>
                  <option value="quiet">Quiet Area</option>
                  <option value="central">Central Location</option>
                  <option value="near-elevator">Near Elevator</option>
                  <option value="near-entrance">Near Entrance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
                <select
                  value={preferences.smoking}
                  onChange={(e) => handlePreferenceChange('smoking', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Select smoking preference"
                >
                  <option value="no-preference">No Preference</option>
                  <option value="allowed">Smoking Allowed</option>
                  <option value="not-allowed">No Smoking</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.petFriendly}
                    onChange={(e) => handlePreferenceChange('petFriendly', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Pet Friendly</span>
                </label>
              </div>

              <div className="col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.accessibility}
                    onChange={(e) => handlePreferenceChange('accessibility', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Accessibility Required</span>
                </label>
              </div>
            </div>
          </div>

          {/* Assignment Constraints */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Assignment Constraints</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={constraints.requireAccessibility}
                    onChange={(e) => handleConstraintChange('requireAccessibility', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Require Accessibility</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={constraints.requirePetFriendly}
                    onChange={(e) => handleConstraintChange('requirePetFriendly', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Require Pet Friendly</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={constraints.avoidRecentStays}
                    onChange={(e) => handleConstraintChange('avoidRecentStays', e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Avoid Recent Stays</span>
                </label>
              </div>
            </div>
          </div>

          {/* Available Rooms Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Available Rooms</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Total Available:</span>
                  <span className="text-gray-900">{availableRooms.length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Standard:</span>
                  <span className="text-gray-900">
                    {availableRooms.filter(r => r.type === 'standard').length}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Deluxe:</span>
                  <span className="text-gray-900">
                    {availableRooms.filter(r => r.type === 'deluxe').length}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Suites:</span>
                  <span className="text-gray-900">
                    {availableRooms.filter(r => r.type === 'suite').length}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Presidential:</span>
                  <span className="text-gray-900">
                    {availableRooms.filter(r => r.type === 'presidential').length}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Avg Price:</span>
                  <span className="text-gray-900">
                    ${Math.round(availableRooms.reduce((sum, r) => sum + r.currentPrice, 0) / availableRooms.length)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Assignment Result */}
          {assignmentResult && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-700 font-medium">Room Assigned Successfully!</span>
              </div>
              <div className="text-sm text-green-600">
                <p>Room: {assignmentResult.recommendedRoom.roomId}</p>
                <p>Confidence: {(assignmentResult.confidence * 100).toFixed(1)}%</p>
                <p>Estimated Revenue: ${assignmentResult.estimatedRevenue}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isAssigning}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignRoom}
              disabled={isAssigning || availableRooms.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8C0 5.79 2.79 3 6 3h12c2.21 0 4 1.79 4 4v8c0 2.21-1.79 4-4 4H6c-2.21 0-4-1.79-4-4V4c0-2.21 1.79-4 4-4h12z"></path>
                  </svg>
                  Assigning...
                </span>
              ) : (
                'Assign Room'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
