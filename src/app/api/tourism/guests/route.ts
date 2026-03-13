/**
 * API Route: Get Guests
 * 
 * Refactored to use GetGuests use case
 * 
 * From: ~45 vrstic
 * To: ~35 vrstic (-22%)
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getUserId } from "@/lib/auth-users"
import { GetGuests } from "@/core/use-cases/get-guests"
import { handleApiError, withRequestLogging } from "@/app/api/middleware"

/**
 * GET /api/tourism/guests
 * Get guests with filtering and search
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
        const propertyId = searchParams.get("propertyId") || undefined
        const q = searchParams.get("q") || undefined
        const limit = parseInt(searchParams.get("limit") || "20")
        const offset = parseInt(searchParams.get("offset") || "0")

        // 3. Execute use case
        const useCase = new GetGuests(
          {} as any, // TODO: Inject guest repository
          {} as any  // TODO: Inject property repository
        )

        const result = await useCase.execute({
          userId,
          propertyId,
          searchQuery: q && q.length >= 2 ? q : undefined,
          limit,
          offset
        })

        // 4. Return response
        return NextResponse.json(result)
      } catch (error) {
        return handleApiError(error, {
          route: "/api/tourism/guests",
          method: "GET"
        })
      }
    },
    "/api/tourism/guests"
  )
}
