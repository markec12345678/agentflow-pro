/**
 * Unit Test: DateRange Value Object
 * 
 * Testira operacije s časovnimi obdobji.
 */

import { describe, it, expect } from '@jest/globals'
import { DateRange } from '@/core/domain/shared/value-objects/date-range'

describe('DateRange Value Object', () => {
  describe('Creation', () => {
    it('should create date range', () => {
      const start = new Date('2026-07-01')
      const end = new Date('2026-07-08')
      const range = new DateRange(start, end)
      
      expect(range.start).toEqual(start)
      expect(range.end).toEqual(end)
    })

    it('should throw error if start >= end', () => {
      const start = new Date('2026-07-08')
      const end = new Date('2026-07-01')
      
      expect(() => new DateRange(start, end)).toThrow('Start date must be before end date')
    })

    it('should normalize to start/end of day', () => {
      const start = new Date('2026-07-01T15:30:00')
      const end = new Date('2026-07-08T10:15:00')
      const range = new DateRange(start, end)
      
      expect(range.start.getHours()).toBe(0)
      expect(range.end.getHours()).toBe(0)
    })
  })

  describe('Duration', () => {
    it('should calculate duration in days', () => {
      const start = new Date('2026-07-01')
      const end = new Date('2026-07-08')
      const range = new DateRange(start, end)
      
      expect(range.durationInDays()).toBe(7)
    })

    it('should calculate nights', () => {
      const start = new Date('2026-07-01')
      const end = new Date('2026-07-08')
      const range = new DateRange(start, end)
      
      expect(range.nights()).toBe(7)
    })

    it('should handle single night stay', () => {
      const start = new Date('2026-07-01')
      const end = new Date('2026-07-02')
      const range = new DateRange(start, end)
      
      expect(range.durationInDays()).toBe(1)
      expect(range.nights()).toBe(1)
    })
  })

  describe('Overlap Detection', () => {
    it('should detect overlapping ranges', () => {
      const range1 = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      const range2 = new DateRange(
        new Date('2026-07-05'),
        new Date('2026-07-12')
      )
      
      expect(range1.overlaps(range2)).toBe(true)
      expect(range2.overlaps(range1)).toBe(true)
    })

    it('should detect non-overlapping ranges', () => {
      const range1 = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      const range2 = new DateRange(
        new Date('2026-07-10'),
        new Date('2026-07-17')
      )
      
      expect(range1.overlaps(range2)).toBe(false)
    })

    it('should detect adjacent ranges as non-overlapping', () => {
      const range1 = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      const range2 = new DateRange(
        new Date('2026-07-08'),
        new Date('2026-07-15')
      )
      
      expect(range1.overlaps(range2)).toBe(false)
    })
  })

  describe('Contains', () => {
    it('should check if date is within range', () => {
      const range = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      
      expect(range.contains(new Date('2026-07-04'))).toBe(true)
      expect(range.contains(new Date('2026-06-15'))).toBe(false)
      expect(range.contains(new Date('2026-07-10'))).toBe(false)
    })

    it('should check if range is within another range', () => {
      const range1 = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-15')
      )
      const range2 = new DateRange(
        new Date('2026-07-05'),
        new Date('2026-07-10')
      )
      
      expect(range1.containsRange(range2)).toBe(true)
      expect(range2.containsRange(range1)).toBe(false)
    })
  })

  describe('Merge', () => {
    it('should merge overlapping ranges', () => {
      const range1 = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      const range2 = new DateRange(
        new Date('2026-07-05'),
        new Date('2026-07-12')
      )
      
      const merged = range1.merge(range2)
      
      expect(merged).not.toBeNull()
      expect(merged!.start).toEqual(new Date('2026-07-01'))
      expect(merged!.end).toEqual(new Date('2026-07-12'))
    })

    it('should merge adjacent ranges', () => {
      const range1 = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      const range2 = new DateRange(
        new Date('2026-07-08'),
        new Date('2026-07-15')
      )
      
      const merged = range1.merge(range2)
      
      expect(merged).not.toBeNull()
      expect(merged!.start).toEqual(new Date('2026-07-01'))
      expect(merged!.end).toEqual(new Date('2026-07-15'))
    })

    it('should return null for non-overlapping ranges', () => {
      const range1 = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      const range2 = new DateRange(
        new Date('2026-07-15'),
        new Date('2026-07-22')
      )
      
      const merged = range1.merge(range2)
      
      expect(merged).toBeNull()
    })
  })

  describe('Split', () => {
    it('should split range into equal parts', () => {
      const range = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-10')
      )
      
      const parts = range.split(3)
      
      expect(parts.length).toBe(3)
      expect(parts[0].nights()).toBe(3)
      expect(parts[1].nights()).toBe(3)
      expect(parts[2].nights()).toBe(3)
    })

    it('should handle uneven split', () => {
      const range = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      
      const parts = range.split(3)
      
      expect(parts.length).toBe(3)
      expect(parts[0].nights()).toBe(3)
      expect(parts[1].nights()).toBe(3)
      expect(parts[2].nights()).toBe(1) // Remaining
    })

    it('should throw error for non-positive days', () => {
      const range = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      
      expect(() => range.split(0)).toThrow('Days must be positive')
      expect(() => range.split(-1)).toThrow('Days must be positive')
    })
  })

  describe('Equality', () => {
    it('should check equality', () => {
      const range1 = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      const range2 = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      const range3 = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-15')
      )
      
      expect(range1.equals(range2)).toBe(true)
      expect(range1.equals(range3)).toBe(false)
    })
  })

  describe('Conversion', () => {
    it('should convert to string', () => {
      const range = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      
      expect(range.toString()).toContain('2026-07-01')
      expect(range.toString()).toContain('2026-07-08')
    })

    it('should convert to JSON', () => {
      const range = new DateRange(
        new Date('2026-07-01'),
        new Date('2026-07-08')
      )
      
      expect(range.toJSON()).toEqual({
        start: '2026-07-01T00:00:00.000Z',
        end: '2026-07-08T00:00:00.000Z'
      })
    })

    it('should create from JSON', () => {
      const json = {
        start: '2026-07-01T00:00:00.000Z',
        end: '2026-07-08T00:00:00.000Z'
      }
      
      const range = DateRange.fromJSON(json)
      
      expect(range.start).toEqual(new Date('2026-07-01'))
      expect(range.end).toEqual(new Date('2026-07-08'))
    })

    it('should create from dates', () => {
      const start = new Date('2026-07-01')
      const end = new Date('2026-07-08')
      
      const range = DateRange.fromDates(start, end)
      
      expect(range.start).toEqual(start)
      expect(range.end).toEqual(end)
    })

    it('should create today range', () => {
      const range = DateRange.today()
      const today = new Date()
      
      expect(range.start.toDateString()).toBe(today.toDateString())
      expect(range.end.toDateString()).toBe(today.toDateString())
    })
  })
})
