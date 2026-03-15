/**
 * Value Object: GuestCount
 *
 * Neizmenljiv objekt za število gostov.
 * Zagotavlja validacijo in type-safety.
 */

export class GuestCount {
  constructor(
    public readonly adults: number,
    public readonly children: number = 0,
    public readonly infants: number = 0
  ) {
    if (adults < 1) {
      throw new Error('At least one adult is required')
    }
    if (adults > 50) {
      throw new Error('Maximum 50 adults allowed')
    }
    if (children < 0) {
      throw new Error('Children count cannot be negative')
    }
    if (infants < 0) {
      throw new Error('Infants count cannot be negative')
    }
  }

  /**
   * Skupno število oseb
   */
  total(): number {
    return this.adults + this.children + this.infants
  }

  /**
   * Preveri če presega kapaciteto
   */
  exceedsCapacity(maxCapacity: number): boolean {
    return this.total() > maxCapacity
  }

  /**
   * Primerja z drugim GuestCount
   */
  equals(other: GuestCount): boolean {
    return (
      this.adults === other.adults &&
      this.children === other.children &&
      this.infants === other.infants
    )
  }

  /**
   * Sešteje dva GuestCount
   */
  add(other: GuestCount): GuestCount {
    return new GuestCount(
      this.adults + other.adults,
      this.children + other.children,
      this.infants + other.infants
    )
  }

  /**
   * Pretvori v string
   */
  toString(): string {
    const parts: string[] = []
    parts.push(`${this.adults} odraslih`)
    if (this.children > 0) {
      parts.push(`${this.children} otrok`)
    }
    if (this.infants > 0) {
      parts.push(`${this.infants} dojenčkov`)
    }
    return parts.join(', ')
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): { adults: number; children: number; infants: number; total: number } {
    return {
      adults: this.adults,
      children: this.children,
      infants: this.infants,
      total: this.total()
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: { adults: number; children?: number; infants?: number }): GuestCount {
    return new GuestCount(
      json.adults,
      json.children || 0,
      json.infants || 0
    )
  }

  /**
   * Ustvari samo z odraslimi
   */
  static adults(count: number): GuestCount {
    return new GuestCount(count)
  }

  /**
   * Ustvari z odraslimi in otroki
   */
  static withChildren(adults: number, children: number): GuestCount {
    return new GuestCount(adults, children)
  }
}
