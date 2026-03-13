/**
 * AgentFlow Pro - Calculate Price API
 * Refactored to use CalculatePrice use case
 * 
 * From: 169 vrstic
 * To: ~60 vrstic (-64%)
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { parseISO } from "date-fns"
import { getPropertyForUser } from "@/lib/tourism/property-access"
import { CalculatePrice } from "@/core/use-cases/calculate-price"
import { Property } from "@/core/domain/tourism/entities/property"
import { Money } from "@/core/domain/shared/value-objects/money"
import { handleApiError, withRequestLogging } from "@/app/api/middleware"

/**
 * GET /api/tourism/calculate-price
 * Calculate price for property stay
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        // 1. Authenticate user
        const session = await getServerSession(authOptions)
        const userId = getUserId(session)
        
        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          )
        }

        // 2. Parse query params
        const { searchParams } = new URL(request.url)
        const propertyId = searchParams.get("propertyId")
        const checkInParam = searchParams.get("checkIn")
        const checkOutParam = searchParams.get("checkOut")

        if (!propertyId || !checkInParam || !checkOutParam) {
          return NextResponse.json(
            { error: "propertyId, checkIn, and checkOut are required" },
            { status: 400 }
          )
        }

        // 3. Get property
        const property = await getPropertyForUser(propertyId, userId)
        if (!property) {
          return NextResponse.json({ error: "Property not found" }, { status: 403 })
        }

        // 4. Parse dates
        const checkIn = parseISO(checkInParam)
        const checkOut = parseISO(checkOutParam)
        
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
          return NextResponse.json(
            { error: "Invalid checkIn or checkOut date (use ISO 8601)" },
            { status: 400 }
          )
        }
        
        if (checkOut <= checkIn) {
          return NextResponse.json(
            { error: "checkOut must be after checkIn" },
            { status: 400 }
          )
        }

        // 5. Create domain entity
        const domainProperty = new Property({
          id: property.id,
          name: property.name,
          type: 'apartment',
          status: 'active',
          address: { street: '', city: property.city || '', postalCode: '', country: property.country || '' },
          description: '',
          baseRate: new Money(property.basePrice ?? 100, property.currency ?? 'EUR'),
          amenities: [],
          rooms: [],
          policies: []
        })

        // 6. Execute use case
        const useCase = new CalculatePrice()
        const result = useCase.execute({
          property: domainProperty,
          checkIn,
          checkOut,
          guests: 2 // Default
        })

        // 7. Return response
        return NextResponse.json({
          nights: result.nights,
          baseTotal: result.basePrice.amount,
          adjustments: {
            seasonal: result.seasonalAdjustment.amount,
            discounts: result.discounts.amount,
            taxes: result.taxes.amount
          },
          finalPrice: result.totalPrice.amount,
          currency: result.totalPrice.currency,
          breakdown: result.breakdown
        })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/tourism/calculate-price',
          method: 'GET'
        })
      }
    },
    '/api/tourism/calculate-price'
  )
}

/**
 * POST /api/tourism/calculate-price
 * Batch price calculations
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        // 1. Authenticate
        const session = await getServerSession(authOptions)
        const userId = getUserId(session)
        
        if (!userId) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          )
        }

        // 2. Parse body
        const body = await request.json()
        const { propertyId, dates } = body

        if (!propertyId || !dates || !Array.isArray(dates)) {
          return NextResponse.json(
            { error: "propertyId and dates array are required" },
            { status: 400 }
          )
        }

        // 3. Get property
        const property = await getPropertyForUser(propertyId, userId)
        if (!property) {
          return NextResponse.json({ error: "Property not found" }, { status: 403 })
        }

        // 4. Batch calculate
        const results = dates.map((d: any) => {
          const checkIn = parseISO(d.checkIn)
          const checkOut = parseISO(d.checkOut)
          
          const useCase = new CalculatePrice()
          const domainProperty = new Property({
            id: property.id,
            name: property.name,
            type: 'apartment',
            status: 'active',
            address: { street: '', city: property.city || '', postalCode: '', country: property.country || '' },
            description: '',
            baseRate: new Money(property.basePrice ?? 100, property.currency ?? 'EUR'),
            amenities: [],
            rooms: [],
            policies: []
          })
          
          const result = useCase.execute({
            property: domainProperty,
            checkIn,
            checkOut,
            guests: 2
          })
          
          return {
            id: d.id || `req_${dates.indexOf(d)}`,
            nights: result.nights,
            baseTotal: result.basePrice.amount,
            finalPrice: result.totalPrice.amount
          }
        })

        return NextResponse.json({
          results,
          currency: property.currency ?? "EUR",
          count: results.length
        })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/tourism/calculate-price',
          method: 'POST'
        })
      }
    },
    '/api/tourism/calculate-price'
  )
}
