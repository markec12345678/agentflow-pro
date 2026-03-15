/**
 * Guest Document Entity (GDPR)
 *
 * Represents uploaded guest identification document
 */

export interface GuestDocumentData {
  id: string;
  reservationId: string;
  type: "id_document" | "passport" | "visa" | "other";
  filename: string;
  filePath: string;
  mimeType: string;
  size: number;
  expiresAt: Date;
  createdAt: Date;
}

export class GuestDocument {
  public readonly id: string;
  public readonly reservationId: string;
  public readonly type: string;
  public readonly filename: string;
  public readonly filePath: string;
  public readonly mimeType: string;
  public readonly size: number;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;

  constructor(data: GuestDocumentData) {
    this.id = data.id;
    this.reservationId = data.reservationId;
    this.type = data.type;
    this.filename = data.filename;
    this.filePath = data.filePath;
    this.mimeType = data.mimeType;
    this.size = data.size;
    this.expiresAt = data.expiresAt;
    this.createdAt = data.createdAt;
  }

  static create(
    data: Omit<GuestDocumentData, "id" | "createdAt">,
  ): GuestDocument {
    return new GuestDocument({
      ...data,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    });
  }
}
