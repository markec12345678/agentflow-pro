/**
 * Domain Entity: Guest
 * 
 * Predstavlja gosta v sistemu.
 * Vsebuje osebne podatke, preference in zgodovino rezervacij.
 */

import { Money } from '../shared/value-objects/money'

export type GuestTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type CommunicationPreference = 'email' | 'phone' | 'whatsapp' | 'sms'

export interface GuestPreferences {
  communicationChannel: CommunicationPreference
  language: string
  specialRequests?: string[]
  dietaryRestrictions?: string[]
  roomPreferences?: {
    floor?: 'low' | 'high'
    view?: 'sea' | 'mountain' | 'city' | 'garden'
    bedType?: 'single' | 'double' | 'king'
    smoking?: boolean
  }
  newsletterOptIn: boolean
}

export interface GuestData {
  id: string
  email: string
  phone?: string
  firstName: string
  lastName: string
  dateOfBirth?: Date
  nationality?: string
  idDocument?: {
    type: 'passport' | 'id_card' | 'drivers_license'
    number: string
    expiryDate?: Date
  }
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  preferences: GuestPreferences
  loyaltyPoints: number
  tier: GuestTier
  totalStays: number
  totalSpent: Money
  createdAt: Date
  updatedAt: Date
  notes?: string
  blacklisted: boolean
  blacklistReason?: string
}

export class Guest {
  public readonly id: string
  public email: string
  public phone?: string
  public firstName: string
  public lastName: string
  public dateOfBirth?: Date
  public nationality?: string
  public idDocument?: GuestData['idDocument']
  public address?: GuestData['address']
  public preferences: GuestPreferences
  public loyaltyPoints: number
  public tier: GuestTier
  public totalStays: number
  public totalSpent: Money
  public createdAt: Date
  public updatedAt: Date
  public notes?: string
  public blacklisted: boolean
  public blacklistReason?: string

  constructor(data: GuestData) {
    this.id = data.id
    this.email = data.email
    this.phone = data.phone
    this.firstName = data.firstName
    this.lastName = data.lastName
    this.dateOfBirth = data.dateOfBirth
    this.nationality = data.nationality
    this.idDocument = data.idDocument
    this.address = data.address
    this.preferences = data.preferences
    this.loyaltyPoints = data.loyaltyPoints
    this.tier = data.tier
    this.totalStays = data.totalStays
    this.totalSpent = data.totalSpent
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.notes = data.notes
    this.blacklisted = data.blacklisted
    this.blacklistReason = data.blacklistReason
  }

  /**
   * Polno ime gosta
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`
  }

  /**
   * Dodaj točke zvestobe
   */
  addLoyaltyPoints(points: number): void {
    if (points < 0) {
      throw new Error('Points cannot be negative')
    }
    this.loyaltyPoints += points
    this.updateTier()
    this.updatedAt = new Date()
  }

  /**
   * Odštej točke zvestobe
   */
  useLoyaltyPoints(points: number): void {
    if (points < 0) {
      throw new Error('Points cannot be negative')
    }
    if (points > this.loyaltyPoints) {
      throw new Error('Not enough points')
    }
    this.loyaltyPoints -= points
    this.updatedAt = new Date()
  }

  /**
   * Posodobi status (tier) glede na točke
   */
  private updateTier(): void {
    if (this.loyaltyPoints >= 10000) {
      this.tier = 'platinum'
    } else if (this.loyaltyPoints >= 5000) {
      this.tier = 'gold'
    } else if (this.loyaltyPoints >= 1000) {
      this.tier = 'silver'
    } else {
      this.tier = 'bronze'
    }
  }

  /**
   * Zabeleži uspešno bivanje
   */
  recordStay(amountSpent: Money): void {
    this.totalStays += 1
    this.totalSpent = this.totalSpent.add(amountSpent)
    
    // Dodaj točke (1 točka na €10)
    const pointsEarned = Math.floor(amountSpent.amount / 10)
    this.addLoyaltyPoints(pointsEarned)
    
    this.updatedAt = new Date()
  }

  /**
   * Preveri ali ima gost določeno preferenco
   */
  hasPreference(preference: keyof GuestPreferences['roomPreferences']): boolean {
    return this.preferences.roomPreferences?.[preference] !== undefined
  }

  /**
   * Dodaj posebno zahtevo
   */
  addSpecialRequest(request: string): void {
    if (!this.preferences.specialRequests) {
      this.preferences.specialRequests = []
    }
    if (!this.preferences.specialRequests.includes(request)) {
      this.preferences.specialRequests.push(request)
    }
    this.updatedAt = new Date()
  }

  /**
   * Dodaj prehransko omejitev
   */
  addDietaryRestriction(restriction: string): void {
    if (!this.preferences.dietaryRestrictions) {
      this.preferences.dietaryRestrictions = []
    }
    if (!this.preferences.dietaryRestrictions.includes(restriction)) {
      this.preferences.dietaryRestrictions.push(restriction)
    }
    this.updatedAt = new Date()
  }

  /**
   * Nastavi komunikacijski kanal
   */
  setCommunicationChannel(channel: CommunicationPreference): void {
    this.preferences.communicationChannel = channel
    this.updatedAt = new Date()
  }

  /**
   * Nastavi jezik komunikacije
   */
  setLanguage(language: string): void {
    this.preferences.language = language
    this.updatedAt = new Date()
  }

  /**
   * Prijava na newsletter
   */
  subscribeToNewsletter(): void {
    this.preferences.newsletterOptIn = true
    this.updatedAt = new Date()
  }

  /**
   * Odjava iz newsletterja
   */
  unsubscribeFromNewsletter(): void {
    this.preferences.newsletterOptIn = false
    this.updatedAt = new Date()
  }

  /**
   * Črni seznam - dodaj gosta
   */
  blacklist(reason: string): void {
    this.blacklisted = true
    this.blacklistReason = reason
    this.updatedAt = new Date()
  }

  /**
   * Odstrani iz črnega seznama
   */
  unblacklist(): void {
    this.blacklisted = false
    this.blacklistReason = undefined
    this.updatedAt = new Date()
  }

  /**
   * Dodaj opombo
   */
  addNote(note: string): void {
    this.notes = this.notes ? `${this.notes}\n${note}` : note
    this.updatedAt = new Date()
  }

  /**
   * Posodobi osebne podatke
   */
  updateProfile(data: Partial<Pick<Guest, 'firstName' | 'lastName' | 'email' | 'phone'>>): void {
    if (data.firstName) this.firstName = data.firstName
    if (data.lastName) this.lastName = data.lastName
    if (data.email) this.email = data.email
    if (data.phone) this.phone = data.phone
    this.updatedAt = new Date()
  }

  /**
   * Posodobi ID dokument
   */
  updateIdDocument(doc: GuestData['idDocument']): void {
    this.idDocument = doc
    this.updatedAt = new Date()
  }

  /**
   * Posodobi naslov
   */
  updateAddress(address: GuestData['address']): void {
    this.address = address
    this.updatedAt = new Date()
  }

  /**
   * Pretvori v Plain Object
   */
  toObject(): GuestData {
    return {
      id: this.id,
      email: this.email,
      phone: this.phone,
      firstName: this.firstName,
      lastName: this.lastName,
      dateOfBirth: this.dateOfBirth,
      nationality: this.nationality,
      idDocument: this.idDocument,
      address: this.address,
      preferences: this.preferences,
      loyaltyPoints: this.loyaltyPoints,
      tier: this.tier,
      totalStays: this.totalStays,
      totalSpent: this.totalSpent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      notes: this.notes,
      blacklisted: this.blacklisted,
      blacklistReason: this.blacklistReason
    }
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      ...this.toObject(),
      totalSpent: this.totalSpent.toJSON(),
      dateOfBirth: this.dateOfBirth?.toISOString(),
      idDocument: this.idDocument ? {
        ...this.idDocument,
        expiryDate: this.idDocument.expiryDate?.toISOString()
      } : undefined
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): Guest {
    return new Guest({
      ...json,
      totalSpent: Money.fromJSON(json.totalSpent),
      dateOfBirth: json.dateOfBirth ? new Date(json.dateOfBirth) : undefined,
      idDocument: json.idDocument ? {
        ...json.idDocument,
        expiryDate: json.idDocument.expiryDate ? new Date(json.idDocument.expiryDate) : undefined
      } : undefined,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    })
  }

  /**
   * Ustvari novega gosta
   */
  static create(data: {
    id: string
    email: string
    firstName: string
    lastName: string
    phone?: string
  }): Guest {
    return new Guest({
      id: data.id,
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      preferences: {
        communicationChannel: 'email',
        language: 'sl',
        newsletterOptIn: false
      },
      loyaltyPoints: 0,
      tier: 'bronze',
      totalStays: 0,
      totalSpent: Money.zero('EUR'),
      createdAt: new Date(),
      updatedAt: new Date(),
      blacklisted: false
    })
  }
}
