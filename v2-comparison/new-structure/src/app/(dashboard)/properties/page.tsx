/**
 * Properties Page (Dashboard)
 * 
 * Main properties listing page with filters and actions.
 * Demonstrates new 2026 architecture pattern.
 */

import { Suspense } from 'react';
import { PropertyList } from '@/features/properties/components/PropertyList';
import { Button } from '@/components/ui/Button';
import { PropertyFiltersForm } from '@/features/properties/components/PropertyFiltersForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Moje nepremičnine | AgentFlow Pro',
  description: 'Upravljajte svoje nepremičnine na enem mestu'
};

interface PropertiesPageProps {
  searchParams: Promise<{
    view?: 'grid' | 'list';
    type?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const viewMode = params.view === 'list' ? 'list' : 'grid';
  
  // Build filters from search params
  const filters = {
    type: params.type ? [params.type as any] : undefined,
    city: params.city,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Moje nepremičnine
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Upravljajte svoje nepremičnine in rezervacije
          </p>
        </div>
        
        <Link href="/dashboard/properties/new">
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Dodaj nepremičnino
          </Button>
        </Link>
      </div>
      
      {/* Filters */}
      <PropertyFiltersForm />
      
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {viewMode === 'grid' ? 'Mrežni pogled' : 'Seznam'}
        </p>
        
        <div className="flex items-center gap-2">
          <Link 
            href="?view=grid"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Mreža
          </Link>
          <Link 
            href="?view=list"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Seznam
          </Link>
        </div>
      </div>
      
      {/* Property List */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <PropertyList 
          filters={filters}
          viewMode={viewMode}
          showActions
        />
      </Suspense>
    </div>
  );
}
