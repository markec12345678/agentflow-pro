/**
 * Property List Component
 * 
 * Displays a list of properties with loading, error, and empty states.
 * Uses React Query for data fetching.
 */

'use client';

import { useProperties } from '../hooks/useProperties';
import { PropertyCard } from './PropertyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import type { PropertyFilters } from '@/entities/property/types';

interface PropertyListProps {
  filters?: PropertyFilters;
  viewMode?: 'grid' | 'list';
  showActions?: boolean;
}

export function PropertyList({ 
  filters, 
  viewMode = 'grid',
  showActions = true 
}: PropertyListProps) {
  const { properties, isLoading, error, hasNextPage, fetchNextPage } = useProperties(filters);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <ErrorState 
        error={error}
        onRetry={() => fetchNextPage()}
        title="Napaka pri nalaganju"
        message="Ni mogoče naložiti nepremičnin. Poskusite znova."
      />
    );
  }
  
  // Empty state
  if (!properties || properties.length === 0) {
    return (
      <EmptyState
        icon="🏠"
        title="Še nimate nepremičnin"
        description="Ustvarite svojo prvo nepremičnino in začnite sprejemati rezervacije."
        action={{
          label: '+ Dodaj nepremičnino',
          href: '/dashboard/properties/new'
        }}
      />
    );
  }
  
  // Grid view
  if (viewMode === 'grid') {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard 
            key={property.id} 
            property={property}
            showActions={showActions}
          />
        ))}
      </div>
    );
  }
  
  // List view
  return (
    <div className="space-y-4">
      {properties.map((property) => (
        <PropertyCard 
          key={property.id} 
          property={property}
          viewMode="list"
          showActions={showActions}
        />
      ))}
    </div>
  );
}
