/**
 * AgentFlow Pro - SMS Gateway Adapter
 * Sends SMS messages via Twilio API
 * 
 * Required Environment Variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 */

import { getSMSConfig } from "@/config/env";

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  segments?: number;
  cost?: number;
}

/**
 * Normalizes phone number to E.164 format (+38640123456)
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  
  // Add Slovenia country code if missing
  if (digits.length >= 9 && digits.startsWith("0")) {
    return "+386" + digits.slice(1);
  }
  
  // Add + if missing for Slovenia
  if (digits.length >= 9 && !digits.startsWith("0") && !digits.startsWith("386")) {
    return "+386" + digits;
  }
  
  // Add + prefix if missing
  if (!digits.startsWith("+")) {
    return "+" + digits;
  }
  
  return "+" + digits;
}

/**
 * Sends SMS message via Twilio
 * @param text - Message body (max 160 chars per segment)
 * @param toPhone - Recipient phone number
 * @returns SendSMSResult
 */
export async function sendSMSMessage(
  text: string,
  toPhone: string
): Promise<SendSMSResult> {
  const { accountSid, authToken, fromNumber } = getSMSConfig();
  
  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: "SMS not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER",
    };
  }

  const normalized = normalizePhone(toPhone);
  
  if (normalized.length < 10) {
    return {
      success: false,
      error: `Invalid phone number: ${toPhone}`,
    };
  }

  try {
    // Calculate segments (160 chars per segment)
    const segments = Math.ceil(text.length / 160);
    
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append("From", fromNumber);
    params.append("To", normalized);
    params.append("Body", text);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.message ?? `HTTP ${res.status}`;
      return { success: false, error: errMsg };
    }

    // Calculate cost (approximate: $0.0079 per segment in Slovenia)
    const cost = segments * 0.0079;

    return {
      success: true,
      messageId: data.sid,
      segments,
      cost,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `SMS send failed: ${msg}` };
  }
}

/**
 * Sends bulk SMS messages
 * @param messages - Array of {phone, text}
 * @returns Array of SendSMSResult
 */
export async function sendBulkSMS(
  messages: Array<{ phone: string; text: string }>
): Promise<Array<SendSMSResult>> {
  const results: SendSMSResult[] = [];
  
  for (const msg of messages) {
    const result = await sendSMSMessage(msg.text, msg.phone);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Sends SMS with delivery report tracking
 * @param text - Message body
 * @param toPhone - Recipient phone
 * @param trackingId - Custom tracking ID
 * @returns SendSMSResult with tracking
 */
export async function sendTrackedSMS(
  text: string,
  toPhone: string,
  trackingId: string
): Promise<SendSMSResult> {
  const result = await sendSMSMessage(text, toPhone);
  
  if (result.success) {
    // Log to database for tracking
    try {
      const { Client } = await import('@supabase/supabase-js');
      const supabase = new Client(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_KEY || ''
      );
      
      await supabase
        .from('sms_logs')
        .insert({
          tracking_id: trackingId,
          phone: toPhone,
          message_sid: result.messageId,
          segments: result.segments,
          cost: result.cost,
          sent_at: new Date().toISOString(),
          status: 'sent',
        });
    } catch (error) {
      console.error('Error logging SMS:', error);
    }
  }
  
  return result;
}
