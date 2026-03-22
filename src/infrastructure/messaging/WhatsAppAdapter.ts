/**
 * AgentFlow Pro - WhatsApp Business Cloud API Adapter
 * Sends text messages via Meta WhatsApp Cloud API.
 * Requires WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.
 *
 * See: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 */

import { getWhatsAppConfig } from "@/config/env";

const API_VERSION = "v18.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Normalizes phone number to E.164 format without + (e.g. 38640123456).
 * Strips spaces, dashes, parentheses; assumes leading 0 → country code if needed.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 9 && digits.startsWith("0")) {
    return "386" + digits.slice(1);
  }
  if (digits.length >= 9 && !digits.startsWith("0")) {
    return digits.startsWith("386") ? digits : "386" + digits;
  }
  return digits;
}

/**
 * Sends a text message via WhatsApp Cloud API.
 * @param text - Message body (up to 4096 chars)
 * @param toPhone - Recipient phone (any format; will be normalized)
 */
export async function sendWhatsAppMessage(
  text: string,
  toPhone: string
): Promise<SendWhatsAppResult> {
  const { phoneNumberId, accessToken } = getWhatsAppConfig();
  if (!phoneNumberId || !accessToken) {
    return {
      success: false,
      error: "WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are not configured.",
    };
  }

  const normalized = normalizePhone(toPhone);
  if (normalized.length < 9) {
    return {
      success: false,
      error: `Invalid phone number: ${toPhone}`,
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalized,
        type: "text",
        text: {
          preview_url: false,
          body: text.slice(0, 4096),
        },
      }),
    });

    const data = (await res.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message: string; code?: number };
    };

    if (!res.ok) {
      const errMsg = data.error?.message ?? `HTTP ${res.status}`;
      return { success: false, error: errMsg };
    }

    const messageId = data.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `WhatsApp send failed: ${msg}` };
  }
}
