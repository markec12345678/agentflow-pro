/**
 * Document Templates (PDF) for AgentFlow Pro
 * 
 * Professional document templates for guest communications:
 * - Invoices and receipts
 * - Booking confirmations
 * - Registration cards
 * - Welcome letters
 * - Checkout summaries
 * 
 * Each template includes:
 * - Document structure and layout
 * - Sections and fields
 * - Styling configuration
 * - Variable substitution
 * - Branding options
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'invoice' | 'confirmation' | 'registration' | 'welcome' | 'checkout';
  format: 'A4' | 'Letter' | 'A5';
  orientation: 'portrait' | 'landscape';
  sections: DocumentSection[];
  variables: string[];
  styling?: StylingConfig;
  branding?: BrandingConfig;
}

export interface DocumentSection {
  type: 'header' | 'footer' | 'text' | 'table' | 'image' | 'signature' | 'spacer';
  content?: string;
  fields?: string[];
  style?: Record<string, string>;
  repeat?: boolean;
}

export interface StylingConfig {
  font?: string;
  font_size?: string;
  line_height?: string;
  margin?: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface BrandingConfig {
  logo?: string;
  company_name?: string;
  tagline?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// ============================================================================
// DOCUMENT TEMPLATES
// ============================================================================

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
  // ============================================================================
  // INVOICE TEMPLATES
  // ============================================================================

  standard_invoice: {
    id: 'standard_invoice',
    name: 'Standard Invoice',
    description: 'Standard invoice for guest billing',
    category: 'invoice',
    format: 'A4',
    orientation: 'portrait',
    sections: [
      {
        type: 'header',
        content: '{{property_logo}}',
        style: { align: 'center', margin_bottom: '20px' }
      },
      {
        type: 'text',
        content: '<h1>INVOICE</h1>',
        style: { align: 'right', font_size: '24px', color: '#333' }
      },
      {
        type: 'text',
        content: `
          <div style="display: flex; justify-content: space-between;">
            <div>
              <strong>Property:</strong><br>
              {{property_name}}<br>
              {{property_address}}<br>
              {{property_phone}}<br>
              {{property_email}}
            </div>
            <div>
              <strong>Guest:</strong><br>
              {{guest_name}}<br>
              {{guest_email}}<br>
              {{guest_phone}}
            </div>
          </div>
        `,
        style: { margin_bottom: '30px' }
      },
      {
        type: 'text',
        content: `
          <div style="display: flex; justify-content: space-between;">
            <div>
              <strong>Invoice #:</strong> {{invoice_number}}<br>
              <strong>Date:</strong> {{invoice_date}}<br>
              <strong>Due Date:</strong> {{due_date}}
            </div>
            <div>
              <strong>Stay Details:</strong><br>
              Check-in: {{check_in_date}}<br>
              Check-out: {{check_out_date}}<br>
              Room: {{room_number}}
            </div>
          </div>
        `,
        style: { margin_bottom: '30px', background: '#f5f5f5', padding: '15px' }
      },
      {
        type: 'table',
        fields: ['description', 'quantity', 'unit_price', 'total'],
        style: { width: '100%', border: '1px solid #ddd' }
      },
      {
        type: 'spacer',
        style: { height: '20px' }
      },
      {
        type: 'text',
        content: `
          <div style="text-align: right;">
            <p><strong>Subtotal:</strong> €{{subtotal}}</p>
            <p><strong>Tax ({{tax_rate}}%):</strong> €{{tax_amount}}</p>
            <p style="font-size: 18px;"><strong>Total:</strong> €{{total}}</p>
            <p><strong>Paid:</strong> €{{amount_paid}}</p>
            <p style="font-size: 16px;"><strong>Balance Due:</strong> €{{balance_due}}</p>
          </div>
        `,
        style: { margin_top: '20px' }
      },
      {
        type: 'text',
        content: `
          <div style="margin-top: 40px; padding: 15px; background: #f9f9f9;">
            <strong>Payment Information:</strong><br>
            Bank: {{bank_name}}<br>
            Account: {{account_number}}<br>
            IBAN: {{iban}}<br>
            SWIFT: {{swift}}
          </div>
        `,
        style: { margin_top: '30px' }
      },
      {
        type: 'footer',
        content: '{{property_footer}}',
        style: { margin_top: '50px', font_size: '10px', color: '#666', align: 'center' }
      }
    ],
    variables: [
      'property_logo', 'property_name', 'property_address', 'property_phone', 'property_email',
      'guest_name', 'guest_email', 'guest_phone',
      'invoice_number', 'invoice_date', 'due_date',
      'check_in_date', 'check_out_date', 'room_number',
      'subtotal', 'tax_rate', 'tax_amount', 'total', 'amount_paid', 'balance_due',
      'bank_name', 'account_number', 'iban', 'swift',
      'property_footer'
    ],
    styling: {
      font: 'Arial, sans-serif',
      font_size: '12px',
      line_height: '1.5',
      margin: '20mm',
      primary_color: '#2563eb',
      secondary_color: '#64748b'
    }
  },

  proforma_invoice: {
    id: 'proforma_invoice',
    name: 'Proforma Invoice',
    description: 'Proforma invoice for advance payment',
    category: 'invoice',
    format: 'A4',
    orientation: 'portrait',
    sections: [
      { type: 'header', content: '{{property_logo}}' },
      {
        type: 'text',
        content: '<h1>PROFORMA INVOICE</h1>',
        style: { align: 'right', font_size: '24px', color: '#333' }
      },
      {
        type: 'text',
        content: `
          <div style="display: flex; justify-content: space-between; margin: 30px 0;">
            <div>
              <strong>Bill To:</strong><br>
              {{guest_name}}<br>
              {{guest_address}}
            </div>
            <div>
              <strong>Reservation:</strong><br>
              {{reservation_id}}<br>
              {{booking_date}}
            </div>
          </div>
        `
      },
      {
        type: 'table',
        fields: ['item', 'description', 'quantity', 'price', 'amount'],
        style: { width: '100%', border: '1px solid #ddd' }
      },
      {
        type: 'text',
        content: `
          <div style="text-align: right; margin-top: 20px;">
            <p><strong>Total Amount:</strong> €{{total}}</p>
            <p><strong>Payment Deadline:</strong> {{payment_deadline}}</p>
          </div>
        `
      },
      {
        type: 'text',
        content: `
          <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107;">
            <strong>Important:</strong> This is a proforma invoice. 
            A final invoice will be issued upon payment receipt.
          </div>
        `,
        style: { margin_top: '30px' }
      },
      { type: 'footer', content: '{{property_footer}}' }
    ],
    variables: [
      'property_logo', 'guest_name', 'guest_address',
      'reservation_id', 'booking_date',
      'total', 'payment_deadline',
      'property_footer'
    ]
  },

  // ============================================================================
  // CONFIRMATION TEMPLATES
  // ============================================================================

  booking_confirmation: {
    id: 'booking_confirmation',
    name: 'Booking Confirmation',
    description: 'Reservation confirmation document',
    category: 'confirmation',
    format: 'A4',
    orientation: 'portrait',
    sections: [
      { type: 'header', content: '{{property_logo}}' },
      {
        type: 'text',
        content: '<h1>BOOKING CONFIRMATION</h1>',
        style: { align: 'center', color: '#2563eb' }
      },
      {
        type: 'text',
        content: `
          <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Confirmation Number:</strong> {{reservation_id}}</p>
            <p><strong>Booking Date:</strong> {{booking_date}}</p>
            <p><strong>Status:</strong> <span style="color: green;">✓ Confirmed</span></p>
          </div>
        `
      },
      {
        type: 'text',
        content: `
          <h2>Guest Information</h2>
          <p><strong>Name:</strong> {{guest_name}}</p>
          <p><strong>Email:</strong> {{guest_email}}</p>
          <p><strong>Phone:</strong> {{guest_phone}}</p>
          <p><strong>Guests:</strong> {{adults}} adults, {{children}} children</p>
        `
      },
      {
        type: 'text',
        content: `
          <h2>Reservation Details</h2>
          <p><strong>Check-in:</strong> {{check_in_date}} from 14:00</p>
          <p><strong>Check-out:</strong> {{check_out_date}} until 11:00</p>
          <p><strong>Room Type:</strong> {{room_type}}</p>
          <p><strong>Room Number:</strong> {{room_number}}</p>
          <p><strong>Nights:</strong> {{nights}}</p>
        `
      },
      {
        type: 'table',
        fields: ['description', 'amount'],
        style: { width: '100%', border: '1px solid #ddd' }
      },
      {
        type: 'text',
        content: `
          <div style="text-align: right; margin-top: 20px;">
            <p><strong>Total Amount:</strong> €{{total}}</p>
            <p><strong>Paid:</strong> €{{paid}}</p>
            <p><strong>Balance:</strong> €{{balance}}</p>
          </div>
        `
      },
      {
        type: 'text',
        content: `
          <div style="margin-top: 30px;">
            <h3>Cancellation Policy</h3>
            <p>{{cancellation_policy}}</p>
          </div>
        `
      },
      {
        type: 'text',
        content: `
          <div style="margin-top: 30px; text-align: center;">
            <p>We look forward to welcoming you!</p>
            <p><strong>{{property_name}} Team</strong></p>
          </div>
        `
      },
      { type: 'footer', content: '{{property_footer}}' }
    ],
    variables: [
      'property_logo', 'reservation_id', 'booking_date',
      'guest_name', 'guest_email', 'guest_phone', 'adults', 'children',
      'check_in_date', 'check_out_date', 'room_type', 'room_number', 'nights',
      'total', 'paid', 'balance',
      'cancellation_policy', 'property_name', 'property_footer'
    ]
  },

  // ============================================================================
  // REGISTRATION TEMPLATES
  // ============================================================================

  registration_card: {
    id: 'registration_card',
    name: 'Registration Card',
    description: 'Guest registration form',
    category: 'registration',
    format: 'A4',
    orientation: 'portrait',
    sections: [
      { type: 'header', content: '{{property_logo}}' },
      {
        type: 'text',
        content: '<h1>GUEST REGISTRATION CARD</h1>',
        style: { align: 'center' }
      },
      {
        type: 'text',
        content: `
          <div style="border: 2px solid #333; padding: 20px; margin: 20px 0;">
            <h3>Personal Information</h3>
            <p><strong>Full Name:</strong> {{guest_name}}</p>
            <p><strong>Date of Birth:</strong> {{date_of_birth}}</p>
            <p><strong>Nationality:</strong> {{nationality}}</p>
            <p><strong>Passport/ID Number:</strong> {{id_number}}</p>
            <p><strong>Address:</strong> {{address}}</p>
            <p><strong>Email:</strong> {{email}}</p>
            <p><strong>Phone:</strong> {{phone}}</p>
          </div>
        `
      },
      {
        type: 'text',
        content: `
          <div style="border: 2px solid #333; padding: 20px; margin: 20px 0;">
            <h3>Stay Information</h3>
            <p><strong>Arrival Date:</strong> {{check_in_date}}</p>
            <p><strong>Departure Date:</strong> {{check_out_date}}</p>
            <p><strong>Room Number:</strong> {{room_number}}</p>
            <p><strong>Number of Guests:</strong> {{guests}}</p>
          </div>
        `
      },
      {
        type: 'text',
        content: `
          <div style="margin: 30px 0;">
            <p>I hereby agree to the terms and conditions of {{property_name}}.</p>
            <br><br>
            <div style="display: flex; justify-content: space-between;">
              <div>
                <p>_______________________</p>
                <p>Guest Signature</p>
              </div>
              <div>
                <p>_______________________</p>
                <p>Date</p>
              </div>
            </div>
          </div>
        `,
        style: { margin_top: '30px' }
      },
      { type: 'footer', content: '{{property_footer}}' }
    ],
    variables: [
      'property_logo', 'guest_name', 'date_of_birth', 'nationality', 'id_number', 'address', 'email', 'phone',
      'check_in_date', 'check_out_date', 'room_number', 'guests',
      'property_name', 'property_footer'
    ]
  },

  // ============================================================================
  // WELCOME TEMPLATES
  // ============================================================================

  welcome_letter: {
    id: 'welcome_letter',
    name: 'Welcome Letter',
    description: 'Welcome letter for guests',
    category: 'welcome',
    format: 'A5',
    orientation: 'portrait',
    sections: [
      { type: 'header', content: '{{property_logo}}' },
      {
        type: 'text',
        content: '<h1 style="color: #2563eb;">Welcome to {{property_name}}!</h1>',
        style: { align: 'center' }
      },
      {
        type: 'text',
        content: `
          <p>Dear {{guest_name}},</p>
          <p>We are delighted to welcome you to {{property_name}}. 
          We hope you will have a wonderful stay with us.</p>
        `
      },
      {
        type: 'text',
        content: `
          <h3>Property Information</h3>
          <p><strong>WiFi Password:</strong> {{wifi_password}}</p>
          <p><strong>Breakfast:</strong> {{breakfast_time}} in {{breakfast_location}}</p>
          <p><strong>Check-out:</strong> {{check_out_time}}</p>
        `,
        style: { background: '#f5f5f5', padding: '15px', margin: '20px 0' }
      },
      {
        type: 'text',
        content: `
          <h3>Useful Information</h3>
          <ul>
            <li>Reception: {{reception_phone}}</li>
            <li>Emergency: {{emergency_phone}}</li>
            <li>Nearby restaurants: {{nearby_restaurants}}</li>
            <li>Attractions: {{nearby_attractions}}</li>
          </ul>
        `
      },
      {
        type: 'text',
        content: `
          <p>If you need anything during your stay, please don't hesitate to contact us.</p>
          <p>Wishing you a pleasant stay!</p>
          <p><strong>{{property_name}} Team</strong></p>
        `
      },
      { type: 'footer', content: '{{property_footer}}' }
    ],
    variables: [
      'property_logo', 'property_name', 'guest_name',
      'wifi_password', 'breakfast_time', 'breakfast_location', 'check_out_time',
      'reception_phone', 'emergency_phone', 'nearby_restaurants', 'nearby_attractions',
      'property_footer'
    ]
  },

  // ============================================================================
  // CHECKOUT TEMPLATES
  // ============================================================================

  checkout_summary: {
    id: 'checkout_summary',
    name: 'Checkout Summary',
    description: 'Guest checkout summary and receipt',
    category: 'checkout',
    format: 'A4',
    orientation: 'portrait',
    sections: [
      { type: 'header', content: '{{property_logo}}' },
      {
        type: 'text',
        content: '<h1>CHECKOUT SUMMARY</h1>',
        style: { align: 'center' }
      },
      {
        type: 'text',
        content: `
          <div style="display: flex; justify-content: space-between; margin: 20px 0;">
            <div>
              <p><strong>Guest:</strong> {{guest_name}}</p>
              <p><strong>Room:</strong> {{room_number}}</p>
            </div>
            <div>
              <p><strong>Check-in:</strong> {{check_in_date}}</p>
              <p><strong>Check-out:</strong> {{check_out_date}}</p>
            </div>
          </div>
        `
      },
      {
        type: 'table',
        fields: ['date', 'description', 'charge', 'payment'],
        style: { width: '100%', border: '1px solid #ddd' }
      },
      {
        type: 'text',
        content: `
          <div style="text-align: right; margin-top: 20px; font-size: 16px;">
            <p><strong>Total Charges:</strong> €{{total_charges}}</p>
            <p><strong>Total Payments:</strong> €{{total_payments}}</p>
            <p style="font-size: 20px;"><strong>Balance:</strong> €{{balance}}</p>
          </div>
        `
      },
      {
        type: 'text',
        content: `
          <div style="margin-top: 40px; text-align: center;">
            <p>Thank you for staying with us!</p>
            <p>We hope to welcome you back soon.</p>
            <br>
            <p>_______________________</p>
            <p>Guest Signature</p>
          </div>
        `
      },
      { type: 'footer', content: '{{property_footer}}' }
    ],
    variables: [
      'property_logo', 'guest_name', 'room_number',
      'check_in_date', 'check_out_date',
      'total_charges', 'total_payments', 'balance',
      'property_footer'
    ]
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get document template by ID
 */
export function getDocumentTemplate(templateId: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES[templateId];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: DocumentTemplate['category']): DocumentTemplate[] {
  return Object.values(DOCUMENT_TEMPLATES).filter(
    (template) => template.category === category
  );
}

/**
 * Check if template exists
 */
export function templateExists(templateId: string): boolean {
  return templateId in DOCUMENT_TEMPLATES;
}

/**
 * Get all template IDs
 */
export const DOCUMENT_TEMPLATE_IDS = Object.keys(DOCUMENT_TEMPLATES);

// ============================================================================
// EXPORTS
// ============================================================================

export type { DocumentTemplate, DocumentSection, StylingConfig, BrandingConfig };
export default DOCUMENT_TEMPLATES;
