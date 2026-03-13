/**
 * E2E Test: Complete Booking Flow
 * 
 * Testira celoten flow: Create → Confirm → CheckIn → CheckOut
 */

import { test, expect } from '@playwright/test'

test.describe('Booking Flow E2E', () => {
  test('should complete full booking lifecycle', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3002/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('http://localhost:3002/dashboard')

    // 2. Navigate to reservations
    await page.click('text=Rezervacije')
    await expect(page).toHaveURL('http://localhost:3002/dashboard/reservations')

    // 3. Create new reservation
    await page.click('text=Nova rezervacija')
    await expect(page.locator('h1')).toContainText('Ustvari rezervacijo')

    // Fill reservation form
    await page.selectOption('select[name="propertyId"]', 'property-123')
    await page.selectOption('select[name="guestId"]', 'guest-456')
    await page.fill('input[name="checkIn"]', '2026-07-01')
    await page.fill('input[name="checkOut"]', '2026-07-08')
    await page.fill('input[name="guests"]', '2')
    await page.fill('textarea[name="notes"]', 'Test reservation')

    await page.click('button[type="submit"]')

    // 4. Verify reservation created
    await expect(page.locator('.toast-success')).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard\/reservations\/res_/)

    // Get reservation ID from URL
    const url = page.url()
    const reservationId = url.split('/').pop()

    // 5. Verify reservation details
    await expect(page.locator('text=Potrjena')).toBeVisible()
    await expect(page.locator('text=2 gosta')).toBeVisible()
    await expect(page.locator('text=7 nočitev')).toBeVisible()

    // 6. Confirm reservation
    await page.click('button:has-text("Potrdi")')
    await expect(page.locator('.toast-success')).toBeVisible()

    // 7. Process check-in
    await page.click('text=Check-in')
    await page.fill('input[name="accessCode"]', '123456')
    await page.click('button:has-text("Opravi check-in")')
    await expect(page.locator('.toast-success')).toBeVisible()

    // 8. Process check-out
    await page.click('text=Check-out')
    await page.click('button:has-text("Opravi check-out")')
    await expect(page.locator('.toast-success')).toBeVisible()

    // 9. Verify completion
    await expect(page.locator('text=Zaključeno')).toBeVisible()
    await expect(page.locator('text=Plačano')).toBeVisible()
  })

  test('should cancel reservation with refund', async ({ page }) => {
    // Login and navigate to reservation
    await page.goto('http://localhost:3002/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.click('text=Rezervacije')
    await page.click('text=Test Reservation')

    // Cancel reservation
    await page.click('button:has-text("Prekliči")')
    await page.selectOption('select[name="cancelledBy"]', 'guest')
    await page.fill('textarea[name="reason"]', 'Emergency - flight cancelled')
    await page.click('button:has-text("Potrdi preklic")')

    // Verify cancellation
    await expect(page.locator('.toast-success')).toBeVisible()
    await expect(page.locator('text=Preklicano')).toBeVisible()
    await expect(page.locator('text=Refundacija')).toBeVisible()
  })

  test('should display validation errors', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/reservations/new')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Verify validation errors
    await expect(page.locator('text=Property is required')).toBeVisible()
    await expect(page.locator('text=Guest is required')).toBeVisible()
    await expect(page.locator('text=Check-in date is required')).toBeVisible()
    await expect(page.locator('text=Check-out date is required')).toBeVisible()
  })

  test('should filter reservations', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/reservations')

    // Filter by status
    await page.selectOption('select[name="status"]', 'confirmed')
    await expect(page.locator('.reservation-card')).toHaveCount(1)

    // Filter by guest
    await page.selectOption('select[name="guestId"]', 'guest-456')
    await expect(page.locator('.reservation-card')).toHaveCount(1)

    // Clear filters
    await page.click('button:has-text("Počisti filtre")')
    await expect(page.locator('.reservation-card')).toHaveCount(2)
  })
})
