/**
 * AgentFlow Pro - Guest ID Upload
 * Refactored to use UploadGuestDocument use case
 * 
 * From: 97 vrstic
 * To: ~50 vrstic (-48%)
 */

import { NextRequest, NextResponse } from "next/server"
import { UploadGuestDocument } from "@/core/use-cases/upload-guest-document"
import { handleApiError, withRequestLogging } from "@/app/api/middleware"

export const dynamic = "force-dynamic"

/**
 * POST /api/guest/upload-id
 * Upload guest identification document (GDPR compliant)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
): Promise<NextResponse<any>> {
  return withRequestLogging(
    request,
    async () => {
      try {
        const { propertyId } = await params
        const formData = await request.formData()
        
        const file = formData.get("file") as File
        const reservationId = formData.get("reservationId") as string
        const guestEmail = formData.get("guestEmail") as string
        const documentType = formData.get("documentType") as any || 'id_document'

        // Validate required fields
        if (!file) {
          return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        if (!reservationId) {
          return NextResponse.json({ error: "Missing reservation ID" }, { status: 400 })
        }

        // Execute use case
        const useCase = new UploadGuestDocument(
          // TODO: Inject real repositories
          {} as any,
          {} as any,
          {} as any
        )

        const result = await useCase.execute({
          file,
          reservationId,
          guestEmail,
          propertyId,
          documentType
        })

        return NextResponse.json({
          success: true,
          message: "Document uploaded successfully",
          documentId: result.documentId,
          filename: result.filename,
          expiresAt: result.expiresAt
        })
      } catch (error) {
        return handleApiError(error, {
          route: '/api/v1/guest/upload-id',
          method: 'POST'
        })
      }
    },
    '/api/v1/guest/upload-id'
  )
}
