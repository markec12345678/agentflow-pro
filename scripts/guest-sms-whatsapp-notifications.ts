/**
 * AgentFlow Pro - SMS & WhatsApp Guest Notifications
 * 
 * Use Case: Multi-channel Guest Communication
 * 
 * Workflow:
 * 1. Read guest arrivals from Supabase
 * 2. Get guest communication preferences (email/SMS/WhatsApp)
 * 3. Send personalized SMS or WhatsApp message
 * 4. Track delivery status
 * 5. Update analytics
 * 
 * Tools Used:
 * - Supabase MCP (Database)
 * - SMS Adapter (Twilio)
 * - WhatsApp Adapter (Meta)
 * - Memory MCP (Guest preferences)
 * - Analytics (Metrics)
 */

import { Client } from '@supabase/supabase-js';
import { sendSMSMessage } from '@/infrastructure/messaging/SMSAdapter';
import { sendWhatsAppMessage } from '@/infrastructure/messaging/WhatsAppAdapter';

// Configuration
const CONFIG = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || '',
  },
  channels: {
    sms: true,
    whatsapp: true,
    fallback: 'sms', // Use SMS if WhatsApp fails
  },
};

// Types
interface Guest {
  id: string;
  name: string;
  phone: string;
  language_preference?: string;
  vip_status?: boolean;
  previous_stays?: number;
  communication_channel?: 'email' | 'sms' | 'whatsapp';
}

interface Reservation {
  id: string;
  guest_id: string;
  check_in: string;
  property_name: string;
  room_type: string;
}

interface NotificationResult {
  guestId: string;
  channel: 'sms' | 'whatsapp';
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

// Main Notification Class
class GuestNotificationService {
  private supabase: Client;
  private sentCount = 0;
  private failedCount = 0;

  constructor() {
    this.supabase = new Client(CONFIG.supabase.url, CONFIG.supabase.key);
  }

  /**
   * STEP 1: Get Today's Arrivals
   */
  async getTodaysArrivals(): Promise<Array<Reservation & { guest: Guest }>> {
    console.log('📅 Fetching today\'s arrivals...');

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data, error } = await this.supabase
        .from('reservations')
        .select(`
          id,
          guest_id,
          check_in,
          property_name,
          room_type,
          guest:guests (
            id,
            name,
            phone,
            language_preference,
            vip_status,
            previous_stays,
            communication_channel
          )
        `)
        .eq('check_in', today)
        .eq('status', 'confirmed');

      if (error) throw error;

      console.log(`✅ Found ${data?.length} arrivals for today`);
      return data as any[];
    } catch (error) {
      console.error('❌ Error fetching arrivals:', error);
      return [];
    }
  }

  /**
   * STEP 2: Generate Personalized Message
   */
  generateMessage(guest: Guest, reservation: Reservation, channel: 'sms' | 'whatsapp'): string {
    const firstName = guest.name.split(' ')[0];
    const language = guest.language_preference || 'en';
    const isVIP = guest.vip_status || false;
    const isReturning = (guest.previous_stays || 0) > 0;

    // SMS messages (max 160 chars)
    if (channel === 'sms') {
      const templates: Record<string, string> = {
        en: isVIP
          ? `🌟 VIP Welcome ${firstName}! Your suite at ${reservation.property_name} is ready. Check-in from 14:00. Need anything? Call +38640123456`
          : isReturning
          ? `Welcome back ${firstName}! ${reservation.property_name} ready for you. Check-in from 14:00. Questions? +38640123456`
          : `Welcome ${firstName}! ${reservation.property_name} ready. Check-in from 14:00. Questions? Call +38640123456`,
        
        sl: isVIP
          ? `🌟 VIP Dobrodošli ${firstName}! Vaša suite v ${reservation.property_name} je pripravljena. Prijava od 14:00. +38640123456`
          : isReturning
          ? `Dobrodošli nazaj ${firstName}! ${reservation.property_name} pripravljen. Prijava od 14:00. +38640123456`
          : `Dobrodošli ${firstName}! ${reservation.property_name} pripravljen. Prijava od 14:00. +38640123456`,
        
        de: `Willkommen ${firstName}! ${reservation.property_name} bereit. Check-in ab 14:00. Fragen? +38640123456`,
        it: `Benvenuto ${firstName}! ${reservation.property_name} pronto. Check-in dalle 14:00. +38640123456`,
      };

      return templates[language] || templates.en;
    }

    // WhatsApp messages (longer, with emojis)
    const whatsappTemplates: Record<string, string> = {
      en: isVIP
        ? `🌟 *VIP Welcome ${firstName}!* 🌟\n\nYour luxury suite at *${reservation.property_name}* is ready!\n\n🕐 Check-in: From 14:00\n🏠 Room: ${reservation.room_type}\n\n✨ Special amenities prepared\n💬 Need anything? Reply here or call +38640123456\n\nCan't wait to host you!`
        : isReturning
        ? `🎉 *Welcome Back ${firstName}!* \n\nSo honored to host you again at *${reservation.property_name}*!\n\n🕐 Check-in: From 14:00\n🏠 Room: ${reservation.room_type}\n\n💬 Questions? Reply here or call +38640123456\n\nSee you soon!`
        : `🏨 *Welcome ${firstName}!* \n\nExcited to host you at *${reservation.property_name}*!\n\n🕐 Check-in: From 14:00\n🏠 Room: ${reservation.room_type}\n\n💬 Need help? Reply here or call +38640123456\n\nSafe travels!`,
      
      sl: isVIP
        ? `🌟 *VIP Dobrodošli ${firstName}!* 🌟\n\nVaša luxury suite v *${reservation.property_name}* je pripravljena!\n\n🕐 Prijava: Od 14:00\n🏠 Soba: ${reservation.room_type}\n\n✨ Posebne ugodnosti pripravljene\n💬 Potrebujete kaj? Odgovorite tukaj ali pokličite +38640123456\n\nVeselimo se vas!`
        : isReturning
        ? `🎉 *Dobrodošli Nazaj ${firstName}!* \n\nČast nam je ponovno gostiti vas v *${reservation.property_name}*!\n\n🕐 Prijava: Od 14:00\n🏠 Soba: ${reservation.room_type}\n\n💬 Vprašanja? Odgovorite tukaj ali pokličite +38640123456\n\nSe vidimo kmalu!`
        : `🏨 *Dobrodošli ${firstName}!* \n\nVeselimo se vašega obiska v *${reservation.property_name}*!\n\n🕐 Prijava: Od 14:00\n🏠 Soba: ${reservation.room_type}\n\n💬 Potrebujete pomoč? Odgovorite tukaj ali pokličite +38640123456\n\nSrečno pot!`,
    };

    return whatsappTemplates[language] || whatsappTemplates.en;
  }

  /**
   * STEP 3: Send Notification (SMS or WhatsApp)
   */
  async sendNotification(
    guest: Guest,
    reservation: Reservation,
    preferredChannel?: 'sms' | 'whatsapp'
  ): Promise<NotificationResult> {
    const channel = preferredChannel || guest.communication_channel === 'whatsapp' ? 'whatsapp' : 'sms';
    const message = this.generateMessage(guest, reservation, channel);

    console.log(`  📱 Sending ${channel} to ${guest.name} (${guest.phone})...`);

    try {
      let result: NotificationResult;

      if (channel === 'whatsapp') {
        const waResult = await sendWhatsAppMessage(message, guest.phone);
        
        result = {
          guestId: guest.id,
          channel: 'whatsapp',
          success: waResult.success,
          messageId: waResult.messageId,
          error: waResult.error,
        };

        // Fallback to SMS if WhatsApp fails
        if (!waResult.success && CONFIG.fallback === 'sms') {
          console.log(`  ⚠️ WhatsApp failed, falling back to SMS...`);
          return this.sendSMSFallback(guest, reservation);
        }
      } else {
        const smsResult = await sendSMSMessage(message, guest.phone);
        
        result = {
          guestId: guest.id,
          channel: 'sms',
          success: smsResult.success,
          messageId: smsResult.messageId,
          error: smsResult.error,
          cost: smsResult.cost,
        };
      }

      if (result.success) {
        this.sentCount++;
        console.log(`  ✅ ${channel} sent successfully`);
      } else {
        this.failedCount++;
        console.log(`  ❌ ${channel} failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      this.failedCount++;
      console.error(`  ❌ Error sending notification:`, error);
      
      return {
        guestId: guest.id,
        channel,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fallback: Send SMS if WhatsApp fails
   */
  private async sendSMSFallback(guest: Guest, reservation: Reservation): Promise<NotificationResult> {
    const message = this.generateMessage(guest, reservation, 'sms');
    const smsResult = await sendSMSMessage(message, guest.phone);

    if (smsResult.success) {
      this.sentCount++;
    } else {
      this.failedCount++;
    }

    return {
      guestId: guest.id,
      channel: 'sms',
      success: smsResult.success,
      messageId: smsResult.messageId,
      error: smsResult.error,
      cost: smsResult.cost,
    };
  }

  /**
   * STEP 4: Save Notification Log
   */
  async saveNotificationLog(result: NotificationResult, guestPhone: string): Promise<void> {
    try {
      await this.supabase
        .from('notification_logs')
        .insert({
          guest_id: result.guestId,
          channel: result.channel,
          message_id: result.messageId,
          phone: guestPhone,
          sent_at: new Date().toISOString(),
          status: result.success ? 'sent' : 'failed',
          error_message: result.error,
          cost: result.cost,
        });
    } catch (error) {
      console.error('Error saving log:', error);
    }
  }

  /**
   * MAIN: Run Complete Notification Workflow
   */
  async runNotifications(): Promise<void> {
    console.log('\n🚀 Starting Guest SMS/WhatsApp Notifications...\n');

    try {
      // Step 1: Get arrivals
      const arrivals = await this.getTodaysArrivals();

      if (arrivals.length === 0) {
        console.log('ℹ️ No arrivals for today');
        return;
      }

      // Step 2: Send notifications
      for (const arrival of arrivals) {
        console.log(`\nProcessing: ${arrival.guest.name}`);

        // Step 3: Send notification
        const result = await this.sendNotification(arrival.guest, arrival);

        // Step 4: Save log
        await this.saveNotificationLog(result, arrival.guest.phone);

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Summary
      console.log('\n🎉 Notifications Complete!\n');
      console.log('📊 Summary:');
      console.log(`   - Total guests: ${arrivals.length}`);
      console.log(`   - Sent: ${this.sentCount}`);
      console.log(`   - Failed: ${this.failedCount}`);
      console.log(`   - Success rate: ${((this.sentCount / arrivals.length) * 100).toFixed(1)}%`);
      console.log('\n✅ All tasks completed!\n');
    } catch (error) {
      console.error('❌ Error in notifications:', error);
      throw error;
    }
  }
}

// Execute
async function main() {
  const service = new GuestNotificationService();
  await service.runNotifications();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { GuestNotificationService };
