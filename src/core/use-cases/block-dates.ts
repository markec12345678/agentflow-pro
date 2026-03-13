/**
 * Use Case: Block Dates
 * 
 * Blokiranje datumov za sobe ali property.
 * Uporablja se za preprečevanje booking-ov (maintenance, external bookings, itd.)
 */

import { DateBlock } from '../domain/tourism/entities/date-block'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface BlockDatesInput {
  propertyId: string
  roomId?: string
  roomTypeId?: string
  startDate: Date
  endDate: Date
  type: 'maintenance' | 'booked_external' | 'closed' | 'staff_use' | 'renovation'
  reason?: string
  notes?: string
  userId: string
  allDay?: boolean
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly'
    interval: number
    endDate?: Date
  }
}

export interface BlockDatesOutput {
  success: boolean
  blockId: string
  dates: Date[]
  totalDays: number
  conflicts?: string[]
}

export interface UnblockDatesInput {
  blockId: string
  userId: string
}

export interface GetBlockedDatesInput {
  propertyId: string
  roomId?: string
  startDate: Date
  endDate: Date
  type?: string
}

export interface GetBlockedDatesOutput {
  blocks: DateBlock[]
  totalBlocks: number
  totalDays: number
}

// ============================================================================
// Use Case Class
// ============================================================================

export class BlockDates {
  constructor(
    private blockRepository: BlockRepository
  ) {}

  /**
   * Blokiranje datumov
   */
  async execute(input: BlockDatesInput): Promise<BlockDatesOutput> {
    const { propertyId, roomId, roomTypeId, startDate, endDate, type, reason, notes, userId, recurring } = input

    // 1. Validacija input-a
    this.validateInput(input)

    // 2. Preveri konflikte z obstoječimi bloki
    const conflicts = await this.checkConflicts(propertyId, roomId, roomTypeId, startDate, endDate)

    if (conflicts.length > 0) {
      return {
        success: false,
        blockId: '',
        dates: this.generateDates(startDate, endDate, recurring),
        totalDays: this.calculateDays(startDate, endDate),
        conflicts
      }
    }

    // 3. Ustvari blok
    const block = DateBlock.create({
      propertyId,
      roomId,
      roomTypeId,
      type,
      scope: roomId ? 'room' : roomTypeId ? 'room_type' : 'property',
      startDate,
      endDate,
      reason,
      notes,
      createdBy: userId,
      allDay: allDay ?? true,
      recurring
    })

    // 4. Shrani blok
    await this.blockRepository.save(block)

    // 5. Generiraj datume
    const dates = this.generateDates(startDate, endDate, recurring)

    return {
      success: true,
      blockId: block.id,
      dates,
      totalDays: dates.length,
      conflicts: []
    }
  }

  /**
   * Odstrani blok
   */
  async unblock(input: UnblockDatesInput): Promise<void> {
    const { blockId, userId } = input

    // 1. Pridobi blok
    const block = await this.blockRepository.findById(blockId)
    
    if (!block) {
      throw new Error('Block not found')
    }

    // 2. Odstrani blok
    await this.blockRepository.delete(blockId)
  }

  /**
   * Pridobi blokirane datume
   */
  async getBlockedDates(input: GetBlockedDatesInput): Promise<GetBlockedDatesOutput> {
    const { propertyId, roomId, startDate, endDate, type } = input

    // 1. Pridobi vse bloke za property
    const blocks = await this.blockRepository.findByPropertyAndDateRange(
      propertyId,
      startDate,
      endDate,
      roomId,
      type
    )

    // 2. Filtriraj samo aktivne bloke
    const activeBlocks = blocks.filter(block => block.isActive())

    // 3. Izračunaj skupno število dni
    const totalDays = activeBlocks.reduce((sum, block) => {
      return sum + block.durationInDays()
    }, 0)

    return {
      blocks: activeBlocks,
      totalBlocks: activeBlocks.length,
      totalDays
    }
  }

  /**
   * Podaljšaj blok
   */
  async extendBlock(blockId: string, days: number): Promise<void> {
    const block = await this.blockRepository.findById(blockId)
    
    if (!block) {
      throw new Error('Block not found')
    }

    block.extend(days)
    await this.blockRepository.save(block)
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Validiraj input
   */
  private validateInput(input: BlockDatesInput): void {
    const { startDate, endDate, roomId, roomTypeId } = input

    if (startDate >= endDate) {
      throw new Error('End date must be after start date')
    }

    if (!roomId && !roomTypeId) {
      throw new Error('Either roomId or roomTypeId must be provided')
    }

    if (roomId && roomTypeId) {
      throw new Error('Cannot provide both roomId and roomTypeId')
    }

    if (startDate < new Date()) {
      throw new Error('Cannot block dates in the past')
    }
  }

  /**
   * Preveri konflikte z obstoječimi bloki
   */
  private async checkConflicts(
    propertyId: string,
    roomId: string | undefined,
    roomTypeId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<string[]> {
    const conflicts: string[] = []

    // Pridobi obstoječe bloke
    const existingBlocks = await this.blockRepository.findByPropertyAndDateRange(
      propertyId,
      startDate,
      endDate,
      roomId,
      undefined
    )

    // Preveri prekrivanja
    const newBlock = DateBlock.create({
      propertyId,
      roomId,
      roomTypeId,
      type: 'maintenance',
      scope: roomId ? 'room' : 'room_type',
      startDate,
      endDate,
      createdBy: 'system'
    })

    for (const block of existingBlocks) {
      if (newBlock.overlapsWith(block)) {
        conflicts.push(`Conflict with block ${block.id} (${block.type})`)
      }
    }

    return conflicts
  }

  /**
   * Generiraj seznam datumov
   */
  private generateDates(
    startDate: Date,
    endDate: Date,
    recurring?: { pattern: string; interval: number; endDate?: Date }
  ): Date[] {
    const dates: Date[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  /**
   * Izračunaj število dni
   */
  private calculateDays(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface BlockRepository {
  findById(id: string): Promise<DateBlock | null>
  findByProperty(propertyId: string): Promise<DateBlock[]>
  findByPropertyAndDateRange(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    roomId?: string,
    type?: string
  ): Promise<DateBlock[]>
  save(block: DateBlock): Promise<void>
  delete(id: string): Promise<void>
  findConflicts(
    propertyId: string,
    roomId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<DateBlock[]>
}
