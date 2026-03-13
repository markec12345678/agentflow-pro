/**
 * Property Card Component
 * 
 * Displays a single property in grid or list view.
 * Supports actions for owners (edit, delete).
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useDeleteProperty } from '../hooks/useProperties';
import type { Property, PropertySummary } from '@/entities/property/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import { Pencil, Trash2, MapPin, Users, Bed, Bath } from 'lucide-react';

interface PropertyCardProps {
  property: Property | PropertySummary;
  viewMode?: 'grid' | 'list';
  showActions?: boolean;
}

export function PropertyCard({ 
  property, 
  viewMode = 'grid',
  showActions = true 
}: PropertyCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteMutation = useDeleteProperty();
  
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(property.id);
      toast.success('Nepremičnina izbrisana');
      setShowDeleteDialog(false);
    } catch {
      toast.error('Napaka pri brisanju');
    }
  };
  
  // Grid view
  if (viewMode === 'grid') {
    return (
      <>
        <article className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
          {/* Image */}
          <Link href={`/dashboard/properties/${property.id}`} className="block aspect-[4/3] relative overflow-hidden">
            <Image
              src={property.images[0] || '/placeholder-property.jpg'}
              alt={property.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute top-3 left-3">
              <Badge variant="primary">
                {translatePropertyType(property.type)}
              </Badge>
            </div>
          </Link>
          
          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Header */}
            <div>
              <Link href={`/dashboard/properties/${property.id}`}>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1 hover:text-blue-600">
                  {property.name}
                </h3>
              </Link>
              <div className="flex items-center gap-1 mt-1 text-gray-500 dark:text-gray-400 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">
                  {property.city}, {property.country}
                </span>
              </div>
            </div>
            
            {/* Features */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{property.maxGuests} gostov</span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{property.bedrooms} spaln</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{property.bathrooms} kopalnic</span>
              </div>
            </div>
            
            {/* Price and Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{property.pricePerNight}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400"> / noč</span>
              </div>
              
              {showActions && (
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/properties/${property.id}/edit`}>
                    <Button variant="ghost" size="icon" aria-label="Uredi">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setShowDeleteDialog(true)}
                    aria-label="Izbriši"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </article>
        
        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Izbriši nepremičnino"
          description="Ali ste prepričani? To dejanje je trajno in ga ni mogoče razveljaviti."
          confirmLabel="Izbriši"
          cancelLabel="Prekliči"
          onConfirm={handleDelete}
          isConfirming={deleteMutation.isPending}
        />
      </>
    );
  }
  
  // List view
  return (
    <>
      <article className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <Link href={`/dashboard/properties/${property.id}`} className="sm:w-64 aspect-[4/3] sm:aspect-auto relative overflow-hidden">
            <Image
              src={property.images[0] || '/placeholder-property.jpg'}
              alt={property.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 250px"
            />
            <div className="absolute top-3 left-3">
              <Badge variant="primary">
                {translatePropertyType(property.type)}
              </Badge>
            </div>
          </Link>
          
          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/dashboard/properties/${property.id}`}>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-600">
                      {property.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1 mt-1 text-gray-500 dark:text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{property.city}, {property.country}</span>
                  </div>
                </div>
                
                {showActions && (
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/properties/${property.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="w-4 h-4 mr-2" />
                        Uredi
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Izbriši
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{property.maxGuests} gostov</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  <span>{property.bedrooms} spaln</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  <span>{property.bathrooms} kopalnic</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                €{property.pricePerNight}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400"> / noč</span>
            </div>
          </div>
        </div>
      </article>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Izbriši nepremičnino"
        description="Ali ste prepričani? To dejanje je trajno in ga ni mogoče razveljaviti."
        confirmLabel="Izbriši"
        cancelLabel="Prekliči"
        onConfirm={handleDelete}
        isConfirming={deleteMutation.isPending}
      />
    </>
  );
}

/**
 * Translate property type to Slovenian
 */
function translatePropertyType(type: string): string {
  const translations: Record<string, string> = {
    apartment: 'Stanovanje',
    house: 'Hiša',
    room: 'Soba',
    villa: 'Vila',
    studio: 'Studio'
  };
  return translations[type] || type;
}
