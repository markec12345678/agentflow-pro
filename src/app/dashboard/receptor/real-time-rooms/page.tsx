/**
 * Real-time Room Status Page
 * Enhanced room management with WebSocket updates
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PropertySelector } from '@/web/components/PropertySelector';
import RoomStatusGrid from '@/components/real-time/RoomStatusGrid';
import { toast } from 'sonner';

export default function RealTimeRoomsPage() {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (!response.ok) {
          router.push('/auth/signin');
          return;
        }
      } catch (error) {
        router.push('/auth/signin');
        return;
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    toast.success(`Switched to property ${propertyId}`);
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
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Real-time Room Status</h1>
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
        {selectedPropertyId ? (
          <RoomStatusGrid
            propertyId={selectedPropertyId}
            onPropertyChange={handlePropertyChange}
          />
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Property</h3>
            <p className="text-gray-600">Please select a property to view real-time room status.</p>
          </div>
        )}
      </div>
    </div>
  );
}
