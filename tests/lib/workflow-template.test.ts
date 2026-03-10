/**
 * Workflow Template Integration Tests
 * 
 * Tests for workflow template functionality:
 * - createWorkflowFromTemplate()
 * - getTemplatesByCategory()
 * - getTemplateById()
 * - templateExists()
 * - validateTemplate()
 * - getWorkflowVariables()
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

// Mock Prisma
const mockCreate = vi.fn();
vi.mock('@/database/schema', () => ({
  prisma: {
    workflow: {
      create: mockCreate,
    },
  },
}));

describe('Workflow Template Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
  });

  describe('createWorkflowFromTemplate', () => {
    it('should create workflow from valid template', async () => {
      mockCreate.mockResolvedValue({
        id: 'wf-123',
        name: 'Avtomatski Check-in Opomnik',
        description: 'Pošlji opomnik 1 dan pred check-in z navodili',
        category: 'guest-communication',
        isActive: true,
      });

      const { createWorkflowFromTemplate } = await import('@/lib/workflow-templates/tourism-workflows');
      const workflow = await createWorkflowFromTemplate('auto_checkin_reminder', 'prop-123', 'user-456');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Avtomatski Check-in Opomnik',
          description: 'Pošlji opomnik 1 dan pred check-in z navodili',
          category: 'guest-communication',
          propertyId: 'prop-123',
          userId: 'user-456',
          isActive: true,
        }),
      });

      expect(workflow.id).toBe('wf-123');
    });

    it('should throw error for non-existent template', async () => {
      const { createWorkflowFromTemplate } = await import('@/lib/workflow-templates/tourism-workflows');

      await expect(
        createWorkflowFromTemplate('nonexistent_template', 'prop-123', 'user-456')
      ).rejects.toThrow(/Template nonexistent_template not found/);

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should set correct trigger configuration from template', async () => {
      mockCreate.mockResolvedValue({ id: 'wf-123' });

      const { createWorkflowFromTemplate } = await import('@/lib/workflow-templates/tourism-workflows');
      await createWorkflowFromTemplate('auto_checkin_reminder', 'prop-123', 'user-456');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          trigger: expect.objectContaining({
            type: 'scheduled',
            schedule: '0 10 * * *',
            condition: 'reservation.checkIn_tomorrow AND reservation.status == "confirmed"',
          }),
        }),
      });
    });

    it('should set correct actions from template', async () => {
      mockCreate.mockResolvedValue({ id: 'wf-123' });

      const { createWorkflowFromTemplate } = await import('@/lib/workflow-templates/tourism-workflows');
      await createWorkflowFromTemplate('auto_checkin_reminder', 'prop-123', 'user-456');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actions: expect.arrayContaining([
            expect.objectContaining({
              type: 'send_email',
              config: expect.objectContaining({
                template: 'pre_arrival',
              }),
            }),
            expect.objectContaining({
              type: 'send_sms',
            }),
            expect.objectContaining({
              type: 'create_task',
            }),
          ]),
        }),
      });
    });

    it('should set estimatedTimeSaved and difficulty from template', async () => {
      mockCreate.mockResolvedValue({ id: 'wf-123' });

      const { createWorkflowFromTemplate } = await import('@/lib/workflow-templates/tourism-workflows');
      await createWorkflowFromTemplate('vip_guest_alert', 'prop-123', 'user-456');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          estimatedTimeSaved: '20 min na VIP gosta',
          difficulty: 'easy',
        }),
      });
    });

    it('should create workflow with isActive set to true', async () => {
      mockCreate.mockResolvedValue({ id: 'wf-123', isActive: true });

      const { createWorkflowFromTemplate } = await import('@/lib/workflow-templates/tourism-workflows');
      const workflow = await createWorkflowFromTemplate('auto_review_request', 'prop-123', 'user-456');

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isActive: true,
        }),
      });
      expect(workflow.isActive).toBe(true);
    });

    it('should create workflow for each template type', async () => {
      mockCreate.mockResolvedValue({ id: 'wf-123' });

      const { createWorkflowFromTemplate, WORKFLOW_TEMPLATE_IDS } = await import('@/lib/workflow-templates/tourism-workflows');

      for (const templateId of WORKFLOW_TEMPLATE_IDS) {
        mockCreate.mockClear();
        await createWorkflowFromTemplate(templateId, 'prop-123', 'user-456');
        expect(mockCreate).toHaveBeenCalled();
      }
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return guest-communication templates', async () => {
      const { getTemplatesByCategory } = await import('@/lib/workflow-templates/tourism-workflows');
      const templates = getTemplatesByCategory('guest-communication');

      expect(templates.length).toBeGreaterThan(0);
      templates.forEach(template => {
        expect(template.category).toBe('guest-communication');
      });

      const templateIds = templates.map(t => t.id);
      expect(templateIds).toContain('auto_checkin_reminder');
      expect(templateIds).toContain('auto_review_request');
    });

    it('should return operations templates', async () => {
      const { getTemplatesByCategory } = await import('@/lib/workflow-templates/tourism-workflows');
      const templates = getTemplatesByCategory('operations');

      expect(templates.length).toBeGreaterThan(0);
      templates.forEach(template => {
        expect(template.category).toBe('operations');
      });

      const templateIds = templates.map(t => t.id);
      expect(templateIds).toContain('vip_guest_alert');
      expect(templateIds).toContain('housekeeping_task_assignment');
    });

    it('should return revenue templates', async () => {
      const { getTemplatesByCategory } = await import('@/lib/workflow-templates/tourism-workflows');
      const templates = getTemplatesByCategory('revenue');

      expect(templates.length).toBeGreaterThan(0);
      templates.forEach(template => {
        expect(template.category).toBe('revenue');
      });

      const templateIds = templates.map(t => t.id);
      expect(templateIds).toContain('low_occupancy_alert');
      expect(templateIds).toContain('payment_reminder');
      expect(templateIds).toContain('dynamic_price_adjustment');
    });

    it('should return compliance templates', async () => {
      const { getTemplatesByCategory } = await import('@/lib/workflow-templates/tourism-workflows');
      const templates = getTemplatesByCategory('compliance');

      expect(templates.length).toBeGreaterThan(0);
      templates.forEach(template => {
        expect(template.category).toBe('compliance');
      });

      expect(templates[0].id).toBe('eturizem_auto_sync');
    });

    it('should return empty array for invalid category', async () => {
      const { getTemplatesByCategory } = await import('@/lib/workflow-templates/tourism-workflows');
      const templates = getTemplatesByCategory('invalid' as any);

      expect(templates).toEqual([]);
    });
  });

  describe('getTemplateById', () => {
    it('should return template by ID', async () => {
      const { getTemplateById } = await import('@/lib/workflow-templates/tourism-workflows');
      const template = getTemplateById('auto_checkin_reminder');

      expect(template).toBeDefined();
      expect(template?.id).toBe('auto_checkin_reminder');
      expect(template?.name).toBe('Avtomatski Check-in Opomnik');
      expect(template?.category).toBe('guest-communication');
    });

    it('should return template with all properties', async () => {
      const { getTemplateById } = await import('@/lib/workflow-templates/tourism-workflows');
      const template = getTemplateById('vip_guest_alert');

      expect(template).toBeDefined();
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('trigger');
      expect(template).toHaveProperty('actions');
      expect(template).toHaveProperty('estimatedTimeSaved');
      expect(template).toHaveProperty('difficulty');
      expect(template).toHaveProperty('variables');
    });

    it('should return undefined for non-existent ID', async () => {
      const { getTemplateById } = await import('@/lib/workflow-templates/tourism-workflows');
      const template = getTemplateById('nonexistent_template');

      expect(template).toBeUndefined();
    });

    it('should return template with correct trigger type', async () => {
      const { getTemplateById } = await import('@/lib/workflow-templates/tourism-workflows');

      const scheduled = getTemplateById('auto_checkin_reminder');
      expect(scheduled?.trigger.type).toBe('scheduled');

      const event = getTemplateById('vip_guest_alert');
      expect(event?.trigger.type).toBe('event');
    });

    it('should return template with actions array', async () => {
      const { getTemplateById } = await import('@/lib/workflow-templates/tourism-workflows');
      const template = getTemplateById('auto_checkin_reminder');

      expect(template).toBeDefined();
      expect(template?.actions).toBeDefined();
      expect(Array.isArray(template?.actions)).toBe(true);
      expect(template?.actions.length).toBeGreaterThan(0);
    });
  });

  describe('templateExists', () => {
    it('should return true for existing template', async () => {
      const { templateExists } = await import('@/lib/workflow-templates/tourism-workflows');

      expect(templateExists('auto_checkin_reminder')).toBe(true);
      expect(templateExists('vip_guest_alert')).toBe(true);
      expect(templateExists('low_occupancy_alert')).toBe(true);
      expect(templateExists('payment_reminder')).toBe(true);
    });

    it('should return false for non-existent template', async () => {
      const { templateExists } = await import('@/lib/workflow-templates/tourism-workflows');

      expect(templateExists('nonexistent')).toBe(false);
      expect(templateExists('')).toBe(false);
      expect(templateExists('undefined')).toBe(false);
    });

    it('should return true for all 8 templates', async () => {
      const { templateExists, WORKFLOW_TEMPLATE_IDS } = await import('@/lib/workflow-templates/tourism-workflows');

      WORKFLOW_TEMPLATE_IDS.forEach(id => {
        expect(templateExists(id)).toBe(true);
      });
    });
  });

  describe('validateTemplate', () => {
    it('should validate complete template', async () => {
      const { validateTemplate } = await import('@/lib/workflow-templates/tourism-workflows');

      const valid = {
        id: 'test',
        name: 'Test Template',
        trigger: {
          type: 'scheduled' as const,
          schedule: '0 * * * *',
        },
        actions: [
          {
            type: 'send_email',
            config: {},
          },
        ],
      };

      expect(validateTemplate(valid)).toBe(true);
    });

    it('should reject template without id', async () => {
      const { validateTemplate } = await import('@/lib/workflow-templates/tourism-workflows');

      const invalid = {
        name: 'Test',
        trigger: { type: 'scheduled' as const, schedule: '0 * * * *' },
        actions: [{ type: 'send_email', config: {} }],
      };

      expect(validateTemplate(invalid as any)).toBe(false);
    });

    it('should reject template without name', async () => {
      const { validateTemplate } = await import('@/lib/workflow-templates/tourism-workflows');

      const invalid = {
        id: 'test',
        trigger: { type: 'scheduled' as const, schedule: '0 * * * *' },
        actions: [{ type: 'send_email', config: {} }],
      };

      expect(validateTemplate(invalid as any)).toBe(false);
    });

    it('should reject template without trigger', async () => {
      const { validateTemplate } = await import('@/lib/workflow-templates/tourism-workflows');

      const invalid = {
        id: 'test',
        name: 'Test',
        actions: [{ type: 'send_email', config: {} }],
      };

      expect(validateTemplate(invalid as any)).toBe(false);
    });

    it('should reject template without actions', async () => {
      const { validateTemplate } = await import('@/lib/workflow-templates/tourism-workflows');

      const invalid = {
        id: 'test',
        name: 'Test',
        trigger: { type: 'scheduled' as const, schedule: '0 * * * *' },
      };

      expect(validateTemplate(invalid as any)).toBe(false);
    });

    it('should reject template with empty actions array', async () => {
      const { validateTemplate } = await import('@/lib/workflow-templates/tourism-workflows');

      const invalid = {
        id: 'test',
        name: 'Test',
        trigger: { type: 'scheduled' as const, schedule: '0 * * * *' },
        actions: [],
      };

      expect(validateTemplate(invalid as any)).toBe(false);
    });

    it('should reject scheduled trigger without schedule', async () => {
      const { validateTemplate } = await import('@/lib/workflow-templates/tourism-workflows');

      const invalid = {
        id: 'test',
        name: 'Test',
        trigger: { type: 'scheduled' as const },
        actions: [{ type: 'send_email', config: {} }],
      };

      expect(validateTemplate(invalid as any)).toBe(false);
    });

    it('should reject event trigger without event', async () => {
      const { validateTemplate } = await import('@/lib/workflow-templates/tourism-workflows');

      const invalid = {
        id: 'test',
        name: 'Test',
        trigger: { type: 'event' as const },
        actions: [{ type: 'send_email', config: {} }],
      };

      expect(validateTemplate(invalid as any)).toBe(false);
    });

    it('should accept event trigger with event', async () => {
      const { validateTemplate } = await import('@/lib/workflow-templates/tourism-workflows');

      const valid = {
        id: 'test',
        name: 'Test',
        trigger: { type: 'event' as const, event: 'reservation.created' },
        actions: [{ type: 'send_email', config: {} }],
      };

      expect(validateTemplate(valid as any)).toBe(true);
    });
  });

  describe('getWorkflowVariables', () => {
    it('should return variables for template', async () => {
      const { getWorkflowVariables } = await import('@/lib/workflow-templates/tourism-workflows');

      const variables = getWorkflowVariables('auto_checkin_reminder');

      expect(Array.isArray(variables)).toBe(true);
      expect(variables.length).toBeGreaterThan(0);
      expect(variables).toContain('guest.email');
      expect(variables).toContain('guest.name');
      expect(variables).toContain('property.name');
    });

    it('should return empty array if template has no variables', async () => {
      const { getWorkflowVariables } = await import('@/lib/workflow-templates/tourism-workflows');

      // Mock a template without variables
      const variables = getWorkflowVariables('nonexistent');
      expect(variables).toEqual([]);
    });

    it('should return all variables for vip_guest_alert', async () => {
      const { getWorkflowVariables } = await import('@/lib/workflow-templates/tourism-workflows');

      const variables = getWorkflowVariables('vip_guest_alert');

      expect(variables).toContain('guest.name');
      expect(variables).toContain('guest.loyaltyTier');
      expect(variables).toContain('reservation.roomNumber');
      expect(variables).toContain('reservation.checkIn');
    });
  });

  describe('WORKFLOW_TEMPLATE_IDS', () => {
    it('should return 8 template IDs', async () => {
      const { WORKFLOW_TEMPLATE_IDS } = await import('@/lib/workflow-templates/tourism-workflows');

      expect(WORKFLOW_TEMPLATE_IDS.length).toBe(8);
    });

    it('should include all expected template IDs', async () => {
      const { WORKFLOW_TEMPLATE_IDS } = await import('@/lib/workflow-templates/tourism-workflows');

      const expected = [
        'auto_checkin_reminder',
        'auto_review_request',
        'low_occupancy_alert',
        'vip_guest_alert',
        'payment_reminder',
        'eturizem_auto_sync',
        'housekeeping_task_assignment',
        'dynamic_price_adjustment',
      ];

      expected.forEach(id => {
        expect(WORKFLOW_TEMPLATE_IDS).toContain(id);
      });
    });
  });

  describe('Template Structure Validation', () => {
    it('all templates should have required properties', async () => {
      const { WORKFLOW_TEMPLATES } = await import('@/lib/workflow-templates/tourism-workflows');

      Object.values(WORKFLOW_TEMPLATES).forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('trigger');
        expect(template).toHaveProperty('actions');
        expect(template).toHaveProperty('estimatedTimeSaved');
        expect(template).toHaveProperty('difficulty');
      });
    });

    it('all templates should have valid categories', async () => {
      const { WORKFLOW_TEMPLATES } = await import('@/lib/workflow-templates/tourism-workflows');

      const validCategories = ['guest-communication', 'operations', 'revenue', 'compliance'];

      Object.values(WORKFLOW_TEMPLATES).forEach(template => {
        expect(validCategories).toContain(template.category);
      });
    });

    it('all templates should have valid trigger types', async () => {
      const { WORKFLOW_TEMPLATES } = await import('@/lib/workflow-templates/tourism-workflows');

      const validTypes = ['scheduled', 'event', 'webhook'];

      Object.values(WORKFLOW_TEMPLATES).forEach(template => {
        expect(validTypes).toContain(template.trigger.type);
      });
    });

    it('all templates should have valid difficulty levels', async () => {
      const { WORKFLOW_TEMPLATES } = await import('@/lib/workflow-templates/tourism-workflows');

      const validDifficulties = ['easy', 'medium', 'hard'];

      Object.values(WORKFLOW_TEMPLATES).forEach(template => {
        expect(validDifficulties).toContain(template.difficulty);
      });
    });

    it('scheduled triggers should have schedule property', async () => {
      const { WORKFLOW_TEMPLATES } = await import('@/lib/workflow-templates/tourism-workflows');

      Object.values(WORKFLOW_TEMPLATES).forEach(template => {
        if (template.trigger.type === 'scheduled') {
          expect(template.trigger.schedule).toBeDefined();
          expect(typeof template.trigger.schedule).toBe('string');
        }
      });
    });

    it('event triggers should have event property', async () => {
      const { WORKFLOW_TEMPLATES } = await import('@/lib/workflow-templates/tourism-workflows');

      Object.values(WORKFLOW_TEMPLATES).forEach(template => {
        if (template.trigger.type === 'event') {
          expect(template.trigger.event).toBeDefined();
          expect(typeof template.trigger.event).toBe('string');
        }
      });
    });
  });
});
