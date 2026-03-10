/**
 * Email Template Rendering Tests
 * 
 * Tests for email template rendering functionality:
 * - renderEmailTemplate()
 * - Variable substitution
 * - All 5 email templates
 * - Multi-language support
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import {
  EMAIL_TEMPLATES,
  renderEmailTemplate,
  getTemplatesByCategory,
  getTemplateById,
  TEMPLATE_IDS,
} from '@/lib/email-templates/guest-templates';

describe('Email Template Rendering', () => {
  describe('renderEmailTemplate', () => {
    describe('Welcome Template', () => {
      it('should render welcome email with all variables', () => {
        const { subject, body } = renderEmailTemplate('welcome', {
          guest_name: 'Janez Novak',
          property_name: 'Hotel Bled',
          check_in_date: '15.3.2026',
          check_out_date: '22.3.2026',
          room_number: '301',
          guest_count: '2',
          property_address: 'Cesta svobode 1',
          property_city: 'Bled',
          property_country: 'Slovenia',
          property_phone: '+386 40 123 456',
          property_email: 'info@hotelbled.com',
          check_in_link: 'https://hotelbled.com/checkin/abc123',
        });

        expect(subject).toContain('Dobrodošli');
        expect(subject).toContain('Hotel Bled');
        expect(body).toContain('Janez Novak');
        expect(body).toContain('15.3.2026');
        expect(body).toContain('22.3.2026');
        expect(body).toContain('301');
        expect(body).toContain('Cesta svobode 1');
        expect(body).toContain('https://hotelbled.com/checkin/abc123');
      });

      it('should keep placeholder if variable not provided', () => {
        const { body } = renderEmailTemplate('welcome', {
          guest_name: 'Test Guest',
          property_name: 'Test Property',
        });

        expect(body).toContain('{{check_in_date}}');
        expect(body).toContain('{{check_out_date}}');
      });
    });

    describe('Pre-arrival Template', () => {
      it('should render pre-arrival email with all variables', () => {
        const { subject, body } = renderEmailTemplate('pre_arrival', {
          guest_name: 'Ana Horvat',
          property_name: 'Villa Ljubljana',
          parking_instructions: 'Parkirišče v garaži, koda 1234',
          access_instructions: 'Uporabite glavni vhod',
          maps_link: 'https://maps.google.com/?q=Villa+Ljubljana',
          property_phone: '+386 40 987 654',
        });

        expect(subject).toContain('jutri');
        expect(subject).toContain('Villa Ljubljana');
        expect(body).toContain('Ana Horvat');
        expect(body).toContain('Parkirišče v garaži');
        expect(body).toContain('https://maps.google.com');
      });
    });

    describe('Post-stay Template', () => {
      it('should render post-stay email with all variables', () => {
        const { subject, body } = renderEmailTemplate('post_stay', {
          guest_name: 'Marko Zupančič',
          property_name: 'Apartmaji Kolpa',
          review_link: 'https://review.hotel.com/abc',
          discount_code: 'HVALA10',
          discount_expiry: '31.12.2026',
          instagram_link: 'https://instagram.com/hotel',
          facebook_link: 'https://facebook.com/hotel',
        });

        expect(subject).toContain('Hvala');
        expect(body).toContain('Marko Zupančič');
        expect(body).toContain('https://review.hotel.com/abc');
        expect(body).toContain('HVALA10');
        expect(body).toContain('31.12.2026');
      });
    });

    describe('Payment Confirmation Template', () => {
      it('should render payment confirmation with all variables', () => {
        const { subject, body } = renderEmailTemplate('payment_confirmation', {
          guest_name: 'Peter Novak',
          amount: '250',
          currency: 'EUR',
          payment_date: '1.3.2026',
          reservation_id: 'RES-2026-001',
          payment_method: 'Kreditna kartica',
          invoice_link: 'https://hotel.com/invoice/001',
        });

        expect(subject).toContain('Potrdilo Plačila');
        expect(subject).toContain('RES-2026-001');
        expect(body).toContain('250 EUR');
        expect(body).toContain('1.3.2026');
        expect(body).toContain('Kreditna kartica');
      });
    });

    describe('Cancellation Template', () => {
      it('should render cancellation email with all variables', () => {
        const { subject, body } = renderEmailTemplate('cancellation', {
          guest_name: 'Maja Kralj',
          reservation_id: 'RES-2026-002',
          cancellation_date: '5.3.2026',
          refund_amount: '200',
          currency: 'EUR',
        });

        expect(subject).toContain('Potrdilo Preklica');
        expect(subject).toContain('RES-2026-002');
        expect(body).toContain('Maja Kralj');
        expect(body).toContain('200 EUR');
        expect(body).toContain('5-7 delovnih dni');
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent template', () => {
      expect(() => {
        renderEmailTemplate('nonexistent_template', { test: 'value' });
      }).toThrow(/Template nonexistent_template not found/);
    });

    it('should handle empty variables object', () => {
      const { subject, body } = renderEmailTemplate('welcome', {});
      
      expect(subject).toContain('{{property_name}}');
      expect(body).toContain('{{guest_name}}');
    });

    it('should handle undefined variables', () => {
      const { subject } = renderEmailTemplate('welcome', {
        guest_name: undefined as unknown as string,
        property_name: 'Test',
      });

      expect(subject).toContain('Test');
    });
  });

  describe('Template Metadata', () => {
    it('should have 5 email templates', () => {
      expect(TEMPLATE_IDS.length).toBe(5);
    });

    it('should have all required template IDs', () => {
      const required = ['welcome', 'pre_arrival', 'post_stay', 'payment_confirmation', 'cancellation'];
      required.forEach(id => {
        expect(TEMPLATE_IDS).toContain(id);
      });
    });

    it('should have correct categories for all templates', () => {
      const templates = Object.values(EMAIL_TEMPLATES);
      
      templates.forEach(template => {
        expect(template).toHaveProperty('category');
        expect(['pre-arrival', 'post-stay', 'booking', 'payment', 'cancellation']).toContain(
          template.category
        );
      });
    });

    it('should have all required properties for each template', () => {
      const templates = Object.values(EMAIL_TEMPLATES);
      
      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('subject');
        expect(template).toHaveProperty('body');
        expect(template).toHaveProperty('variables');
        expect(template).toHaveProperty('category');
        expect(Array.isArray(template.variables)).toBe(true);
      });
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return templates filtered by category', () => {
      const booking = getTemplatesByCategory('booking');
      const payment = getTemplatesByCategory('payment');
      const preArrival = getTemplatesByCategory('pre-arrival');
      const postStay = getTemplatesByCategory('post-stay');
      const cancellation = getTemplatesByCategory('cancellation');

      expect(booking.length).toBe(1);
      expect(booking[0].id).toBe('welcome');

      expect(payment.length).toBe(1);
      expect(payment[0].id).toBe('payment_confirmation');

      expect(preArrival.length).toBe(1);
      expect(preArrival[0].id).toBe('pre_arrival');

      expect(postStay.length).toBe(1);
      expect(postStay[0].id).toBe('post_stay');

      expect(cancellation.length).toBe(1);
      expect(cancellation[0].id).toBe('cancellation');
    });

    it('should return empty array for invalid category', () => {
      const invalid = getTemplatesByCategory('invalid' as any);
      expect(invalid).toEqual([]);
    });
  });

  describe('getTemplateById', () => {
    it('should return template by ID', () => {
      const template = getTemplateById('welcome');
      
      expect(template).toBeDefined();
      expect(template?.id).toBe('welcome');
      expect(template?.name).toBe('Dobrodošlica');
    });

    it('should return undefined for non-existent ID', () => {
      const template = getTemplateById('nonexistent');
      expect(template).toBeUndefined();
    });
  });

  describe('Variable Substitution Edge Cases', () => {
    it('should handle special characters in variables', () => {
      const { body } = renderEmailTemplate('welcome', {
        guest_name: 'O\'Brien & Novak',
        property_name: 'Hotel "Bled"',
        check_in_date: '15.3.2026',
        check_out_date: '22.3.2026',
        room_number: '301',
        guest_count: '2',
        property_address: 'Cesta 1',
        property_city: 'Bled',
        property_country: 'Slovenia',
        property_phone: '+386 40 123 456',
        property_email: 'info@bled.com',
        check_in_link: 'https://bled.com/checkin',
      });

      expect(body).toContain('O\'Brien & Novak');
      expect(body).toContain('Hotel "Bled"');
    });

    it('should handle multiple occurrences of same variable', () => {
      const { subject, body } = renderEmailTemplate('welcome', {
        guest_name: 'Test Guest',
        property_name: 'Test Property',
        check_in_date: '15.3.2026',
        check_out_date: '22.3.2026',
        room_number: '301',
        guest_count: '2',
        property_address: 'Test 1',
        property_city: 'Test',
        property_country: 'Test',
        property_phone: '+386 40 123 456',
        property_email: 'test@test.com',
        check_in_link: 'https://test.com',
      });

      const propertyCount = (body.match(/Test Property/g) || []).length;
      expect(propertyCount).toBeGreaterThan(1);
    });

    it('should handle HTML content in variables', () => {
      const { body } = renderEmailTemplate('post_stay', {
        guest_name: 'Test',
        property_name: 'Test',
        review_link: '<script>alert("xss")</script>',
        discount_code: 'TEST10',
        discount_expiry: '31.12.2026',
        instagram_link: 'https://instagram.com',
        facebook_link: 'https://facebook.com',
      });

      // Note: This test highlights a potential XSS vulnerability
      // In production, variables should be sanitized
      expect(body).toContain('<script>alert("xss")</script>');
    });
  });

  describe('Template Content Validation', () => {
    it('should have HTML structure in all templates', () => {
      const templates = Object.values(EMAIL_TEMPLATES);
      
      templates.forEach(template => {
        expect(template.body).toContain('<div');
        expect(template.body).toContain('</div>');
      });
    });

    it('should have gradient headers in all templates', () => {
      const templates = Object.values(EMAIL_TEMPLATES);
      
      templates.forEach(template => {
        expect(template.body).toContain('linear-gradient');
      });
    });

    it('should have responsive design in all templates', () => {
      const templates = Object.values(EMAIL_TEMPLATES);
      
      templates.forEach(template => {
        expect(template.body).toContain('max-width');
      });
    });

    it('should have call-to-action buttons where appropriate', () => {
      const welcome = EMAIL_TEMPLATES.welcome.body;
      const postStay = EMAIL_TEMPLATES.post_stay.body;
      const payment = EMAIL_TEMPLATES.payment_confirmation.body;

      expect(welcome).toContain('<a href=');
      expect(postStay).toContain('<a href=');
      expect(payment).toContain('<a href=');
    });
  });

  describe('Multi-language Support', () => {
    it('should support Slovenian language', () => {
      const { subject } = renderEmailTemplate('welcome', {
        guest_name: 'Test',
        property_name: 'Test',
        check_in_date: '15.3.2026',
        check_out_date: '22.3.2026',
        room_number: '301',
        guest_count: '2',
        property_address: 'Test',
        property_city: 'Test',
        property_country: 'Slovenia',
        property_phone: '+386 40 123 456',
        property_email: 'test@test.com',
        check_in_link: 'https://test.com',
      });

      expect(subject).toMatch(/dobrodošli|prijetno|veselimo/i);
    });
  });
});
