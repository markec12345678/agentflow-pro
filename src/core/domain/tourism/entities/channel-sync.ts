/**
 * Domain Entity: ChannelSync
 * 
 * Sinhronizacija s kanali (Booking.com, Airbnb, Expedia).
 * Upravlja availability, rates in bookings med kanali.
 */

export type ChannelType = 'booking_com' | 'airbnb' | 'expedia' | 'vrbo' | 'agoda'
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed' | 'partial'
export type SyncDirection = 'push' | 'pull' | 'bidirectional'

export interface ChannelSyncData {
  id: string
  propertyId: string
  channel: ChannelType
  channelId: string // External channel ID
  status: SyncStatus
  direction: SyncDirection
  lastSyncAt?: Date
  nextSyncAt?: Date
  isActive: boolean
  settings: {
    autoSync: boolean
    syncInterval: number // minutes
    pushAvailability: boolean
    pushRates: boolean
    pullBookings: boolean
    conflictResolution: 'channel_wins' | 'property_wins' | 'manual'
  }
  statistics: {
    totalSyncs: number
    successfulSyncs: number
    failedSyncs: number
    lastError?: string
  }
  credentials: {
    apiKey?: string
    apiSecret?: string
    propertyId?: string
    expiresAt?: Date
  }
  createdAt: Date
  updatedAt?: Date
}

export class ChannelSync {
  public readonly id: string
  public readonly propertyId: string
  public readonly channel: ChannelType
  public readonly channelId: string
  public status: SyncStatus
  public readonly direction: SyncDirection
  public lastSyncAt?: Date
  public nextSyncAt?: Date
  public isActive: boolean
  public settings: {
    autoSync: boolean
    syncInterval: number
    pushAvailability: boolean
    pushRates: boolean
    pullBookings: boolean
    conflictResolution: 'channel_wins' | 'property_wins' | 'manual'
  }
  public statistics: {
    totalSyncs: number
    successfulSyncs: number
    failedSyncs: number
    lastError?: string
  }
  public credentials: {
    apiKey?: string
    apiSecret?: string
    propertyId?: string
    expiresAt?: Date
  }
  public readonly createdAt: Date
  public updatedAt?: Date

  constructor(data: ChannelSyncData) {
    this.id = data.id
    this.propertyId = data.propertyId
    this.channel = data.channel
    this.channelId = data.channelId
    this.status = data.status
    this.direction = data.direction
    this.lastSyncAt = data.lastSyncAt
    this.nextSyncAt = data.nextSyncAt
    this.isActive = data.isActive
    this.settings = data.settings
    this.statistics = data.statistics
    this.credentials = data.credentials
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  /**
   * Začni sinhronizacijo
   */
  startSync(): void {
    if (!this.isActive) {
      throw new Error('Channel sync is not active')
    }
    this.status = 'syncing'
    this.updatedAt = new Date()
  }

  /**
   * Končaj sinhronizacijo z uspehom
   */
  completeSync(): void {
    this.status = 'completed'
    this.lastSyncAt = new Date()
    this.nextSyncAt = new Date(Date.now() + this.settings.syncInterval * 60 * 1000)
    this.statistics.totalSyncs += 1
    this.statistics.successfulSyncs += 1
    this.updatedAt = new Date()
  }

  /**
   * Končaj sinhronizacijo z napako
   */
  failSync(error: string): void {
    this.status = 'failed'
    this.statistics.totalSyncs += 1
    this.statistics.failedSyncs += 1
    this.statistics.lastError = error
    this.updatedAt = new Date()
  }

  /**
   * Preveri ali je čas za sinhronizacijo
   */
  isTimeToSync(): boolean {
    if (!this.isActive || !this.settings.autoSync) {
      return false
    }

    if (!this.nextSyncAt) {
      return true
    }

    return new Date() >= this.nextSyncAt
  }

  /**
   * Preveri ali je kanal povezan
   */
  isConnected(): boolean {
    return this.isActive && 
           this.credentials.apiKey !== undefined &&
           (!this.credentials.expiresAt || this.credentials.expiresAt > new Date())
  }

  /**
   * Posodobi credentials
   */
  updateCredentials(apiKey: string, apiSecret?: string, expiresAt?: Date): void {
    this.credentials.apiKey = apiKey
    this.credentials.apiSecret = apiSecret
    this.credentials.expiresAt = expiresAt
    this.updatedAt = new Date()
  }

  /**
   * Aktiviraj kanal
   */
  activate(): void {
    this.isActive = true
    this.nextSyncAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Deaktiviraj kanal
   */
  deactivate(): void {
    this.isActive = false
    this.nextSyncAt = undefined
    this.updatedAt = new Date()
  }

  /**
   * Posodobi nastavitve
   */
  updateSettings(settings: Partial<typeof this.settings>): void {
    this.settings = { ...this.settings, ...settings }
    this.updatedAt = new Date()
  }

  /**
   * Generiraj opis sinhronizacije
   */
  generateDescription(): string {
    const parts: string[] = []

    // Channel name
    parts.push(this.getChannelName())

    // Status
    parts.push(this.getStatusLabel())

    // Last sync
    if (this.lastSyncAt) {
      parts.push(`Last sync: ${this.lastSyncAt.toLocaleDateString()}`)
    }

    // Settings
    const features: string[] = []
    if (this.settings.pushAvailability) features.push('Availability')
    if (this.settings.pushRates) features.push('Rates')
    if (this.settings.pullBookings) features.push('Bookings')
    
    if (features.length > 0) {
      parts.push(`Sync: ${features.join(', ')}`)
    }

    return parts.join(' • ')
  }

  /**
   * Izračunaj success rate
   */
  successRate(): number {
    if (this.statistics.totalSyncs === 0) return 0
    return (this.statistics.successfulSyncs / this.statistics.totalSyncs) * 100
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): ChannelSyncData {
    return {
      id: this.id,
      propertyId: this.propertyId,
      channel: this.channel,
      channelId: this.channelId,
      status: this.status,
      direction: this.direction,
      lastSyncAt: this.lastSyncAt,
      nextSyncAt: this.nextSyncAt,
      isActive: this.isActive,
      settings: this.settings,
      statistics: this.statistics,
      credentials: this.credentials,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      lastSyncAt: this.lastSyncAt?.toISOString(),
      nextSyncAt: this.nextSyncAt?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
      credentials: {
        ...this.credentials,
        expiresAt: this.credentials.expiresAt?.toISOString()
      }
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): ChannelSync {
    return new ChannelSync({
      ...json,
      lastSyncAt: json.lastSyncAt ? new Date(json.lastSyncAt) : undefined,
      nextSyncAt: json.nextSyncAt ? new Date(json.nextSyncAt) : undefined,
      createdAt: new Date(json.createdAt),
      updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
      credentials: {
        ...json.credentials,
        expiresAt: json.credentials.expiresAt ? new Date(json.credentials.expiresAt) : undefined
      }
    })
  }

  /**
   * Ustvari novo ChannelSync
   */
  static create(data: Omit<ChannelSyncData, 'id' | 'createdAt' | 'statistics'>): ChannelSync {
    return new ChannelSync({
      ...data,
      id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      statistics: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0
      }
    })
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private getChannelName(): string {
    const names: Record<ChannelType, string> = {
      booking_com: 'Booking.com',
      airbnb: 'Airbnb',
      expedia: 'Expedia',
      vrbo: 'Vrbo',
      agoda: 'Agoda'
    }
    return names[this.channel] || this.channel
  }

  private getStatusLabel(): string {
    const labels: Record<SyncStatus, string> = {
      pending: 'Pending',
      syncing: 'Syncing',
      completed: 'Completed',
      failed: 'Failed',
      partial: 'Partial'
    }
    return labels[this.status] || this.status
  }
}
