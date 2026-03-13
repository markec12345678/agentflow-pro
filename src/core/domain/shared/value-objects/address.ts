/**
 * Value Object: Address
 * 
 * Naslov nastanitve ali druge lokacije.
 */

export class Address {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly country: string,
    public readonly region?: string,
    public readonly latitude?: number,
    public readonly longitude?: number
  ) {
    if (!street.trim()) {
      throw new Error('Street cannot be empty')
    }
    if (!city.trim()) {
      throw new Error('City cannot be empty')
    }
    if (!postalCode.trim()) {
      throw new Error('Postal code cannot be empty')
    }
    if (!country.trim()) {
      throw new Error('Country cannot be empty')
    }
  }

  /**
   * Formatiraj naslov za display
   */
  toString(): string {
    const parts = [
      this.street,
      this.postalCode + ' ' + this.city,
      this.region,
      this.country
    ].filter(Boolean)
    
    return parts.join(', ')
  }

  /**
   * Formatiraj za pošiljanje (samo ulica in mesto)
   */
  toMailFormat(): string {
    return `${this.street}\n${this.postalCode} ${this.city}\n${this.country}`
  }

  /**
   * Preveri ali je v določeni državi
   */
  isInCountry(country: string): boolean {
    return this.country.toLowerCase() === country.toLowerCase()
  }

  /**
   * Preveri ali je v določenem mestu
   */
  isInCity(city: string): boolean {
    return this.city.toLowerCase() === city.toLowerCase()
  }

  /**
   * Izračuna razdaljo do drugih koordinat (v km)
   */
  distanceTo(latitude: number, longitude: number): number | null {
    if (!this.latitude || !this.longitude) {
      return null
    }

    const R = 6371 // Earth radius in km
    const dLat = this.toRad(latitude - this.latitude)
    const dLon = this.toRad(longitude - this.longitude)
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.latitude)) *
      Math.cos(this.toRad(latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Primerja z drugim naslovom
   */
  equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.city === other.city &&
      this.postalCode === other.postalCode &&
      this.country === other.country &&
      this.region === other.region
    )
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): any {
    return {
      street: this.street,
      city: this.city,
      postalCode: this.postalCode,
      country: this.country,
      region: this.region,
      latitude: this.latitude,
      longitude: this.longitude
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: any): Address {
    return new Address(
      json.street,
      json.city,
      json.postalCode,
      json.country,
      json.region,
      json.latitude,
      json.longitude
    )
  }

  /**
   * Ustvari iz preprostih podatkov
   */
  static create(data: {
    street: string
    city: string
    postalCode: string
    country: string
    region?: string
  }): Address {
    return new Address(
      data.street,
      data.city,
      data.postalCode,
      data.country,
      data.region
    )
  }
}
