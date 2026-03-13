/**
 * Use Case: Upload Guest Document
 * 
 * Upload guest identification document (GDPR compliant).
 */

import { GuestDocument } from '../domain/tourism/entities/guest-document'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface UploadGuestDocumentInput {
  file: File
  reservationId: string
  guestEmail: string
  propertyId: string
  documentType?: 'id_document' | 'passport' | 'visa' | 'other'
}

export interface UploadGuestDocumentOutput {
  success: boolean
  documentId: string
  filename: string
  expiresAt: Date
}

// ============================================================================
// Use Case Class
// ============================================================================

export class UploadGuestDocument {
  constructor(
    private documentRepository: GuestDocumentRepository,
    private reservationRepository: ReservationRepository,
    private fileStorage: FileStorageService
  ) {}

  /**
   * Upload guest identification document
   */
  async execute(input: UploadGuestDocumentInput): Promise<UploadGuestDocumentOutput> {
    const { file, reservationId, guestEmail, propertyId, documentType = 'id_document' } = input

    // 1. Validate file
    this.validateFile(file)

    // 2. Verify reservation exists and belongs to property
    const reservation = await this.reservationRepository.findById(reservationId)
    
    if (!reservation) {
      throw new Error('Reservation not found')
    }

    if (reservation.propertyId !== propertyId) {
      throw new Error('Reservation does not belong to this property')
    }

    // 3. Verify email matches
    if (reservation.guestEmail !== guestEmail) {
      throw new Error('Email mismatch')
    }

    // 4. Generate secure filename
    const filename = this.generateSecureFilename(file)

    // 5. Save file to secure storage
    const filePath = await this.fileStorage.save(file, filename, propertyId)

    // 6. Create document entity
    const document = GuestDocument.create({
      reservationId,
      type: documentType,
      filename,
      filePath,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      expiresAt: this.calculateExpiryDate()
    })

    // 7. Save document metadata
    await this.documentRepository.save(document)

    return {
      success: true,
      documentId: document.id,
      filename,
      expiresAt: document.expiresAt
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.')
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit')
    }
  }

  /**
   * Generate secure filename
   */
  private generateSecureFilename(file: File): string {
    const extension = file.name.split('.').pop() || 'bin'
    const uuid = this.generateUUID()
    return `${uuid}.${extension}`
  }

  /**
   * Calculate document expiry date (90 days)
   */
  private calculateExpiryDate(): Date {
    return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  }

  /**
   * Generate UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}

// ============================================================================
// Repository/Service Interfaces
// ============================================================================

export interface GuestDocumentRepository {
  save(document: GuestDocument): Promise<void>
  findById(id: string): Promise<GuestDocument | null>
  findByReservation(reservationId: string): Promise<GuestDocument[]>
  delete(id: string): Promise<void>
}

export interface ReservationRepository {
  findById(id: string): Promise<any | null>
}

export interface FileStorageService {
  save(file: File, filename: string, propertyId: string): Promise<string>
  delete(filePath: string): Promise<void>
  get(filePath: string): Promise<Buffer>
}
