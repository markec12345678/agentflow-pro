/**
 * Template Systems - Comprehensive Test Suite
 * 
 * Tests for all 8 template systems:
 * - Email Templates (5)
 * - Workflow Templates (8)
 * - Dashboard Templates (23)
 * - AI Prompt Templates (15)
 * - SMS/WhatsApp Templates (20)
 * - Notification Templates (20)
 * - Report Templates (11)
 * - Document Templates (7)
 * 
 * Total: 109 templates tested
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  EMAIL_TEMPLATES,
  renderEmailTemplate,
  WORKFLOW_TEMPLATES,
  AI_PROMPT_TEMPLATES,
  renderPrompt,
  SMS_TEMPLATES,
  renderMessage,
  NOTIFICATION_TEMPLATES,
  renderNotification,
  REPORT_TEMPLATES,
  DOCUMENT_TEMPLATES,
  WIDGET_TEMPLATES,
  DASHBOARD_TEMPLATES,
  getAllTemplateCounts,
  searchTemplates,
  getTemplateStatistics
} from '@/lib/templates';

// ============================================================================
// EMAIL TEMPLATES TESTS
// ============================================================================

describe('Email Templates', () => {
  describe('renderEmailTemplate', () => {
    it('should render welcome template', () => {
      const { subject, body } = renderEmailTemplate('welcome', {
        guest_name: 'John Doe',
        property_name: 'Villa Bled',
        check_in_date: '2026-03-15',
        check_out_date: '2026-03-22',
        room_number: '301',
        guest_count: '2',
        property_address: 'Cesta svobode 1',
        property_city: 'Bled',
        property_country: 'Slovenia',
        property_phone: '+386 40 123 456',
        property_email: 'info@villabled.com',
        check_in_link: 'https://villabled.com/checkin/abc123'
      });

      expect(subject).toContain('Dobrodošli');
      expect(subject).toContain('Villa Bled');
      expect(body).toContain('John Doe');
      expect(body).toContain('2026-03-15');
    });

    it('should render pre_arrival template', () => {
      const { subject } = renderEmailTemplate('pre_arrival', {
        guest_name: 'Jane Smith',
        property_name: 'Hotel Ljubljana',
        parking_instructions: 'Parking available in garage',
        access_instructions: 'Use main entrance',
        maps_link: 'https://maps.google.com/...',
        property_phone: '+386 40 123 456'
      });

      expect(subject).toContain('jutri');
    });

    it('should throw error for non-existent template', () => {
      expect(() => renderEmailTemplate('nonexistent', {})).toThrow();
    });
  });

  describe('template count', () => {
    it('should have 5 email templates', () => {
      expect(Object.keys(EMAIL_TEMPLATES).length).toBe(5);
    });

    it('should have all required templates', () => {
      const required = ['welcome', 'pre_arrival', 'post_stay', 'payment_confirmation', 'cancellation'];
      required.forEach(id => {
        expect(EMAIL_TEMPLATES).toHaveProperty(id);
      });
    });
  });
});

// ============================================================================
// WORKFLOW TEMPLATES TESTS
// ============================================================================

describe('Workflow Templates', () => {
  describe('template structure', () => {
    it('should have 8 workflow templates', () => {
      expect(Object.keys(WORKFLOW_TEMPLATES).length).toBe(8);
    });

    it('should have valid trigger for each template', () => {
      Object.values(WORKFLOW_TEMPLATES).forEach(template => {
        expect(template).toHaveProperty('trigger');
        expect(template.trigger).toHaveProperty('type');
        expect(['scheduled', 'event', 'webhook']).toContain(template.trigger.type);
      });
    });

    it('should have valid actions for each template', () => {
      Object.values(WORKFLOW_TEMPLATES).forEach(template => {
        expect(template).toHaveProperty('actions');
        expect(Array.isArray(template.actions)).toBe(true);
        expect(template.actions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('specific templates', () => {
    it('should have auto_checkin_reminder template', () => {
      const template = WORKFLOW_TEMPLATES.auto_checkin_reminder;
      expect(template).toBeDefined();
      expect(template.category).toBe('guest-communication');
      expect(template.estimatedTimeSaved).toContain('min');
    });

    it('should have vip_guest_alert template', () => {
      const template = WORKFLOW_TEMPLATES.vip_guest_alert;
      expect(template).toBeDefined();
      expect(template.difficulty).toBe('easy');
    });
  });
});

// ============================================================================
// AI PROMPT TEMPLATES TESTS
// ============================================================================

describe('AI Prompt Templates', () => {
  describe('renderPrompt', () => {
    it('should render respond_to_review prompt', () => {
      const prompt = renderPrompt('respond_to_review', {
        review_text: 'Amazing stay with great view!',
        guest_name: 'John',
        property_name: 'Villa',
        review_score: '9',
        maxWords: '100'
      });

      expect(prompt).toContain('Amazing stay with great view!');
      expect(prompt).toContain('professional');
    });

    it('should replace all variables', () => {
      const prompt = renderPrompt('welcome_message', {
        guest_name: 'Jane',
        property_name: 'Hotel',
        check_in_date: '2026-03-15',
        check_out_date: '2026-03-22',
        room_type: 'Suite',
        special_occasion: 'Anniversary',
        maxWords: '150'
      });

      expect(prompt).toContain('Jane');
      expect(prompt).toContain('Hotel');
      expect(prompt).toContain('2026-03-15');
    });
  });

  describe('template count', () => {
    it('should have 15 AI prompt templates', () => {
      expect(Object.keys(AI_PROMPT_TEMPLATES).length).toBe(15);
    });

    it('should have templates in all categories', () => {
      const categories = new Set(
        Object.values(AI_PROMPT_TEMPLATES).map(t => t.category)
      );
      expect(categories.size).toBeGreaterThan(4);
    });
  });
});

// ============================================================================
// SMS/WHATSAPP TEMPLATES TESTS
// ============================================================================

describe('SMS/WhatsApp Templates', () => {
  describe('renderMessage', () => {
    it('should render checkin_reminder message', () => {
      const message = renderMessage('checkin_reminder', {
        guest_name: 'John Doe',
        property_name: 'Villa Bled'
      });

      expect(message).toContain('John Doe');
      expect(message).toContain('Villa Bled');
      expect(message.length).toBeLessThan(160);
    });

    it('should render wifi_password message', () => {
      const message = renderMessage('wifi_password', {
        property_name: 'Hotel',
        wifi_password: '12345',
        wifi_network: 'Hotel-Guest'
      });

      expect(message).toContain('12345');
      expect(message.length).toBeLessThan(160);
    });

    it('should handle long messages for WhatsApp', () => {
      const message = renderMessage('checkin_instructions', {
        property_name: 'Villa Bled',
        address: 'Cesta 1',
        door_code: '1234',
        wifi_password: '5678'
      });

      // WhatsApp can be longer than SMS
      expect(message).toBeDefined();
    });
  });

  describe('template count', () => {
    it('should have 20 SMS/WhatsApp templates', () => {
      expect(Object.keys(SMS_TEMPLATES).length).toBe(20);
    });

    it('should have templates in all categories', () => {
      const categories = new Set(
        Object.values(SMS_TEMPLATES).map(t => t.category)
      );
      expect(categories.size).toBe(5); // pre-arrival, during-stay, post-stay, operational, emergency
    });
  });
});

// ============================================================================
// NOTIFICATION TEMPLATES TESTS
// ============================================================================

describe('Notification Templates', () => {
  describe('renderNotification', () => {
    it('should render vip_arrival notification', () => {
      const { title, body } = renderNotification('vip_arrival', {
        guest_name: 'John Doe',
        loyalty_tier: 'Gold',
        check_in_time: '14:00',
        room_number: '301'
      });

      expect(title).toContain('VIP');
      expect(body).toContain('John Doe');
      expect(body).toContain('Gold');
    });

    it('should render maintenance_request notification', () => {
      const { title } = renderNotification('maintenance_request', {
        room_number: '301',
        issue_description: 'AC not working',
        priority: 'high',
        reported_by: 'Guest'
      });

      expect(title).toContain('Vzdrževanje');
    });
  });

  describe('template count', () => {
    it('should have 20 notification templates', () => {
      expect(Object.keys(NOTIFICATION_TEMPLATES).length).toBe(20);
    });

    it('should have templates for all priorities', () => {
      const priorities = new Set(
        Object.values(NOTIFICATION_TEMPLATES).map(t => t.priority)
      );
      expect(priorities.has('urgent')).toBe(true);
      expect(priorities.has('high')).toBe(true);
      expect(priorities.has('medium')).toBe(true);
      expect(priorities.has('low')).toBe(true);
    });
  });
});

// ============================================================================
// REPORT TEMPLATES TESTS
// ============================================================================

describe('Report Templates', () => {
  describe('template structure', () => {
    it('should have 11 report templates', () => {
      expect(Object.keys(REPORT_TEMPLATES).length).toBe(11);
    });

    it('should have valid sections for each template', () => {
      Object.values(REPORT_TEMPLATES).forEach(template => {
        expect(template).toHaveProperty('sections');
        expect(Array.isArray(template.sections)).toBe(true);
        expect(template.sections.length).toBeGreaterThan(0);
      });
    });

    it('should have valid frequency for each template', () => {
      Object.values(REPORT_TEMPLATES).forEach(template => {
        expect(template).toHaveProperty('frequency');
        expect(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'on-demand'])
          .toContain(template.frequency);
      });
    });
  });

  describe('specific templates', () => {
    it('should have monthly_performance template', () => {
      const template = REPORT_TEMPLATES.monthly_performance;
      expect(template).toBeDefined();
      expect(template.category).toBe('performance');
      expect(template.recipients.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// DOCUMENT TEMPLATES TESTS
// ============================================================================

describe('Document Templates', () => {
  describe('template structure', () => {
    it('should have 7 document templates', () => {
      expect(Object.keys(DOCUMENT_TEMPLATES).length).toBe(7);
    });

    it('should have valid format for each template', () => {
      Object.values(DOCUMENT_TEMPLATES).forEach(template => {
        expect(template).toHaveProperty('format');
        expect(['A4', 'Letter', 'A5']).toContain(template.format);
      });
    });

    it('should have valid sections for each template', () => {
      Object.values(DOCUMENT_TEMPLATES).forEach(template => {
        expect(template).toHaveProperty('sections');
        expect(Array.isArray(template.sections)).toBe(true);
      });
    });
  });

  describe('specific templates', () => {
    it('should have standard_invoice template', () => {
      const template = DOCUMENT_TEMPLATES.standard_invoice;
      expect(template).toBeDefined();
      expect(template.category).toBe('invoice');
      expect(template.variables.length).toBeGreaterThan(10);
    });
  });
});

// ============================================================================
// DASHBOARD TEMPLATES TESTS
// ============================================================================

describe('Dashboard Templates', () => {
  describe('widget templates', () => {
    it('should have 18 widget templates', () => {
      expect(Object.keys(WIDGET_TEMPLATES).length).toBe(18);
    });

    it('should have valid size configuration for each widget', () => {
      Object.values(WIDGET_TEMPLATES).forEach(widget => {
        expect(widget).toHaveProperty('defaultSize');
        expect(widget.defaultSize).toHaveProperty('w');
        expect(widget.defaultSize).toHaveProperty('h');
      });
    });

    it('should have valid category for each widget', () => {
      const validCategories = ['revenue', 'operations', 'guests', 'marketing'];
      Object.values(WIDGET_TEMPLATES).forEach(widget => {
        expect(validCategories).toContain(widget.category);
      });
    });

    it('should have required properties for each widget', () => {
      Object.values(WIDGET_TEMPLATES).forEach(widget => {
        expect(widget).toHaveProperty('type');
        expect(widget).toHaveProperty('title');
        expect(widget).toHaveProperty('description');
        expect(widget).toHaveProperty('dataEndpoint');
        expect(widget).toHaveProperty('refreshInterval');
        expect(widget).toHaveProperty('category');
      });
    });

    it('should have revenue widgets', () => {
      const revenueWidgets = Object.values(WIDGET_TEMPLATES).filter(
        w => w.category === 'revenue'
      );
      expect(revenueWidgets.length).toBeGreaterThan(0);
      expect(revenueWidgets.map(w => w.type)).toContain('revenue_mtd');
    });

    it('should have operations widgets', () => {
      const operationsWidgets = Object.values(WIDGET_TEMPLATES).filter(
        w => w.category === 'operations'
      );
      expect(operationsWidgets.length).toBeGreaterThan(0);
      expect(operationsWidgets.map(w => w.type)).toContain('today_arrivals');
    });

    it('should have guests widgets', () => {
      const guestsWidgets = Object.values(WIDGET_TEMPLATES).filter(
        w => w.category === 'guests'
      );
      expect(guestsWidgets.length).toBeGreaterThan(0);
    });

    it('should have marketing widgets', () => {
      const marketingWidgets = Object.values(WIDGET_TEMPLATES).filter(
        w => w.category === 'marketing'
      );
      expect(marketingWidgets.length).toBeGreaterThan(0);
    });
  });

  describe('dashboard templates', () => {
    it('should have 5 dashboard templates', () => {
      expect(Object.keys(DASHBOARD_TEMPLATES).length).toBe(5);
    });

    it('should have valid widgets for each dashboard', () => {
      Object.values(DASHBOARD_TEMPLATES).forEach(dashboard => {
        expect(dashboard).toHaveProperty('widgets');
        expect(Array.isArray(dashboard.widgets)).toBe(true);
        expect(dashboard.widgets.length).toBeGreaterThan(0);
      });
    });

    it('should have valid role for each dashboard', () => {
      const validRoles = ['owner', 'director', 'receptor', 'housekeeping', 'manager'];
      Object.values(DASHBOARD_TEMPLATES).forEach(dashboard => {
        expect(validRoles).toContain(dashboard.role);
      });
    });

    it('should have required properties for each dashboard', () => {
      Object.values(DASHBOARD_TEMPLATES).forEach(dashboard => {
        expect(dashboard).toHaveProperty('id');
        expect(dashboard).toHaveProperty('name');
        expect(dashboard).toHaveProperty('description');
        expect(dashboard).toHaveProperty('role');
        expect(dashboard).toHaveProperty('widgets');
      });
    });

    it('should have owner dashboard with revenue widgets', () => {
      const owner = DASHBOARD_TEMPLATES.owner;
      expect(owner).toBeDefined();
      const widgetTypes = owner.widgets.map(w => w.type);
      expect(widgetTypes).toContain('revenue_mtd');
      expect(widgetTypes).toContain('occupancy_rate');
    });

    it('should have director dashboard with operational widgets', () => {
      const director = DASHBOARD_TEMPLATES.director;
      expect(director).toBeDefined();
      const widgetTypes = director.widgets.map(w => w.type);
      expect(widgetTypes).toContain('today_arrivals');
      expect(widgetTypes).toContain('today_departures');
    });

    it('should have receptor dashboard with daily operations widgets', () => {
      const receptor = DASHBOARD_TEMPLATES.receptor;
      expect(receptor).toBeDefined();
      const widgetTypes = receptor.widgets.map(w => w.type);
      expect(widgetTypes).toContain('today_arrivals');
      expect(widgetTypes).toContain('room_status');
    });

    it('should have housekeeping dashboard with cleaning widgets', () => {
      const housekeeping = DASHBOARD_TEMPLATES.housekeeping;
      expect(housekeeping).toBeDefined();
      const widgetTypes = housekeeping.widgets.map(w => w.type);
      expect(widgetTypes).toContain('rooms_to_clean');
      expect(widgetTypes).toContain('cleaning_progress');
    });

    it('should have manager dashboard with combined widgets', () => {
      const manager = DASHBOARD_TEMPLATES.manager;
      expect(manager).toBeDefined();
      const widgetTypes = manager.widgets.map(w => w.type);
      expect(widgetTypes).toContain('revenue_mtd');
      expect(widgetTypes).toContain('guest_satisfaction');
    });

    it('should have valid widget positions for each dashboard', () => {
      Object.values(DASHBOARD_TEMPLATES).forEach(dashboard => {
        dashboard.widgets.forEach(widget => {
          expect(widget.position).toHaveProperty('x');
          expect(widget.position).toHaveProperty('y');
          expect(widget.position).toHaveProperty('w');
          expect(widget.position).toHaveProperty('h');
        });
      });
    });

    it('should have grid layout for all dashboards', () => {
      Object.values(DASHBOARD_TEMPLATES).forEach(dashboard => {
        expect(dashboard.layout).toBe('grid');
        expect(dashboard.columns).toBe(12);
      });
    });
  });

  describe('widget size validation', () => {
    it('should have consistent widget sizes', () => {
      Object.values(WIDGET_TEMPLATES).forEach(widget => {
        expect(widget.defaultSize.w).toBeGreaterThanOrEqual(widget.minSize.w);
        expect(widget.defaultSize.h).toBeGreaterThanOrEqual(widget.minSize.h);
      });
    });

    it('should have reasonable widget sizes', () => {
      Object.values(WIDGET_TEMPLATES).forEach(widget => {
        expect(widget.defaultSize.w).toBeLessThanOrEqual(12);
        expect(widget.defaultSize.h).toBeLessThanOrEqual(6);
        expect(widget.minSize.w).toBeGreaterThanOrEqual(1);
        expect(widget.minSize.h).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('widget refresh intervals', () => {
    it('should have valid refresh intervals', () => {
      Object.values(WIDGET_TEMPLATES).forEach(widget => {
        expect(widget.refreshInterval).toBeGreaterThanOrEqual(0);
        expect(widget.refreshInterval).toBeLessThanOrEqual(3600);
      });
    });

    it('should have real-time widgets (30s refresh)', () => {
      const realTimeWidgets = Object.values(WIDGET_TEMPLATES).filter(
        w => w.refreshInterval === 30
      );
      expect(realTimeWidgets.length).toBeGreaterThan(0);
    });

    it('should have hourly refresh widgets', () => {
      const hourlyWidgets = Object.values(WIDGET_TEMPLATES).filter(
        w => w.refreshInterval === 3600
      );
      expect(hourlyWidgets.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS TESTS
// ============================================================================

describe('Template Helpers', () => {
  describe('getAllTemplateCounts', () => {
    it('should return counts for all systems', () => {
      const counts = getAllTemplateCounts();
      
      expect(counts).toHaveProperty('email');
      expect(counts).toHaveProperty('workflow');
      expect(counts).toHaveProperty('ai_prompt');
      expect(counts).toHaveProperty('sms');
      expect(counts).toHaveProperty('notification');
      expect(counts).toHaveProperty('report');
      expect(counts).toHaveProperty('document');
      expect(counts).toHaveProperty('total');
      expect(counts.total).toBeGreaterThan(100);
    });
  });

  describe('searchTemplates', () => {
    it('should find templates by query', () => {
      const results = searchTemplates('welcome');
      
      expect(results).toHaveProperty('email');
      expect(results.email.length).toBeGreaterThan(0);
    });

    it('should return empty arrays for non-existent query', () => {
      const results = searchTemplates('xyznonexistent123');
      
      Object.values(results).forEach(arr => {
        expect(Array.isArray(arr)).toBe(true);
      });
    });
  });

  describe('getTemplateStatistics', () => {
    it('should return valid statistics', () => {
      const stats = getTemplateStatistics();
      
      expect(stats).toHaveProperty('total_templates');
      expect(stats).toHaveProperty('by_system');
      expect(stats).toHaveProperty('estimated_annual_value');
      expect(stats).toHaveProperty('roi_percentage');
      expect(stats.total_templates).toBeGreaterThan(100);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Template Integration', () => {
  describe('cross-system consistency', () => {
    it('should have consistent ID naming', () => {
      const allIds = [
        ...Object.keys(EMAIL_TEMPLATES),
        ...Object.keys(WORKFLOW_TEMPLATES),
        ...Object.keys(AI_PROMPT_TEMPLATES),
        ...Object.keys(SMS_TEMPLATES),
        ...Object.keys(NOTIFICATION_TEMPLATES)
      ];

      allIds.forEach(id => {
        expect(id).toMatch(/^[a-z0-9_]+$/);
      });
    });

    it('should have unique IDs across systems', () => {
      const allIds = [
        ...Object.keys(EMAIL_TEMPLATES),
        ...Object.keys(WORKFLOW_TEMPLATES),
        ...Object.keys(AI_PROMPT_TEMPLATES),
        ...Object.keys(SMS_TEMPLATES),
        ...Object.keys(NOTIFICATION_TEMPLATES),
        ...Object.keys(REPORT_TEMPLATES),
        ...Object.keys(DOCUMENT_TEMPLATES)
      ];

      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Template Performance', () => {
  describe('rendering performance', () => {
    it('should render email template in <10ms', () => {
      const start = performance.now();
      renderEmailTemplate('welcome', {
        guest_name: 'Test',
        property_name: 'Test',
        check_in_date: '2026-03-15',
        check_out_date: '2026-03-22',
        room_number: '301',
        guest_count: '2',
        property_address: 'Test',
        property_city: 'Test',
        property_country: 'Test',
        property_phone: 'Test',
        property_email: 'Test',
        check_in_link: 'Test'
      });
      const end = performance.now();
      
      expect(end - start).toBeLessThan(10);
    });

    it('should render SMS template in <5ms', () => {
      const start = performance.now();
      renderMessage('checkin_reminder', {
        guest_name: 'Test',
        property_name: 'Test'
      });
      const end = performance.now();
      
      expect(end - start).toBeLessThan(5);
    });

    it('should render AI prompt in <5ms', () => {
      const start = performance.now();
      renderPrompt('respond_to_review', {
        review_text: 'Test',
        guest_name: 'Test',
        property_name: 'Test',
        review_score: '9',
        maxWords: '100'
      });
      const end = performance.now();
      
      expect(end - start).toBeLessThan(5);
    });
  });
});
