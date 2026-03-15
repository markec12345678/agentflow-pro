/**
 * Value Object: Email
 *
 * Neizmenljiv objekt za email naslove.
 * Zagotavlja validacijo in type-safety.
 */

export class Email {
  public readonly value: string

  constructor(value: string) {
    // Normalize to lowercase
    const normalized = value.trim().toLowerCase()
    
    if (!this.isValidEmail(normalized)) {
      throw new Error(`Invalid email format: ${value}`)
    }

    this.value = normalized
  }

  /**
   * Validacija email formata
   */
  private isValidEmail(email: string): boolean {
    // RFC 5322 compliant regex (simplified for practical use)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!emailRegex.test(email)) {
      return false
    }

    const [local, domain] = email.split('@')
    
    // Local part checks
    if (!local || local.length > 64) {
      return false
    }
    
    // Domain checks
    if (!domain || domain.length > 255) {
      return false
    }
    
    if (!domain.includes('.')) {
      return false
    }

    const tld = domain.split('.').pop()
    if (!tld || tld.length < 2) {
      return false
    }

    return true
  }

  /**
   * Get local part (before @)
   */
  get localPart(): string {
    return this.value.split('@')[0]
  }

  /**
   * Get domain part (after @)
   */
  get domain(): string {
    return this.value.split('@')[1]
  }

  /**
   * Get top-level domain
   */
  get tld(): string {
    const parts = this.domain.split('.')
    return parts[parts.length - 1]
  }

  /**
   * Preveri če je enak drugemu emailu
   */
  equals(other: Email): boolean {
    return this.value === other.value
  }

  /**
   * Preveri če ima enak domain
   */
  sameDomain(other: Email): boolean {
    return this.domain === other.domain
  }

  /**
   * Pretvori v string
   */
  toString(): string {
    return this.value
  }

  /**
   * Pretvori v JSON
   */
  toJSON(): string {
    return this.value
  }

  /**
   * Ustvari iz JSON
   */
  static fromJSON(json: string): Email {
    return new Email(json)
  }

  /**
   * Ustvari iz stringa
   */
  static fromString(value: string): Email {
    return new Email(value)
  }

  /**
   * Try create - vrne null namesto exceptiona
   */
  static tryCreate(value: string): Email | null {
    try {
      return new Email(value)
    } catch {
      return null
    }
  }

  /**
   * Preveri če je email validen (brez metanja exceptiona)
   */
  static isValid(value: string): boolean {
    try {
      new Email(value)
      return true
    } catch {
      return false
    }
  }
}
