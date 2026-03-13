/**
 * Property Validation Schemas (Zod)
 * 
 * Single source of truth for validation across:
 * - API request validation
 * - Form validation
 * - Database constraints
 * - Client-side validation
 */

import { z } from 'zod';

/**
 * Property type enum schema
 */
export const propertyTypeSchema = z.enum([
  'apartment',
  'house',
  'room',
  'villa',
  'studio'
]);

/**
 * Property status enum schema
 */
export const propertyStatusSchema = z.enum([
  'active',
  'inactive',
  'maintenance',
  'archived'
]);

/**
 * Coordinates schema
 */
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

/**
 * Property creation schema
 */
export const propertyCreateSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  
  type: propertyTypeSchema,
  
  address: z
    .string()
    .min(10, 'Address must be at least 10 characters')
    .max(200)
    .trim(),
  
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100)
    .trim(),
  
  country: z
    .string()
    .length(2, 'Country must be 2-letter ISO code')
    .toUpperCase(),
  
  postalCode: z
    .string()
    .min(4, 'Postal code must be at least 4 characters')
    .max(20),
  
  coordinates: coordinatesSchema.optional(),
  
  pricePerNight: z
    .number()
    .positive('Price must be positive')
    .max(100000, 'Price is too high'),
  
  cleaningFee: z
    .number()
    .nonnegative('Cleaning fee cannot be negative')
    .optional(),
  
  maxGuests: z
    .number()
    .int('Must be a whole number')
    .min(1, 'At least 1 guest required')
    .max(100),
  
  bedrooms: z
    .number()
    .int()
    .min(0)
    .max(50),
  
  bathrooms: z
    .number()
    .min(0)
    .max(50),
  
  area: z
    .number()
    .positive('Area must be positive')
    .max(100000),
  
  amenities: z
    .array(z.string().uuid())
    .max(50, 'Too many amenities'),
  
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(10000, 'Description is too long'),
  
  images: z
    .array(z.string().url())
    .min(1, 'At least one image required')
    .max(20, 'Maximum 20 images')
    .optional()
    .default([])
});

/**
 * Property update schema (all fields optional)
 */
export const propertyUpdateSchema = propertyCreateSchema.partial().extend({
  status: propertyStatusSchema.optional(),
  images: z.array(z.string().url()).max(20).optional()
});

/**
 * Property filters schema
 */
export const propertyFiltersSchema = z.object({
  type: z.array(propertyTypeSchema).optional(),
  city: z.string().optional(),
  country: z.string().length(2).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minBedrooms: z.number().int().min(0).optional(),
  minBathrooms: z.number().min(0).optional(),
  minGuests: z.number().int().min(1).optional(),
  amenities: z.array(z.string().uuid()).optional(),
  status: propertyStatusSchema.optional(),
  availableFrom: z.string().datetime().optional(),
  availableTo: z.string().datetime().optional()
});

/**
 * Property list query params schema
 */
export const propertyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['pricePerNight', 'name', 'createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  ...propertyFiltersSchema.shape
});

/**
 * Property API response schema
 */
export const propertyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: propertyTypeSchema,
  address: z.string(),
  city: z.string(),
  country: z.string(),
  postalCode: z.string(),
  coordinates: coordinatesSchema,
  pricePerNight: z.number(),
  cleaningFee: z.number().optional(),
  maxGuests: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  area: z.number(),
  amenities: z.array(z.string().uuid()),
  description: z.string(),
  images: z.array(z.string().url()),
  status: propertyStatusSchema,
  ownerId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastBookedAt: z.string().datetime().optional().nullable()
});

/**
 * Property list response schema
 */
export const propertyListResponseSchema = z.object({
  data: z.array(propertyResponseSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number()
  })
});

// Type exports
export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
export type PropertyFilters = z.infer<typeof propertyFiltersSchema>;
export type PropertyListQuery = z.infer<typeof propertyListQuerySchema>;
