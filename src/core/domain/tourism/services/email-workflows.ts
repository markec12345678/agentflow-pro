/**
 * AgentFlow Pro - Email Workflows Configuration (TOURISM-EMAIL-ROADMAP §3)
 * Trigger-based email automation for tourism: booking, pre-arrival, during-stay, post-stay, re-booking.
 */

export type EmailWorkflowTrigger =
  | "reservation.created"
  | "reservation.check_in"
  | "reservation.stay_day"
  | "reservation.check_out";

export type EmailWorkflowDelay =
  | "immediate"
  | "-7_days"
  | "-24h"
  | "+1_day"
  | "+2_days"
  | "+60_days";

export interface EmailWorkflowConfig {
  trigger: EmailWorkflowTrigger;
  delay: EmailWorkflowDelay;
  channels?: string[];
  variables?: string[];
  upsell_opportunities?: string[];
  review_platforms?: string[];
}

export const EMAIL_WORKFLOWS: Record<string, EmailWorkflowConfig> = {
  booking_confirmation: {
    trigger: "reservation.created",
    delay: "immediate",
    channels: ["email", "sms", "whatsapp"],
    variables: ["guest_name", "property_name", "check_in", "check_out", "total_price"],
  },
  pre_arrival: {
    trigger: "reservation.check_in",
    delay: "-7_days",
    upsell_opportunities: ["airport_transfer", "early_checkin", "breakfast"],
    variables: ["local_events", "weather_forecast", "parking_info"],
  },
  check_in_instructions: {
    trigger: "reservation.check_in",
    delay: "-24h",
    channels: ["email", "sms"],
    variables: ["access_info", "parking", "wifi", "contact"],
  },
  during_stay_upsell: {
    trigger: "reservation.stay_day",
    delay: "+2_days",
    upsell_opportunities: ["spa", "dining", "late_checkout", "room_upgrade"],
    variables: ["guest_preferences", "previous_purchases"],
  },
  post_stay_review: {
    trigger: "reservation.check_out",
    delay: "+1_day",
    channels: ["email", "sms"],
    review_platforms: ["Booking.com", "Google", "TripAdvisor"],
  },
  re_booking_campaign: {
    trigger: "reservation.check_out",
    delay: "+60_days",
    variables: ["seasonal_offers", "loyalty_discount", "same_dates_discount"],
  },
};
