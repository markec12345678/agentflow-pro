/**
 * Blocked Date Entity
 */

export interface BlockedDateData {
  id: string;
  propertyId: string;
  roomId?: string | null;
  date: Date;
  type:
    | "maintenance"
    | "booked_external"
    | "closed"
    | "staff_use"
    | "renovation";
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BlockedDate {
  public readonly id: string;
  public readonly propertyId: string;
  public readonly roomId?: string | null;
  public readonly date: Date;
  public readonly type: string;
  public readonly reason?: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(data: BlockedDateData) {
    this.id = data.id;
    this.propertyId = data.propertyId;
    this.roomId = data.roomId;
    this.date = data.date;
    this.type = data.type;
    this.reason = data.reason;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
