/**
 * AgentFlow Pro - Guest Communication Channels & AI Message Types
 * See docs/TOURISM-EMAIL-ROADMAP.md §13
 *
 * COMMUNICATION_CHANNELS – channel config with provider and SLA
 * AI_MESSAGE_TYPES – confidence thresholds and HITL rules for AI-generated messages
 * Integration with hitl.ts – use these thresholds instead of single CONFIDENCE_THRESHOLD
 */

export const COMMUNICATION_CHANNELS = {
  whatsapp: {
    provider: "Twilio/Meta",
    use_cases: [
      "check_in_instructions",
      "upsell_offers",
      "urgent_notifications",
    ],
    response_time_sla: "<15_minutes",
  },
  sms: {
    provider: "Twilio",
    use_cases: [
      "otp_verification",
      "emergency_alerts",
      "booking_confirmations",
    ],
    response_time_sla: "<5_minutes",
  },
  email: {
    provider: "SendGrid/Resend",
    use_cases: [
      "invoices",
      "detailed_information",
      "marketing_campaigns",
    ],
    response_time_sla: "<1_hour",
  },
  ota_messaging: {
    platforms: ["Booking.com", "Airbnb", "Expedia"],
    use_cases: ["guest_inquiries", "reservation_changes"],
    response_time_sla: "<1_hour",
  },
} as const;

export const AI_MESSAGE_TYPES = {
  inquiry_response: { confidence_threshold: 0.85, hitl_below: true },
  upsell_offer: { confidence_threshold: 0.75, hitl_below: false },
  complaint_handling: { confidence_threshold: 0.9, hitl_below: true },
  review_response: { confidence_threshold: 0.8, hitl_below: true },
} as const;

export type CommunicationChannel = keyof typeof COMMUNICATION_CHANNELS;
export type AIMessageType = keyof typeof AI_MESSAGE_TYPES;
