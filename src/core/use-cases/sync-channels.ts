/**
 * Use Case: Sync Channels
 * 
 * Sinhronizacija availability, rates in bookings z kanali (Booking.com, Airbnb, itd.)
 */

import { ChannelSync } from '../domain/tourism/entities/channel-sync'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface SyncChannelsInput {
  propertyId: string
  channelIds?: string[]
  syncType: 'availability' | 'rates' | 'bookings' | 'full'
  force?: boolean
  userId: string
}

export interface SyncChannelsOutput {
  success: boolean
  syncId: string
  channels: ChannelSyncResult[]
  totalChannels: number
  successfulChannels: number
  failedChannels: number
  startedAt: Date
  completedAt?: Date
}

export interface ChannelSyncResult {
  channelId: string
  channelName: string
  success: boolean
  status: 'pending' | 'syncing' | 'completed' | 'failed'
  itemsSynced: number
  errors?: string[]
  duration: number
}

export interface PushRatesInput {
  propertyId: string
  channelIds?: string[]
  rates: RateUpdate[]
  userId: string
}

export interface RateUpdate {
  roomId: string
  date: Date
  rate: number
  currency: string
  minStay?: number
}

export interface PullBookingsOutput {
  success: boolean
  bookings: BookingImport[]
  totalBookings: number
}

export interface BookingImport {
  externalId: string
  channel: string
  roomId: string
  checkIn: Date
  checkOut: Date
  guests: number
  totalPrice: number
  status: 'confirmed' | 'pending' | 'cancelled'
  guestEmail?: string
  guestName?: string
}

// ============================================================================
// Use Case Class
// ============================================================================

export class SyncChannels {
  constructor(
    private channelRepository: ChannelRepository,
    private availabilityRepository: AvailabilityRepository,
    private bookingRepository: BookingRepository,
    private channelApiClient: ChannelApiClient
  ) {}

  /**
   * Sinhroniziraj kanale
   */
  async execute(input: SyncChannelsInput): Promise<SyncChannelsOutput> {
    const { propertyId, channelIds, syncType, force, userId } = input

    // 1. Pridobi kanale za property
    const channels = await this.channelRepository.findByProperty(propertyId)
    
    // Filtriraj po channelIds če so podani
    const filteredChannels = channelIds
      ? channels.filter(c => channelIds.includes(c.id))
      : channels

    // Filtriraj samo aktivne kanale
    const activeChannels = filteredChannels.filter(c => c.isActive)

    // 2. Pripravi rezultate
    const syncId = `sync_${Date.now()}`
    const startedAt = new Date()
    const results: ChannelSyncResult[] = []

    let successfulCount = 0
    let failedCount = 0

    // 3. Sinhroniziraj vsak kanal
    for (const channel of activeChannels) {
      const result = await this.syncChannel(channel, syncType, force)
      results.push(result)

      if (result.success) {
        successfulCount++
        channel.completeSync()
      } else {
        failedCount++
        channel.failSync(result.errors?.join('; ') || 'Unknown error')
      }

      // Shrani posodobitve kanala
      await this.channelRepository.save(channel)
    }

    return {
      success: failedCount === 0,
      syncId,
      channels: results,
      totalChannels: activeChannels.length,
      successfulChannels: successfulCount,
      failedChannels: failedCount,
      startedAt,
      completedAt: new Date()
    }
  }

  /**
   * Push rates na kanale
   */
  async pushRates(input: PushRatesInput): Promise<void> {
    const { propertyId, channelIds, rates, userId } = input

    // Pridobi kanale
    const channels = await this.channelRepository.findByProperty(propertyId)
    const filteredChannels = channelIds
      ? channels.filter(c => channelIds.includes(c.id))
      : channels

    // Push na vsak kanal
    for (const channel of filteredChannels) {
      if (!channel.settings.pushRates) continue
      if (!channel.isConnected()) continue

      try {
        channel.startSync()
        
        // Push rates through API
        await this.channelApiClient.pushRates(channel.channel, channel.credentials, rates)
        
        channel.completeSync()
      } catch (error: any) {
        channel.failSync(error.message)
      }

      await this.channelRepository.save(channel)
    }
  }

  /**
   * Pull bookings iz kanalov
   */
  async pullBookings(propertyId: string): Promise<PullBookingsOutput> {
    // Pridobi kanale
    const channels = await this.channelRepository.findByProperty(propertyId)
    const activeChannels = channels.filter(c => c.isActive && c.settings.pullBookings)

    const allBookings: BookingImport[] = []

    // Pull iz vsakega kanala
    for (const channel of activeChannels) {
      if (!channel.isConnected()) continue

      try {
        const bookings = await this.channelApiClient.pullBookings(
          channel.channel,
          channel.credentials,
          propertyId
        )

        // Shrani booking-e v lokalno bazo
        for (const booking of bookings) {
          await this.bookingRepository.create({
            ...booking,
            propertyId,
            source: 'channel',
            externalId: booking.externalId
          })
          allBookings.push(booking)
        }

        channel.completeSync()
      } catch (error: any) {
        channel.failSync(error.message)
      }

      await this.channelRepository.save(channel)
    }

    return {
      success: true,
      bookings: allBookings,
      totalBookings: allBookings.length
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async syncChannel(
    channel: ChannelSync,
    syncType: string,
    force: boolean = false
  ): Promise<ChannelSyncResult> {
    const startTime = Date.now()
    const result: ChannelSyncResult = {
      channelId: channel.id,
      channelName: channel.getChannelName(),
      success: false,
      status: 'pending',
      itemsSynced: 0,
      errors: [],
      duration: 0
    }

    try {
      // Preveri ali je kanal povezan
      if (!channel.isConnected()) {
        throw new Error('Channel not connected')
      }

      // Preveri ali je čas za sync
      if (!force && !channel.isTimeToSync()) {
        result.status = 'pending'
        result.errors = ['Not time to sync']
        return result
      }

      // Začni sync
      channel.startSync()
      result.status = 'syncing'

      let itemsSynced = 0

      // Sync availability
      if (syncType === 'full' || syncType === 'availability') {
        if (channel.settings.pushAvailability) {
          const availability = await this.availabilityRepository.getPropertyAvailability(channel.propertyId)
          await this.channelApiClient.pushAvailability(channel.channel, channel.credentials, availability)
          itemsSynced += availability.length
        }
      }

      // Sync rates
      if (syncType === 'full' || syncType === 'rates') {
        if (channel.settings.pushRates) {
          // TODO: Get rates and push
          itemsSynced += 1
        }
      }

      // Sync bookings
      if (syncType === 'full' || syncType === 'bookings') {
        if (channel.settings.pullBookings) {
          const bookings = await this.channelApiClient.pullBookings(channel.channel, channel.credentials, channel.propertyId)
          itemsSynced += bookings.length
        }
      }

      // Končaj sync
      result.success = true
      result.status = 'completed'
      result.itemsSynced = itemsSynced

    } catch (error: any) {
      result.success = false
      result.status = 'failed'
      result.errors = [error.message]
    }

    result.duration = Date.now() - startTime
    return result
  }
}

// ============================================================================
// Repository/API Interfaces
// ============================================================================

export interface ChannelRepository {
  findById(id: string): Promise<ChannelSync | null>
  findByProperty(propertyId: string): Promise<ChannelSync[]>
  save(channel: ChannelSync): Promise<void>
  delete(id: string): Promise<void>
}

export interface AvailabilityRepository {
  getPropertyAvailability(propertyId: string): Promise<any[]>
}

export interface BookingRepository {
  create(booking: any): Promise<void>
}

export interface ChannelApiClient {
  pushAvailability(channel: string, credentials: any, availability: any[]): Promise<void>
  pushRates(channel: string, credentials: any, rates: RateUpdate[]): Promise<void>
  pullBookings(channel: string, credentials: any, propertyId: string): Promise<BookingImport[]>
}
