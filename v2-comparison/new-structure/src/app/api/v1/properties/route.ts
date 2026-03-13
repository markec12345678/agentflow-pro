/**
 * Properties API v1
 * 
 * RESTful API for property operations.
 * Supports filtering, pagination, and sorting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/infrastructure/database';
import { propertyListQuerySchema, propertyCreateSchema } from '@/entities/property/schemas';
import { ApiError } from '@/features/properties/api/propertyApi';

/**
 * GET /api/v1/properties
 * 
 * Get all properties with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const queryResult = propertyListQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );
    
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const { page, pageSize, sortBy, sortOrder, ...filters } = queryResult.data;
    
    // Build where clause
    const where: any = {
      ownerId: user.id
    };
    
    if (filters.type) {
      where.type = { in: filters.type };
    }
    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }
    if (filters.country) {
      where.country = filters.country;
    }
    if (filters.minPrice !== undefined) {
      where.pricePerNight = { ...where.pricePerNight, gte: filters.minPrice };
    }
    if (filters.maxPrice !== undefined) {
      where.pricePerNight = { ...where.pricePerNight, lte: filters.maxPrice };
    }
    if (filters.minBedrooms !== undefined) {
      where.bedrooms = { ...where.bedrooms, gte: filters.minBedrooms };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    
    // Execute query
    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          country: true,
          pricePerNight: true,
          images: true,
          bedrooms: true,
          bathrooms: true,
          maxGuests: true,
          createdAt: true
        }
      }),
      db.property.count({ where })
    ]);
    
    // Build response
    const totalPages = Math.ceil(total / pageSize);
    
    return NextResponse.json({
      data: properties,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Properties API error:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/properties
 * 
 * Create new property
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validationResult = propertyCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const property = await db.property.create({
      data: {
        ...validationResult.data,
        ownerId: user.id
      }
    });
    
    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Create property error:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
