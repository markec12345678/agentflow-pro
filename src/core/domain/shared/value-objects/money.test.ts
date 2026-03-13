/**
 * Unit Test: Money Value Object
 * 
 * Testira denarne operacije.
 */

import { describe, it, expect } from '@jest/globals'
import { Money } from '@/core/domain/shared/value-objects/money'

describe('Money Value Object', () => {
  describe('Creation', () => {
    it('should create money with default EUR currency', () => {
      const money = new Money(100)
      expect(money.amount).toBe(100)
      expect(money.currency).toBe('EUR')
    })

    it('should create money with specified currency', () => {
      const money = new Money(100, 'USD')
      expect(money.amount).toBe(100)
      expect(money.currency).toBe('USD')
    })

    it('should round to 2 decimal places', () => {
      const money = new Money(100.999)
      expect(money.amount).toBe(101) // Rounded
    })

    it('should throw error for negative amount', () => {
      expect(() => new Money(-1)).toThrow('Amount cannot be negative')
    })
  })

  describe('Addition', () => {
    it('should add two money objects with same currency', () => {
      const money1 = new Money(100, 'EUR')
      const money2 = new Money(50, 'EUR')
      const result = money1.add(money2)
      
      expect(result.amount).toBe(150)
      expect(result.currency).toBe('EUR')
    })

    it('should throw error for currency mismatch', () => {
      const money1 = new Money(100, 'EUR')
      const money2 = new Money(50, 'USD')
      
      expect(() => money1.add(money2)).toThrow('Currency mismatch')
    })
  })

  describe('Subtraction', () => {
    it('should subtract two money objects with same currency', () => {
      const money1 = new Money(100, 'EUR')
      const money2 = new Money(30, 'EUR')
      const result = money1.subtract(money2)
      
      expect(result.amount).toBe(70)
      expect(result.currency).toBe('EUR')
    })

    it('should throw error if result would be negative', () => {
      const money1 = new Money(50, 'EUR')
      const money2 = new Money(100, 'EUR')
      
      expect(() => money1.subtract(money2)).toThrow('Result cannot be negative')
    })

    it('should throw error for currency mismatch', () => {
      const money1 = new Money(100, 'EUR')
      const money2 = new Money(50, 'USD')
      
      expect(() => money1.subtract(money2)).toThrow('Currency mismatch')
    })
  })

  describe('Multiplication', () => {
    it('should multiply money by positive number', () => {
      const money = new Money(100, 'EUR')
      const result = money.multiply(3)
      
      expect(result.amount).toBe(300)
      expect(result.currency).toBe('EUR')
    })

    it('should multiply money by float', () => {
      const money = new Money(100, 'EUR')
      const result = money.multiply(1.5)
      
      expect(result.amount).toBe(150)
    })

    it('should throw error for negative multiplier', () => {
      const money = new Money(100, 'EUR')
      
      expect(() => money.multiply(-2)).toThrow('Multiplier cannot be negative')
    })
  })

  describe('Discount', () => {
    it('should apply 10% discount', () => {
      const money = new Money(100, 'EUR')
      const result = money.applyDiscount(10)
      
      expect(result.amount).toBe(90)
    })

    it('should apply 15% discount', () => {
      const money = new Money(200, 'EUR')
      const result = money.applyDiscount(15)
      
      expect(result.amount).toBe(170)
    })

    it('should throw error for discount > 100', () => {
      const money = new Money(100, 'EUR')
      
      expect(() => money.applyDiscount(150)).toThrow('Discount must be between 0 and 100')
    })

    it('should throw error for negative discount', () => {
      const money = new Money(100, 'EUR')
      
      expect(() => money.applyDiscount(-10)).toThrow('Discount must be between 0 and 100')
    })
  })

  describe('Comparison', () => {
    it('should check equality', () => {
      const money1 = new Money(100, 'EUR')
      const money2 = new Money(100, 'EUR')
      const money3 = new Money(200, 'EUR')
      
      expect(money1.equals(money2)).toBe(true)
      expect(money1.equals(money3)).toBe(false)
    })

    it('should check greater than', () => {
      const money1 = new Money(100, 'EUR')
      const money2 = new Money(50, 'EUR')
      
      expect(money1.greaterThan(money2)).toBe(true)
      expect(money2.greaterThan(money1)).toBe(false)
    })

    it('should check less than', () => {
      const money1 = new Money(50, 'EUR')
      const money2 = new Money(100, 'EUR')
      
      expect(money1.lessThan(money2)).toBe(true)
      expect(money2.lessThan(money1)).toBe(false)
    })

    it('should throw error for currency mismatch in comparison', () => {
      const money1 = new Money(100, 'EUR')
      const money2 = new Money(50, 'USD')
      
      expect(() => money1.greaterThan(money2)).toThrow('Currency mismatch')
    })
  })

  describe('Conversion', () => {
    it('should convert to string', () => {
      const money = new Money(100.50, 'EUR')
      expect(money.toString()).toBe('EUR 100.50')
    })

    it('should convert to number', () => {
      const money = new Money(100.50, 'EUR')
      expect(money.toNumber()).toBe(100.5)
    })

    it('should convert to JSON', () => {
      const money = new Money(100.50, 'EUR')
      expect(money.toJSON()).toEqual({
        amount: 100.5,
        currency: 'EUR'
      })
    })

    it('should create from JSON', () => {
      const json = { amount: 100.50, currency: 'EUR' }
      const money = Money.fromJSON(json)
      
      expect(money.amount).toBe(100.5)
      expect(money.currency).toBe('EUR')
    })

    it('should create zero money', () => {
      const money = Money.zero('EUR')
      
      expect(money.amount).toBe(0)
      expect(money.currency).toBe('EUR')
    })
  })
})
