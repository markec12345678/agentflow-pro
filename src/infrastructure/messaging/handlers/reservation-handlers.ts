/**
 * Reservation Event Handlers
 * 
 * Handlerji za reservation domain evente.
 */

import {
  ReservationCreated,
  ReservationConfirmed,
  ReservationCancelled,
  ReservationCheckedIn,
  ReservationCheckedOut
} from '@/core/domain/tourism/events/reservation-events'
import { eventBus } from '@/infrastructure/messaging/in-memory-event-bus'
import { logger } from '@/infrastructure/observability/logger';

// ============================================================================
// Reservation Created Handler
// ============================================================================

export class ReservationCreatedHandler {
  async handle(event: ReservationCreated): Promise<void> {
    logger.info('Handling ReservationCreated:', {
      reservationId: event.reservationId,
      propertyId: event.propertyId,
      guestId: event.guestId,
      checkIn: event.checkIn,
      totalPrice: event.totalPrice.amount
    })

    // 1. Pošlji confirmation email gostu
    // await this.sendConfirmationEmail(event)

    // 2. Posodobi koledar (block dates)
    // await this.blockCalendar(event)

    // 3. Obvesti property manager-ja
    // await this.notifyManager(event)

    // 4. Shrani v analytics
    // await this.trackAnalytics(event)
  }

  private async sendConfirmationEmail(event: ReservationCreated): Promise<void> {
    // TODO: Implement email sending
    logger.info(`Sending confirmation email to guest ${event.guestId}`)
  }

  private async blockCalendar(event: ReservationCreated): Promise<void> {
    // TODO: Block dates in calendar
    logger.info(`Blocking calendar from ${event.checkIn} to ${event.checkOut}`)
  }

  private async notifyManager(event: ReservationCreated): Promise<void> {
    // TODO: Notify property manager
    logger.info(`Notifying manager about new reservation ${event.reservationId}`)
  }

  private async trackAnalytics(event: ReservationCreated): Promise<void> {
    // TODO: Track in analytics
    logger.info(`Tracking reservation analytics for ${event.reservationId}`)
  }
}

// ============================================================================
// Reservation Confirmed Handler
// ============================================================================

export class ReservationConfirmedHandler {
  async handle(event: ReservationConfirmed): Promise<void> {
    logger.info('Handling ReservationConfirmed:', {
      reservationId: event.reservationId,
      confirmedAt: event.confirmedAt,
      confirmationCode: event.confirmationCode
    })

    // 1. Pošlji potrditveni email s confirmation code
    // await this.sendConfirmationCodeEmail(event)

    // 2. Omogoči online check-in
    // await this.enableOnlineCheckIn(event)
  }
}

// ============================================================================
// Reservation Cancelled Handler
// ============================================================================

export class ReservationCancelledHandler {
  async handle(event: ReservationCancelled): Promise<void> {
    logger.info('Handling ReservationCancelled:', {
      reservationId: event.reservationId,
      reason: event.reason,
      cancelledBy: event.cancelledBy,
      refundAmount: event.refundAmount?.amount
    })

    // 1. Obdelaj refundacijo
    // if (event.refundAmount) {
    //   await this.processRefund(event)
    // }

    // 2. Sprosti datume v koledarju
    // await this.freeCalendar(event)

    // 3. Pošlji cancellation email
    // await this.sendCancellationEmail(event)

    // 4. Posodobi statistiko
    // await this.updateCancellationStats(event)
  }
}

// ============================================================================
// Register Handlers
// ============================================================================

export function registerReservationEventHandlers(): void {
  const createdHandler = new ReservationCreatedHandler()
  const confirmedHandler = new ReservationConfirmedHandler()
  const cancelledHandler = new ReservationCancelledHandler()

  eventBus.subscribe(ReservationCreated, createdHandler.handle.bind(createdHandler))
  eventBus.subscribe(ReservationConfirmed, confirmedHandler.handle.bind(confirmedHandler))
  eventBus.subscribe(ReservationCancelled, cancelledHandler.handle.bind(cancelledHandler))

  logger.info('Reservation event handlers registered')
}
