/**
 * Value Object: Money
 * 
 * Neizmenljiv objekt za denarne vrednosti.
 * Zagotavlja type-safety za denarne operacije.
 */

export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'EUR'
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative')
    }
    
    // Zaokroži na 2 decimalni mesti
    this.amount = Math.round(amount * 100) / 100
  }

  /**
   * Sešteje dve denarni vrednosti
   */
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`)
    }
    return new Money(this.amount + other.amount, this.currency)
  }

  /**
   * Odšteje denarno vrednost
   */
  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`)
    }
    const result = this.amount - other.amount
    if (result < 0) {
      throw new Error('Result cannot be negative')
    }
    return new Money(result, this.currency)
  }

  /**
   * Pomnoži z multiplikatorjem
   */
  multiply(multiplier: number): Money {
    if (multiplier < 0) {
      throw new Error('Multiplier cannot be negative')
    }
    return new Money(this.amount * multiplier, this.currency)
  }

  /**
   * Uporabi popust (v %)
   */
  applyDiscount(percent: number): Money {
    if (percent < 0 || percent > 100) {
      throw new Error('Discount must be between 0 and 100')
    }
    const discountAmount = this.amount * (percent / 100)
    return new Money(this.amount - discountAmount, this.currency)
  }

  /**
   * Primerja dve denarni vrednosti
   */
  equals(other: Money): boolean {
    return this.currency === other.currency && this.amount === other.amount
  }

  /**
   * Preveri če je večji od drugega
   */
  greaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`)
    }
    return this.amount > other.amount
  }

  /**
   * Preveri če je manjši od drugega
   */
  lessThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`)
    }
    return this.amount < other.amount
  }

  /**
   * Pretvori v string (za display)
   */
  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`
  }

  /**
   * Pretvori v število
   */
  toNumber(): number {
    return this.amount
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.amount,
      currency: this.currency
    }
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: { amount: number; currency?: string }): Money {
    return new Money(json.amount, json.currency || 'EUR')
  }

  /**
   * Ničelna vrednost
   */
  static zero(currency: string = 'EUR'): Money {
    return new Money(0, currency)
  }
}
