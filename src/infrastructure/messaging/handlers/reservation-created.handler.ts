/**
 * Event Handler: Reservation Created
 * 
 * Obdeluje dogodek ReservationCreated.
 * Pošlje confirmation email, posodobi koledar, obvesti manager-ja.
 */

import { ReservationCreated } from '@/core/domain/tourism/events/reservation-events'
import { logger } from '@/infrastructure/observability/logger';
import { eventBus } from '@/infrastructure/messaging/in-memory-event-bus'

// ============================================================================
// Handler Class
// ============================================================================

export class ReservationCreatedHandler {
  /**
   * Handle ReservationCreated event
   */
  async handle(event: ReservationCreated): Promise<void> {
    logger.info('Handling ReservationCreated event:', event.eventId)

    try {
      // 1. Pošlji confirmation email gostu
      await this.sendConfirmationEmail(event)

      // 2. Posodobi koledar (block dates)
      await this.updateCalendar(event)

      // 3. Obvesti property manager-ja
      await this.notifyManager(event)

      // 4. Shrani v analytics
      await this.trackAnalytics(event)

      logger.info('ReservationCreated event handled successfully')
    } catch (error) {
      logger.error('Error handling ReservationCreated event:', error)
      // V productionu: pošlji v error tracking (Sentry)
      throw error
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Pošlji confirmation email
   */
  private async sendConfirmationEmail(event: ReservationCreated): Promise<void> {
    // TODO: Implement email service
    // const emailService = new EmailService()
    
    const emailData = {
      to: event.guestId, // TODO: Get guest email from repository
      subject: 'Potrditev rezervacije - AgentFlow Pro',
      body: `
        Spoštovani,
        
        Vaša rezervacija je potrjena!
        
        Podrobnosti:
        - Rezervacija ID: ${event.reservationId}
        - Confirmation Code: ${event.confirmationCode}
        - Property ID: ${event.propertyId}
        - Check-in: ${event.dateRange.start.toISOString()}
        - Check-out: ${event.dateRange.end.toISOString()}
        - Gostje: ${event.guests}
        - Skupna cena: ${event.totalPrice.toString()}
        
        Veselimo se vašega obiska!
        
        Lep pozdrav,
        AgentFlow Pro Team
      `
    }

    logger.info('Sending confirmation email:', emailData)
    // await emailService.send(emailData)
  }

  /**
   * Posodobi koledar (block dates)
   */
  private async updateCalendar(event: ReservationCreated): Promise<void> {
    // TODO: Implement calendar service
    // const calendarService = new CalendarService()
    
    const calendarData = {
      propertyId: event.propertyId,
      dates: {
        start: event.dateRange.start,
        end: event.dateRange.end
      },
      status: 'booked',
      reservationId: event.reservationId
    }

    logger.info('Updating calendar:', calendarData)
    // await calendarService.blockDates(calendarData)
  }

  /**
   * Obvesti property manager-ja
   */
  private async notifyManager(event: ReservationCreated): Promise<void> {
    // TODO: Implement notification service
    // const notificationService = new NotificationService()
    
    // TODO: Get property manager ID from property
    const managerId = 'manager-123' // Placeholder
    
    const notification = {
      userId: managerId,
      type: 'new_reservation',
      title: 'Nova rezervacija',
      message: `Nova rezervacija ${event.confirmationCode} za property ${event.propertyId}`,
      data: {
        reservationId: event.reservationId,
        propertyId: event.propertyId,
        confirmationCode: event.confirmationCode,
        guests: event.guests,
        dateRange: event.dateRange
      }
    }

    logger.info('Notifying manager:', notification)
    // await notificationService.send(notification)
  }

  /**
   * Shrani v analytics
   */
  private async trackAnalytics(event: ReservationCreated): Promise<void> {
    // TODO: Implement analytics service
    // const analyticsService = new AnalyticsService()
    
    const analyticsData = {
      event: 'reservation_created',
      timestamp: event.timestamp,
      data: {
        reservationId: event.reservationId,
        propertyId: event.propertyId,
        guestId: event.guestId,
        totalPrice: event.totalPrice.amount,
        currency: event.totalPrice.currency,
        guests: event.guests,
        nights: event.dateRange.nights()
      }
    }

    logger.info('Tracking analytics:', analyticsData)
    // await analyticsService.track(analyticsData)
  }
}

// ============================================================================
// Register Handler
// ============================================================================

// Registriraj handler ob zagonu aplikacije
const handler = new ReservationCreatedHandler()
eventBus.subscribe(ReservationCreated, handler.handle.bind(handler))

logger.info('ReservationCreatedHandler registered')
