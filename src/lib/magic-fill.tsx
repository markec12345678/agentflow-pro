/**
 * Magic Fill - Auto-fill forms with AI-extracted data from Concierge
 *
 * When user completes onboarding via AI conversation,
 * this utility auto-fills traditional forms with extracted data.
 * Best of both worlds: conversational onboarding + form editing.
 */

import { UseFormReturn } from 'react-hook-form';
import { useEffect } from 'react';

interface MagicFillData {
  propertyName?: string;
  propertyType?: 'hotel' | 'kamp' | 'kmetija' | 'apartma' | 'drugo';
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  roomCount?: number;
  roomTypes?: Array<{
    type?: string;
    count?: number;
    price?: number;
    capacity?: number;
  }>;
  amenities?: string[];
  enableEturizem?: boolean;
  enableAutoEmails?: boolean;
}

/**
 * Auto-fill property form with AI-extracted data
 */
export function magicFillPropertyForm(
  form: UseFormReturn<any>,
  data: MagicFillData
) {
  // Fill basic property info
  if (data.propertyName) {
    form.setValue('name', data.propertyName);
  }

  if (data.propertyType) {
    form.setValue('type', data.propertyType);
  }

  // Fill address
  if (data.address) {
    if (data.address.street) {
      form.setValue('address.street', data.address.street);
    }
    if (data.address.city) {
      form.setValue('address.city', data.address.city);
    }
    if (data.address.postalCode) {
      form.setValue('address.postalCode', data.address.postalCode);
    }
    if (data.address.country) {
      form.setValue('address.country', data.address.country);
    }
  }

  // Fill room info
  if (data.roomCount) {
    form.setValue('roomCount', data.roomCount);
  }

  // Fill room types
  if (data.roomTypes && data.roomTypes.length > 0) {
    form.setValue('roomTypes', data.roomTypes.map(rt => ({
      type: rt.type || 'Standard',
      count: rt.count || 1,
      price: rt.price || 50,
      capacity: rt.capacity || 2,
    })));
  }

  // Fill amenities
  if (data.amenities && data.amenities.length > 0) {
    data.amenities.forEach(amenity => {
      const amenityKey = amenity.toLowerCase().replace(/\s+/g, '_');
      form.setValue(`amenities.${amenityKey}`, true);
    });
  }

  // Fill integrations
  if (data.enableEturizem !== undefined) {
    form.setValue('enableEturizem', data.enableEturizem);
  }

  if (data.enableAutoEmails !== undefined) {
    form.setValue('enableAutoEmails', data.enableAutoEmails);
  }
}

/**
 * Hook to watch concierge context and auto-fill form
 */
export function useMagicFill(
  form: UseFormReturn<any>,
  conciergeContext: any
) {
  useEffect(() => {
    if (conciergeContext?.extractedData) {
      magicFillPropertyForm(form, conciergeContext.extractedData);
    }
  }, [conciergeContext, form]);
}

/**
 * Component wrapper for auto-fill forms
 */
export function MagicFillForm({
  children,
  form,
  conciergeContext,
}: {
  children: React.ReactNode;
  form: UseFormReturn<any>;
  conciergeContext: any;
}) {
  useMagicFill(form, conciergeContext);

  return <>{children}</>;
}
