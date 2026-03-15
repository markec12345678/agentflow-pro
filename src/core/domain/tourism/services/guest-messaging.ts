/**
 * AgentFlow Pro - Guest Messaging System
 * WhatsApp/SMS integration for guest communication
 */

import { prisma } from "@/database/schema";

export interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  channel: "email" | "whatsapp" | "sms";
  trigger: "booking_confirmation" | "pre_arrival" | "check_in" | "during_stay" | "check_out" | "post_stay";
}

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "booking_confirmation",
    name: "Potrdilo rezervacije",
    subject: "Potrdilo rezervacije - {{property_name}}",
    body: "Pozdravljeni {{guest_name}},\n\nVaša rezervacija je potrjena!\n\nCheck-in: {{check_in}}\nCheck-out: {{check_out}}\nŠtevilo gostov: {{guests}}\n\nVeseli se vašega obiska!\n\n{{property_name}}",
    variables: ["guest_name", "property_name", "check_in", "check_out", "guests"],
    channel: "email",
    trigger: "booking_confirmation",
  },
  {
    id: "pre_arrival",
    name: "Pred prihodom",
    subject: "Priprave na vaš prihodu - {{property_name}}",
    body: "Pozdravljeni {{guest_name}},\n\nVeselimo se vašega obiska {{check_in}}!\n\nCheck-in: od {{check_in_time}}\nNaslov: {{address}}\nParkiranje: {{parking_info}}\n\nZa dodatne informacije smo vam na voljo.\n\nLep pozdrav,\n{{property_name}}",
    variables: ["guest_name", "property_name", "check_in", "check_in_time", "address", "parking_info"],
    channel: "email",
    trigger: "pre_arrival",
  },
  {
    id: "check_in_instructions",
    name: "Navodila za check-in",
    subject: "Navodila za prihodu - {{property_name}}",
    body: "Pozdravljeni {{guest_name}},\n\nTukaj so navodila za check-in:\n\n📍 Naslov: {{address}}\n🔑 Koda za vrata: {{door_code}}\n📶 WiFi geslo: {{wifi_password}}\n\nVeselimo se vašega obiska!\n\n{{property_name}}",
    variables: ["guest_name", "property_name", "address", "door_code", "wifi_password"],
    channel: "whatsapp",
    trigger: "check_in",
  },
  {
    id: "during_stay",
    name: "Med bivanjem",
    subject: "Kako je vaše bivanje? - {{property_name}}",
    body: "Pozdravljeni {{guest_name}},\n\nUpamo, da uživate v vašem bivanju!\n\nAli potrebujete kakšno pomoč ali priporočila za lokalne atrakcije?\n\nOdgovorite na to sporočilo in z veseljem vam bomo pomagali.\n\nLep pozdrav,\n{{property_name}}",
    variables: ["guest_name", "property_name"],
    channel: "whatsapp",
    trigger: "during_stay",
  },
  {
    id: "check_out",
    name: "Check-out opomnik",
    subject: "Check-out danes - {{property_name}}",
    body: "Pozdravljeni {{guest_name}},\n\nDanes je dan check-outa. Prosimo, zapustite sobo do {{check_out_time}}.\n\n🔑 Ključe pustite na {{key_return_location}}\n\nHvala za obisk in vabimo vas spet!\n\n{{property_name}}",
    variables: ["guest_name", "property_name", "check_out_time", "key_return_location"],
    channel: "whatsapp",
    trigger: "check_out",
  },
  {
    id: "post_stay_review",
    name: "Prošnja za recenzijo",
    subject: "Hvala za obisk! - {{property_name}}",
    body: "Pozdravljeni {{guest_name}},\n\nHvala, da ste bili naši gostje!\n\nBi bili tako prijazni in delili vašo izkušnjo z drugimi?\n\n📝 Napišite recenzijo: {{review_link}}\n\nVeseli se vašega ponovnega obiska!\n\n{{property_name}}",
    variables: ["guest_name", "property_name", "review_link"],
    channel: "email",
    trigger: "post_stay",
  },
];

/**
 * Send message to guest
 */
export async function sendGuestMessage(data: {
  reservationId: string;
  templateId: string;
  channel?: "email" | "whatsapp" | "sms";
  customVariables?: Record<string, string>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { reservationId, templateId, customVariables } = data;

    // Get reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        property: true,
      },
    });

    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }

    // Get template
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // Prepare variables
    const variables = {
      guest_name: reservation.guestName || "Gost",
      property_name: reservation.property.name,
      check_in: formatDate(reservation.checkIn),
      check_out: formatDate(reservation.checkOut),
      check_in_time: reservation.property.checkInTime || "15:00",
      check_out_time: reservation.property.checkOutTime || "11:00",
      guests: String(reservation.guests || 1),
      address: reservation.property.address || "",
      door_code: reservation.property.metadata?.doorCode || "",
      wifi_password: reservation.property.metadata?.wifiPassword || "",
      parking_info: reservation.property.metadata?.parkingInfo || "",
      key_return_location: reservation.property.metadata?.keyReturnLocation || "recepacija",
      review_link: getReviewLink(reservation),
      ...customVariables,
    };

    // Replace variables in template
    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);

    // Send message
    let messageId: string | undefined;

    if (template.channel === "email") {
      messageId = await sendEmail({
        to: reservation.guestEmail,
        subject,
        body,
      });
    } else if (template.channel === "whatsapp") {
      messageId = await sendWhatsApp({
        to: reservation.guestPhone,
        body,
      });
    } else if (template.channel === "sms") {
      messageId = await sendSMS({
        to: reservation.guestPhone,
        body,
      });
    }

    // Log message
    await prisma.guestMessage.create({
      data: {
        reservationId,
        templateId,
        channel: template.channel,
        subject,
        body,
        status: "sent",
        sentAt: new Date(),
        metadata: {
          messageId,
        },
      },
    });

    return { success: true, messageId };
  } catch (error) {
    logger.error("[Guest Messaging] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Schedule automated messages for reservation
 */
export async function scheduleAutomatedMessages(reservationId: string): Promise<void> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) return;

  const now = new Date();
  const checkIn = reservation.checkIn;
  const checkOut = reservation.checkOut;

  // Calculate send times
  const schedules = [
    {
      templateId: "booking_confirmation",
      sendAt: now, // Immediately
    },
    {
      templateId: "pre_arrival",
      sendAt: new Date(checkIn.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before
    },
    {
      templateId: "check_in_instructions",
      sendAt: new Date(checkIn.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
    },
    {
      templateId: "during_stay",
      sendAt: new Date(checkIn.getTime() + 2 * 60 * 60 * 1000), // 2 hours after check-in
    },
    {
      templateId: "check_out",
      sendAt: new Date(checkOut.getTime() - 6 * 60 * 60 * 1000), // 6 hours before
    },
    {
      templateId: "post_stay_review",
      sendAt: new Date(checkOut.getTime() + 24 * 60 * 60 * 1000), // 1 day after
    },
  ];

  // Create scheduled messages
  for (const schedule of schedules) {
    // Don't schedule if time is in the past
    if (schedule.sendAt < now) continue;

    await prisma.scheduledMessage.create({
      data: {
        reservationId,
        templateId: schedule.templateId,
        scheduledFor: schedule.sendAt,
        status: "pending",
      },
    });
  }
}

/**
 * Send email (mock - in production use SendGrid/Postmark)
 */
async function sendEmail(data: { to: string; subject: string; body: string }): Promise<string> {
  logger.info(`[Email] To: ${data.to}, Subject: ${data.subject}`);
  return `email_${Date.now()}`;
}

/**
 * Send WhatsApp (mock - in production use Twilio/Meta)
 */
async function sendWhatsApp(data: { to?: string; body: string }): Promise<string> {
  logger.info(`[WhatsApp] To: ${data.to}, Body: ${data.body}`);
  return `whatsapp_${Date.now()}`;
}

/**
 * Send SMS (mock - in production use Twilio)
 */
async function sendSMS(data: { to?: string; body: string }): Promise<string> {
  logger.info(`[SMS] To: ${data.to}, Body: ${data.body}`);
  return `sms_${Date.now()}`;
}

/**
 * Replace variables in template
 */
function replaceVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}

/**
 * Format date
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("sl-SI", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get review link
 */
function getReviewLink(reservation: any): string {
  // In production, generate actual review link
  return `https://www.booking.com/review?property=${reservation.propertyId}`;
}
