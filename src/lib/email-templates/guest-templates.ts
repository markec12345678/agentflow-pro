/**
 * Email Templates for AgentFlow Pro
 * 
 * Professional email templates for all guest communication scenarios:
 * - Pre-arrival emails
 * - During-stay emails
 * - Post-stay emails
 * - Booking confirmations
 * - Payment confirmations
 * - Cancellations
 * 
 * All templates support variable substitution and multi-language.
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'pre-arrival' | 'during-stay' | 'post-stay' | 'booking' | 'payment' | 'cancellation';
  language?: string;
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
 * @returns Rendered subject and body
 * 
 * @example
 * const { subject, body } = renderEmailTemplate('welcome', {
 *   guest_name: 'John Doe',
 *   property_name: 'Villa Bled'
 * });
 */
export function renderEmailTemplate(
  templateId: string,
  variables: Record<string, string>
): { subject: string; body: string } {
  const template = EMAIL_TEMPLATES[templateId];
  
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const render = (text: string) => {
    return text.replace(/{{(\w+)}}/g, (match, key) => {
      return variables[key] || match;
    });
  };

  return {
    subject: render(template.subject),
    body: render(template.body),
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
// EXPORTS
// ============================================================================

export type { EmailTemplate };
export default EMAIL_TEMPLATES;
