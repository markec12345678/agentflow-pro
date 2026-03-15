/**
 * Event Handler: Reservation Cancelled
 * 
 * Obdeluje dogodek ReservationCancelled.
 * Pošlje refundacijo, obvesti manager-ja, posodobi koledar.
 */

import { ReservationCancelled } from '@/core/domain/tourism/events/reservation-events'
import { logger } from '@/infrastructure/observability/logger';
import { eventBus } from '@/infrastructure/messaging/in-memory-event-bus'

// ============================================================================
// Handler Class
// ============================================================================

export class ReservationCancelledHandler {
  /**
   * Handle ReservationCancelled event
   */
  async handle(event: ReservationCancelled): Promise<void> {
    logger.info('Handling ReservationCancelled event:', event.eventId)

    try {
      // 1. Process refund (if applicable)
      if (event.refundAmount && event.refundAmount.amount > 0) {
        await this.processRefund(event)
      }

      // 2. Update calendar (free up dates)
      await this.updateCalendar(event)

      // 3. Notify property manager
      await this.notifyManager(event)

      // 4. Send cancellation confirmation to guest
      await this.sendCancellationEmail(event)

      // 5. Track analytics
      await this.trackAnalytics(event)

      logger.info('ReservationCancelled event handled successfully')
    } catch (error) {
      logger.error('Error handling ReservationCancelled event:', error)
      throw error
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Obdelaj refundacijo
   */
  private async processRefund(event: ReservationCancelled): Promise<void> {
    // TODO: Implement payment gateway refund
    // const paymentGateway = new PaymentGateway()
    
    const refundData = {
      reservationId: event.reservationId,
      amount: event.refundAmount.amount,
      currency: event.refundAmount.currency,
      reason: event.reason,
      cancelledBy: event.cancelledBy
    }

    logger.info('Processing refund:', refundData)
    // await paymentGateway.refund(refundData)
  }

  /**
   * Posodobi koledar (free up dates)
   */
  private async updateCalendar(event: ReservationCancelled): Promise<void> {
    // TODO: Implement calendar service
    // const calendarService = new CalendarService()
    
    // Pridobi datum rezervacije (bi moral biti v event-u ali preko repository-ja)
    // Za zdaj samo logiramo
    
    logger.info('Updating calendar - freeing dates for reservation:', event.reservationId)
    // await calendarService.freeDates({
    //   reservationId: event.reservationId,
    //   status: 'available'
    // })
  }

  /**
   * Obvesti property manager-ja
   */
  private async notifyManager(event: ReservationCancelled): Promise<void> {
    // TODO: Get property manager ID
    const managerId = 'manager-123' // Placeholder
    
    const notification = {
      userId: managerId,
      type: 'reservation_cancelled',
      title: 'Rezervacija preklicana',
      message: `Rezervacija ${event.reservationId} je bila preklicana.`,
      data: {
        reservationId: event.reservationId,
        reason: event.reason,
        cancelledBy: event.cancelledBy,
        refundAmount: event.refundAmount?.toJSON()
      }
    }

    logger.info('Notifying manager:', notification)
    // await notificationService.send(notification)
  }

  /**
   * Pošlji cancellation email gostu
   */
  private async sendCancellationEmail(event: ReservationCancelled): Promise<void> {
    // TODO: Get guest email
    // const guest = await guestRepo.findById(event.guestId)
    
    const emailData = {
      to: 'guest@example.com', // TODO: Get from guest repository
      subject: 'Potrdilo o preklicu rezervacije',
      body: `
        Spoštovani,
        
        Vaša rezervacija je bila preklicana.
        
        Podrobnosti:
        - Rezervacija ID: ${event.reservationId}
        - Razlog za preklic: ${event.reason}
        - Preklical: ${event.cancelledBy === 'guest' ? 'Gost' : event.cancelledBy === 'host' ? 'Gostitelj' : 'Sistem'}
        ${event.refundAmount && event.refundAmount.amount > 0 ? 
          `- Refundacija: ${event.refundAmount.toString()}` : 
          '- Brez refundacije'}
        
        V primeru vprašanj smo vam na voljo.
        
        Lep pozdrav,
        AgentFlow Pro Team
      `
    }

    logger.info('Sending cancellation email:', emailData)
    // await emailService.send(emailData)
  }

  /**
   * Shrani v analytics
   */
  private async trackAnalytics(event: ReservationCancelled): Promise<void> {
    const analyticsData = {
      event: 'reservation_cancelled',
      timestamp: event.timestamp,
      data: {
        reservationId: event.reservationId,
        reason: event.reason,
        cancelledBy: event.cancelledBy,
        refundAmount: event.refundAmount?.amount || 0,
        hasRefund: event.refundAmount && event.refundAmount.amount > 0
      }
    }

    logger.info('Tracking analytics:', analyticsData)
    // await analyticsService.track(analyticsData)
  }
}

// ============================================================================
// Register Handler
// ============================================================================

const handler = new ReservationCancelledHandler()
eventBus.subscribe(ReservationCancelled, handler.handle.bind(handler))

logger.info('ReservationCancelledHandler registered')
