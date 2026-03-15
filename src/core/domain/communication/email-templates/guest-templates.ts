/**
 * Email & SMS Templates for AgentFlow Pro
 *
 * Professional email and SMS templates for all guest communication scenarios.
 * All templates support variable substitution and multi-language.
 *
 * @version 1.1.0
 * @author AgentFlow Pro Team
 */

import { sanitizeText } from '@/lib/sanitize';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'pre-arrival' | 'during-stay' | 'post-stay' | 'booking' | 'payment' | 'cancellation';
  language?: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  variables: string[];
  category: 'pre-arrival' | 'during-stay' | 'post-stay' | 'booking' | 'payment' | 'cancellation' | 'review';
  language?: string;
  maxLength?: number; // Default 160 characters for SMS
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  // ============================================================================
  // 1. WELCOME EMAIL (On Booking)
  // ============================================================================
  welcome: {
    id: 'welcome',
    name: 'Dobrodošlica',
    category: 'booking',
    subject: 'Dobrodošli v {{property_name}}! 🎉',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Dobrodošli!</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Pozdravljeni <strong>{{guest_name}}</strong>,</p>
          
          <p>Hvala za vašo rezervacijo v <strong>{{property_name}}</strong>! Veselimo se vašega obiska.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📅 Podatki o rezervaciji</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Check-in:</strong></td>
                <td style="padding: 8px 0;">{{check_in_date}} ob 14:00</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Check-out:</strong></td>
                <td style="padding: 8px 0;">{{check_out_date}} do 11:00</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Soba:</strong></td>
                <td style="padding: 8px 0;">{{room_number}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Gostje:</strong></td>
                <td style="padding: 8px 0;">{{guest_count}} oseb</td>
              </tr>
            </table>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📍 Lokacija</h3>
            <p><strong>{{property_name}}</strong><br>
            {{property_address}}<br>
            {{property_city}}, {{property_country}}</p>
            
            <p>📞 {{property_phone}}<br>
            ✉️ {{property_email}}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{check_in_link}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Opravite Online Check-in
            </a>
          </div>
          
          <p>Za dodatna vprašanja smo vam na voljo 24/7.</p>
          
          <p>Lep pozdrav,<br>
          <strong>Ekipa {{property_name}}</strong></p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p>© 2026 {{property_name}}. Vse pravice pridržane.</p>
        </div>
      </div>
    `,
    variables: [
      'guest_name', 'property_name', 'check_in_date', 'check_out_date',
      'room_number', 'guest_count', 'property_address', 'property_city',
      'property_country', 'property_phone', 'property_email', 'check_in_link'
    ]
  },

  // ============================================================================
  // 2. PRE-ARRIVAL EMAIL (1 Day Before Check-in)
  // ============================================================================
  pre_arrival: {
    id: 'pre_arrival',
    name: 'Opomnik Pred Prihodom',
    category: 'pre-arrival',
    subject: 'Vaš obisk v {{property_name}} je jutri! 🏨',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Že kmalu! 🎉</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Pozdravljeni <strong>{{guest_name}}</strong>,</p>
          
          <p>Veselimo se vašega obiska <strong>jutri</strong>!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">✅ Priprave na prihodu</h3>
            <ul style="line-height: 2;">
              <li>⏰ <strong>Check-in:</strong> od 14:00 dalje</li>
              <li>🅿️ <strong>Parkiranje:</strong> {{parking_instructions}}</li>
              <li>📶 <strong>WiFi:</strong> Geslo vam bomo posredovali ob prihodu</li>
              <li>🔑 <strong>Early check-in:</strong> Na voljo po dogovoru</li>
            </ul>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📍 Navodila za dostop</h3>
            <p>{{access_instructions}}</p>
            <p style="margin-top: 15px;">
              <a href="{{maps_link}}" style="color: #11998e; text-decoration: none;">
                🗺️ Odpri v Google Maps
              </a>
            </p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>💡 Nasvet:</strong> Za hitrejši check-in nam lahko vnaprej pošljete kopijo osebnega dokumenta.</p>
          </div>
          
          <p>V primeru zamude nas prosim obvestite na {{property_phone}}.</p>
          
          <p>Lep pozdrav,<br>
          <strong>Ekipa {{property_name}}</strong></p>
        </div>
      </div>
    `,
    variables: [
      'guest_name', 'property_name', 'parking_instructions',
      'access_instructions', 'maps_link', 'property_phone'
    ]
  },

  // ============================================================================
  // 3. POST-STAY EMAIL (After Checkout)
  // ============================================================================
  post_stay: {
    id: 'post_stay',
    name: 'Hvala Za Obisk',
    category: 'post-stay',
    subject: 'Hvala za vaš obisk v {{property_name}}! ⭐',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Hvala! 💕</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Pozdravljeni <strong>{{guest_name}}</strong>,</p>
          
          <p>Hvala, da ste bili naš gost v <strong>{{property_name}}</strong>! Upamo, da ste uživali v bivanju.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0;">⭐ Kako smo opravili?</h3>
            <p>Prosim, vzemite si 2 minuti in ocenite vaše bivanje:</p>
            <a href="{{review_link}}" style="background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">
              Pustite Mnenje
            </a>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">🎁 Posebna Ponudba Za Vas</h3>
            <p>Kot zahvalo vam podarjamo <strong>10% popust</strong> na naslednjo rezervacijo!</p>
            <p style="background: #f0f0f0; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; letter-spacing: 2px;">
              {{discount_code}}
            </p>
            <p style="font-size: 12px; color: #666;">Velja do {{discount_expiry}}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📸 Delite Svoj Obisk</h3>
            <p>Označite nas na družbenih omrežjih:</p>
            <p>
              <a href="{{instagram_link}}" style="margin-right: 10px;">📷 Instagram</a>
              <a href="{{facebook_link}}">👍 Facebook</a>
            </p>
          </div>
          
          <p>Veselimo se vašega ponovnega obiska!</p>
          
          <p>Lep pozdrav,<br>
          <strong>Ekipa {{property_name}}</strong></p>
        </div>
      </div>
    `,
    variables: [
      'guest_name', 'property_name', 'review_link', 'discount_code',
      'discount_expiry', 'instagram_link', 'facebook_link'
    ]
  },

  // ============================================================================
  // 4. PAYMENT CONFIRMATION
  // ============================================================================
  payment_confirmation: {
    id: 'payment_confirmation',
    name: 'Potrdilo Plačila',
    category: 'payment',
    subject: 'Potrdilo Plačila - Rezervacija {{reservation_id}}',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Plačilo Uspešno ✅</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Pozdravljeni <strong>{{guest_name}}</strong>,</p>
          
          <p>Potrjujemo prejem vašega plačila.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">💰 Podatki O Plačilu</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Znesek:</strong></td>
                <td style="padding: 8px 0;">{{amount}} {{currency}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Datum:</strong></td>
                <td style="padding: 8px 0;">{{payment_date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Rezervacija:</strong></td>
                <td style="padding: 8px 0;">{{reservation_id}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Način plačila:</strong></td>
                <td style="padding: 8px 0;">{{payment_method}}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{invoice_link}}" style="background: #56ab2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              📄 Prenesi Račun
            </a>
          </div>
          
          <p style="font-size: 12px; color: #666;">Račun je priložen temu emailu ali ga lahko prenesete preko zgornje povezave.</p>
          
          <p>Lep pozdrav,<br>
          <strong>Ekipa {{property_name}}</strong></p>
        </div>
      </div>
    `,
    variables: [
      'guest_name', 'amount', 'currency', 'payment_date',
      'reservation_id', 'payment_method', 'invoice_link'
    ]
  },

  // ============================================================================
  // 5. CANCELLATION CONFIRMATION
  // ============================================================================
  cancellation: {
    id: 'cancellation',
    name: 'Potrdilo Preklica',
    category: 'cancellation',
    subject: 'Potrdilo Preklica - {{reservation_id}}',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #eb5757 0%, #f2994a 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Rezervacija Preklicana</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Pozdravljeni <strong>{{guest_name}}</strong>,</p>
          
          <p>Vaša rezervacija je bila uspešno preklicana.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📋 Podatki Preklica</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;"><strong>Rezervacija:</strong></td>
                <td style="padding: 8px 0;">{{reservation_id}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Datum preklica:</strong></td>
                <td style="padding: 8px 0;">{{cancellation_date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Povračilo:</strong></td>
                <td style="padding: 8px 0;">{{refund_amount}} {{currency}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Čas povračila:</strong></td>
                <td style="padding: 8px 0;">5-7 delovnih dni</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>💡 Informacija:</strong> Povračilo bo nakazano na isti plačilni način kot originalno plačilo.</p>
          </div>
          
          <p>Žal nam je, da ne boste naš gost. Upamo, da vas bomo lahko gostili drugič!</p>
          
          <p>Lep pozdrav,<br>
          <strong>Ekipa {{property_name}}</strong></p>
        </div>
      </div>
    `,
    variables: [
      'guest_name', 'reservation_id', 'cancellation_date',
      'refund_amount', 'currency'
    ]
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Render email template with variables
 *
 * @param templateId - Template ID from EMAIL_TEMPLATES
 * @param variables - Object with variable key-value pairs
 * @param branding - Optional branding configuration for white-label
 * @returns Rendered subject and body
 *
 * @example
 * const { subject, body } = renderEmailTemplate('welcome', {
 *   guest_name: 'John Doe',
 *   property_name: 'Villa Bled'
 * }, {
 *   logoUrl: 'https://example.com/logo.png',
 *   primaryColor: '#3B82F6',
 *   removeAgentFlowBranding: true
 * });
 */
export function renderEmailTemplate(
  templateId: string,
  variables: Record<string, string>,
  branding?: {
    logoUrl?: string | null;
    logoSmall?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    removeAgentFlowBranding?: boolean;
  }
): { subject: string; body: string } {
  const template = EMAIL_TEMPLATES[templateId];

  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const render = (text: string) => {
    return text.replace(/{{(\w+)}}/g, (match, key) => {
      // Sanitize variables to prevent XSS attacks
      const value = variables[key] || match;
      return sanitizeText(value);
    });
  };

  let body = render(template.body);

  // Apply white-label branding if provided
  if (branding) {
    // Replace default gradient with brand colors
    if (branding.primaryColor || branding.secondaryColor) {
      const gradient = branding.secondaryColor && branding.primaryColor
        ? `background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%);`
        : `background: ${branding.primaryColor || '#667eea'};`;
      body = body.replace(
        /background: linear-gradient\(135deg,.*?\);/,
        gradient
      );
    }

    // Add logo if provided
    if (branding.logoUrl) {
      const logoHTML = `<div style="text-align: center; margin-bottom: 20px;">
        <img src="${branding.logoUrl}" alt="Logo" style="max-height: 80px; max-width: 300px;" />
      </div>`;
      body = body.replace('<div style="background: linear-gradient', logoHTML + '<div style="background: linear-gradient');
    }

    // Remove AgentFlow branding if requested
    if (branding.removeAgentFlowBranding) {
      body = body.replace(
        /<div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">[\s\S]*?<\/div>\s*<\/div>\s*$/,
        `<div style="background: #f9f9f9; color: #666; padding: 20px; text-align: center; font-size: 12px; border-top: 2px solid ${branding.primaryColor || '#667eea'};">
          <p>© 2026 {{property_name}}. Vse pravice pridržane.</p>
          ${branding.logoSmall ? `<p><img src="${branding.logoSmall}" alt="Logo" style="height: 40px; margin-top: 10px;" /></p>` : ''}
        </div>
      </div>`
      );
    }

    // Apply custom font family
    if (branding.fontFamily) {
      body = body.replace(
        /font-family: Arial, sans-serif;/g,
        `font-family: ${branding.fontFamily}, sans-serif;`
      );
    }
  }

  return {
    subject: render(template.subject),
    body,
  };
}

/**
 * Get all template IDs
 */
export const TEMPLATE_IDS = Object.keys(EMAIL_TEMPLATES);

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
  return Object.values(EMAIL_TEMPLATES).filter(
    template => template.category === category
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES[templateId];
}

// ============================================================================
// SMS TEMPLATES (Slovenian)
// ============================================================================

export const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  // ============================================================================
  // 1. WELCOME SMS (On Booking)
  // ============================================================================
  welcome: {
    id: 'sms_welcome',
    name: 'Dobrodošlica SMS',
    category: 'booking',
    body: 'Pozdravljeni {{guest_name}}! Hvala za rezervacijo v {{property_name}}. Veselimo se vašega obiska {{check_in_date}}. Za online check-in kliknite: {{check_in_link}}',
    variables: ['guest_name', 'property_name', 'check_in_date', 'check_in_link'],
    maxLength: 160
  },

  // ============================================================================
  // 2. PRE-ARRIVAL SMS (1 Day Before)
  // ============================================================================
  pre_arrival: {
    id: 'sms_pre_arrival',
    name: 'Opomnik Pred Prihodom SMS',
    category: 'pre-arrival',
    body: '{{guest_name}}, jutri vas pričakujemo v {{property_name}}! Check-in od 14:00. Parkiranje: {{parking_instructions}}. Vprašanja? {{property_phone}}',
    variables: ['guest_name', 'property_name', 'parking_instructions', 'property_phone'],
    maxLength: 160
  },

  // ============================================================================
  // 3. CHECK-IN DAY SMS
  // ============================================================================
  check_in_day: {
    id: 'sms_check_in_day',
    name: 'Dan Check-in SMS',
    category: 'pre-arrival',
    body: 'Dobrodošli! Danes je vaš check-in v {{property_name}}. Veselimo se ob 14:00. Lokacija: {{property_address}}. Info: {{property_phone}}',
    variables: ['guest_name', 'property_name', 'property_address', 'property_phone'],
    maxLength: 160
  },

  // ============================================================================
  // 4. DURING STAY SMS
  // ============================================================================
  during_stay: {
    id: 'sms_during_stay',
    name: 'Med Bivanjem SMS',
    category: 'during-stay',
    body: '{{guest_name}}, upamo, da uživate v {{property_name}}! Za dodatna vprašanja ali storitve smo vam na voljo na {{property_phone}}. Lep pozdrav!',
    variables: ['guest_name', 'property_name', 'property_phone'],
    maxLength: 160
  },

  // ============================================================================
  // 5. CHECK-OUT REMINDER SMS
  // ============================================================================
  check_out_reminder: {
    id: 'sms_check_out_reminder',
    name: 'Opomnik Check-out SMS',
    category: 'post-stay',
    body: '{{guest_name}}, jutri je vaš check-out do 11:00. Hvala, da ste bili naš gost! Upamo, da se kmalu vidimo. Ekipa {{property_name}}',
    variables: ['guest_name', 'property_name'],
    maxLength: 160
  },

  // ============================================================================
  // 6. POST-STAY THANK YOU SMS
  // ============================================================================
  post_stay_thank_you: {
    id: 'sms_post_stay_thank_you',
    name: 'Hvala Za Obisk SMS',
    category: 'post-stay',
    body: '{{guest_name}}, hvala za obisk v {{property_name}}! Upamo, da ste uživali. Podarjamo vam 10% popust za naslednjo rezervacijo: {{discount_code}}',
    variables: ['guest_name', 'property_name', 'discount_code'],
    maxLength: 160
  },

  // ============================================================================
  // 7. REVIEW REQUEST SMS (Google Reviews)
  // ============================================================================
  review_request: {
    id: 'sms_review_request',
    name: 'Prošnja Za Mnenje SMS',
    category: 'review',
    body: '{{guest_name}}, hvala za obisk! Prosim, ocenite vaše bivanje z {{property_name}}: {{review_link}}. Hvala za vaš čas! ⭐',
    variables: ['guest_name', 'property_name', 'review_link'],
    maxLength: 160
  },

  // ============================================================================
  // 8. PAYMENT CONFIRMATION SMS
  // ============================================================================
  payment_confirmation: {
    id: 'sms_payment_confirmation',
    name: 'Potrdilo Plačila SMS',
    category: 'payment',
    body: '{{guest_name}}, plačilo {{amount}} {{currency}} za rezervacijo {{reservation_id}} je bilo uspešno. Račun najdete v emailu. Hvala!',
    variables: ['guest_name', 'amount', 'currency', 'reservation_id'],
    maxLength: 160
  },

  // ============================================================================
  // 9. CANCELLATION SMS
  // ============================================================================
  cancellation: {
    id: 'sms_cancellation',
    name: 'Potrdilo Preklica SMS',
    category: 'cancellation',
    body: '{{guest_name}}, vaša rezervacija {{reservation_id}} je bila preklicana. Povračilo {{refund_amount}} {{currency}} sledi v 5-7 dneh.',
    variables: ['guest_name', 'reservation_id', 'refund_amount', 'currency'],
    maxLength: 160
  },

  // ============================================================================
  // 10. SPECIAL OFFER SMS
  // ============================================================================
  special_offer: {
    id: 'sms_special_offer',
    name: 'Posebna Ponudba SMS',
    category: 'booking',
    body: '{{guest_name}}, ekskluzivna ponudba za vas! 15% popust na vse rezervacije v {{property_name}} do {{expiry_date}}. Koda: {{discount_code}}. Rezervirajte: {{booking_link}}',
    variables: ['guest_name', 'property_name', 'discount_code', 'expiry_date', 'booking_link'],
    maxLength: 160
  }
};

// ============================================================================
// SMS HELPER FUNCTIONS
// ============================================================================

/**
 * Render SMS template with variables
 *
 * @param templateId - Template ID from SMS_TEMPLATES
 * @param variables - Object with variable key-value pairs
 * @returns Rendered SMS body
 *
 * @example
 * const smsBody = renderSMSTemplate('sms_welcome', {
 *   guest_name: 'John Doe',
 *   property_name: 'Villa Bled',
 *   check_in_date: '2026-03-20',
 *   check_in_link: 'https://example.com/checkin'
 * });
 */
export function renderSMSTemplate(
  templateId: string,
  variables: Record<string, string>
): { body: string; characterCount: number; segmentCount: number } {
  const template = SMS_TEMPLATES[templateId];

  if (!template) {
    throw new Error(`SMS Template ${templateId} not found`);
  }

  const render = (text: string) => {
    return text.replace(/{{(\w+)}}/g, (match, key) => {
      const value = variables[key] || match;
      return sanitizeText(value);
    });
  };

  const body = render(template.body);
  const characterCount = body.length;
  const segmentCount = Math.ceil(characterCount / (template.maxLength || 160));

  return {
    body,
    characterCount,
    segmentCount
  };
}

/**
 * Get all SMS template IDs
 */
export const SMS_TEMPLATE_IDS = Object.keys(SMS_TEMPLATES);

/**
 * Get SMS templates by category
 */
export function getSMSTemplatesByCategory(category: SMSTemplate['category']): SMSTemplate[] {
  return Object.values(SMS_TEMPLATES).filter(
    template => template.category === category
  );
}

/**
 * Get SMS template by ID
 */
export function getSMSTemplateById(templateId: string): SMSTemplate | undefined {
  return SMS_TEMPLATES[templateId];
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { EmailTemplate, SMSTemplate };
export default EMAIL_TEMPLATES;
