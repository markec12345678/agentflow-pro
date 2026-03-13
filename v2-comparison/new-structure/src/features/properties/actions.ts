/**
 * Property Server Actions
 * 
 * Server-side mutations for progressive enhancement.
 * Can be used directly in forms or called from client components.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { propertyCreateSchema, propertyUpdateSchema } from '@/entities/property/schemas';
import type { PropertyCreateInput, PropertyUpdateInput } from '@/entities/property/types';
import { db } from '@/infrastructure/database';
import { getCurrentUser } from '@/lib/auth';
import { ApiError } from './api/propertyApi';

/**
 * Create property server action
 * 
 * Usage in form:
 * <form action={createPropertyAction}>
 *   <input name="name" />
 *   <input name="type" />
 *   ...
 * </form>
 */
export async function createPropertyAction(formData: FormData) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new ApiError('Unauthorized', 401);
    }
    
    // Parse form data
    const rawData = Object.fromEntries(formData.entries());
    
    // Validate with Zod
    const validated = propertyCreateSchema.parse({
      ...rawData,
      pricePerNight: Number(rawData.pricePerNight),
      maxGuests: Number(rawData.maxGuests),
      bedrooms: Number(rawData.bedrooms),
      bathrooms: Number(rawData.bathrooms),
      area: Number(rawData.area),
      amenities: rawData.amenities ? JSON.parse(rawData.amenities as string) : []
    });
    
    // Create in database
    const property = await db.property.create({
      data: {
        ...validated,
        ownerId: user.id
      }
    });
    
    // Revalidate and redirect
    revalidatePath('/dashboard/properties');
    redirect(`/dashboard/properties/${property.id}`);
    
    return { success: true, data: property };
  } catch (error) {
    if (error instanceof Error) {
      return { 
        success: false, 
        error: error.message,
        code: error instanceof ApiError ? error.code : undefined
      };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update property server action
 */
export async function updatePropertyAction(
  id: string,
  formData: FormData
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new ApiError('Unauthorized', 401);
    }
    
    // Verify ownership
    const existing = await db.property.findUnique({
      where: { id }
    });
    
    if (!existing || existing.ownerId !== user.id) {
      throw new ApiError('Property not found', 404);
    }
    
    // Parse and validate
    const rawData = Object.fromEntries(formData.entries());
    const validated = propertyUpdateSchema.parse({
      ...rawData,
      pricePerNight: rawData.pricePerNight ? Number(rawData.pricePerNight) : undefined,
      amenities: rawData.amenities ? JSON.parse(rawData.amenities as string) : undefined
    });
    
    // Update
    const property = await db.property.update({
      where: { id },
      data: validated
    });
    
    revalidatePath('/dashboard/properties');
    revalidatePath(`/dashboard/properties/${id}`);
    
    return { success: true, data: property };
  } catch (error) {
    if (error instanceof Error) {
      return { 
        success: false, 
        error: error.message,
        code: error instanceof ApiError ? error.code : undefined
      };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete property server action
 */
export async function deletePropertyAction(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new ApiError('Unauthorized', 401);
    }
    
    // Verify ownership
    const existing = await db.property.findUnique({
      where: { id }
    });
    
    if (!existing || existing.ownerId !== user.id) {
      throw new ApiError('Property not found', 404);
    }
    
    // Delete
    await db.property.delete({
      where: { id }
    });
    
    revalidatePath('/dashboard/properties');
    
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { 
        success: false, 
        error: error.message,
        code: error instanceof ApiError ? error.code : undefined
      };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Create property with redirect (for programmatic usage)
 */
export async function createProperty(data: PropertyCreateInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError('Unauthorized', 401);
  }
  
  const validated = propertyCreateSchema.parse(data);
  
  const property = await db.property.create({
    data: {
      ...validated,
      ownerId: user.id
    }
  });
  
  revalidatePath('/dashboard/properties');
  
  return { success: true, data: property };
}

/**
 * Update property with redirect (for programmatic usage)
 */
export async function updateProperty(id: string, data: PropertyUpdateInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError('Unauthorized', 401);
  }
  
  // Verify ownership
  const existing = await db.property.findUnique({
    where: { id }
  });
  
  if (!existing || existing.ownerId !== user.id) {
    throw new ApiError('Property not found', 404);
  }
  
  const validated = propertyUpdateSchema.parse(data);
  
  const property = await db.property.update({
    where: { id },
    data: validated
  });
  
  revalidatePath('/dashboard/properties');
  revalidatePath(`/dashboard/properties/${id}`);
  
  return { success: true, data: property };
}
